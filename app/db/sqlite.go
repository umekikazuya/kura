package db

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"unicode/utf8"

	_ "github.com/mattn/go-sqlite3"

	"github.com/umekikazuya/kura/app/domain"
)

type sqliteRepo struct {
	db *sql.DB
}

// NewSQLiteRepository initializes the SQLite database and runs migrations.
func NewSQLiteRepository() (domain.ClipRepository, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}
	appDir := filepath.Join(homeDir, ".kura")
	if err := os.MkdirAll(appDir, 0o750); err != nil {
		return nil, fmt.Errorf("failed to create data dir: %w", err)
	}

	dbPath := filepath.Join(appDir, "kura.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	repo := &sqliteRepo{db: db}
	if err := repo.initSchema(); err != nil {
		_ = db.Close()
		return nil, err
	}

	return repo, nil
}

func (r *sqliteRepo) initSchema() error {
	// clips table and FTS5 virtual table
	// `tokenize='trigram'` is ideal for fast Japanese N-gram full-text search.
	query := `
	CREATE TABLE IF NOT EXISTS clips (
		id TEXT PRIMARY KEY,
		content TEXT NOT NULL UNIQUE,
		created_at DATETIME NOT NULL,
		updated_at DATETIME NOT NULL
	);
	
	CREATE VIRTUAL TABLE IF NOT EXISTS clips_fts USING fts5(
		content,
		content='clips',
		content_rowid='rowid',
		tokenize='trigram'
	);
	
	CREATE TRIGGER IF NOT EXISTS clips_ai AFTER INSERT ON clips BEGIN
		INSERT INTO clips_fts(rowid, content) VALUES (new.rowid, new.content);
	END;
	CREATE TRIGGER IF NOT EXISTS clips_ad AFTER DELETE ON clips BEGIN
		INSERT INTO clips_fts(clips_fts, rowid, content) VALUES('delete', old.rowid, old.content);
	END;
	CREATE TRIGGER IF NOT EXISTS clips_au AFTER UPDATE ON clips BEGIN
		INSERT INTO clips_fts(clips_fts, rowid, content) VALUES('delete', old.rowid, old.content);
		INSERT INTO clips_fts(rowid, content) VALUES (new.rowid, new.content);
	END;
	`
	_, err := r.db.ExecContext(context.Background(), query)
	if err != nil {
		return err
	}
	return nil
}

func (r *sqliteRepo) Save(ctx context.Context, item *domain.ClipItem) error {
	if item == nil {
		return fmt.Errorf("item cannot be nil")
	}
	query := `
	INSERT INTO clips (id, content, created_at, updated_at)
	VALUES (?, ?, ?, ?)
	ON CONFLICT(content) DO UPDATE SET
		updated_at = excluded.updated_at;
	`
	_, err := r.db.ExecContext(ctx, query, item.ID, item.Content, item.CreatedAt, item.UpdatedAt)
	return err
}

func (r *sqliteRepo) GetAll(ctx context.Context, limit, offset int) ([]*domain.ClipItem, error) {
	query := `
	SELECT id, content, created_at, updated_at 
	FROM clips 
	ORDER BY updated_at DESC 
	LIMIT ? OFFSET ?
	`
	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = rows.Close()
	}()

	var items []*domain.ClipItem
	for rows.Next() {
		var item domain.ClipItem
		if err := rows.Scan(&item.ID, &item.Content, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, &item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

func (r *sqliteRepo) Search(ctx context.Context, queryStr string, limit, offset int) ([]*domain.ClipItem, error) {
	var query string
	var matchArg interface{}

	// SQLite's trigram tokenizer only matches strings of 3 or more characters.
	// For shorter queries (like many Japanese words or abbreviations), we fallback to LIKE.
	if utf8.RuneCountInString(queryStr) < 3 {
		query = `
		SELECT id, content, created_at, updated_at
		FROM clips
		WHERE content LIKE ?
		ORDER BY updated_at DESC
		LIMIT ? OFFSET ?
		`
		matchArg = "%" + queryStr + "%"
	} else {
		query = `
		SELECT c.id, c.content, c.created_at, c.updated_at
		FROM clips_fts f
		JOIN clips c ON f.rowid = c.rowid
		WHERE clips_fts MATCH ?
		ORDER BY c.updated_at DESC
		LIMIT ? OFFSET ?
		`
		// Quote wrapping prevents syntax errors with special characters in FTS queries
		safeQuery := strings.ReplaceAll(queryStr, `"`, `""`)
		matchArg = fmt.Sprintf(`"%s"`, safeQuery)
	}

	rows, err := r.db.QueryContext(ctx, query, matchArg, limit, offset)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = rows.Close()
	}()

	var items []*domain.ClipItem
	for rows.Next() {
		var item domain.ClipItem
		if err := rows.Scan(&item.ID, &item.Content, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, &item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}
