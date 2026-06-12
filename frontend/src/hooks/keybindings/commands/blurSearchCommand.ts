import type {
  CommandDeps,
  CommandResult,
  InputContext,
  KeyCommand,
} from '../types'

export const blurSearchCommand: KeyCommand = {
  id: 'blur-search',
  canHandle: (context: InputContext): boolean =>
    context.mode === 'search' &&
    (context.event.key === 'Enter' || context.event.key === 'Escape'),
  execute: (_context: InputContext, deps: CommandDeps): CommandResult => {
    deps.blurSearch()
    return {
      handled: true,
      preventDefault: true,
    }
  },
}
