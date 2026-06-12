import type {
  CommandDeps,
  CommandResult,
  InputContext,
  KeyCommand,
} from '../types'

function isMoveUpKey(context: InputContext): boolean {
  if (context.mode === 'search') {
    return context.event.key === 'ArrowUp'
  }

  return context.event.key === 'k' || context.event.key === 'ArrowUp'
}

export const moveUpCommand: KeyCommand = {
  id: 'move-up',
  canHandle: isMoveUpKey,
  execute: (_context: InputContext, deps: CommandDeps): CommandResult => {
    deps.moveSelection(-1)
    return {
      handled: true,
      preventDefault: true,
    }
  },
}
