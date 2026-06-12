import type {
  CommandDeps,
  CommandResult,
  InputContext,
  KeyCommand,
} from '../types'

export const focusSearchCommand: KeyCommand = {
  id: 'focus-search',
  canHandle: (context: InputContext): boolean =>
    context.mode === 'normal' && context.event.key === '/',
  execute: (_context: InputContext, deps: CommandDeps): CommandResult => {
    deps.focusSearch()
    return {
      handled: true,
      preventDefault: true,
    }
  },
}
