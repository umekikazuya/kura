import { useVirtualizer } from '@tanstack/react-virtual'
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

  useEffect(() => {
    fetchClips()
    const unsubscribe = initListener()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [initListener, fetchClips])

  useEffect(() => {
    const handleFocus = () => {
      if (searchInputRef.current) {
        searchInputRef.current.blur()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  useKeyBindings(searchInputRef)

  const rowVirtualizer = useVirtualizer({
    count: clips.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
    scrollPaddingEnd: 80,
  })

  useEffect(() => {
    if (clips.length > 0) {
      rowVirtualizer.scrollToIndex(selectedIndex, { align: 'auto' })
    }
  }, [selectedIndex, rowVirtualizer, clips.length])

  return (
    <div
      className="relative h-screen overflow-hidden antialiased text-[#1C1C1E]"
      style={{
        backgroundColor: 'rgba(245, 245, 247, 0.95)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div
        className="absolute left-0 top-0 z-20 h-4 w-full"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      {/* スクロールエリアを全画面に広げ、下部バーの裏側までコンテンツが潜り込むようにする */}
      <div
        ref={parentRef}
        className="h-full w-full overflow-auto px-3 pb-24 pt-4"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {isLoading && clips.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[15px] font-medium text-black/40">
            Loading...
          </div>
        ) : clips.length === 0 ? (
          <div className="flex h-full items-center justify-center font-mono text-[15px] text-black/40">
            ~ empty ~
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

              const bgClass = isSelected
                ? 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.1)] scale-100 z-10'
                : 'bg-transparent hover:bg-black/5 scale-[0.99] z-0'

              const textPrimary = isSelected
                ? 'text-[#000000] font-semibold'
                : 'text-[#1C1C1E] font-medium'

              const textSecondary = isSelected
                ? 'text-black/50 font-medium'
                : 'text-black/40'

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className="absolute left-0 top-0 w-full px-1 py-1"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div
                    onClick={() => setSelectedIndex(virtualRow.index)}
                    onDoubleClick={() =>
                      PasteClip(item.content).catch(console.error)
                    }
                    className={`flex cursor-default flex-col justify-center rounded-2xl px-4 py-3 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${bgClass}`}
                    style={
                      {
                        WebkitAppRegion: 'no-drag',
                      } as React.CSSProperties
                    }
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span
                        className={`truncate text-[15px] leading-snug tracking-tight ${textPrimary}`}
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.content.replace(/\s+/g, ' ')}
                      </span>
                      {isSelected && (
                        <span className="flex-none font-mono text-[14px] font-bold text-black/60">
                          ↵
                        </span>
                      )}
                    </div>
                    <span
                      className={`mt-1 font-mono text-[11px] tracking-wider ${textSecondary}`}
                    >
                      {new Date(item.updated_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      • {item.content.length} chars
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 
        究極のリキッド感を出すため、バーを absolute 配置にしてリストの「上に」浮かせる。
        さらに極厚のブラー(blur-[40px])と彩度アップ(saturate-[1.8])をかけ、
        スクロールしたアイテムがガラスの裏を通過して溶ける様子を完璧に再現。
      */}
      <div
        className="absolute bottom-0 left-0 z-30 flex w-full items-center border-t border-black/[0.05] bg-white/10 px-4 pb-5 pt-4 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] backdrop-blur-[40px] backdrop-saturate-[1.8]"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span
          className={`mr-3 font-mono text-[16px] transition-colors duration-300 ${searchQuery ? 'text-black font-bold' : 'text-black/30'}`}
        >
          {searchQuery ? '/' : ':'}
        </span>
        <input
          ref={searchInputRef}
          type="text"
          className="flex-1 bg-transparent font-mono text-[15px] tracking-tight text-[#1C1C1E] placeholder-black/30 outline-none"
          placeholder=""
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        />
        <div className="ml-4 flex items-center gap-2 font-mono text-[11px] tracking-widest text-black/40">
          {clips.length === 0 ? 0 : selectedIndex + 1}/{clips.length}
        </div>
      </div>
    </div>
  )
}

export default App
