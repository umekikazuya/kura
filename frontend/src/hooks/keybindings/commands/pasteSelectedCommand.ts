import type {
  CommandDeps,
  CommandResult,
  InputContext,
  KeyCommand,
} from '../types'

export const pasteSelectedCommand: KeyCommand = {
  id: 'paste-selected',
  canHandle: (context: InputContext): boolean =>
    context.mode === 'normal' && context.event.key === 'Enter',
  execute: (_context: InputContext, deps: CommandDeps): CommandResult => {
    deps.pasteSelected()
    return {
      handled: true,
      preventDefault: true,
    }
  },
}
