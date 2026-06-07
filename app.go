package main

import (
	"context"
	"log"
	"time"

	"github.com/umekikazuya/kura/app/domain"
	"github.com/umekikazuya/kura/app/io"
	"github.com/umekikazuya/kura/app/usecase"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.design/x/hotkey"
)

// App struct
type App struct {
	ctx     context.Context
	repo    domain.ClipRepository
	monitor *usecase.ClipboardMonitor
}

// NewApp creates a new App application struct
func NewApp(repo domain.ClipRepository, monitor *usecase.ClipboardMonitor) *App {
	return &App{
		repo:    repo,
		monitor: monitor,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Hook up the callback for frontend notifications
	a.monitor.OnNewClip = func() {
		runtime.EventsEmit(a.ctx, "onNewClip")
	}

	// Start the background monitor loop in a goroutine
	go a.monitor.Start(ctx)

	// Register global hotkey
	a.registerGlobalHotkey()
}

func (a *App) registerGlobalHotkey() {
	// Register Cmd + Option + V
	hk := hotkey.New([]hotkey.Modifier{hotkey.ModCmd, hotkey.ModOption}, hotkey.KeyV)
	err := hk.Register()
	if err != nil {
		log.Printf("Failed to register global hotkey: %v", err)
		return
	}

	go func() {
		for {
			<-hk.Keydown()
			if io.IsApplicationHidden() {
				log.Println("Global hotkey triggered, showing window")
				a.ShowWindow()
			} else {
				log.Println("Global hotkey triggered, hiding window")
				a.HideWindow()
			}
		}
	}()
}

// GetClips returns the most recent clips
func (a *App) GetClips(limit, offset int) ([]*domain.ClipItem, error) {
	return a.repo.GetAll(a.ctx, limit, offset)
}

// SearchClips returns clips matching the query
func (a *App) SearchClips(query string, limit, offset int) ([]*domain.ClipItem, error) {
	return a.repo.Search(a.ctx, query, limit, offset)
}

// HideWindow hides the application window
func (a *App) HideWindow() {
	io.HideApplication()
}

// ShowWindow shows and activates the application window
func (a *App) ShowWindow() {
	io.ShowApplication()
	runtime.WindowShow(a.ctx)
}

// PasteClip sets the clipboard text, hides the window, and simulates Cmd+V
func (a *App) PasteClip(content string) error {
	// 1. Set the clipboard text
	if err := runtime.ClipboardSetText(a.ctx, content); err != nil {
		return err
	}

	// 2. Hide the kura application so macOS yields focus back to the previous app
	log.Println("Hiding application for paste...")
	io.HideApplication()

	// 3. Wait slightly for the previous app to regain focus, AND run it in a goroutine!
	// If we sleep in the main IPC thread, the WindowHide event won't be processed by the UI
	// until after the sleep, meaning Cmd+V fires while kura is still visible!
	go func() {
		time.Sleep(200 * time.Millisecond)
		log.Println("Simulating Cmd+V")
		io.SimulateCmdV()
	}()

	return nil
}
