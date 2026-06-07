import { useVirtualizer } from '@tanstack/react-virtual'
import { Clock, Copy, Hash, Search } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { PasteClip } from '../wailsjs/go/main/App'
import { useKeyBindings } from './hooks/useKeyBindings'
import { useClipStore } from './store/clipStore'

function App() {
  const {
    clips,
    selectedIndex,
    searchQuery,
    setSearchQuery,
    setSelectedIndex,
    fetchClips,
    initListener,
    isLoading,
  } = useClipStore()

  const searchInputRef = useRef<HTMLInputElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)

  // Initialize data and listeners
  useEffect(() => {
    fetchClips()
    const unsubscribe = initListener()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [initListener, fetchClips])

  // Set up global keyboard shortcuts
  useKeyBindings(searchInputRef)

  // Setup virtualizer for ultra-fast rendering of large lists
  const rowVirtualizer = useVirtualizer({
    count: clips.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Estimated height of each item in px
    overscan: 5,
  })

  // Auto-scroll to selected index when navigating with keyboard
  useEffect(() => {
    if (clips.length > 0) {
      rowVirtualizer.scrollToIndex(selectedIndex, { align: 'auto' })
    }
  }, [selectedIndex, rowVirtualizer, clips.length])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-app-bg text-slate-200 antialiased selection:bg-sky-500/30">
      {/* Draggable Top Padding (to allow moving the frameless window) */}
      <div
        className="h-4 flex-none"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      {/* Virtualized List Container */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto p-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {isLoading && clips.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-slate-500">
            <div className="flex animate-pulse items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Loading...</span>
            </div>
          </div>
        ) : clips.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-500">
            <Copy className="h-8 w-8 opacity-50" />
            <p>No clips found</p>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = clips[virtualRow.index]
              const isSelected = virtualRow.index === selectedIndex

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className="absolute top-0 left-0 w-full p-1 transition-transform"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {/* biome-ignore lint/a11y/useKeyWithClickEvents: handled by global useKeyBindings */}
                  {/* biome-ignore lint/a11y/noStaticElementInteractions: this is a list item */}
                  <div
                    onClick={() => setSelectedIndex(virtualRow.index)}
                    onDoubleClick={() =>
                      PasteClip(item.content).catch(console.error)
                    }
                    className={`flex cursor-pointer list-item-container flex-col gap-1 rounded-lg border p-3 transition-all duration-200 ease-out ${
                      isSelected
                        ? 'border-item-border bg-item-selected shadow-[0_0_15px_rgba(56,189,248,0.15)] ring-1 ring-sky-500/50'
                        : 'border-transparent bg-slate-800/30 hover:bg-item-hover'
                    }
                    `}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Content Preview */}
                      <p
                        className={`truncate-2-lines font-medium text-sm leading-relaxed ${isSelected ? 'text-white' : 'text-slate-300'}
                      `}
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.content}
                      </p>

                      {/* Shortcut hint */}
                      {isSelected && (
                        <div className="flex flex-none items-center justify-center rounded border border-sky-500/30 bg-sky-500/20 px-2 py-0.5 font-bold text-sky-300 text-xs">
                          ↵ Enter
                        </div>
                      )}
                    </div>

                    {/* Meta Data */}
                    <div className="mt-1 flex items-center gap-3 font-mono text-slate-500 text-xs">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.updated_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {item.id.substring(0, 8)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Vim-like Status/Search Bar */}
      <div
        className="flex flex-none items-center border-slate-800 border-t bg-slate-900/80 px-3 py-1.5 font-mono text-slate-400 text-sm backdrop-blur-md"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span
          className={`${searchQuery ? 'text-sky-400' : 'text-slate-500'} mr-2 font-bold`}
        >
          {searchQuery ? '/' : ':'}
        </span>
        <input
          ref={searchInputRef}
          type="text"
          className="flex-1 border-none bg-transparent text-sky-100 placeholder-slate-600 outline-none focus:ring-0"
          placeholder="type / to search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        />
        <span
          className="ml-4 text-slate-500 text-xs"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {clips.length === 0 ? 0 : selectedIndex + 1}/{clips.length}
        </span>
      </div>
    </div>
  )
}

export default App
