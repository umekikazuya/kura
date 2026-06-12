import type {
  CommandDeps,
  CommandResult,
  InputContext,
  KeyCommand,
} from '../types'

const GG_TIMEOUT_MS = 500

export const goTopByGgCommand: KeyCommand = {
  id: 'go-top-by-gg',
  canHandle: (context: InputContext): boolean =>
    context.mode === 'normal' && context.event.key === 'g',
  execute: (context: InputContext, deps: CommandDeps): CommandResult => {
    if (context.event.repeat) {
      return {
        handled: true,
        preventDefault: true,
        nextSequence: context.sequence,
      }
    }

    const now = deps.now()
    if (
      context.sequence.pendingKey === 'g' &&
      context.sequence.startedAt !== null &&
      now - context.sequence.startedAt <= GG_TIMEOUT_MS
    ) {
      deps.goSelectionTop()
      return {
        handled: true,
        preventDefault: true,
        nextSequence: {
          pendingKey: null,
          startedAt: null,
        },
      }
    }

    return {
      handled: true,
      preventDefault: true,
      nextSequence: {
        pendingKey: 'g',
        startedAt: now,
      },
    }
  },
}
