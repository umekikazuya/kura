import type {
  CommandDeps,
  CommandResult,
  InputContext,
  KeyCommand,
} from '../types'

function isMoveDownKey(context: InputContext): boolean {
  if (context.mode === 'search') {
    return context.event.key === 'ArrowDown'
  }

  return context.event.key === 'j' || context.event.key === 'ArrowDown'
}

export const moveDownCommand: KeyCommand = {
  id: 'move-down',
  canHandle: isMoveDownKey,
  execute: (_context: InputContext, deps: CommandDeps): CommandResult => {
    deps.moveSelection(1)
    return {
      handled: true,
      preventDefault: true,
    }
  },
}
