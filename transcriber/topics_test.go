package transcriber

import (
	"testing"
)

func TestParseTopicsJSON_Complete(t *testing.T) {
	raw := `{
		"topics": [
			{
				"id": "t1",
				"category": "Places & Geography",
				"title": "Topic 1",
				"description": "Desc 1",
				"video_ids": ["v1", "v2"]
			}
		]
	}`
	topics, err := parseTopicsJSON(raw)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(topics) != 1 || topics[0].Title != "Topic 1" || topics[0].Category != "Places & Geography" {
		t.Fatalf("unexpected result: %+v", topics)
	}
}

func TestParseTopicsJSON_Truncated(t *testing.T) {
	raw := `{
		"topics": [
			{
				"id": "t1",
				"title": "Topic 1",
				"description": "Desc 1",
				"video_ids": ["v1", "v2"]
			},
			{
				"id": "t2",
				"title": "Topic 2",
				"description": "Desc 2",
				"video_ids": ["v3"]
			},
			{
				"id": "t3",
				"title": "Topic 3",
				"description": "Desc 3",
				"video_ids": ["v4"
	`
	topics, err := parseTopicsJSON(raw)
	if err != nil {
		t.Fatalf("unexpected error on truncated JSON: %v", err)
	}
	if len(topics) != 2 {
		t.Fatalf("expected 2 repaired topics, got %d", len(topics))
	}
	if topics[1].Title != "Topic 2" {
		t.Fatalf("unexpected second topic: %+v", topics[1])
	}
}

func TestParseTopicsJSON_CodeFencesAndPreamble(t *testing.T) {
	raw := "Here is the result:\n```json\n{\n  \"topics\": [\n    {\n      \"id\": \"t1\",\n      \"title\": \"Title 1\",\n      \"description\": \"Desc 1\",\n      \"video_ids\": [\"1\"]\n    }\n  ]\n}\n```\nHope this helps!"
	topics, err := parseTopicsJSON(raw)
	if err != nil {
		t.Fatalf("unexpected error with preamble: %v", err)
	}
	if len(topics) != 1 {
		t.Fatalf("expected 1 topic, got %d", len(topics))
	}
}

func TestExtractDraftSections(t *testing.T) {
	// Case 1: Structured tags
	rawWithTags := `<<<EXECUTIVE_SUMMARY>>>
Core Premise: Cultural traditions are vital.
Key Strategic Takeaways:
- Tradition matters
- History informs identity
<<<END_EXECUTIVE_SUMMARY>>>

<<<ARTICLE_BODY>>>
# The Power of Tradition

This is the main article content.
<<<END_ARTICLE_BODY>>>`

	sum, art := ExtractDraftSections(rawWithTags)
	if sum == "" || art != "# The Power of Tradition\n\nThis is the main article content." {
		t.Fatalf("failed to extract tagged sections: sum=%q art=%q", sum, art)
	}

	// Case 2: No summary tags
	plainArticle := "# Clean Headline\n\nArticle body paragraph."
	sum2, art2 := ExtractDraftSections(plainArticle)
	if sum2 != "" || art2 != plainArticle {
		t.Fatalf("failed on plain article: sum=%q art=%q", sum2, art2)
	}

	// Case 3: Legacy format
	legacy := `## Executive Summary
> **Core Premise:** Ancient craft informs modern life.
> - Preserved knowledge
> - Community bonds

# Rediscovering the Blacksmiths

The bellows roared.`

	sum3, art3 := ExtractDraftSections(legacy)
	if sum3 == "" || art3 != "# Rediscovering the Blacksmiths\n\nThe bellows roared." {
		t.Fatalf("failed on legacy format: sum=%q art=%q", sum3, art3)
	}
}
