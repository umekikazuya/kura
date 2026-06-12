import { useEffect, useRef } from 'react'
import { HideWindow, PasteClip } from '../../wailsjs/go/main/App'
import { useClipStore } from '../store/clipStore'
import { handleKeydown } from './keybindings/controller'
import { createEmptySequenceState } from './keybindings/types'

export function useKeyBindings(
  searchInputRef: React.RefObject<HTMLInputElement | null>,
) {
  const setSelectedIndex = useClipStore((state) => state.setSelectedIndex)
  const sequenceRef = useRef(createEmptySequenceState())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused = document.activeElement === searchInputRef.current
      const mode = isInputFocused ? 'search' : 'normal'
      sequenceRef.current = handleKeydown(
        {
          mode,
          event: e,
          sequence: sequenceRef.current,
        },
        {
          moveSelection: (delta) => {
            setSelectedIndex((prev) => prev + delta)
          },
          goSelectionTop: () => {
            setSelectedIndex(0)
          },
          focusSearch: () => {
            searchInputRef.current?.focus()
          },
          blurSearch: () => {
            searchInputRef.current?.blur()
          },
          hideWindow: () => {
            void HideWindow().catch(console.error)
          },
          pasteSelected: () => {
            const { clips, selectedIndex } = useClipStore.getState()
            const selectedClip = clips[selectedIndex]
            if (selectedClip) {
              PasteClip(selectedClip.content).catch(console.error)
            }
          },
          now: () => Date.now(),
        },
      )
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSelectedIndex, searchInputRef])
}
