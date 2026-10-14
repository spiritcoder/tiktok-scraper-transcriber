package transcriber

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

// TavilySearchRequest represents the request payload sent to the Tavily API
type TavilySearchRequest struct {
	APIKey         string   `json:"api_key"`
	Query          string   `json:"query"`
	SearchDepth    string   `json:"search_depth,omitempty"`
	IncludeAnswer  bool     `json:"include_answer,omitempty"`
	MaxResults     int      `json:"max_results,omitempty"`
	ExcludeDomains []string `json:"exclude_domains,omitempty"`
}

// TavilySearchResultItem represents an individual web search result returned by Tavily
type TavilySearchResultItem struct {
	Title   string  `json:"title"`
	URL     string  `json:"url"`
	Content string  `json:"content"`
	Score   float64 `json:"score"`
}

// TavilySearchResponse represents the JSON response returned by the Tavily API
type TavilySearchResponse struct {
	Query   string                   `json:"query"`
	Answer  string                   `json:"answer"`
	Results []TavilySearchResultItem `json:"results"`
}

// WebSearchResult is the clean application model for a single research reference
type WebSearchResult struct {
	Title   string  `json:"title"`
	URL     string  `json:"url"`
	Content string  `json:"content"`
	Score   float64 `json:"score"`
}

// WebResearchReport represents the completed research report ready for prompt injection or UI review
type WebResearchReport struct {
	Query          string            `json:"query"`
	Answer         string            `json:"answer,omitempty"`
	Results        []WebSearchResult `json:"results"`
	FormattedBrief string            `json:"formatted_brief"`
}

// FormulateTopicResearchQuery extracts the clean subject and cultural entities for Tavily search
func FormulateTopicResearchQuery(topicTitle string, topicDesc string, category string, userAngle string) string {
	cleanAngle := strings.TrimSpace(userAngle)
	// Only use userAngle directly if it is a concise search phrase (not an entire prompt directive or briefing)
	if cleanAngle != "" && len(cleanAngle) <= 100 && !strings.Contains(cleanAngle, "\n") && !strings.Contains(strings.ToLower(cleanAngle), "http") && !strings.Contains(strings.ToLower(cleanAngle), "verified") {
		return cleanAngle
	}

	cleanTitle := CleanMetadataText(topicTitle)
	cleanDesc := CleanMetadataText(topicDesc)

	// 1. Extract core topic subject (strip documentary subtitle hooks after : or -)
	coreSubject := cleanTitle
	if idx := strings.Index(coreSubject, ":"); idx != -1 {
		coreSubject = strings.TrimSpace(coreSubject[:idx])
	} else if idx := strings.Index(coreSubject, " - "); idx != -1 {
		coreSubject = strings.TrimSpace(coreSubject[:idx])
	}

	// Strip common title prefixes ("The ", "A ", "An ")
	lowerSubject := strings.ToLower(coreSubject)
	if strings.HasPrefix(lowerSubject, "the ") {
		coreSubject = strings.TrimSpace(coreSubject[4:])
	} else if strings.HasPrefix(lowerSubject, "a ") {
		coreSubject = strings.TrimSpace(coreSubject[2:])
	} else if strings.HasPrefix(lowerSubject, "an ") {
		coreSubject = strings.TrimSpace(coreSubject[3:])
	}

	// 2. Discover relevant geographic, ethnic, and domain context from description or title
	contextKeywords := []string{
		"Imo State", "Imo", "Anambra", "Enugu", "Delta State", "Delta", "Abia", "Ebonyi", "Rivers State",
		"Dikenafai", "Awka", "Owerri", "Onitsha", "Asaba", "Nri", "Nsukka", "Orashi", "Oguta", "Ibusa",
		"Achina", "Amaokpala", "Enugu-Ezike", "Mbaise", "Igbo", "Odinani", "sacred grove", "sacred forest",
	}

	combinedText := strings.ToLower(cleanTitle + " " + cleanDesc)
	var foundContext []string
	for _, kw := range contextKeywords {
		if strings.Contains(combinedText, strings.ToLower(kw)) {
			// Avoid adding short tokens if longer one already exists (e.g. "Imo" vs "Imo State")
			alreadyPresent := false
			for _, fc := range foundContext {
				if strings.Contains(strings.ToLower(fc), strings.ToLower(kw)) {
					alreadyPresent = true
					break
				}
			}
			if !alreadyPresent {
				foundContext = append(foundContext, kw)
			}
		}
	}

	// 3. Assemble targeted search query
	parts := []string{coreSubject}
	if len(foundContext) > 0 {
		if len(foundContext) > 3 {
			foundContext = foundContext[:3]
		}
		parts = append(parts, strings.Join(foundContext, " "))
	} else if category != "" && !strings.EqualFold(category, "General") {
		parts = append(parts, category)
	}

	// Append "history" or "culture" if not already present
	queryCandidate := strings.Join(parts, " ")
	lowerCandidate := strings.ToLower(queryCandidate)
	if !strings.Contains(lowerCandidate, "history") && !strings.Contains(lowerCandidate, "tradition") && !strings.Contains(lowerCandidate, "culture") {
		queryCandidate += " history"
	}

	finalQuery := strings.TrimSpace(queryCandidate)
	if len(finalQuery) > 120 {
		if idx := strings.LastIndex(finalQuery[:120], " "); idx > 20 {
			finalQuery = finalQuery[:idx]
		} else {
			finalQuery = finalQuery[:120]
		}
	}
	return finalQuery
}

// FormulateResearchQuery generates an optimal, noise-free search query for Tavily from single video metadata
func FormulateResearchQuery(title string, desc string, transcript string, userAngle string) string {
	cleanAngle := strings.TrimSpace(userAngle)
	cleanTitle := CleanMetadataText(title)
	cleanDesc := CleanMetadataText(desc)

	if cleanAngle != "" && len(cleanAngle) <= 100 && !strings.Contains(cleanAngle, "\n") && !strings.Contains(strings.ToLower(cleanAngle), "http") && !strings.Contains(strings.ToLower(cleanAngle), "verified") {
		if cleanTitle != "" && !strings.Contains(strings.ToLower(cleanAngle), strings.ToLower(cleanTitle)) {
			candidate := fmt.Sprintf("%s %s", cleanAngle, cleanTitle)
			if len(candidate) > 120 {
				candidate = candidate[:120]
			}
			return candidate
		}
		return cleanAngle
	}

	// Strip narrative temporal lead-ins (e.g., "In December 2006, a sacred forest...")
	reIntro := regexp.MustCompile(`(?i)^(?:in\s+[a-z]+\s+\d{4},?\s*|years\s+ago,?\s*|did\s+you\s+know\s+that\s+|why\s+did\s+)`)
	cleanedTitle := reIntro.ReplaceAllString(cleanTitle, "")

	if cleanedTitle != "" {
		filtered := removeNoiseWords(cleanedTitle)
		if len(filtered) >= 10 {
			// Append geographic or cultural anchor if present in description
			descLower := strings.ToLower(cleanDesc)
			if (strings.Contains(descLower, "imo state") || strings.Contains(descLower, "imo")) && !strings.Contains(strings.ToLower(filtered), "imo") {
				filtered += " Imo State"
			} else if strings.Contains(descLower, "anambra") && !strings.Contains(strings.ToLower(filtered), "anambra") {
				filtered += " Anambra"
			} else if strings.Contains(descLower, "enugu") && !strings.Contains(strings.ToLower(filtered), "enugu") {
				filtered += " Enugu"
			}
			if !strings.Contains(strings.ToLower(filtered), "history") && !strings.Contains(strings.ToLower(filtered), "culture") {
				filtered += " history"
			}
			return filtered
		}
	}

	if cleanDesc != "" {
		filtered := removeNoiseWords(cleanDesc)
		if len(filtered) >= 10 {
			if len(filtered) > 120 {
				filtered = filtered[:120]
			}
			return filtered
		}
	}

	// Fallback to first substantive sentence of transcript
	cleanTrans := strings.TrimSpace(transcript)
	if cleanTrans != "" {
		sentences := strings.Split(cleanTrans, ".")
		for _, s := range sentences {
			trimmed := strings.TrimSpace(s)
			if len(trimmed) > 20 {
				if len(trimmed) > 120 {
					trimmed = trimmed[:120]
				}
				return trimmed
			}
		}
	}

	if cleanTitle != "" {
		return cleanTitle
	}
	return "African cultural traditions and history"
}

// removeNoiseWords strips viral hashtags, emojis, and generic video fillers
func removeNoiseWords(input string) string {
	reHashtag := regexp.MustCompile(`#[A-Za-z0-9_]+`)
	reMention := regexp.MustCompile(`@[A-Za-z0-9_]+`)
	reURL := regexp.MustCompile(`https?://\S+`)

	out := reHashtag.ReplaceAllString(input, "")
	out = reMention.ReplaceAllString(out, "")
	out = reURL.ReplaceAllString(out, "")

	// Remove common TikTok viral phrases
	viralFillers := []string{
		"part 1", "part 2", "part 3", "pt 1", "pt 2", "pt 3",
		"wait for it", "must watch", "fyp", "foryou", "viral",
		"watch till the end", "tiktok", "trending",
	}
	lower := strings.ToLower(out)
	for _, filler := range viralFillers {
		idx := strings.Index(lower, filler)
		if idx != -1 {
			lower = strings.ReplaceAll(lower, filler, "")
			out = out[:idx] + out[idx+len(filler):]
		}
	}

	// Collapse whitespace and clean punctuation
	reSpaces := regexp.MustCompile(`\s+`)
	out = strings.TrimSpace(reSpaces.ReplaceAllString(out, " "))
	return out
}

// PerformTavilySearch executes a web research search using the official Tavily API
func PerformTavilySearch(apiKey string, query string, maxResults int) (*TavilySearchResponse, error) {
	cleanKey := strings.TrimSpace(apiKey)
	if cleanKey == "" {
		return nil, fmt.Errorf("Tavily API key is required for web research")
	}

	cleanQuery := strings.TrimSpace(query)
	if cleanQuery == "" {
		return nil, fmt.Errorf("search query cannot be empty")
	}

	// Strictly enforce Tavily query length limit (never exceed 200 chars)
	if len(cleanQuery) > 200 {
		if idx := strings.LastIndex(cleanQuery[:200], " "); idx > 30 {
			cleanQuery = cleanQuery[:idx]
		} else {
			cleanQuery = cleanQuery[:200]
		}
	}

	if maxResults <= 0 || maxResults > 10 {
		maxResults = 5
	}

	reqPayload := TavilySearchRequest{
		APIKey:        cleanKey,
		Query:         cleanQuery,
		SearchDepth:   "basic",
		IncludeAnswer: true,
		MaxResults:    maxResults,
		ExcludeDomains: []string{
			"facebook.com",
			"tiktok.com",
			"instagram.com",
			"youtube.com",
			"youtu.be",
			"twitter.com",
			"x.com",
			"reddit.com",
			"pinterest.com",
		},
	}

	jsonBytes, err := json.Marshal(reqPayload)
	if err != nil {
		return nil, fmt.Errorf("failed to encode search request: %w", err)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	httpReq, err := http.NewRequest("POST", "https://api.tavily.com/search", bytes.NewBuffer(jsonBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create search HTTP request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("Tavily search request failed: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read Tavily response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errResp struct {
			Detail string `json:"detail"`
			Error  string `json:"error"`
		}
		_ = json.Unmarshal(bodyBytes, &errResp)
		msg := errResp.Detail
		if msg == "" {
			msg = errResp.Error
		}
		if msg == "" {
			msg = fmt.Sprintf("HTTP status %d: %s", resp.StatusCode, string(bodyBytes))
		}
		return nil, fmt.Errorf("Tavily API error: %s", msg)
	}

	var searchResp TavilySearchResponse
	if err := json.Unmarshal(bodyBytes, &searchResp); err != nil {
		return nil, fmt.Errorf("failed to parse Tavily response: %w", err)
	}

	return &searchResp, nil
}

// ConductWebResearch coordinates query formulation, search execution, and brief formatting
func ConductWebResearch(query string, title string, desc string, transcript string, apiKey string) (*WebResearchReport, error) {
	effectiveQuery := strings.TrimSpace(query)
	if effectiveQuery == "" {
		effectiveQuery = FormulateResearchQuery(title, desc, transcript, "")
	}

	rawResp, err := PerformTavilySearch(apiKey, effectiveQuery, 5)
	if err != nil {
		return nil, err
	}

	report := &WebResearchReport{
		Query:   rawResp.Query,
		Answer:  strings.TrimSpace(rawResp.Answer),
		Results: make([]WebSearchResult, 0, len(rawResp.Results)),
	}

	for _, r := range rawResp.Results {
		report.Results = append(report.Results, WebSearchResult{
			Title:   strings.TrimSpace(r.Title),
			URL:     strings.TrimSpace(r.URL),
			Content: strings.TrimSpace(r.Content),
			Score:   r.Score,
		})
	}

	report.FormattedBrief = FormatResearchBrief(report)
	return report, nil
}

// ConductTopicWebResearch researches a synthesized multi-video topic using smart topical query formulation
func ConductTopicWebResearch(topicTitle string, topicDesc string, category string, userAngle string, apiKey string) (*WebResearchReport, error) {
	query := FormulateTopicResearchQuery(topicTitle, topicDesc, category, userAngle)
	return ConductWebResearch(query, topicTitle, topicDesc, "", apiKey)
}

// FormatResearchBrief turns a WebResearchReport into structured markdown context for the DeepSeek prompt
func FormatResearchBrief(report *WebResearchReport) string {
	if report == nil || (report.Answer == "" && len(report.Results) == 0) {
		return ""
	}

	// Filter out social media platforms from brief results
	socialDomains := []string{"facebook.com", "tiktok.com", "youtube.com", "youtu.be", "twitter.com", "x.com", "instagram.com", "reddit.com"}
	var cleanResults []WebSearchResult
	for _, r := range report.Results {
		link := strings.ToLower(r.URL)
		isSocial := false
		for _, sd := range socialDomains {
			if strings.Contains(link, sd) {
				isSocial = true
				break
			}
		}
		if !isSocial && strings.TrimSpace(r.URL) != "" {
			cleanResults = append(cleanResults, r)
		}
	}

	var sb strings.Builder
	sb.WriteString("REAL-TIME VERIFIED WEB RESEARCH & FACTUAL GROUNDING (Tavily):\n")
	sb.WriteString(fmt.Sprintf("- Research Query Executed: %q\n\n", report.Query))

	if report.Answer != "" {
		sb.WriteString("KEY FACTUAL SYNTHESIS & HISTORICAL CONTEXT:\n")
		sb.WriteString(report.Answer)
		sb.WriteString("\n\n")
	}

	if len(cleanResults) > 0 {
		sb.WriteString("VERIFIED EXTERNAL SOURCES & EXCERPTS:\n")
		for i, res := range cleanResults {
			sb.WriteString(fmt.Sprintf("[%d] %s\n", i+1, res.Title))
			if res.URL != "" {
				sb.WriteString(fmt.Sprintf("    URL: %s\n", res.URL))
			}
			if res.Content != "" {
				content := res.Content
				if len(content) > 350 {
					content = content[:350] + "..."
				}
				sb.WriteString(fmt.Sprintf("    Excerpt: %s\n", content))
			}
			sb.WriteString("\n")
		}
	}

	sb.WriteString("INSTRUCTIONS ON USING RESEARCH CONTEXT:\n")
	sb.WriteString("- USE AS BACKGROUND FACTUAL GROUNDING: Weave the historical dates, geographic realities, academic perspectives, and cultural facts into the narrative.\n")
	sb.WriteString("- NEVER ENGAGE IN META-COMMENTARY: Never write \"according to the search\", \"the web brief states\", \"in this transcript\", or \"the creator notes\". Write directly with authoritative storytelling.\n")
	sb.WriteString("- DO NOT LIST WEB SEARCH URLS IN THE DRAFT: The article draft's References section must only include \"### Primary Source Media\" and \"### External Historical & Academic References\" (citing classic recognized scholars, books, and ethnographies). Web research URLs reside separately in the application interface.\n")
	sb.WriteString("---\n")

	return sb.String()
}

// FormatWebSourcesSection creates the markdown block of verified non-social web search URLs
func FormatWebSourcesSection(results []WebSearchResult) string {
	var validResults []WebSearchResult
	socialDomains := []string{"facebook.com", "tiktok.com", "youtube.com", "youtu.be", "twitter.com", "x.com", "instagram.com", "reddit.com"}
	for _, r := range results {
		link := strings.ToLower(r.URL)
		isSocial := false
		for _, sd := range socialDomains {
			if strings.Contains(link, sd) {
				isSocial = true
				break
			}
		}
		if !isSocial && strings.TrimSpace(r.URL) != "" {
			validResults = append(validResults, r)
		}
	}

	if len(validResults) == 0 {
		return ""
	}

	var sb strings.Builder
	sb.WriteString("### Verified Web & Archival Research Sources\n")
	for i, r := range validResults {
		title := r.Title
		if title == "" {
			title = r.URL
		}
		sb.WriteString(fmt.Sprintf("* [%d] **%s** - [%s](%s)\n", i+1, title, r.URL, r.URL))
		if r.Content != "" {
			snippet := r.Content
			if len(snippet) > 180 {
				snippet = snippet[:180] + "..."
			}
			sb.WriteString(fmt.Sprintf("  - *Contextual Finding:* %s\n", snippet))
		}
	}
	sb.WriteString("\n")
	return sb.String()
}

// InjectWebSourcesIntoArticle ensures verified web search URLs appear at the bottom of References & Works Cited
func InjectWebSourcesIntoArticle(article string, webSourcesMd string) string {
	if strings.TrimSpace(webSourcesMd) == "" {
		return article
	}

	const refHeader = "## References & Works Cited"
	if idx := strings.Index(article, refHeader); idx != -1 {
		// Append to the bottom of the article after References & Works Cited, preserving all academic references
		return strings.TrimSpace(article) + "\n\n" + strings.TrimSpace(webSourcesMd) + "\n"
	}

	// If no references header found, append at the end
	return strings.TrimSpace(article) + "\n\n## References & Works Cited\n\n" + strings.TrimSpace(webSourcesMd) + "\n"
}


