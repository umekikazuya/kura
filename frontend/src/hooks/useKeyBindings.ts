import { useEffect } from 'react'
import { HideWindow, PasteClip } from '../../wailsjs/go/main/App'
import { useClipStore } from '../store/clipStore'

export function useKeyBindings(
  searchInputRef: React.RefObject<HTMLInputElement | null>,
) {
  const { setSelectedIndex, clips } = useClipStore()

  useEffect(() => {
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Intentional monolithic key handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || e.key === 'Process') {
        return
      }

      // Don't intercept if user is typing in an input (unless it's the search bar and they press specific keys like ArrowUp/Down)
      const isInputFocused = document.activeElement?.tagName === 'INPUT'

      if (isInputFocused) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex((prev) => prev + 1)
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex((prev) => prev - 1)
        } else if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault()
          // Exit search mode (blur input) to return to normal mode
          if (searchInputRef.current) {
            searchInputRef.current.blur()
          }
        }
        return
      }

      // VIM-style navigation when input is NOT focused
      if (e.key === 'Escape') {
        e.preventDefault()
        HideWindow()
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => prev + 1)
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => prev - 1)
      } else if (e.key === '/') {
        e.preventDefault()
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selectedClip = clips[useClipStore.getState().selectedIndex]
        if (selectedClip) {
          PasteClip(selectedClip.content).catch(console.error)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSelectedIndex, searchInputRef, clips])
}
