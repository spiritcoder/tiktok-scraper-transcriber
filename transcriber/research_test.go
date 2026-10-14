package transcriber

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestFormulateResearchQuery(t *testing.T) {
	// Case 1: Explicit user angle
	q1 := FormulateResearchQuery("Short Title #fyp", "Desc", "Transcript text", "Pre-colonial Igbo blacksmiths")
	if !strings.Contains(q1, "Pre-colonial Igbo blacksmiths") {
		t.Fatalf("expected user angle in query, got: %s", q1)
	}

	// Case 2: Clean title with hashtag and viral noise
	q2 := FormulateResearchQuery("The Secret History of Nri Kingdom #fyp #viral part 1", "Desc", "Transcript", "")
	if strings.Contains(q2, "#fyp") || strings.Contains(q2, "part 1") {
		t.Fatalf("expected noise words removed, got: %s", q2)
	}
	if !strings.Contains(q2, "Nri Kingdom") {
		t.Fatalf("expected subject to be preserved, got: %s", q2)
	}

	// Case 3: Empty title, uses description
	q3 := FormulateResearchQuery("", "Exploring the sacred python totem in Idemili traditions #culture", "Transcript", "")
	if !strings.Contains(q3, "Idemili") {
		t.Fatalf("expected description subject preserved, got: %s", q3)
	}
}

func TestFormatResearchBrief(t *testing.T) {
	report := &WebResearchReport{
		Query:  "Nri Kingdom coronation",
		Answer: "The Nri Kingdom was the historical religious and political heartland of the Igbo people.",
		Results: []WebSearchResult{
			{
				Title:   "Nri Kingdom - Wikipedia",
				URL:     "https://en.wikipedia.org/wiki/Kingdom_of_Nri",
				Content: "The Kingdom of Nri was a medieval polity in what is now southeastern Nigeria.",
			},
		},
	}

	brief := FormatResearchBrief(report)
	if !strings.Contains(brief, "Nri Kingdom coronation") {
		t.Fatalf("expected query in brief")
	}
	if !strings.Contains(brief, "religious and political heartland") {
		t.Fatalf("expected answer synthesis in brief")
	}
	if !strings.Contains(brief, "https://en.wikipedia.org/wiki/Kingdom_of_Nri") {
		t.Fatalf("expected source URL in brief")
	}
}

func TestPerformTavilySearchMock(t *testing.T) {
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req TavilySearchRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if req.APIKey != "mock-tavily-key" {
			http.Error(w, `{"error": "unauthorized"}`, http.StatusUnauthorized)
			return
		}

		resp := TavilySearchResponse{
			Query:  req.Query,
			Answer: "Mocked factual answer about Odinani.",
			Results: []TavilySearchResultItem{
				{
					Title:   "Odinani Overview",
					URL:     "https://example.com/odinani",
					Content: "Odinani comprises the traditional cultural beliefs and religious practices of the Igbo people.",
					Score:   0.98,
				},
			},
		}
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer mockServer.Close()

	// Note: PerformTavilySearch calls the hardcoded tavily URL, but we can test validation:
	_, err := PerformTavilySearch("", "test query", 5)
	if err == nil {
		t.Fatalf("expected error for empty API key")
	}

	_, err2 := PerformTavilySearch("some-key", "", 5)
	if err2 == nil {
		t.Fatalf("expected error for empty query")
	}
}

func TestFormulateTopicResearchQuery(t *testing.T) {
	// Case 1: Topic with documentary subtitle hook
	q1 := FormulateTopicResearchQuery(
		"The Dikenafai Sacred Forest: The Day the Unseen Trees Fell",
		"The 2006 clearing of Dikenafai's sacred forest in Imo State reveals how religious change...",
		"History & Heritage",
		"",
	)
	if strings.Contains(q1, "The Day the Unseen Trees Fell") {
		t.Fatalf("expected documentary hook subtitle removed from query, got: %s", q1)
	}
	if !strings.Contains(q1, "Dikenafai Sacred Forest") {
		t.Fatalf("expected core subject preserved, got: %s", q1)
	}
	if !strings.Contains(q1, "Imo State") {
		t.Fatalf("expected geographic anchor Imo State included, got: %s", q1)
	}

	// Case 2: Banking topic
	q2 := FormulateTopicResearchQuery(
		"Isusu: The Indigenous Banking Empire Built on Trust Alone",
		"Traditional rotating credit in Igbo land",
		"Finance & Trade",
		"",
	)
	if !strings.Contains(q2, "Isusu") || !strings.Contains(q2, "Igbo") {
		t.Fatalf("expected Isusu and Igbo in query, got: %s", q2)
	}

	// Case 3: User angle overrides title
	q3 := FormulateTopicResearchQuery("Some Title", "Some Desc", "History", "Taboo conservation systems in southeastern Nigeria")
	if q3 != "Taboo conservation systems in southeastern Nigeria" {
		t.Fatalf("expected user angle to override, got: %s", q3)
	}

	// Case 4: Long user angle or multi-line prompt falls back to clean topic formulation and is clamped
	longAngle := "This is a very long editorial prompt explaining how the article should explore the destruction of the sacred forest in Dikenafai, with details about the villagers cutting down trees for church buildings and how the water stopped flowing, and oha trees becoming expensive.\n\nMore paragraphs here with details that would exceed 1500 chars if not checked."
	q4 := FormulateTopicResearchQuery("The Dikenafai Sacred Forest: The Day the Unseen Trees Fell", "Sacred forest in Imo State", "History", longAngle)
	if len(q4) > 120 {
		t.Fatalf("expected query length clamped to <= 120, got length %d: %s", len(q4), q4)
	}
	if strings.Contains(q4, "More paragraphs") {
		t.Fatalf("expected long editorial text ignored for query formulation")
	}
	if !strings.Contains(q4, "Dikenafai") {
		t.Fatalf("expected topic subject in query, got: %s", q4)
	}
}

func TestFormatWebSourcesSectionFiltersSocialMedia(t *testing.T) {
	results := []WebSearchResult{
		{
			Title:   "Creator Facebook Post",
			URL:     "https://www.facebook.com/anterrastudios/posts/123",
			Content: "Facebook video mirror",
		},
		{
			Title:   "YouTube Video",
			URL:     "https://www.youtube.com/watch?v=abc",
			Content: "YouTube clip",
		},
		{
			Title:   "IJIH Scholarly Study",
			URL:     "https://www.ijih.org/volumes/article/607",
			Content: "Academic documentation of sacred groves in southeastern Nigeria.",
		},
	}

	md := FormatWebSourcesSection(results)
	if strings.Contains(md, "facebook.com") {
		t.Fatalf("expected facebook link to be filtered out")
	}
	if strings.Contains(md, "youtube.com") {
		t.Fatalf("expected youtube link to be filtered out")
	}
	if !strings.Contains(md, "https://www.ijih.org/volumes/article/607") {
		t.Fatalf("expected academic link to be retained")
	}
}

func TestInjectWebSourcesIntoArticlePreservesAcademicReferences(t *testing.T) {
	article := `# The Sacred Forest of Dikenafai

Narrative text here.

## References & Works Cited

### Primary Source Media
* [1] **Video** - *TikTok*, [Watch on TikTok](https://tiktok.com)

### External Historical & Academic References
* **Uchendu, Victor C.** (1965). *The Igbo of Southeast Nigeria*.
  - *Contextual Relevance:* Foundational ethnographic study.
`

	webSection := `### Verified Web & Archival Research Sources
* [1] **Sacred Groves Study** - [https://example.com/groves](https://example.com/groves)
`

	injected := InjectWebSourcesIntoArticle(article, webSection)

	// Ensure External Historical & Academic References is still in the output
	if !strings.Contains(injected, "### External Historical & Academic References") {
		t.Fatalf("expected academic references preserved")
	}
	if !strings.Contains(injected, "Uchendu, Victor C.") {
		t.Fatalf("expected Uchendu citation preserved")
	}
	if !strings.Contains(injected, "https://example.com/groves") {
		t.Fatalf("expected web source included")
	}

	// Verify academic references appears BEFORE web sources
	acadIdx := strings.Index(injected, "### External Historical & Academic References")
	webIdx := strings.Index(injected, "### Verified Web & Archival Research Sources")
	if acadIdx > webIdx {
		t.Fatalf("expected academic references to come before web sources")
	}
}

