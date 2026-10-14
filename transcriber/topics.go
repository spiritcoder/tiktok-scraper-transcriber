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

type ProfileVideoMeta struct {
	ID    string `json:"id"`
	URL   string `json:"url"`
	Title string `json:"title"`
	Desc  string `json:"desc"`
}

type TopicCluster struct {
	ID          string   `json:"id"`
	Category    string   `json:"category"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	VideoIDs    []string `json:"video_ids"`
	IsPublished bool     `json:"is_published"`
}

type TopicVideoDetail struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	Desc       string `json:"desc"`
	URL        string `json:"url,omitempty"`
	Transcript string `json:"transcript"`
}

// DiscoverProfileTopics analyzes a creator's catalog and groups videos into organic topics
func DiscoverProfileTopics(creator string, videos []ProfileVideoMeta, targetCategories []string, apiKey string) ([]TopicCluster, error) {
	cleanKey := strings.TrimSpace(apiKey)
	if cleanKey == "" {
		return nil, fmt.Errorf("DeepSeek API key is required to discover profile topics")
	}

	if len(videos) == 0 {
		return nil, fmt.Errorf("no videos provided for topic discovery")
	}

	// Limit to the top 60 catalog entries to prevent prompt bloat and token exhaustion
	catalogVideos := videos
	if len(catalogVideos) > 60 {
		catalogVideos = catalogVideos[:60]
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("CREATOR: %s\nTOTAL VIDEOS: %d\n\nCATALOG ENTRIES:\n", creator, len(catalogVideos)))
	for i, v := range catalogVideos {
		cleanT := CleanMetadataText(v.Title)
		cleanD := CleanMetadataText(v.Desc)
		sb.WriteString(fmt.Sprintf("%d. [ID: %s]\n   Title: %s\n", i+1, v.ID, cleanT))
		if cleanD != "" && cleanD != cleanT {
			sb.WriteString(fmt.Sprintf("   Caption: %s\n", cleanD))
		}
		sb.WriteString("\n")
	}

	categoryDirective := ""
	var cleanCategories []string
	for _, c := range targetCategories {
		t := strings.TrimSpace(c)
		if t != "" {
			cleanCategories = append(cleanCategories, t)
		}
	}

	if len(cleanCategories) > 0 {
		categoryDirective = fmt.Sprintf(`
CATEGORY CLASSIFICATION DIRECTIVES:
The user has provided the following target categories: %s.
- For every topic, select the most accurate category from this list and assign it to the "category" field.
- If and only if a topic genuinely does not fit into any of the provided target categories, you may suggest a clear, concise new category name.
`, strings.Join(cleanCategories, ", "))
	} else {
		categoryDirective = `
CATEGORY CLASSIFICATION DIRECTIVES:
For each topic, infer and assign a clear, concise overarching category to the "category" field that best describes its domain (e.g. History & Heritage, Places & Geography, Food & Culinary, Arts & Literature, Science & Innovation, Culture & Traditions, etc.).
`
	}

	prompt := `You are a master cultural documentary producer, indigenous historian, and investigative essayist.
Your task is to analyze the video catalog of TikTok creator ` + creator + ` and craft compelling, documentary-worthy topics for their videos.

CRITICAL RULES FOR TOPIC DISCOVERY:

1. STRICTLY FORBID BROAD UMBRELLA CATEGORIES:
   Do NOT group videos into broad academic category bins like "Igbo Deities and Spiritual Forces", "Colonial Encounters", "Cultural Practices and Social Structures", "Cosmology and Afterlife", "Symbols and Objects of Power", or "Community and Identity". Those are lazy encyclopedic folders, NOT documentary topics.

2. CRAFT DOCUMENTARY-WORTHY, CREATIVE TITLES & NAME THE EXACT CONCEPT:
   - Each topic title must feel like the title of a prestige documentary episode, an investigative podcast, or a high-caliber Longform essay.
   - ALWAYS explicitly identify and name the underlying indigenous concept, deity, goddess, river, artifact, historical event, or custom (e.g. Ikenga, Ofo, Isusu, Ogbanje, Agwu, Ani, Idemili, Ekumeku, etc.).
   - BE CREATIVE AND THOUGHT-PROVOKING: Combine the exact named entity/concept with a captivating hook, question, or paradox.
   - Do NOT just copy the literal video title or TikTok caption.
   - EXAMPLES OF DOCUMENTARY-WORTHY TITLES:
     - For Ikenga: "Ikenga: What Really Is It?" (NOT "That horned figure in your grandfather's house")
     - For Isusu: "Isusu: The Indigenous Banking Empire Built on Trust Alone" (NOT "The Igbo built a banking system with no building")
     - For Ofo: "Ofo: The Sacred Staff That Forbid Igbo Ancestors from Lying" (NOT "Our ancestors believed the truth could live inside a staff")
     - For Enugu-Ezike spirit: "The Choosing Spirit of Enugu-Ezike: The Female Divinity That Claims Women"
     - For Achina deity: "The Exiled Deity of Achina: Why a Town Had to Plead for Its God's Return"
     - For Amaokpala: "Amaokpala and the Devouring River: When the Earth Fights Water"
     - For Dikenafai: "The Dikenafai Sacred Forest: The Day the Unseen Trees Fell"
     - For Ogbanje: "Ogbanje: The Children Born to Die and Return"
     - For Ekumeku: "Ekumeku: The Invisible Guerilla War the British Couldn't Break"
     - For Asaba: "Asaba 1967: When White Garments Met Machine Guns"

3. ULTRA-NICHED & SPECIFIC (1 TO 3 VIDEOS PER TOPIC):
   - Every distinct legend, river, town incident, sacred object, or ritual must have its own dedicated topic.
   - Having single-video topics for distinct subjects is strongly encouraged.
   - Only group videos together if they explicitly explore the exact same named deity, river, location, concept, or multi-part story.
   - Never lump different deities, rivers, or communities together under one generic label.
` + categoryDirective + `
4. OUTPUT FORMAT:
   Return ONLY a strict, valid JSON object with a single "topics" array. No Markdown code fences, no extra conversational preamble or closing notes.
   Schema:
   {
     "topics": [
       {
         "id": "topic_1",
         "category": "Assigned or Inferred Category",
         "title": "Creative, Documentary-Worthy Title (e.g. Concept: The Core Paradox / Question)",
         "description": "1 to 2 gripping, documentary-style sentences framing the core mystery, cultural tension, or historical revelation.",
         "video_ids": ["id1"]
       }
     ]
   }

5. STRICTLY ZERO EMOJIS: Do not use any emoji characters or symbols anywhere in the title, description, or JSON output.

` + sb.String()

	reqBody := map[string]interface{}{
		"model": "deepseek-chat",
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "You are a master cultural documentary researcher, investigative essayist, and domain curator. You analyze indigenous African content and produce creative, documentary-worthy topic titles that name the exact concept, deity, or tradition with intriguing narrative hooks. You never use emojis.",
			},
			{
				"role":    "user",
				"content": prompt,
			},
		},
		"response_format": map[string]string{
			"type": "json_object",
		},
		"temperature": 0.4,
		"max_tokens":  8192,
	}

	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to encode request: %w", err)
	}

	client := &http.Client{Timeout: 90 * time.Second}
	req, err := http.NewRequest("POST", "https://api.deepseek.com/chat/completions", bytes.NewBuffer(jsonBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+cleanKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("DeepSeek request failed: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errResp DeepSeekChatResponse
		if jsonErr := json.Unmarshal(bodyBytes, &errResp); jsonErr == nil && errResp.Error != nil && errResp.Error.Message != "" {
			return nil, fmt.Errorf("DeepSeek API error: %s", errResp.Error.Message)
		}
		return nil, fmt.Errorf("DeepSeek API error (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	var chatResp DeepSeekChatResponse
	if err := json.Unmarshal(bodyBytes, &chatResp); err != nil {
		return nil, fmt.Errorf("failed to parse DeepSeek response: %w", err)
	}

	if len(chatResp.Choices) == 0 || strings.TrimSpace(chatResp.Choices[0].Message.Content) == "" {
		return nil, fmt.Errorf("DeepSeek returned an empty response")
	}

	rawContent := strings.TrimSpace(chatResp.Choices[0].Message.Content)
	return parseTopicsJSON(rawContent)
}

func parseTopicsJSON(rawContent string) ([]TopicCluster, error) {
	cleaned := strings.TrimSpace(rawContent)

	// Strip markdown code fences if present
	if strings.Contains(cleaned, "```") {
		reFence := regexp.MustCompile("(?s)```(?:json)?\\s*(.*?)\\s*```")
		if m := reFence.FindStringSubmatch(cleaned); len(m) > 1 {
			cleaned = strings.TrimSpace(m[1])
		} else {
			reOpenFence := regexp.MustCompile("(?s)```(?:json)?\\s*(.*)")
			if m2 := reOpenFence.FindStringSubmatch(cleaned); len(m2) > 1 {
				cleaned = strings.TrimSpace(m2[1])
			}
		}
	}

	firstBrace := strings.Index(cleaned, "{")
	if firstBrace != -1 {
		cleaned = cleaned[firstBrace:]
	}

	var result struct {
		Topics []TopicCluster `json:"topics"`
	}

	// 1. Direct unmarshal attempt
	if err := json.Unmarshal([]byte(cleaned), &result); err == nil && len(result.Topics) > 0 {
		return result.Topics, nil
	}

	// 2. Truncation repair: find last complete object closing brace and close the array and root object
	lastBrace := strings.LastIndex(cleaned, "}")
	if lastBrace != -1 {
		attempted := strings.TrimRight(cleaned[:lastBrace+1], ", \r\n\t") + "\n  ]\n}"
		if err := json.Unmarshal([]byte(attempted), &result); err == nil && len(result.Topics) > 0 {
			return result.Topics, nil
		}
	}

	// 3. Fallback: regex extraction of individual topic objects
	reTopic := regexp.MustCompile(`(?s)\{\s*"id"\s*:\s*"([^"]+)"\s*,\s*"title"\s*:\s*"([^"]+)"\s*,\s*"description"\s*:\s*"([^"]+)"\s*,\s*"video_ids"\s*:\s*\[(.*?)\]\s*\}`)
	matches := reTopic.FindAllStringSubmatch(cleaned, -1)
	if len(matches) > 0 {
		var fallbackTopics []TopicCluster
		reIds := regexp.MustCompile(`"([^"]+)"`)
		for _, m := range matches {
			var vids []string
			for _, idMatch := range reIds.FindAllStringSubmatch(m[4], -1) {
				if len(idMatch) > 1 {
					vids = append(vids, idMatch[1])
				}
			}
			fallbackTopics = append(fallbackTopics, TopicCluster{
				ID:          m[1],
				Title:       m[2],
				Description: m[3],
				VideoIDs:    vids,
			})
		}
		if len(fallbackTopics) > 0 {
			return fallbackTopics, nil
		}
	}

	return nil, fmt.Errorf("failed to parse topics JSON: unexpected end of JSON input (raw response snippet: %.300s...)", rawContent)
}

// GenerateTopicDraft synthesizes multiple videos from a topic into a comprehensive, human-sounding article
func GenerateTopicDraft(topicTitle string, topicDesc string, category string, videos []TopicVideoDetail, researchPrompt string, includeSummary bool, includeReferences bool, apiKey string) (string, string, error) {
	cleanKey := strings.TrimSpace(apiKey)
	if cleanKey == "" {
		return "", "", fmt.Errorf("DeepSeek API key is required to generate topic article draft")
	}

	if len(videos) == 0 {
		return "", "", fmt.Errorf("no videos provided for topic draft generation")
	}

	cleanTopicTitle := strings.TrimSpace(topicTitle)
	cleanTopicDesc := strings.TrimSpace(topicDesc)
	cleanCategory := strings.TrimSpace(category)
	if cleanCategory == "" {
		cleanCategory = "General"
	}
	cleanResearch := strings.TrimSpace(researchPrompt)

	summarySectionDirective := ""
	if includeSummary {
		summarySectionDirective = `EXECUTIVE SUMMARY DIRECTIVE (STRICTLY CONCISE):
Generate a separate, concise Executive Summary block at the very top of your output.
- LENGTH: STRICT MAXIMUM OF 75 TO 100 WORDS TOTAL. Do not write a long essay or multi-paragraph summary. Keep it punchy, synthesized, and immediate.
- FORMAT: Wrap this concise block exactly between <<<EXECUTIVE_SUMMARY>>> and <<<END_EXECUTIVE_SUMMARY>>> tags:
<<<EXECUTIVE_SUMMARY>>>
Core Premise: [1-2 concise sentences capturing the overarching cultural or socio-philosophical argument. Max 35 words.]

Key Strategic Takeaways:
- [Takeaway 1: Short, direct synthesis takeaway across the video series]
- [Takeaway 2: Short cultural nuance or historical principle highlighted]
- [Takeaway 3: Practical insight, preservation value, or contemporary relevance]
<<<END_EXECUTIVE_SUMMARY>>>

`
	}

	referencesStructure := ""
	if includeReferences {
		var primaryList strings.Builder
		for idx, v := range videos {
			cleanT := CleanMetadataText(v.Title)
			if cleanT == "" {
				cleanT = fmt.Sprintf("Video %s", v.ID)
			}
			link := strings.TrimSpace(v.URL)
			if link == "" {
				link = fmt.Sprintf("https://www.tiktok.com/video/%s", v.ID)
			}
			primaryList.WriteString(fmt.Sprintf("* [%d] **%s** - *TikTok*, [Watch on TikTok](%s)\n", idx+1, cleanT, link))
		}

		referencesStructure = fmt.Sprintf(`## References & Works Cited

### Primary Source Media
%s
### External Historical & Academic References
* **[Author / Scholar / Historical Record]** ([Year/Period if known]). *[Title of Work, Treaty, or Ethnographic Archive]*.
  - *Contextual Relevance:* [How this external scholarly source verifies, expands upon, or documents the events, proverbs, or customs analyzed in the article. Actively cite real historical authors, academic texts, colonial records, or recognized oral traditions.]
`, primaryList.String())
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("TOPIC: %s\nCATEGORY: %s\nOVERVIEW: %s\n\n", cleanTopicTitle, cleanCategory, cleanTopicDesc))

	if cleanResearch != "" {
		sb.WriteString("EDITORIAL RESEARCH DIRECTIVE & FOCUS ANGLE:\n" + cleanResearch + "\n\n---\n")
	}

	sb.WriteString("SOURCE VIDEOS AND SPOKEN TRANSCRIPTS UNDER THIS TOPIC:\n\n")
	for i, v := range videos {
		cleanT := CleanMetadataText(v.Title)
		cleanD := CleanMetadataText(v.Desc)
		cleanTr := strings.TrimSpace(v.Transcript)

		sb.WriteString(fmt.Sprintf("=== VIDEO %d: %s ===\n", i+1, cleanT))
		if cleanD != "" && cleanD != cleanT {
			sb.WriteString(fmt.Sprintf("Creator Caption: %s\n", cleanD))
		}
		if cleanTr != "" {
			sb.WriteString("Spoken Transcript:\n" + cleanTr + "\n\n")
		} else {
			sb.WriteString("Transcript: (Native captions unavailable; use title and caption context)\n\n")
		}
	}

	prompt := `You are an insightful, thoughtful cultural writer, investigative essayist, and domain researcher.
Your task is to synthesize multiple related videos from a single creator into one cohesive, comprehensive, published-grade written article.

VOICE & TONE GUIDELINES (SOUND HUMAN & ENGAGING):
- WRITE LIKE A REAL HUMAN BEING: Adopt the voice of an articulate, engaging culture writer or essayist (think thoughtful Substack, Atlantic, or Longform journalism).
- DO NOT BE OVERLY SERIOUS, STIFF, OR ACADEMIC: Speak naturally to the reader. Be approachable, sharp, and conversational without dumbing down the ideas.
- STRICTLY BAN ALL AI CLICHES: Never use robotic AI filler phrases. Specifically avoid: "delve", "tapestry", "in conclusion", "it is important to remember", "testament to", "beacon of hope", "realm of", "rich heritage", "pivotal role", "let us examine".
- VARY SENTENCE CADENCE: Use a natural mix of short, punchy statements and descriptive flowing thoughts. Write the way smart people speak when telling a compelling story.
- STRICTLY NO EMOJIS: Do not use any emoji characters or symbols anywhere in the article.

ABSOLUTE PROHIBITION AGAINST META-COMMENTARY (WRITE DIRECT ESSAY NARRATIVE):
- NEVER WRITE AS A REVIEWER OR SUMMARIZER OF VIDEOS OR TRANSCRIPTS: Do not refer to "the transcript", "the video", "the clip", "the speaker", "the creator", "the series", or "this TikTok" anywhere in the article body.
- NEVER SAY: "The transcript mentions...", "The transcript describes...", "The speaker notes...", "The creator asks...", "In these videos...", "The creator behind this account...".
- WRITE DIRECTLY WITH NARRATIVE AUTHORITY: Treat the history, people, spirits, geography, oral traditions, and socio-economic realities as living subjects. Write directly about the community, the sacred grove, the elders, the oracles, the chainsaws, the loss of trees, the community dynamics, and the philosophical implications. You are the author telling the story directly to the reader.
- NO SOCIAL MEDIA META-DETAILS: Do not mention follower counts, name dictionaries, TikTok comments, or creator profile questions in the narrative.

DEEP RESEARCH & SYNTHESIS DIRECTIVES:
- SYNTHESIZE ACROSS ALL VIDEOS: Do not treat the videos as separate disconnected clips. Unify the arguments, anecdotes, and themes from all provided videos into one compelling, progressive narrative.
- EXTENSIVE BACKGROUND RESEARCH: Actively draw upon your deep knowledge of African history, Igbo culture, linguistics, traditions, geography, and real-world parallels to enrich what the speaker mentions.
- RECONSTRUCT AND VERIFY PHONETICALLY DISTORTED WORDS: Speech recognition often mishears African dialects (especially Igbo terms or Nigerian Pidgin). Cross-reference with the video metadata and cultural context to correct spellings and provide standard orthography.

REQUIRED OUTPUT STRUCTURE:
` + summarySectionDirective + `<<<ARTICLE_BODY>>>
# ` + cleanTopicTitle + `
**Category:** ` + cleanCategory + `

[Engaging Narrative Lead: Set the scene, introduce the central theme connecting these videos, and hook the reader naturally without corporate preamble.]

## [Thematic Section 1: Engaging Title]
[Rich narrative paragraphs exploring the foundational ideas with background research and context.]
* [Sharp Takeaway / Analytical Pointer]: [Breakdown of nuance, historical fact, or practical insight.]
* [Analytical Pointer]: [Exploration of underlying meaning or cultural implication.]

## [Thematic Section 2: Engaging Title]
[Detailed narrative synthesizing the arguments and stories shared across the videos.]
* [Analytical Pointer]: [Nuance, proverb analysis, or historical context.]
* [Analytical Pointer]: [Critical observation or counter-perspective.]

## [Thematic Section 3: Engaging Title]
[Further deep exploration integrating research and practical lessons.]
* [Analytical Pointer]: [Deeper significance or connection to contemporary life.]

## Key Terms & Cultural Concepts
[Explain specific Igbo concepts, proverbs, or cultural phrases mentioned or implied across these videos, with standard spelling, literal translation, and cultural context.]
* **[Term / Expression]**: [Explanation and practical meaning in context.]

## Final Reflections
[A natural, thought-provoking concluding reflection that leaves the reader with insight. Do not start with "In conclusion" or summarize mechanically.]

` + referencesStructure + `<<<END_ARTICLE_BODY>>>
---
` + sb.String()

	reqBody := map[string]interface{}{
		"model": "deepseek-chat",
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "You are an insightful cultural essayist and domain researcher. You write published-grade, full-length synthesized articles that sound completely human, conversational, and engaging. You actively research and contextualize African and Igbo history, never use robotic AI clichés, and never use emojis.",
			},
			{
				"role":    "user",
				"content": prompt,
			},
		},
		"temperature": 0.5,
		"max_tokens":  8192,
	}

	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", "", fmt.Errorf("failed to encode request: %w", err)
	}

	client := &http.Client{Timeout: 90 * time.Second}
	req, err := http.NewRequest("POST", "https://api.deepseek.com/chat/completions", bytes.NewBuffer(jsonBytes))
	if err != nil {
		return "", "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+cleanKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("DeepSeek request failed: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errResp DeepSeekChatResponse
		if jsonErr := json.Unmarshal(bodyBytes, &errResp); jsonErr == nil && errResp.Error != nil && errResp.Error.Message != "" {
			return "", "", fmt.Errorf("DeepSeek API error: %s", errResp.Error.Message)
		}
		return "", "", fmt.Errorf("DeepSeek API error (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	var chatResp DeepSeekChatResponse
	if err := json.Unmarshal(bodyBytes, &chatResp); err != nil {
		return "", "", fmt.Errorf("failed to parse DeepSeek response: %w", err)
	}

	if len(chatResp.Choices) == 0 || strings.TrimSpace(chatResp.Choices[0].Message.Content) == "" {
		return "", "", fmt.Errorf("DeepSeek returned an empty response")
	}

	rawContent := strings.TrimSpace(chatResp.Choices[0].Message.Content)
	summary, article := ExtractDraftSections(rawContent)
	return summary, article, nil
}
