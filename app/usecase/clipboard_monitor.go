package usecase

import (
	"context"
	"log"
	"strings"
	"time"

	"github.com/umekikazuya/kura/app/domain"
	"github.com/umekikazuya/kura/app/io"
)

// ClipboardMonitor watches the OS clipboard and saves new text items to the repository.
type ClipboardMonitor struct {
	repo      domain.ClipRepository
	OnNewClip func()
}

// NewClipboardMonitor creates a new ClipboardMonitor.
func NewClipboardMonitor(repo domain.ClipRepository) *ClipboardMonitor {
	return &ClipboardMonitor{
		repo: repo,
	}
}

// Start begins polling the clipboard for changes. It blocks until the context is canceled.
func (m *ClipboardMonitor) Start(ctx context.Context) {
	log.Println("Starting clipboard monitor...")
	lastCount := io.GetClipboardChangeCount()

	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("Stopping clipboard monitor...")
			return
		case <-ticker.C:
			currentCount := io.GetClipboardChangeCount()
			if currentCount == lastCount {
				continue
			}
			lastCount = currentCount
			m.processClipboard(ctx)
		}
	}
}

func (m *ClipboardMonitor) processClipboard(ctx context.Context) {
	// Security check: Ignore password managers
	if io.IsClipboardConcealed() {
		log.Println("Clipboard update ignored (ConcealedType detected)")
		return
	}

	text, err := io.GetClipboardText()
	if err != nil {
		return // Probably an image or file, ignore
	}

	text = strings.TrimSpace(text)
	if text == "" {
		return
	}

	// Save to DB
	item := domain.NewClipItem(text)
	if err := m.repo.Save(ctx, item); err != nil {
		log.Printf("Failed to save clip: %v\n", err)
	} else {
		log.Printf("Saved new clip: %s...\n", text[:min(len(text), 20)])
		if m.OnNewClip != nil {
			m.OnNewClip()
		}
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
