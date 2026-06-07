import { create } from 'zustand'
import { GetClips, SearchClips } from '../../wailsjs/go/main/App'
import type { domain } from '../../wailsjs/go/models'
import { EventsOn } from '../../wailsjs/runtime/runtime'

interface ClipState {
  clips: domain.ClipItem[]
  selectedIndex: number
  searchQuery: string
  isLoading: boolean

  requestVersion: number

  // Actions
  setSearchQuery: (query: string) => void
  setSelectedIndex: (index: number | ((prev: number) => number)) => void
  fetchClips: () => Promise<void>
  initListener: () => () => void
}

export const useClipStore = create<ClipState>((set, get) => ({
  clips: [],
  selectedIndex: 0,
  searchQuery: '',
  isLoading: false,
  requestVersion: 0,

  setSearchQuery: (query: string) => {
    set({ searchQuery: query, selectedIndex: 0 })
    get().fetchClips()
  },

  setSelectedIndex: (indexOrUpdater) => {
    set((state) => {
      const target =
        typeof indexOrUpdater === 'function'
          ? indexOrUpdater(state.selectedIndex)
          : indexOrUpdater

      if (state.clips.length === 0) return { selectedIndex: 0 }

      const newIndex = Math.max(0, Math.min(target, state.clips.length - 1))
      return { selectedIndex: newIndex }
    })
  },

  fetchClips: async () => {
    const { searchQuery, requestVersion } = get()
    const currentReqVersion = requestVersion + 1
    set({ isLoading: true, requestVersion: currentReqVersion })

    try {
      let result: domain.ClipItem[] | null = null
      // We'll load up to 100 items for the UI list to keep it fast,
      // but virtual scrolling can handle much more if we want to add pagination later.
      if (searchQuery.trim() !== '') {
        result = await SearchClips(searchQuery, 100, 0)
      } else {
        result = await GetClips(100, 0)
      }

      // Ensure we always have an array even if the DB returns null
      if (get().requestVersion === currentReqVersion) {
        set({ clips: result || [], isLoading: false })
      }
    } catch (err) {
      console.error('Failed to fetch clips:', err)
      if (get().requestVersion === currentReqVersion) {
        set({ isLoading: false })
      }
    }
  },

  initListener: () => {
    // Listen for the event emitted by Go backend when a new clip is copied
    return EventsOn('onNewClip', () => {
      // Refresh the list immediately
      get().fetchClips()
    })
  },
}))
