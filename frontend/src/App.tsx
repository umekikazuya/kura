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
    initListener()
  }, [])

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
    <div className="flex flex-col h-screen bg-app-bg text-slate-200 antialiased overflow-hidden selection:bg-sky-500/30">
      {/* Draggable Top Padding (to allow moving the frameless window) */}
      <div
        className="flex-none h-4"
        style={{ WebkitAppRegion: 'drag' } as any}
      />

      {/* Virtualized List Container */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto p-2"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        {isLoading && clips.length === 0 ? (
          <div className="flex justify-center items-center h-32 text-slate-500">
            <div className="animate-pulse flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Loading...</span>
            </div>
          </div>
        ) : clips.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-slate-500 gap-3">
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
                    className={`
                      list-item-container flex flex-col gap-1 p-3 rounded-lg cursor-pointer
                      transition-all duration-200 ease-out border
                      ${
                        isSelected
                          ? 'bg-item-selected border-item-border shadow-[0_0_15px_rgba(56,189,248,0.15)] ring-1 ring-sky-500/50'
                          : 'bg-slate-800/30 border-transparent hover:bg-item-hover'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start gap-4">
                      {/* Content Preview */}
                      <p
                        className={`
                        text-sm font-medium leading-relaxed truncate-2-lines
                        ${isSelected ? 'text-white' : 'text-slate-300'}
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
                        <div className="flex-none flex items-center justify-center bg-sky-500/20 text-sky-300 rounded px-2 py-0.5 text-xs font-bold border border-sky-500/30">
                          ↵ Enter
                        </div>
                      )}
                    </div>

                    {/* Meta Data */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.updated_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
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
        className="flex-none flex items-center bg-slate-900/80 backdrop-blur-md border-t border-slate-800 text-slate-400 font-mono text-sm px-3 py-1.5"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <span
          className={`${searchQuery ? 'text-sky-400' : 'text-slate-500'} font-bold mr-2`}
        >
          {searchQuery ? '/' : ':'}
        </span>
        <input
          ref={searchInputRef}
          type="text"
          className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sky-100 placeholder-slate-600"
          placeholder="type / to search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          style={{ WebkitAppRegion: 'no-drag' } as any}
        />
        <span
          className="text-xs text-slate-500 ml-4"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          {selectedIndex + 1}/{clips.length}
        </span>
      </div>
    </div>
  )
}

export default App
