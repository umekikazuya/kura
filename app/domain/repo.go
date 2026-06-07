package domain

import (
	"context"
)

// ClipRepository is the interface for storing and retrieving clipboard history.
type ClipRepository interface {
	Save(ctx context.Context, item *ClipItem) error
	GetAll(ctx context.Context, limit, offset int) ([]*ClipItem, error)
	Search(ctx context.Context, query string, limit, offset int) ([]*ClipItem, error)
}
