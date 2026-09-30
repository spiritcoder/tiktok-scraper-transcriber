package store

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "modernc.org/sqlite"
	"tiktok-scraper-transcriber/transcriber"
)

type Store struct {
	db *sql.DB
}

type ArticleDraftRecord struct {
	ID               string    `json:"id"`
	TopicID          string    `json:"topic_id"`
	ProfileUsername  string    `json:"profile_username"`
	Title            string    `json:"title"`
	Category         string    `json:"category"`
	ResearchPrompt   string    `json:"research_prompt"`
	ExecutiveSummary string    `json:"executive_summary,omitempty"`
	MarkdownContent  string    `json:"markdown_content"`
	WordCount        int       `json:"word_count"`
	SourceJSON       string    `json:"source_json,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type ProfileRecord struct {
	Username      string    `json:"username"`
	AvatarURL     string    `json:"avatar_url"`
	VideoCount    int       `json:"video_count"`
	TopicCount    int       `json:"topic_count"`
	LastScrapedAt time.Time `json:"last_scraped_at"`
}

// NewStore initializes the SQLite database file and sets up all relational tables
func NewStore(dbPath string) (*Store, error) {
	cleanPath := strings.TrimSpace(dbPath)
	if cleanPath == "" {
		cleanPath = filepath.Join("data", "studio.db")
	}

	dir := filepath.Dir(cleanPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create db directory %s: %w", dir, err)
	}

	db, err := sql.Open("sqlite", cleanPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database: %w", err)
	}

	// Performance pragmas
	_, _ = db.Exec("PRAGMA journal_mode=WAL;")
	_, _ = db.Exec("PRAGMA foreign_keys=ON;")

	if err := createTables(db); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("failed to create database tables: %w", err)
	}

	return &Store{db: db}, nil
}

func createTables(db *sql.DB) error {
	schema := `
	CREATE TABLE IF NOT EXISTS profiles (
		username TEXT PRIMARY KEY,
		avatar_url TEXT,
		video_count INTEGER DEFAULT 0,
		last_scraped_at DATETIME,
		created_at DATETIME
	);

	CREATE TABLE IF NOT EXISTS videos (
		id TEXT PRIMARY KEY,
		profile_username TEXT,
		url TEXT,
		title TEXT,
		description TEXT,
		duration INTEGER DEFAULT 0,
		thumbnail TEXT,
		view_count INTEGER DEFAULT 0,
		created_at DATETIME,
		FOREIGN KEY(profile_username) REFERENCES profiles(username) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS transcripts (
		video_id TEXT,
		source TEXT,
		language TEXT,
		full_text TEXT,
		word_count INTEGER DEFAULT 0,
		segments_json TEXT,
		duration REAL DEFAULT 0,
		updated_at DATETIME,
		PRIMARY KEY(video_id, source),
		FOREIGN KEY(video_id) REFERENCES videos(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS topics (
		id TEXT PRIMARY KEY,
		profile_username TEXT,
		category TEXT,
		title TEXT,
		description TEXT,
		video_ids_json TEXT,
		is_published INTEGER DEFAULT 0,
		created_at DATETIME,
		FOREIGN KEY(profile_username) REFERENCES profiles(username) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS article_drafts (
		id TEXT PRIMARY KEY,
		topic_id TEXT,
		profile_username TEXT,
		title TEXT,
		category TEXT,
		research_prompt TEXT,
		executive_summary TEXT,
		markdown_content TEXT,
		word_count INTEGER DEFAULT 0,
		source_json TEXT,
		created_at DATETIME,
		updated_at DATETIME
	);

	CREATE INDEX IF NOT EXISTS idx_videos_profile ON videos(profile_username);
	CREATE INDEX IF NOT EXISTS idx_topics_profile ON topics(profile_username);
	CREATE INDEX IF NOT EXISTS idx_drafts_profile ON article_drafts(profile_username);
	CREATE INDEX IF NOT EXISTS idx_drafts_updated ON article_drafts(updated_at DESC);
	`

	_, err := db.Exec(schema)
	if err != nil {
		return err
	}

	// Ensure source_json and executive_summary columns exist in article_drafts
	_, _ = db.Exec("ALTER TABLE article_drafts ADD COLUMN source_json TEXT;")
	_, _ = db.Exec("ALTER TABLE article_drafts ADD COLUMN executive_summary TEXT;")
	// Ensure is_published column exists in topics
	_, _ = db.Exec("ALTER TABLE topics ADD COLUMN is_published INTEGER DEFAULT 0;")

	// Auto-migrate legacy transcripts table if single PK column
	var pkCount int
	row := db.QueryRow("SELECT COUNT(*) FROM pragma_table_info('transcripts') WHERE pk > 0;")
	if err := row.Scan(&pkCount); err == nil && pkCount == 1 {
		_, _ = db.Exec(`
			CREATE TABLE IF NOT EXISTS transcripts_migrated (
				video_id TEXT,
				source TEXT,
				language TEXT,
				full_text TEXT,
				word_count INTEGER DEFAULT 0,
				segments_json TEXT,
				duration REAL DEFAULT 0,
				updated_at DATETIME,
				PRIMARY KEY(video_id, source)
			);
			INSERT OR IGNORE INTO transcripts_migrated SELECT * FROM transcripts;
			DROP TABLE transcripts;
			ALTER TABLE transcripts_migrated RENAME TO transcripts;
		`)
	}
	return nil
}

func (s *Store) Close() error {
	if s.db != nil {
		return s.db.Close()
	}
	return nil
}

// SaveProfile upserts a creator profile and their catalog of videos
func (s *Store) SaveProfile(username string, avatarURL string, videos []transcriber.VideoItem) error {
	cleanUname := strings.TrimPrefix(strings.TrimSpace(username), "@")
	if cleanUname == "" {
		return nil
	}

	now := time.Now()

	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`
		INSERT INTO profiles(username, avatar_url, video_count, last_scraped_at, created_at)
		VALUES(?, ?, ?, ?, ?)
		ON CONFLICT(username) DO UPDATE SET
			avatar_url = CASE WHEN excluded.avatar_url != '' THEN excluded.avatar_url ELSE profiles.avatar_url END,
			video_count = excluded.video_count,
			last_scraped_at = excluded.last_scraped_at;
	`, cleanUname, avatarURL, len(videos), now, now)
	if err != nil {
		return fmt.Errorf("failed to upsert profile: %w", err)
	}

	for _, v := range videos {
		vID := strings.TrimSpace(v.ID)
		if vID == "" {
			continue
		}

		_, err = tx.Exec(`
			INSERT INTO videos(id, profile_username, url, title, description, duration, thumbnail, view_count, created_at)
			VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET
				profile_username = excluded.profile_username,
				url = excluded.url,
				title = excluded.title,
				description = excluded.description,
				duration = excluded.duration,
				thumbnail = excluded.thumbnail,
				view_count = excluded.view_count;
		`, vID, cleanUname, v.URL, v.Title, v.Description, v.Duration, v.Thumbnail, v.ViewCount, now)
		if err != nil {
			return fmt.Errorf("failed to upsert video %s: %w", vID, err)
		}
	}

	return tx.Commit()
}

// GetProfile retrieves a saved creator profile and their videos
func (s *Store) GetProfile(username string) (*transcriber.ProfileResult, error) {
	cleanUname := strings.TrimPrefix(strings.TrimSpace(username), "@")
	var profile transcriber.ProfileResult
	profile.Username = cleanUname

	rows, err := s.db.Query(`
		SELECT id, url, title, description, duration, thumbnail, view_count
		FROM videos
		WHERE profile_username = ?
		ORDER BY id DESC;
	`, cleanUname)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var v transcriber.VideoItem
		if err := rows.Scan(&v.ID, &v.URL, &v.Title, &v.Description, &v.Duration, &v.Thumbnail, &v.ViewCount); err != nil {
			return nil, err
		}
		profile.Videos = append(profile.Videos, v)
	}

	if len(profile.Videos) == 0 {
		return nil, sql.ErrNoRows
	}

	return &profile, nil
}

// GetCachedTranscript checks if a video already has a cached transcript, preferring Whisper AI if available
func (s *Store) GetCachedTranscript(videoID string) (*transcriber.TranscriptResult, error) {
	cleanID := strings.TrimSpace(videoID)
	if cleanID == "" {
		return nil, sql.ErrNoRows
	}

	row := s.db.QueryRow(`
		SELECT source, language, full_text, word_count, segments_json, duration
		FROM transcripts
		WHERE video_id = ?
		ORDER BY CASE WHEN source = 'groq_whisper' THEN 1 ELSE 2 END ASC
		LIMIT 1;
	`, cleanID)

	var res transcriber.TranscriptResult
	var segJSON string
	res.VideoID = cleanID

	err := row.Scan(&res.Source, &res.Language, &res.FullText, &res.WordCount, &segJSON, &res.Duration)
	if err != nil {
		return nil, err
	}

	if segJSON != "" {
		_ = json.Unmarshal([]byte(segJSON), &res.Segments)
	}

	return &res, nil
}

// GetCachedTranscripts returns both Whisper and TikTok transcripts if available
func (s *Store) GetCachedTranscripts(videoID string) (whisper *transcriber.TranscriptResult, tiktok *transcriber.TranscriptResult, err error) {
	cleanID := strings.TrimSpace(videoID)
	if cleanID == "" {
		return nil, nil, sql.ErrNoRows
	}

	rows, err := s.db.Query(`
		SELECT source, language, full_text, word_count, segments_json, duration
		FROM transcripts
		WHERE video_id = ?;
	`, cleanID)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var res transcriber.TranscriptResult
		var segJSON string
		res.VideoID = cleanID
		if err := rows.Scan(&res.Source, &res.Language, &res.FullText, &res.WordCount, &segJSON, &res.Duration); err != nil {
			continue
		}
		if segJSON != "" {
			_ = json.Unmarshal([]byte(segJSON), &res.Segments)
		}
		if res.Source == "groq_whisper" {
			whisperCopy := res
			whisper = &whisperCopy
		} else {
			tiktokCopy := res
			tiktok = &tiktokCopy
		}
	}

	return whisper, tiktok, nil
}

// SaveTranscript saves or updates a cached transcript for a video
func (s *Store) SaveTranscript(videoID string, res *transcriber.TranscriptResult) error {
	cleanID := strings.TrimSpace(videoID)
	if cleanID == "" && res != nil {
		cleanID = strings.TrimSpace(res.VideoID)
	}
	if cleanID == "" || res == nil {
		return nil
	}

	source := res.Source
	if source == "" {
		source = "groq_whisper"
	}

	segBytes, _ := json.Marshal(res.Segments)
	now := time.Now()

	// Ensure video entry exists so foreign key doesn't fail
	_, _ = s.db.Exec(`
		INSERT INTO videos(id, title, created_at)
		VALUES(?, ?, ?)
		ON CONFLICT(id) DO NOTHING;
	`, cleanID, res.VideoTitle, now)

	_, err := s.db.Exec(`
		INSERT INTO transcripts(video_id, source, language, full_text, word_count, segments_json, duration, updated_at)
		VALUES(?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(video_id, source) DO UPDATE SET
			language = excluded.language,
			full_text = excluded.full_text,
			word_count = excluded.word_count,
			segments_json = excluded.segments_json,
			duration = excluded.duration,
			updated_at = excluded.updated_at;
	`, cleanID, source, res.Language, res.FullText, res.WordCount, string(segBytes), res.Duration, now)

	return err
}

// SaveTopics saves discovered topics for a creator
func (s *Store) SaveTopics(username string, topics []transcriber.TopicCluster) error {
	cleanUname := strings.TrimPrefix(strings.TrimSpace(username), "@")
	if cleanUname == "" || len(topics) == 0 {
		return nil
	}

	now := time.Now()
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Ensure profile entry exists
	_, _ = tx.Exec(`
		INSERT INTO profiles(username, created_at)
		VALUES(?, ?)
		ON CONFLICT(username) DO NOTHING;
	`, cleanUname, now)

	// Clean previous topics for this creator to avoid duplicates
	_, _ = tx.Exec("DELETE FROM topics WHERE profile_username = ?", cleanUname)

	for _, t := range topics {
		vidsJSON, _ := json.Marshal(t.VideoIDs)
		tID := strings.TrimSpace(t.ID)
		if tID == "" {
			tID = fmt.Sprintf("topic_%d", time.Now().UnixNano())
		}

		pubInt := 0
		if t.IsPublished {
			pubInt = 1
		}

		_, err = tx.Exec(`
			INSERT INTO topics(id, profile_username, category, title, description, video_ids_json, is_published, created_at)
			VALUES(?, ?, ?, ?, ?, ?, ?, ?);
		`, tID, cleanUname, t.Category, t.Title, t.Description, string(vidsJSON), pubInt, now)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// GetTopics retrieves cached topics for a creator
func (s *Store) GetTopics(username string) ([]transcriber.TopicCluster, error) {
	cleanUname := strings.TrimPrefix(strings.TrimSpace(username), "@")
	rows, err := s.db.Query(`
		SELECT id, category, title, description, video_ids_json, COALESCE(is_published, 0)
		FROM topics
		WHERE profile_username = ?
		ORDER BY rowid ASC;
	`, cleanUname)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var topics []transcriber.TopicCluster
	for rows.Next() {
		var t transcriber.TopicCluster
		var vidsJSON string
		var pubInt int
		if err := rows.Scan(&t.ID, &t.Category, &t.Title, &t.Description, &vidsJSON, &pubInt); err != nil {
			return nil, err
		}
		if vidsJSON != "" {
			_ = json.Unmarshal([]byte(vidsJSON), &t.VideoIDs)
		}
		t.IsPublished = (pubInt == 1)
		topics = append(topics, t)
	}

	return topics, nil
}

// DeleteTopic removes a single dismissed topic for a creator
func (s *Store) DeleteTopic(username, topicID string) error {
	cleanUname := strings.TrimPrefix(strings.TrimSpace(username), "@")
	cleanTID := strings.TrimSpace(topicID)
	if cleanUname == "" || cleanTID == "" {
		return nil
	}
	_, err := s.db.Exec("DELETE FROM topics WHERE profile_username = ? AND id = ?", cleanUname, cleanTID)
	return err
}

// UpdateTopicCategory updates the category tag for an individual topic
func (s *Store) UpdateTopicCategory(username, topicID, category string) error {
	cleanUname := strings.TrimPrefix(strings.TrimSpace(username), "@")
	cleanTID := strings.TrimSpace(topicID)
	cleanCat := strings.TrimSpace(category)
	if cleanUname == "" || cleanTID == "" {
		return nil
	}
	_, err := s.db.Exec("UPDATE topics SET category = ? WHERE profile_username = ? AND id = ?", cleanCat, cleanUname, cleanTID)
	return err
}

// UpdateTopicPublishStatus updates the publication status for an individual topic
func (s *Store) UpdateTopicPublishStatus(username, topicID string, isPublished bool) error {
	cleanUname := strings.TrimPrefix(strings.TrimSpace(username), "@")
	cleanTID := strings.TrimSpace(topicID)
	if cleanUname == "" || cleanTID == "" {
		return nil
	}
	pubInt := 0
	if isPublished {
		pubInt = 1
	}
	_, err := s.db.Exec("UPDATE topics SET is_published = ? WHERE profile_username = ? AND id = ?", pubInt, cleanUname, cleanTID)
	return err
}

// SaveArticleDraft saves or updates an article draft
func (s *Store) SaveArticleDraft(draft *ArticleDraftRecord) error {
	if draft == nil {
		return nil
	}
	dID := strings.TrimSpace(draft.ID)
	if dID == "" {
		dID = fmt.Sprintf("art_%d", time.Now().UnixNano())
		draft.ID = dID
	}

	now := time.Now()
	if draft.CreatedAt.IsZero() {
		draft.CreatedAt = now
	}
	draft.UpdatedAt = now

	_, err := s.db.Exec(`
		INSERT INTO article_drafts(id, topic_id, profile_username, title, category, research_prompt, executive_summary, markdown_content, word_count, source_json, created_at, updated_at)
		VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			title = excluded.title,
			category = excluded.category,
			research_prompt = excluded.research_prompt,
			executive_summary = excluded.executive_summary,
			markdown_content = excluded.markdown_content,
			word_count = excluded.word_count,
			source_json = COALESCE(NULLIF(excluded.source_json, ''), article_drafts.source_json),
			updated_at = excluded.updated_at;
	`, draft.ID, draft.TopicID, draft.ProfileUsername, draft.Title, draft.Category, draft.ResearchPrompt, draft.ExecutiveSummary, draft.MarkdownContent, draft.WordCount, draft.SourceJSON, draft.CreatedAt, draft.UpdatedAt)

	return err
}

// GetArticleDrafts returns all saved article drafts ordered by most recently updated
func (s *Store) GetArticleDrafts() ([]ArticleDraftRecord, error) {
	rows, err := s.db.Query(`
		SELECT id, topic_id, profile_username, title, category, research_prompt, COALESCE(executive_summary, ''), markdown_content, word_count, COALESCE(source_json, ''), created_at, updated_at
		FROM article_drafts
		ORDER BY updated_at DESC;
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var drafts []ArticleDraftRecord
	for rows.Next() {
		var d ArticleDraftRecord
		if err := rows.Scan(&d.ID, &d.TopicID, &d.ProfileUsername, &d.Title, &d.Category, &d.ResearchPrompt, &d.ExecutiveSummary, &d.MarkdownContent, &d.WordCount, &d.SourceJSON, &d.CreatedAt, &d.UpdatedAt); err != nil {
			return nil, err
		}
		drafts = append(drafts, d)
	}

	return drafts, nil
}

// GetArticleDraft retrieves a single draft by ID
func (s *Store) GetArticleDraft(id string) (*ArticleDraftRecord, error) {
	row := s.db.QueryRow(`
		SELECT id, topic_id, profile_username, title, category, research_prompt, COALESCE(executive_summary, ''), markdown_content, word_count, COALESCE(source_json, ''), created_at, updated_at
		FROM article_drafts
		WHERE id = ?;
	`, strings.TrimSpace(id))

	var d ArticleDraftRecord
	err := row.Scan(&d.ID, &d.TopicID, &d.ProfileUsername, &d.Title, &d.Category, &d.ResearchPrompt, &d.ExecutiveSummary, &d.MarkdownContent, &d.WordCount, &d.SourceJSON, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return &d, nil
}

// DeleteArticleDraft removes a draft by ID
func (s *Store) DeleteArticleDraft(id string) error {
	_, err := s.db.Exec("DELETE FROM article_drafts WHERE id = ?", strings.TrimSpace(id))
	return err
}

// GetRecentProfiles returns a list of previously scraped profiles with their topic counts
func (s *Store) GetRecentProfiles() ([]ProfileRecord, error) {
	rows, err := s.db.Query(`
		SELECT p.username, COALESCE(p.avatar_url, ''), p.video_count, p.last_scraped_at, COUNT(t.id) as topic_count
		FROM profiles p
		LEFT JOIN topics t ON p.username = t.profile_username
		GROUP BY p.username
		ORDER BY p.last_scraped_at DESC
		LIMIT 20;
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []ProfileRecord
	for rows.Next() {
		var p ProfileRecord
		if err := rows.Scan(&p.Username, &p.AvatarURL, &p.VideoCount, &p.LastScrapedAt, &p.TopicCount); err != nil {
			return nil, err
		}
		list = append(list, p)
	}

	return list, nil
}
