import { useEffect, useRef } from 'react'
import { HideWindow, PasteClip } from '../../wailsjs/go/main/App'
import { useClipStore } from '../store/clipStore'

const GG_TIMEOUT_MS = 500

export function useKeyBindings(
  searchInputRef: React.RefObject<HTMLInputElement | null>,
) {
  const { setSelectedIndex, clips } = useClipStore()
  const lastGPressedAtRef = useRef<number | null>(null)

  useEffect(() => {
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Intentional monolithic key handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || e.key === 'Process') {
        return
      }

      // Don't intercept if user is typing in an input (unless it's the search bar and they press specific keys like ArrowUp/Down)
      const isInputFocused = document.activeElement?.tagName === 'INPUT'

      if (isInputFocused) {
        lastGPressedAtRef.current = null
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

      if (e.key === 'g') {
        e.preventDefault()
        if (e.repeat) {
          return
        }

        const now = Date.now()
        if (
          lastGPressedAtRef.current !== null &&
          now - lastGPressedAtRef.current <= GG_TIMEOUT_MS
        ) {
          setSelectedIndex(0)
          lastGPressedAtRef.current = null
          return
        }

        lastGPressedAtRef.current = now
        return
      }

      lastGPressedAtRef.current = null

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
