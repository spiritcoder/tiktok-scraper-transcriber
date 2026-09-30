package store

import (
	"path/filepath"
	"testing"
	"tiktok-scraper-transcriber/transcriber"
)

func TestStoreOperations(t *testing.T) {
	tempDir := t.TempDir()
	dbPath := filepath.Join(tempDir, "test.db")

	st, err := NewStore(dbPath)
	if err != nil {
		t.Fatalf("failed to create store: %v", err)
	}
	defer st.Close()

	// 1. Test Profile and Videos
	vids := []transcriber.VideoItem{
		{
			ID:          "1234567890123456789",
			Title:       "Test Video 1",
			Description: "Desc 1",
			Duration:    60,
			URL:         "https://tiktok.com/@creator/video/1234567890123456789",
		},
	}
	if err := st.SaveProfile("testcreator", "https://avatar.jpg", vids); err != nil {
		t.Fatalf("failed to save profile: %v", err)
	}

	p, err := st.GetProfile("testcreator")
	if err != nil {
		t.Fatalf("failed to get profile: %v", err)
	}
	if len(p.Videos) != 1 || p.Videos[0].ID != "1234567890123456789" {
		t.Fatalf("unexpected profile videos: %+v", p.Videos)
	}

	// 2. Test Transcript Caching
	tr := &transcriber.TranscriptResult{
		VideoID:   "1234567890123456789",
		Source:    "groq_whisper",
		Language:  "en",
		FullText:  "This is a cached transcript.",
		WordCount: 5,
		Duration:  60,
	}
	if err := st.SaveTranscript("1234567890123456789", tr); err != nil {
		t.Fatalf("failed to save transcript: %v", err)
	}

	cached, err := st.GetCachedTranscript("1234567890123456789")
	if err != nil {
		t.Fatalf("failed to get cached transcript: %v", err)
	}
	if cached.FullText != "This is a cached transcript." {
		t.Fatalf("unexpected cached text: %s", cached.FullText)
	}

	// 3. Test Topics
	topics := []transcriber.TopicCluster{
		{
			ID:          "top_1",
			Category:    "History & Heritage",
			Title:       "Ikenga: What Really Is It?",
			Description: "A deep dive into personal achievement.",
			VideoIDs:    []string{"1234567890123456789"},
		},
	}
	if err := st.SaveTopics("testcreator", topics); err != nil {
		t.Fatalf("failed to save topics: %v", err)
	}

	gotTopics, err := st.GetTopics("testcreator")
	if err != nil {
		t.Fatalf("failed to get topics: %v", err)
	}
	if len(gotTopics) != 1 || gotTopics[0].Category != "History & Heritage" {
		t.Fatalf("unexpected topics: %+v", gotTopics)
	}

	// 4. Test Article Draft
	draft := &ArticleDraftRecord{
		ID:              "art_1",
		TopicID:         "top_1",
		ProfileUsername: "testcreator",
		Title:           "Ikenga: What Really Is It?",
		Category:        "History & Heritage",
		ResearchPrompt:  "Focus on pre-colonial metallurgy",
		MarkdownContent: "# Ikenga\n**Category:** History & Heritage\nFull content",
		WordCount:       8,
	}
	if err := st.SaveArticleDraft(draft); err != nil {
		t.Fatalf("failed to save article draft: %v", err)
	}

	drafts, err := st.GetArticleDrafts()
	if err != nil {
		t.Fatalf("failed to get drafts: %v", err)
	}
	if len(drafts) != 1 || drafts[0].Category != "History & Heritage" {
		t.Fatalf("unexpected drafts: %+v", drafts)
	}

	// 5. Test Dual Transcripts (TikTok Subtitles and Groq Whisper on same video)
	trTikTok := &transcriber.TranscriptResult{
		VideoID:   "1234567890123456789",
		Source:    "tiktok_native",
		Language:  "en",
		FullText:  "This is a native TikTok caption.",
		WordCount: 6,
		Duration:  60,
	}
	if err := st.SaveTranscript("1234567890123456789", trTikTok); err != nil {
		t.Fatalf("failed to save tiktok transcript: %v", err)
	}

	whisper, tiktok, err := st.GetCachedTranscripts("1234567890123456789")
	if err != nil {
		t.Fatalf("failed to get dual transcripts: %v", err)
	}
	if whisper == nil || whisper.FullText != "This is a cached transcript." {
		t.Fatalf("whisper transcript mismatch: %+v", whisper)
	}
	if tiktok == nil || tiktok.FullText != "This is a native TikTok caption." {
		t.Fatalf("tiktok transcript mismatch: %+v", tiktok)
	}

	// 6. Test Topic Category Update & Publish Status
	if err := st.UpdateTopicCategory("testcreator", "top_1", "Philosophy & Arts"); err != nil {
		t.Fatalf("failed to update topic category: %v", err)
	}
	if err := st.UpdateTopicPublishStatus("testcreator", "top_1", true); err != nil {
		t.Fatalf("failed to update topic publish status: %v", err)
	}
	gotTopics, _ = st.GetTopics("testcreator")
	if len(gotTopics) != 1 || gotTopics[0].Category != "Philosophy & Arts" || !gotTopics[0].IsPublished {
		t.Fatalf("expected updated category and published status true, got: %+v", gotTopics)
	}
	// Revert to draft
	if err := st.UpdateTopicPublishStatus("testcreator", "top_1", false); err != nil {
		t.Fatalf("failed to revert topic publish status: %v", err)
	}
	gotTopics, _ = st.GetTopics("testcreator")
	if len(gotTopics) != 1 || gotTopics[0].IsPublished {
		t.Fatalf("expected published status false, got: %+v", gotTopics)
	}

	// 7. Test Profiles with Topic Count
	profiles, err := st.GetRecentProfiles()
	if err != nil {
		t.Fatalf("failed to get recent profiles: %v", err)
	}
	if len(profiles) == 0 || profiles[0].TopicCount != 1 {
		t.Fatalf("expected 1 topic in profile count, got: %+v", profiles)
	}

	// 8. Test Topic Deletion
	if err := st.DeleteTopic("testcreator", "top_1"); err != nil {
		t.Fatalf("failed to delete topic: %v", err)
	}
	gotTopics, _ = st.GetTopics("testcreator")
	if len(gotTopics) != 0 {
		t.Fatalf("expected 0 topics after delete, got: %+v", gotTopics)
	}
}
