package db

import (
	"context"
	"database/sql"
	"testing"
	"time"

	_ "github.com/mattn/go-sqlite3"

	"github.com/umekikazuya/kura/app/domain"
)

func setupTestDB(t *testing.T) *sqliteRepo {
	t.Helper()
	// Use in-memory SQLite for testing
	db, err := sql.Open("sqlite3", "file::memory:?cache=shared")
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}

	repo := &sqliteRepo{db: db}
	if err := repo.initSchema(); err != nil {
		t.Fatalf("failed to init schema: %v", err)
	}

	return repo
}

func TestSQLiteRepo_SaveAndGetAll(t *testing.T) {
	repo := setupTestDB(t)
	defer repo.db.Close()

	ctx := context.Background()

	// Insert items
	item1 := domain.NewClipItem("Hello World")
	if err := repo.Save(ctx, item1); err != nil {
		t.Fatalf("failed to save item1: %v", err)
	}

	time.Sleep(10 * time.Millisecond)

	item2 := domain.NewClipItem("Testing FTS5")
	if err := repo.Save(ctx, item2); err != nil {
		t.Fatalf("failed to save item2: %v", err)
	}

	// GetAll
	items, err := repo.GetAll(ctx, 10, 0)
	if err != nil {
		t.Fatalf("failed to get all items: %v", err)
	}

	if len(items) != 2 {
		t.Errorf("expected 2 items, got %d", len(items))
	}

	// Because item2 was inserted last, it should be at the top
	if items[0].Content != "Testing FTS5" {
		t.Errorf("expected item2 at top, got %s", items[0].Content)
	}
}

func TestSQLiteRepo_UpsertUpdatesTimestamp(t *testing.T) {
	repo := setupTestDB(t)
	defer repo.db.Close()

	ctx := context.Background()

	content := "Unique Content"
	item1 := domain.NewClipItem(content)

	_ = repo.Save(ctx, item1)

	// Wait briefly to ensure timestamp difference
	time.Sleep(10 * time.Millisecond)

	// Upsert the same content
	item2 := domain.NewClipItem(content)
	_ = repo.Save(ctx, item2)

	items, _ := repo.GetAll(ctx, 10, 0)
	if len(items) != 1 {
		t.Errorf("expected 1 item after upsert, got %d", len(items))
	}

	if items[0].UpdatedAt.Before(item1.UpdatedAt) || items[0].UpdatedAt.Equal(item1.UpdatedAt) {
		t.Errorf("expected updated_at to be newer")
	}
}

func TestSQLiteRepo_Search(t *testing.T) {
	repo := setupTestDB(t)
	defer repo.db.Close()

	ctx := context.Background()

	_ = repo.Save(ctx, domain.NewClipItem("こんにちは世界"))
	_ = repo.Save(ctx, domain.NewClipItem("Golang is awesome"))
	_ = repo.Save(ctx, domain.NewClipItem("Rust is also awesome"))

	// Search matching "awesome"
	results, err := repo.Search(ctx, "awesome", 10, 0)
	if err != nil {
		t.Fatalf("search failed: %v", err)
	}
	if len(results) != 2 {
		t.Errorf("expected 2 results for 'awesome', got %d", len(results))
	}

	// Search Japanese with FTS trigram
	resultsJP, err := repo.Search(ctx, "世界", 10, 0)
	if err != nil {
		t.Fatalf("search failed: %v", err)
	}
	if len(resultsJP) != 1 {
		t.Errorf("expected 1 result for '世界', got %d", len(resultsJP))
	}
}
