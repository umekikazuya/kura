export type InputMode = 'normal' | 'search'

export interface SequenceState {
  pendingKey: string | null
  startedAt: number | null
}

export interface InputContext {
  mode: InputMode
  event: KeyboardEvent
  sequence: SequenceState
}

export interface CommandDeps {
  moveSelection: (delta: number) => void
  goSelectionTop: () => void
  focusSearch: () => void
  blurSearch: () => void
  hideWindow: () => void
  pasteSelected: () => void
  now: () => number
}

export interface CommandResult {
  handled: boolean
  preventDefault?: boolean
  nextSequence?: SequenceState
}

export interface KeyCommand {
  id: string
  canHandle: (context: InputContext) => boolean
  execute: (context: InputContext, deps: CommandDeps) => CommandResult
}

export function createEmptySequenceState(): SequenceState {
  return {
    pendingKey: null,
    startedAt: null,
  }
}
