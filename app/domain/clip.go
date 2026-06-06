package domain

import (
	"crypto/sha256"
	"fmt"
	"time"
)

// ClipItem represents a single clipboard history item.
type ClipItem struct {
	ID        string    `json:"id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// NewClipItem creates a new clip item. The ID is a SHA256 hash of the content to guarantee uniqueness.
func NewClipItem(content string) *ClipItem {
	hash := sha256.Sum256([]byte(content))
	id := fmt.Sprintf("%x", hash)
	now := time.Now()
	return &ClipItem{
		ID:        id,
		Content:   content,
		CreatedAt: now,
		UpdatedAt: now,
	}
}
