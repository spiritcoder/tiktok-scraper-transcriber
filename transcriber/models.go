package transcriber

type VideoItem struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Duration    int     `json:"duration"`
	Thumbnail   string  `json:"thumbnail"`
	URL         string  `json:"url"`
	ViewCount   int64   `json:"view_count"`
	LikeCount   int64   `json:"like_count"`
	Author      string  `json:"author"`
}

type ProfileResult struct {
	Username string      `json:"username"`
	Videos   []VideoItem `json:"videos"`
}

type Segment struct {
	Start float64 `json:"start"`
	End   float64 `json:"end"`
	Text  string  `json:"text"`
}

type TranscriptResult struct {
	Source      string    `json:"source"` // "tiktok_native" or "groq_whisper"
	VideoID     string    `json:"video_id"`
	VideoTitle  string    `json:"video_title"`
	AITitle     string    `json:"ai_title,omitempty"`
	Language    string    `json:"language"`
	FullText    string    `json:"full_text"`
	WordCount   int       `json:"word_count"`
	Segments    []Segment `json:"segments"`
	Duration    float64   `json:"duration"`
	Error       string    `json:"error,omitempty"`
}
