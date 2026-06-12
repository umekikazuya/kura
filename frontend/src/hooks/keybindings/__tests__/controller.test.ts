import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleKeydown } from '../controller'
import type { CommandDeps, SequenceState } from '../types'
import { createEmptySequenceState } from '../types'

interface TestDeps {
  deps: CommandDeps
  calls: {
    moveSelection: number[]
    goSelectionTop: number
    focusSearch: number
    blurSearch: number
    hideWindow: number
    pasteSelected: number
  }
  setNow: (value: number) => void
}

function createTestDeps(initialNow = 0): TestDeps {
  const calls = {
    moveSelection: [] as number[],
    goSelectionTop: 0,
    focusSearch: 0,
    blurSearch: 0,
    hideWindow: 0,
    pasteSelected: 0,
  }
  let now = initialNow

  return {
    calls,
    setNow: (value: number) => {
      now = value
    },
    deps: {
      moveSelection: (delta: number) => {
        calls.moveSelection.push(delta)
      },
      goSelectionTop: () => {
        calls.goSelectionTop += 1
      },
      focusSearch: () => {
        calls.focusSearch += 1
      },
      blurSearch: () => {
        calls.blurSearch += 1
      },
      hideWindow: () => {
        calls.hideWindow += 1
      },
      pasteSelected: () => {
        calls.pasteSelected += 1
      },
      now: () => now,
    },
  }
}

function createEvent(
  key: string,
  options: { repeat?: boolean; isComposing?: boolean } = {},
) {
  const preventDefault = vi.fn()
  const event = {
    key,
    repeat: options.repeat ?? false,
    isComposing: options.isComposing ?? false,
    preventDefault,
  } as unknown as KeyboardEvent
  return { event, preventDefault }
}

function run(
  mode: 'normal' | 'search',
  key: string,
  sequence: SequenceState,
  deps: CommandDeps,
  options: { repeat?: boolean; isComposing?: boolean } = {},
) {
  const { event, preventDefault } = createEvent(key, options)
  const nextSequence = handleKeydown(
    {
      mode,
      event,
      sequence,
    },
    deps,
  )
  return { nextSequence, preventDefault }
}

describe('handleKeydown', () => {
  let testDeps: TestDeps

  beforeEach(() => {
    testDeps = createTestDeps()
  })

  it('moves down in normal mode with j', () => {
    const { nextSequence, preventDefault } = run(
      'normal',
      'j',
      createEmptySequenceState(),
      testDeps.deps,
    )

    expect(testDeps.calls.moveSelection).toEqual([1])
    expect(preventDefault).toHaveBeenCalledOnce()
    expect(nextSequence).toEqual(createEmptySequenceState())
  })

  it('moves up in search mode with ArrowUp', () => {
    const { preventDefault } = run(
      'search',
      'ArrowUp',
      createEmptySequenceState(),
      testDeps.deps,
    )

    expect(testDeps.calls.moveSelection).toEqual([-1])
    expect(preventDefault).toHaveBeenCalledOnce()
  })

  it('handles / in normal mode by focusing search', () => {
    const { preventDefault } = run(
      'normal',
      '/',
      createEmptySequenceState(),
      testDeps.deps,
    )

    expect(testDeps.calls.focusSearch).toBe(1)
    expect(preventDefault).toHaveBeenCalledOnce()
  })

  it('handles Escape in normal mode by hiding window', () => {
    const { preventDefault } = run(
      'normal',
      'Escape',
      createEmptySequenceState(),
      testDeps.deps,
    )

    expect(testDeps.calls.hideWindow).toBe(1)
    expect(preventDefault).toHaveBeenCalledOnce()
  })

  it('handles Enter in search mode by blurring input', () => {
    const { preventDefault } = run(
      'search',
      'Enter',
      createEmptySequenceState(),
      testDeps.deps,
    )

    expect(testDeps.calls.blurSearch).toBe(1)
    expect(preventDefault).toHaveBeenCalledOnce()
  })

  it('handles Enter in normal mode by pasting selected item', () => {
    const { preventDefault } = run(
      'normal',
      'Enter',
      createEmptySequenceState(),
      testDeps.deps,
    )

    expect(testDeps.calls.pasteSelected).toBe(1)
    expect(preventDefault).toHaveBeenCalledOnce()
  })

  it('goes top on gg within timeout (499ms)', () => {
    const first = run('normal', 'g', createEmptySequenceState(), testDeps.deps)
    expect(first.preventDefault).toHaveBeenCalledOnce()
    expect(first.nextSequence.pendingKey).toBe('g')
    expect(testDeps.calls.goSelectionTop).toBe(0)

    testDeps.setNow(499)
    const second = run('normal', 'g', first.nextSequence, testDeps.deps)
    expect(second.preventDefault).toHaveBeenCalledOnce()
    expect(testDeps.calls.goSelectionTop).toBe(1)
    expect(second.nextSequence).toEqual(createEmptySequenceState())
  })

  it('goes top on gg at timeout boundary (500ms)', () => {
    const first = run('normal', 'g', createEmptySequenceState(), testDeps.deps)
    testDeps.setNow(500)
    const second = run('normal', 'g', first.nextSequence, testDeps.deps)

    expect(testDeps.calls.goSelectionTop).toBe(1)
    expect(second.nextSequence).toEqual(createEmptySequenceState())
  })

  it('does not go top on gg after timeout (501ms)', () => {
    const first = run('normal', 'g', createEmptySequenceState(), testDeps.deps)
    testDeps.setNow(501)
    const second = run('normal', 'g', first.nextSequence, testDeps.deps)

    expect(testDeps.calls.goSelectionTop).toBe(0)
    expect(second.nextSequence.pendingKey).toBe('g')
    expect(second.nextSequence.startedAt).toBe(501)
  })

  it('does not evaluate gg in search mode', () => {
    const first = run('search', 'g', createEmptySequenceState(), testDeps.deps)
    const second = run('search', 'g', first.nextSequence, testDeps.deps)

    expect(testDeps.calls.goSelectionTop).toBe(0)
    expect(first.preventDefault).not.toHaveBeenCalled()
    expect(second.preventDefault).not.toHaveBeenCalled()
    expect(second.nextSequence).toEqual(createEmptySequenceState())
  })
})
