import type {
  CommandDeps,
  CommandResult,
  InputContext,
  KeyCommand,
} from '../types'

export const hideWindowCommand: KeyCommand = {
  id: 'hide-window',
  canHandle: (context: InputContext): boolean =>
    context.mode === 'normal' && context.event.key === 'Escape',
  execute: (_context: InputContext, deps: CommandDeps): CommandResult => {
    deps.hideWindow()
    return {
      handled: true,
      preventDefault: true,
    }
  },
}
