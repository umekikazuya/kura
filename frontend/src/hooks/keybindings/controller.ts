import { resolveCommands } from './resolver'
import type { CommandDeps, InputContext, SequenceState } from './types'
import { createEmptySequenceState } from './types'

function getDefaultNextSequence(context: InputContext): SequenceState {
  if (context.mode === 'search') {
    return createEmptySequenceState()
  }

  if (context.event.key === 'g') {
    return context.sequence
  }

  return createEmptySequenceState()
}

export function handleKeydown(
  context: InputContext,
  deps: CommandDeps,
): SequenceState {
  if (context.event.isComposing || context.event.key === 'Process') {
    return context.sequence
  }

  for (const command of resolveCommands(context.mode)) {
    if (!command.canHandle(context)) {
      continue
    }

    const result = command.execute(context, deps)
    if (result.preventDefault) {
      context.event.preventDefault()
    }

    return result.nextSequence ?? getDefaultNextSequence(context)
  }

  return getDefaultNextSequence(context)
}
