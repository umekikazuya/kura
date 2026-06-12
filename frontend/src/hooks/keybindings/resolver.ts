import { blurSearchCommand } from './commands/blurSearchCommand'
import { focusSearchCommand } from './commands/focusSearchCommand'
import { goTopByGgCommand } from './commands/goTopByGgCommand'
import { hideWindowCommand } from './commands/hideWindowCommand'
import { moveDownCommand } from './commands/moveDownCommand'
import { moveUpCommand } from './commands/moveUpCommand'
import { pasteSelectedCommand } from './commands/pasteSelectedCommand'
import type { InputMode, KeyCommand } from './types'

/*
 * Behavior matrix (regression baseline):
 * normal: j/ArrowDown=down, k/ArrowUp=up, /=focus, Enter=paste, Escape=hide, gg=top
 * search: ArrowDown=down, ArrowUp=up, Enter|Escape=blur, gg=disabled
 */
const NORMAL_MODE_COMMANDS: KeyCommand[] = [
  goTopByGgCommand,
  hideWindowCommand,
  moveDownCommand,
  moveUpCommand,
  focusSearchCommand,
  pasteSelectedCommand,
]

const SEARCH_MODE_COMMANDS: KeyCommand[] = [
  moveDownCommand,
  moveUpCommand,
  blurSearchCommand,
]

export function resolveCommands(mode: InputMode): KeyCommand[] {
  if (mode === 'search') {
    return SEARCH_MODE_COMMANDS
  }

  return NORMAL_MODE_COMMANDS
}
