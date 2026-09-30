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

type DeepSeekChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// GenerateDraft calls DeepSeek V3 (deepseek-chat) to produce a comprehensive, human-sounding written article
func GenerateDraft(transcript string, videoTitle string, videoDesc string, videoURL string, creator string, researchPrompt string, includeSummary bool, includeReferences bool, apiKey string) (string, string, error) {
	cleanKey := strings.TrimSpace(apiKey)
	if cleanKey == "" {
		return "", "", fmt.Errorf("DeepSeek API key is required to generate article draft")
	}

	cleanTranscript := strings.TrimSpace(transcript)
	if cleanTranscript == "" {
		return "", "", fmt.Errorf("transcript is empty")
	}

	cleanTitle := CleanMetadataText(videoTitle)
	cleanDesc := CleanMetadataText(videoDesc)
	cleanURL := strings.TrimSpace(videoURL)
	cleanCreator := strings.TrimPrefix(strings.TrimSpace(creator), "@")
	cleanResearch := strings.TrimSpace(researchPrompt)

	metadataSection := ""
	if cleanTitle != "" || cleanDesc != "" || cleanURL != "" || cleanCreator != "" {
		metadataSection = "CONTEXTUAL METADATA (VIDEO TITLE, CREATOR & URL):\n"
		if cleanTitle != "" {
			metadataSection += "- Video Title: " + cleanTitle + "\n"
		}
		if cleanDesc != "" && cleanDesc != cleanTitle {
			metadataSection += "- Creator Caption / Description: " + cleanDesc + "\n"
		}
		if cleanCreator != "" {
			metadataSection += "- Creator: @" + cleanCreator + "\n"
		}
		if cleanURL != "" {
			metadataSection += "- Source Video URL: " + cleanURL + "\n"
		}
		metadataSection += "\nINSTRUCTION ON METADATA:\n- Use the Video Title and Creator Caption as primary contextual anchors to correctly identify people, historical figures, deities, locations, cultural events, and specific Igbo terminology mentioned in the video.\n- Cross-reference the creator's written text with the spoken transcript to resolve any phonetically misheard or ambiguous words.\n\n---\n"
	}

	researchSection := ""
	if cleanResearch != "" {
		researchSection = "EDITORIAL RESEARCH DIRECTIVE & FOCUS ANGLE:\n" + cleanResearch + "\n\nINSTRUCTION ON RESEARCH DIRECTIVE:\n- Weave the above research focus, angle, or background notes into the article's narrative and analytical breakdown.\n\n---\n"
	}

	summarySectionDirective := ""
	if includeSummary {
		summarySectionDirective = `EXECUTIVE SUMMARY DIRECTIVE (STRICTLY CONCISE):
Generate a separate, concise Executive Summary block at the very top of your output.
- LENGTH: STRICT MAXIMUM OF 75 TO 100 WORDS TOTAL. Do not write a long essay or multi-paragraph summary. Keep it punchy, immediate, and direct.
- FORMAT: Wrap this concise block exactly between <<<EXECUTIVE_SUMMARY>>> and <<<END_EXECUTIVE_SUMMARY>>> tags:
<<<EXECUTIVE_SUMMARY>>>
Core Premise: [1-2 concise sentences capturing the overarching cultural or socio-philosophical argument. Max 35 words.]

Key Strategic Takeaways:
- [Takeaway 1: Short, direct cultural or historical takeaway]
- [Takeaway 2: Short analytical nuance or argument]
- [Takeaway 3: Practical insight or contemporary relevance]
<<<END_EXECUTIVE_SUMMARY>>>

`
	}

	referencesStructure := ""
	if includeReferences {
		primaryLink := cleanURL
		if primaryLink == "" {
			primaryLink = "https://www.tiktok.com"
		}
		creatorName := cleanCreator
		if creatorName == "" {
			creatorName = "creator"
		}
		referencesStructure = fmt.Sprintf(`## References & Works Cited

### Primary Source Media
* [1] **%s** - @%s, *TikTok*, [Watch on TikTok](%s)
  - *Context:* [Brief summary of arguments and perspectives contributed in this clip]

### External Historical & Academic References
* **[Author / Scholar / Historical Record]** ([Year/Period if known]). *[Title of Work, Treaty, or Ethnographic Archive]*.
  - *Contextual Relevance:* [How this external scholarly source verifies, expands upon, or documents the events, proverbs, or customs analyzed in the article. Actively cite real historical authors, academic texts, colonial records, or recognized oral traditions.]
`, cleanTitle, creatorName, primaryLink)
	}

	prompt := `You are an insightful, thoughtful cultural writer, investigative essayist, and domain researcher. Your goal is to write a comprehensive, published-grade article based on the provided video transcript and contextual background.

VOICE & TONE GUIDELINES (SOUND HUMAN & ENGAGING):
- WRITE LIKE A REAL HUMAN BEING: Adopt the voice of an articulate, engaging culture writer or curious essayist (think thoughtful Substack, Atlantic, or Longform journalism).
- DO NOT BE OVERLY SERIOUS, STIFF, OR ACADEMIC: Speak naturally to the reader. Be approachable, witty where appropriate, sharp, and conversational without dumbing down the ideas.
- STRICTLY BAN ALL AI CLICHES: Never use corporate or robotic AI filler phrases. Specifically avoid: "delve", "tapestry", "in conclusion", "it is important to remember", "testament to", "beacon of hope", "realm of", "rich heritage", "pivotal role", "let us examine".
- VARY SENTENCE CADENCE: Use a natural mix of short, punchy statements and descriptive flowing thoughts. Write the way smart people actually speak and write when telling a compelling story.
- STRICTLY NO EMOJIS: Do not use any emoji characters or symbols anywhere in the article.

DEEP RESEARCH & CONTEXTUAL EXPANSION:
- DO NOT JUST PARROT OR SUMMARIZE THE TRANSCRIPT: Actively draw upon your deep knowledge of African history, Igbo culture, linguistics, traditions, geography, and socio-economic dynamics to expand on what the speaker discusses.
- SUPPLEMENT AND CONTEXTUALIZE: When the speaker mentions a custom, clan, historical figure, proverb, deity, or practice, explain the historical roots, philosophical meaning, and real-world significance for the reader.
- RECONSTRUCT AND VERIFY PHONETICALLY DISTORTED WORDS: Speech recognition often mishears African dialects (especially Igbo words or Nigerian Pidgin). Cross-reference with the video title, caption, and your cultural knowledge to correct spellings and provide standard orthography.

REQUIRED OUTPUT STRUCTURE:
` + summarySectionDirective + `<<<ARTICLE_BODY>>>
# [Captivating, Human Article Headline]

[Engaging Narrative Lead: Set the scene, introduce the core idea or story, and hook the reader naturally without corporate preamble.]

## [Thematic Section 1: Engaging Title]
[Rich, narrative paragraphs exploring this angle with cultural context and background research.]
* [Sharp Takeaway / Analytical Pointer]: [Breakdown of nuance, historical fact, or practical insight.]
* [Analytical Pointer]: [Exploration of underlying meaning or real-world implication.]

## [Thematic Section 2: Engaging Title]
[Detailed narrative continuing the story, addressing arguments or cultural traditions raised.]
* [Analytical Pointer]: [Cultural nuance, proverb analysis, or historical context.]
* [Analytical Pointer]: [Critical observation or counter-perspective.]

## [Thematic Section 3: Engaging Title]
[Further deep exploration integrating research and practical lessons.]
* [Analytical Pointer]: [Deeper significance or connection to contemporary life.]

## Key Terms & Cultural Concepts
[Explain specific Igbo concepts, proverbs, or cultural phrases mentioned or implied in the video, with standard spelling, literal translation, and cultural context.]
* **[Term / Expression]**: [Explanation and practical meaning in context.]

## Final Reflections
[A natural, thought-provoking concluding reflection that leaves the reader with insight. Do not start with "In conclusion" or summarize mechanically.]

` + referencesStructure + `<<<END_ARTICLE_BODY>>>
---
` + metadataSection + researchSection + `SPOKEN TRANSCRIPT:
` + cleanTranscript

	reqBody := map[string]interface{}{
		"model": "deepseek-chat",
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "You are an insightful cultural essayist and domain researcher. You write published-grade, full-length articles that sound completely human, conversational, and engaging. You actively research and contextualize African and Igbo history, never use robotic AI clichés, and never use emojis.",
			},
			{
				"role":    "user",
				"content": prompt,
			},
		},
		"temperature": 0.5,
		"max_tokens":  4096,
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
		return "", "", fmt.Errorf("failed to read response body: %w", err)
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

// ExtractDraftSections splits DeepSeek output into an Executive Summary (if present) and the Article Body
func ExtractDraftSections(rawOutput string) (string, string) {
	raw := strings.TrimSpace(rawOutput)
	if raw == "" {
		return "", ""
	}

	summary := ""
	article := raw

	if strings.Contains(raw, "<<<EXECUTIVE_SUMMARY>>>") {
		reSummary := regexp.MustCompile(`(?s)<<<EXECUTIVE_SUMMARY>>>\s*(.*?)\s*<<<END_EXECUTIVE_SUMMARY>>>`)
		if m := reSummary.FindStringSubmatch(raw); len(m) > 1 {
			summary = strings.TrimSpace(m[1])
		}

		if strings.Contains(raw, "<<<ARTICLE_BODY>>>") {
			reArticle := regexp.MustCompile(`(?s)<<<ARTICLE_BODY>>>\s*(.*?)(?:<<<END_ARTICLE_BODY>>>|$)`)
			if m := reArticle.FindStringSubmatch(raw); len(m) > 1 {
				article = strings.TrimSpace(m[1])
			}
		} else {
			endIdx := strings.Index(raw, "<<<END_EXECUTIVE_SUMMARY>>>")
			if endIdx != -1 {
				article = strings.TrimSpace(raw[endIdx+len("<<<END_EXECUTIVE_SUMMARY>>>"):])
			}
		}
	} else if strings.Contains(raw, "**Core Premise:**") {
		// Fallback for legacy format with blockquote executive summary
		startIdx := strings.Index(raw, "## Executive Summary")
		if startIdx == -1 {
			startIdx = strings.Index(raw, "> **Core Premise:**")
		}
		if startIdx != -1 {
			postSlice := raw[startIdx:]
			reNextSection := regexp.MustCompile(`(?m)^\s*(?:#[^#]|##\s)`)
			locs := reNextSection.FindAllStringIndex(postSlice, -1)
			splitIdx := -1
			for _, loc := range locs {
				if loc[0] > 20 {
					splitIdx = startIdx + loc[0]
					break
				}
			}

			if splitIdx != -1 {
				rawSum := strings.TrimSpace(raw[startIdx:splitIdx])
				rawSum = strings.TrimPrefix(rawSum, "## Executive Summary")
				summary = strings.TrimSpace(regexp.MustCompile(`(?m)^>\s?`).ReplaceAllString(rawSum, ""))
				article = strings.TrimSpace(raw[:startIdx] + "\n\n" + raw[splitIdx:])
			}
		}
	}

	article = strings.TrimPrefix(article, "<<<ARTICLE_BODY>>>")
	article = strings.TrimSuffix(article, "<<<END_ARTICLE_BODY>>>")
	article = strings.TrimSpace(article)

	return summary, article
}
