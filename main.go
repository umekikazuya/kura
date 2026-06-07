package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/umekikazuya/kura/app/db"
	"github.com/umekikazuya/kura/app/usecase"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Initialize DB
	repo, err := db.NewSQLiteRepository()
	if err != nil {
		log.Fatalf("failed to init db: %v", err)
	}

	// Initialize monitor
	monitor := usecase.NewClipboardMonitor(repo)

	// Create an instance of the app structure
	app := NewApp(repo, monitor)

	// Create application with options
	err = wails.Run(&options.App{
		Title:     "kura",
		Width:     800,
		Height:    600,
		Frameless: true,
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId: "com.umekikazuya.kura",
			OnSecondInstanceLaunch: func(data options.SecondInstanceData) {
				runtime.WindowShow(app.ctx)
			},
		},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 0, G: 0, B: 0, A: 0},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
		Mac: &mac.Options{
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
			Appearance:           mac.NSAppearanceNameVibrantLight,
			TitleBar: &mac.TitleBar{
				TitlebarAppearsTransparent: true,
				HideTitle:                  true,
				HideTitleBar:               true,
				FullSizeContent:            true,
				UseToolbar:                 false,
				HideToolbarSeparator:       true,
			},
		},
	})
	if err != nil {
		println("Error:", err.Error())
	}
}
