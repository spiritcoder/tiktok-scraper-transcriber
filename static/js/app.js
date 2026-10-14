// TikTok Transcript Retriever & Scraper Client Logic

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const urlInput = document.getElementById('urlInput');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const mainSpinner = document.getElementById('mainSpinner');
    const clearInput = document.getElementById('clearInput');
    const forceWhisperToggle = document.getElementById('forceWhisperToggle');
    
    // API Key Drawer
    const apiKeyBtn = document.getElementById('apiKeyBtn');
    const keyModal = document.getElementById('keyModal');
    const closeKeyModal = document.getElementById('closeKeyModal');
    const saveKeyBtn = document.getElementById('saveKeyBtn');
    const groqKeyInput = document.getElementById('groqKeyInput');
    const deepseekKeyInput = document.getElementById('deepseekKeyInput');
    const keyIndicator = document.getElementById('keyIndicator');
    const keyLabel = document.getElementById('keyLabel');

    // Loading State
    const loadingBanner = document.getElementById('loadingBanner');
    const loadingTitle = document.getElementById('loadingTitle');
    const loadingSubtitle = document.getElementById('loadingSubtitle');

    // Profile Section
    const profileSection = document.getElementById('profileSection');
    const profileUsername = document.getElementById('profileUsername');
    const profileInitial = document.getElementById('profileInitial');
    const profileMeta = document.getElementById('profileMeta');
    const videoGrid = document.getElementById('videoGrid');
    const featuredVideoBox = document.getElementById('featuredVideoBox');
    const featuredTitle = document.getElementById('featuredTitle');
    const featuredDesc = document.getElementById('featuredDesc');
    const featuredDuration = document.getElementById('featuredDuration');
    const featuredViews = document.getElementById('featuredViews');
    const featuredTranscribeBtn = document.getElementById('featuredTranscribeBtn');
    const videoSearchInput = document.getElementById('videoSearchInput');
    const clearVideoSearch = document.getElementById('clearVideoSearch');
    const filteredVideoCount = document.getElementById('filteredVideoCount');
    const scopeAllBtn = document.getElementById('scopeAllBtn');
    const scopeTitleBtn = document.getElementById('scopeTitleBtn');

    // Profile Section Tabs & Topics Elements
    const tabVideosBtn = document.getElementById('tabVideosBtn');
    const tabTopicsBtn = document.getElementById('tabTopicsBtn');
    const tabVideosCount = document.getElementById('tabVideosCount');
    const tabTopicsBadge = document.getElementById('tabTopicsBadge');
    const allVideosContainer = document.getElementById('allVideosContainer');
    const topicsContainer = document.getElementById('topicsContainer');
    const topicsEmptyState = document.getElementById('topicsEmptyState');
    const topicsLoadingState = document.getElementById('topicsLoadingState');
    const topicsContent = document.getElementById('topicsContent');
    const topicsGrid = document.getElementById('topicsGrid');
    const analyzeTopicsBtn = document.getElementById('analyzeTopicsBtn');
    const reanalyzeTopicsBtn = document.getElementById('reanalyzeTopicsBtn');
    const topicsSpinner = document.getElementById('topicsSpinner');
    const analyzeTopicsBtnText = document.getElementById('analyzeTopicsBtnText');
    const topicsCountHeading = document.getElementById('topicsCountHeading');
    const targetCategoriesInput = document.getElementById('targetCategoriesInput');
    const activeCategoriesInput = document.getElementById('activeCategoriesInput');
    const updateCategoriesBtn = document.getElementById('updateCategoriesBtn');

    // Studio Library Elements
    const libraryBtn = document.getElementById('libraryBtn');
    const libraryModal = document.getElementById('libraryModal');
    const closeLibraryModal = document.getElementById('closeLibraryModal');
    const libTabDrafts = document.getElementById('libTabDrafts');
    const libTabProfiles = document.getElementById('libTabProfiles');
    const libDraftsPane = document.getElementById('libDraftsPane');
    const libProfilesPane = document.getElementById('libProfilesPane');
    const libDraftsLoading = document.getElementById('libDraftsLoading');
    const libDraftsEmpty = document.getElementById('libDraftsEmpty');
    const libDraftsList = document.getElementById('libDraftsList');
    const libProfilesLoading = document.getElementById('libProfilesLoading');
    const libProfilesEmpty = document.getElementById('libProfilesEmpty');
    const libProfilesList = document.getElementById('libProfilesList');

    // Transcript Modal
    const transcriptModal = document.getElementById('transcriptModal');
    const closeTranscriptModal = document.getElementById('closeTranscriptModal');
    const transcriptVideoTitle = document.getElementById('transcriptVideoTitle');
    const sourceBadge = document.getElementById('sourceBadge');
    const langBadge = document.getElementById('langBadge');
    const wordsBadge = document.getElementById('wordsBadge');
    const durationBadge = document.getElementById('durationBadge');
    const transcriptContent = document.getElementById('transcriptContent');
    const transcriptToolbar = document.getElementById('transcriptToolbar');
    const modalLoadingBox = document.getElementById('modalLoadingBox');
    const modalLoadingTitle = document.getElementById('modalLoadingTitle');
    const modalLoadingSub = document.getElementById('modalLoadingSub');
    const aiTitleCard = document.getElementById('aiTitleCard');
    const aiTitleText = document.getElementById('aiTitleText');
    const regenerateTitleBtn = document.getElementById('regenerateTitleBtn');
    
    // View Toggles & Actions
    const viewParagraphsBtn = document.getElementById('viewParagraphsBtn');
    const viewEditBtn = document.getElementById('viewEditBtn');
    const viewTimestampsBtn = document.getElementById('viewTimestampsBtn');
    const viewDraftBtn = document.getElementById('viewDraftBtn');
    const copyBtn = document.getElementById('copyBtn');
    const copyText = document.getElementById('copyText');
    const downloadTxtBtn = document.getElementById('downloadTxtBtn');
    const downloadJsonBtn = document.getElementById('downloadJsonBtn');
    const downloadMdBtn = document.getElementById('downloadMdBtn');
    const retranscribeBanner = document.getElementById('retranscribeBanner');
    const retranscribeBtn = document.getElementById('retranscribeBtn');

    // Article Draft Elements
    const draftContainer = document.getElementById('draftContainer');
    const draftEmptyState = document.getElementById('draftEmptyState');
    const draftLoadingState = document.getElementById('draftLoadingState');
    const draftPreviewWrap = document.getElementById('draftPreviewWrap');
    const draftRendered = document.getElementById('draftRendered');
    const draftRaw = document.getElementById('draftRaw');
    const draftResearchInput = document.getElementById('draftResearchInput');
    const draftInlineResearchInput = document.getElementById('draftInlineResearchInput');
    const generateDraftBtn = document.getElementById('generateDraftBtn');
    const regenerateDraftBtn = document.getElementById('regenerateDraftBtn');
    const toggleRawMdBtn = document.getElementById('toggleRawMdBtn');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const toggleTopicPublishBtn = document.getElementById('toggleTopicPublishBtn');
    const toggleIncludeSummary = document.getElementById('toggleIncludeSummary');
    const toggleIncludeReferences = document.getElementById('toggleIncludeReferences');
    const toggleInlineIncludeSummary = document.getElementById('toggleInlineIncludeSummary');
    const toggleInlineIncludeReferences = document.getElementById('toggleInlineIncludeReferences');
    const toggleWebResearch = document.getElementById('toggleWebResearch');
    const toggleInlineWebResearch = document.getElementById('toggleInlineWebResearch');
    const fetchResearchBtn = document.getElementById('fetchResearchBtn');
    const inlineFetchResearchBtn = document.getElementById('inlineFetchResearchBtn');
    const tavilyKeyInput = document.getElementById('tavilyKeyInput');

    if (toggleIncludeSummary && toggleInlineIncludeSummary) {
        toggleIncludeSummary.addEventListener('change', () => {
            toggleInlineIncludeSummary.checked = toggleIncludeSummary.checked;
        });
        toggleInlineIncludeSummary.addEventListener('change', () => {
            toggleIncludeSummary.checked = toggleInlineIncludeSummary.checked;
        });
    }
    if (toggleIncludeReferences && toggleInlineIncludeReferences) {
        toggleIncludeReferences.addEventListener('change', () => {
            toggleInlineIncludeReferences.checked = toggleIncludeReferences.checked;
        });
        toggleInlineIncludeReferences.addEventListener('change', () => {
            toggleIncludeReferences.checked = toggleInlineIncludeReferences.checked;
        });
    }
    if (toggleWebResearch && toggleInlineWebResearch) {
        toggleWebResearch.addEventListener('change', () => {
            toggleInlineWebResearch.checked = toggleWebResearch.checked;
        });
        toggleInlineWebResearch.addEventListener('change', () => {
            toggleWebResearch.checked = toggleInlineWebResearch.checked;
        });
    }

    // Live Web Research Grounding UI Elements
    const researchGroundingCard = document.getElementById('researchGroundingCard');
    const researchQueryLabel = document.getElementById('researchQueryLabel');
    const toggleResearchDetailsBtn = document.getElementById('toggleResearchDetailsBtn');
    const researchToggleText = document.getElementById('researchToggleText');
    const researchToggleArrow = document.getElementById('researchToggleArrow');
    const researchGroundingBody = document.getElementById('researchGroundingBody');
    const researchAnswerBox = document.getElementById('researchAnswerBox');
    const researchAnswerText = document.getElementById('researchAnswerText');
    const researchSourcesList = document.getElementById('researchSourcesList');
    const draftLoadingTitle = document.getElementById('draftLoadingTitle');
    const draftLoadingDesc = document.getElementById('draftLoadingDesc');

    if (toggleResearchDetailsBtn && researchGroundingBody) {
        toggleResearchDetailsBtn.addEventListener('click', () => {
            const isHidden = researchGroundingBody.classList.toggle('hidden');
            if (researchToggleArrow) {
                researchToggleArrow.textContent = isHidden ? '▼' : '▲';
            }
        });
    }

    function renderResearchGroundingTray(webResearch) {
        if (!researchGroundingCard) return;

        if (!webResearch || (!webResearch.answer && (!webResearch.results || webResearch.results.length === 0))) {
            researchGroundingCard.classList.add('hidden');
            return;
        }

        if (researchQueryLabel) {
            researchQueryLabel.textContent = webResearch.query ? `Query: "${webResearch.query}"` : '';
        }

        const results = webResearch.results || [];
        if (researchToggleText) {
            researchToggleText.textContent = `Sources (${results.length})`;
        }

        if (researchAnswerBox && researchAnswerText) {
            if (webResearch.answer && webResearch.answer.trim()) {
                researchAnswerText.textContent = webResearch.answer.trim();
                researchAnswerBox.classList.remove('hidden');
            } else {
                researchAnswerBox.classList.add('hidden');
            }
        }

        if (researchSourcesList) {
            researchSourcesList.innerHTML = '';
            results.forEach((item, idx) => {
                const div = document.createElement('div');
                div.className = 'research-source-item';

                let hostname = '';
                try {
                    hostname = new URL(item.url).hostname.replace(/^www\./, '');
                } catch (e) {
                    hostname = 'web source';
                }

                const header = document.createElement('div');
                header.className = 'research-source-header';

                const link = document.createElement('a');
                link.className = 'research-source-link';
                link.href = item.url || '#';
                link.target = '_blank';
                link.rel = 'noopener noreferrer';

                const numSpan = document.createElement('span');
                numSpan.textContent = `[${idx + 1}] `;
                const titleSpan = document.createElement('span');
                titleSpan.textContent = item.title || item.url || 'Web Source';
                const arrowSpan = document.createElement('span');
                arrowSpan.textContent = ' ↗';
                arrowSpan.style.fontSize = '0.75rem';
                arrowSpan.style.opacity = '0.8';

                link.appendChild(numSpan);
                link.appendChild(titleSpan);
                link.appendChild(arrowSpan);

                const domain = document.createElement('span');
                domain.className = 'research-source-domain';
                domain.textContent = hostname;

                header.appendChild(link);
                header.appendChild(domain);
                div.appendChild(header);

                if (item.content) {
                    const snippet = document.createElement('p');
                    snippet.className = 'research-source-snippet';
                    snippet.textContent = item.content;
                    div.appendChild(snippet);
                }

                researchSourcesList.appendChild(div);
            });
        }

        researchGroundingCard.classList.remove('hidden');
        if (researchGroundingBody) {
            researchGroundingBody.classList.remove('hidden');
            if (researchToggleArrow) researchToggleArrow.textContent = '▲';
        }
    }

    const executiveSummaryCard = document.getElementById('executiveSummaryCard');
    const summaryTextarea = document.getElementById('summaryTextarea');
    const summaryMetaCount = document.getElementById('summaryMetaCount');
    const copySummaryBtn = document.getElementById('copySummaryBtn');

    if (summaryTextarea && summaryMetaCount) {
        summaryTextarea.addEventListener('input', () => {
            const wc = countWords(summaryTextarea.value);
            summaryMetaCount.textContent = `${wc} words`;
        });
    }

    if (copySummaryBtn && summaryTextarea) {
        copySummaryBtn.addEventListener('click', () => {
            const text = summaryTextarea.value.trim();
            if (!text) return;
            navigator.clipboard.writeText(text).then(() => {
                const orig = copySummaryBtn.textContent;
                copySummaryBtn.textContent = 'Copied!';
                setTimeout(() => { copySummaryBtn.textContent = orig; }, 1800);
            });
        });
    }

    // Whisper Prompt & Language Controls (Search card + Settings modal)
    // Whisper Prompt & Language Controls (Search card + Settings modal)
    const loadIgboPresetBtn = document.getElementById('loadIgboPresetBtn');
    const modalLoadIgboPresetBtn = document.getElementById('modalLoadIgboPresetBtn');
    const whisperLangSelect = document.getElementById('whisperLangSelect');
    const modalWhisperLangSelect = document.getElementById('modalWhisperLangSelect');
    const whisperPromptInput = document.getElementById('whisperPromptInput');
    const modalWhisperPromptInput = document.getElementById('modalWhisperPromptInput');
    const includeMetadataPromptToggle = document.getElementById('includeMetadataPromptToggle');
    const modalIncludeMetadataPromptToggle = document.getElementById('modalIncludeMetadataPromptToggle');
    const retranscribePromptPreview = document.getElementById('retranscribePromptPreview');
    const editPromptFromBannerBtn = document.getElementById('editPromptFromBannerBtn');

    // Modal Video Context & Inline Whisper Controls
    const modalVideoMetaCard = document.getElementById('modalVideoMetaCard');
    const modalVideoLink = document.getElementById('modalVideoLink');
    const transcriptVideoCaption = document.getElementById('transcriptVideoCaption');
    const copyCaptionBtn = document.getElementById('copyCaptionBtn');
    const addCaptionToWhisperBtn = document.getElementById('addCaptionToWhisperBtn');
    const modalInlineWhisperPrompt = document.getElementById('modalInlineWhisperPrompt');
    const modalInlineIncludeMetaToggle = document.getElementById('modalInlineIncludeMetaToggle');
    const modalRunWhisperBtn = document.getElementById('modalRunWhisperBtn');
    const modalInlineIgboBtn = document.getElementById('modalInlineIgboBtn');
    const modalInlineClearPromptBtn = document.getElementById('modalInlineClearPromptBtn');

    // Studio Light Modal & Comparison Elements
    const headerVideoTitle = document.getElementById('headerVideoTitle');
    const activeSourceChip = document.getElementById('activeSourceChip');
    const stepTranscriptBtn = document.getElementById('stepTranscriptBtn');
    const step1ViewToggles = document.getElementById('step1ViewToggles');
    const sourceComparisonBar = document.getElementById('sourceComparisonBar');
    const switchWhisperBtn = document.getElementById('switchWhisperBtn');
    const switchTikTokBtn = document.getElementById('switchTikTokBtn');
    const comparisonHint = document.getElementById('comparisonHint');

    // State
    let currentResult = null;
    let savedTikTokResult = null;
    let savedWhisperResult = null;
    let activeTranscriptSource = 'whisper'; // 'whisper' | 'tiktok'
    let currentVideoURL = '';
    let currentViewMode = 'paragraphs'; // 'paragraphs' | 'timestamps' | 'draft'
    let currentDraft = '';
    let rawMdVisible = false;
    let allProfileVideos = [];
    let searchScope = 'all'; // 'all' | 'titles'
    let discoveredTopics = [];
    let cachedTranscripts = {};
    let currentTopicContext = null;

    // Load saved API keys from localStorage
    const savedGroqKey = localStorage.getItem('groq_api_key');
    if (savedGroqKey) {
        groqKeyInput.value = savedGroqKey;
    }
    const savedDeepSeekKey = localStorage.getItem('deepseek_api_key');
    if (savedDeepSeekKey) {
        deepseekKeyInput.value = savedDeepSeekKey;
    }
    const savedTavilyKey = localStorage.getItem('tavily_api_key');
    if (savedTavilyKey && tavilyKeyInput) {
        tavilyKeyInput.value = savedTavilyKey;
    }
    updateKeyIndicator();

    function updateKeyIndicator() {
        const hasGroq = !!(groqKeyInput.value.trim() || localStorage.getItem('groq_api_key'));
        const hasDeepSeek = !!(deepseekKeyInput.value.trim() || localStorage.getItem('deepseek_api_key'));
        const hasTavily = !!(tavilyKeyInput && (tavilyKeyInput.value.trim() || localStorage.getItem('tavily_api_key')));

        if (hasGroq || hasDeepSeek || hasTavily) {
            keyIndicator.classList.add('active');
            let labels = [];
            if (hasGroq) labels.push('Groq');
            if (hasDeepSeek) labels.push('DeepSeek');
            if (hasTavily) labels.push('Tavily');
            keyLabel.textContent = labels.join(' + ') + ' Active';
        } else {
            keyIndicator.classList.remove('active');
            keyLabel.textContent = 'API & Whisper Settings';
        }
    }

    // Target Categories Persistence & Synchronization
    const savedCategories = localStorage.getItem('target_categories') || '';
    if (targetCategoriesInput) targetCategoriesInput.value = savedCategories;
    if (activeCategoriesInput) activeCategoriesInput.value = savedCategories;

    function syncCategories(val) {
        if (targetCategoriesInput && targetCategoriesInput.value !== val) {
            targetCategoriesInput.value = val;
        }
        if (activeCategoriesInput && activeCategoriesInput.value !== val) {
            activeCategoriesInput.value = val;
        }
        if (val.trim()) {
            localStorage.setItem('target_categories', val.trim());
        } else {
            localStorage.removeItem('target_categories');
        }
    }

    if (targetCategoriesInput) {
        targetCategoriesInput.addEventListener('input', (e) => syncCategories(e.target.value));
    }
    if (activeCategoriesInput) {
        activeCategoriesInput.addEventListener('input', (e) => syncCategories(e.target.value));
    }
    if (updateCategoriesBtn) {
        updateCategoriesBtn.addEventListener('click', () => {
            analyzeProfileTopics();
        });
    }

    function getApiKey() {
        return groqKeyInput.value.trim() || localStorage.getItem('groq_api_key') || '';
    }

    function getDeepSeekKey() {
        return deepseekKeyInput.value.trim() || localStorage.getItem('deepseek_api_key') || '';
    }

    function getTavilyKey() {
        return (tavilyKeyInput && tavilyKeyInput.value.trim()) || localStorage.getItem('tavily_api_key') || '';
    }

    // Whisper prompt & language synchronization across Search Card and Modal
    const IGBO_DEFAULT_PROMPT = "Asusu Igbo, Ndi Igbo, omenala Igbo, Ala Igbo, Chi, Chukwu, Eze, Igbo terms and vocabulary.";

    function syncWhisperPrompt(val) {
        if (whisperPromptInput && whisperPromptInput.value !== val) {
            whisperPromptInput.value = val;
        }
        if (modalWhisperPromptInput && modalWhisperPromptInput.value !== val) {
            modalWhisperPromptInput.value = val;
        }
        if (modalInlineWhisperPrompt && modalInlineWhisperPrompt.value !== val) {
            modalInlineWhisperPrompt.value = val;
        }
        if (retranscribePromptPreview) {
            const trimmed = (val || '').trim();
            retranscribePromptPreview.textContent = trimmed ? (trimmed.length > 30 ? trimmed.substring(0, 30) + '...' : trimmed) : 'None';
            retranscribePromptPreview.title = trimmed || 'No prompt set';
        }
        localStorage.setItem('whisper_prompt', val);
    }

    function syncWhisperLang(val) {
        if (whisperLangSelect && whisperLangSelect.value !== val) {
            whisperLangSelect.value = val;
        }
        if (modalWhisperLangSelect && modalWhisperLangSelect.value !== val) {
            modalWhisperLangSelect.value = val;
        }
        localStorage.setItem('whisper_lang', val);
    }

    function syncIncludeMetadata(checked) {
        if (includeMetadataPromptToggle && includeMetadataPromptToggle.checked !== checked) {
            includeMetadataPromptToggle.checked = checked;
        }
        if (modalIncludeMetadataPromptToggle && modalIncludeMetadataPromptToggle.checked !== checked) {
            modalIncludeMetadataPromptToggle.checked = checked;
        }
        if (modalInlineIncludeMetaToggle && modalInlineIncludeMetaToggle.checked !== checked) {
            modalInlineIncludeMetaToggle.checked = checked;
        }
        localStorage.setItem('whisper_include_metadata', checked ? 'true' : 'false');
    }

    // Initialize prompt, language & metadata toggle from localStorage
    const savedWhisperPrompt = localStorage.getItem('whisper_prompt');
    const initialPrompt = (savedWhisperPrompt !== null) ? savedWhisperPrompt : IGBO_DEFAULT_PROMPT;
    syncWhisperPrompt(initialPrompt);

    const savedWhisperLang = localStorage.getItem('whisper_lang') || 'auto';
    syncWhisperLang(savedWhisperLang);

    const savedIncludeMeta = localStorage.getItem('whisper_include_metadata');
    const initialIncludeMeta = (savedIncludeMeta !== null) ? (savedIncludeMeta === 'true') : true;
    syncIncludeMetadata(initialIncludeMeta);

    // Event listeners for two-way sync
    if (whisperPromptInput) {
        whisperPromptInput.addEventListener('input', () => syncWhisperPrompt(whisperPromptInput.value));
    }
    if (modalWhisperPromptInput) {
        modalWhisperPromptInput.addEventListener('input', () => syncWhisperPrompt(modalWhisperPromptInput.value));
    }
    if (modalInlineWhisperPrompt) {
        modalInlineWhisperPrompt.addEventListener('input', () => syncWhisperPrompt(modalInlineWhisperPrompt.value));
    }
    if (whisperLangSelect) {
        whisperLangSelect.addEventListener('change', () => syncWhisperLang(whisperLangSelect.value));
    }
    if (modalWhisperLangSelect) {
        modalWhisperLangSelect.addEventListener('change', () => syncWhisperLang(modalWhisperLangSelect.value));
    }
    if (includeMetadataPromptToggle) {
        includeMetadataPromptToggle.addEventListener('change', () => syncIncludeMetadata(includeMetadataPromptToggle.checked));
    }
    if (modalIncludeMetadataPromptToggle) {
        modalIncludeMetadataPromptToggle.addEventListener('change', () => syncIncludeMetadata(modalIncludeMetadataPromptToggle.checked));
    }
    if (modalInlineIncludeMetaToggle) {
        modalInlineIncludeMetaToggle.addEventListener('change', () => syncIncludeMetadata(modalInlineIncludeMetaToggle.checked));
    }

    if (loadIgboPresetBtn) {
        loadIgboPresetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            syncWhisperPrompt(IGBO_DEFAULT_PROMPT);
        });
    }
    if (modalLoadIgboPresetBtn) {
        modalLoadIgboPresetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            syncWhisperPrompt(IGBO_DEFAULT_PROMPT);
        });
    }
    if (modalInlineIgboBtn) {
        modalInlineIgboBtn.addEventListener('click', (e) => {
            e.preventDefault();
            syncWhisperPrompt(IGBO_DEFAULT_PROMPT);
        });
    }
    if (modalInlineClearPromptBtn) {
        modalInlineClearPromptBtn.addEventListener('click', (e) => {
            e.preventDefault();
            syncWhisperPrompt('');
        });
    }
    if (copyCaptionBtn) {
        copyCaptionBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const captionText = transcriptVideoCaption.textContent || '';
            if (!captionText || captionText.startsWith('No caption')) return;
            try {
                await navigator.clipboard.writeText(captionText);
                copyCaptionBtn.textContent = 'Copied!';
                setTimeout(() => { copyCaptionBtn.textContent = 'Copy Caption'; }, 2000);
            } catch (err) {
                alert('Failed to copy caption');
            }
        });
    }
    if (addCaptionToWhisperBtn) {
        addCaptionToWhisperBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const captionText = transcriptVideoCaption.textContent || '';
            if (!captionText || captionText.startsWith('No caption')) return;
            const cleaned = stripHashtags(captionText).trim();
            if (!cleaned) return;
            const currentP = (modalInlineWhisperPrompt ? modalInlineWhisperPrompt.value.trim() : '') || localStorage.getItem('whisper_prompt') || '';
            const newPrompt = currentP ? `${currentP}, ${cleaned}` : cleaned;
            syncWhisperPrompt(newPrompt);
            addCaptionToWhisperBtn.textContent = 'Added to Prompt!';
            setTimeout(() => { addCaptionToWhisperBtn.textContent = '+ Add to Whisper Prompt'; }, 2000);
        });
    }
    if (modalRunWhisperBtn) {
        modalRunWhisperBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!currentVideoURL) return;
            transcribeSingleVideo(currentVideoURL, true, currentResult?.video_title, modalRunWhisperBtn, currentResult?.video_desc || '');
        });
    }
    if (editPromptFromBannerBtn) {
        editPromptFromBannerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (modalInlineWhisperPrompt) {
                modalInlineWhisperPrompt.focus();
                modalInlineWhisperPrompt.scrollIntoView({ behavior: 'smooth' });
            } else {
                keyModal.classList.remove('hidden');
                if (modalWhisperPromptInput) modalWhisperPromptInput.focus();
            }
        });
    }

    // Modal controls for API Key
    if (apiKeyBtn) {
        apiKeyBtn.addEventListener('click', () => {
            if (keyModal) keyModal.classList.remove('hidden');
        });
    }

    if (closeKeyModal) {
        closeKeyModal.addEventListener('click', () => {
            if (keyModal) keyModal.classList.add('hidden');
        });
    }

    if (saveKeyBtn) {
        saveKeyBtn.addEventListener('click', () => {
        const groqVal = groqKeyInput.value.trim();
        const deepseekVal = deepseekKeyInput.value.trim();

        if (groqVal) {
            localStorage.setItem('groq_api_key', groqVal);
        } else {
            localStorage.removeItem('groq_api_key');
        }

        if (deepseekVal) {
            localStorage.setItem('deepseek_api_key', deepseekVal);
        } else {
            localStorage.removeItem('deepseek_api_key');
        }

        if (tavilyKeyInput) {
            const tavilyVal = tavilyKeyInput.value.trim();
            if (tavilyVal) {
                localStorage.setItem('tavily_api_key', tavilyVal);
            } else {
                localStorage.removeItem('tavily_api_key');
            }
        }

        if (modalWhisperPromptInput) {
            syncWhisperPrompt(modalWhisperPromptInput.value);
        }
        if (modalWhisperLangSelect) {
            syncWhisperLang(modalWhisperLangSelect.value);
        }
        if (modalIncludeMetadataPromptToggle) {
            syncIncludeMetadata(modalIncludeMetadataPromptToggle.checked);
        }

        updateKeyIndicator();
        keyModal.classList.add('hidden');

        // Auto-generate AI title if transcript modal is open and title was pending
        if (groqVal && currentResult && currentResult.full_text && !currentResult.ai_title) {
            fetchAITitle();
        }
    });
}

    // Clear input
    if (urlInput) {
        urlInput.addEventListener('input', () => {
            if (clearInput) clearInput.classList.toggle('hidden', !urlInput.value);
        });
        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }

    if (clearInput) {
        clearInput.addEventListener('click', () => {
            if (urlInput) {
                urlInput.value = '';
                urlInput.focus();
            }
            clearInput.classList.add('hidden');
        });
    }

    // Example Chips
    document.querySelectorAll('.example-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            if (urlInput) urlInput.value = chip.dataset.url;
            if (clearInput) clearInput.classList.remove('hidden');
            handleSearch();
        });
    });

    // Submit handler
    if (submitBtn) {
        submitBtn.addEventListener('click', handleSearch);
    }

    function isVideoURL(url) {
        if (!url) return false;
        const lower = url.toLowerCase();
        return lower.includes('/video/') || 
               lower.includes('vt.tiktok.com') || 
               lower.includes('vm.tiktok.com') || 
               lower.includes('/v/');
    }

    function handleSearch() {
        const val = urlInput.value.trim();
        if (!val) {
            alert('Please paste a TikTok video link to begin');
            return;
        }

        if (!isVideoURL(val)) {
            alert("Please paste a TikTok video link instead of a username.\n\nTikTok's bot protection blocks scraping directly from profile handles (@username).\n\nTip: Open any video by this creator, copy its share link (e.g., https://vt.tiktok.com/... or /video/...), and paste it here! That single video link will instantly unlock and scrape their entire video catalog.");
            return;
        }

        fetchProfile(val, val);
    }

    async function fetchProfile(profileQuery, postedVideoURL = null) {
        setLoading(true, `Scraping all videos from ${profileQuery}...`, 'Scanning creator profile and retrieving entire video catalog');
        profileSection.classList.add('hidden');

        try {
            const resp = await fetch(`/api/profile?url=${encodeURIComponent(profileQuery)}&limit=0`);
            const data = await resp.json();

            if (!resp.ok || !data.success) {
                throw new Error(data.error || 'Failed to fetch profile');
            }

            renderProfile(data.data, postedVideoURL, data.topics);
        } catch (err) {
            let msg = err.message;
            if (msg.includes('Unable to extract secondary user ID') || msg.includes('private or has embedding disabled')) {
                msg = `TikTok is protecting this creator's profile page from direct automated scrapers.\n\nTip: Paste any single video link from this creator (e.g., https://vt.tiktok.com/ZSb6P1BSu/) into the search box to browse their videos or transcribe!`;
            }
            alert(msg);
        } finally {
            setLoading(false);
        }
    }

    function renderProfile(profile, postedVideoURL = null, cachedTopics = null) {
        if (!profile) return;
        const uname = profile.username || profile.Username || 'creator';
        if (profileUsername) profileUsername.textContent = '@' + uname;
        if (profileInitial) profileInitial.textContent = uname ? uname.charAt(0).toUpperCase() : '@';

        const vids = profile.videos || profile.Videos || [];
        // Ensure most recent videos are always at the top (highest TikTok snowflake ID first)
        vids.sort((a, b) => {
            const idA = String(a.id || a.ID || '');
            const idB = String(b.id || b.ID || '');
            if (idA.length !== idB.length) return idB.length - idA.length;
            return idB.localeCompare(idA);
        });
        allProfileVideos = vids;
        if (profileMeta) profileMeta.textContent = `Found ${vids.length} videos from this creator`;
        
        if (tabVideosCount) tabVideosCount.textContent = vids.length;

        // Cache-first topic restoration
        if (cachedTopics && cachedTopics.length > 0) {
            discoveredTopics = cachedTopics;
            if (tabTopicsBadge) tabTopicsBadge.textContent = cachedTopics.length;
            renderTopicCards(discoveredTopics);
            if (topicsEmptyState) topicsEmptyState.classList.add('hidden');
            if (topicsLoadingState) topicsLoadingState.classList.add('hidden');
            if (topicsContent) topicsContent.classList.remove('hidden');
        } else {
            discoveredTopics = [];
            if (tabTopicsBadge) tabTopicsBadge.textContent = 'New';
            if (topicsEmptyState) topicsEmptyState.classList.remove('hidden');
            if (topicsLoadingState) topicsLoadingState.classList.add('hidden');
            if (topicsContent) topicsContent.classList.add('hidden');
            if (topicsGrid) topicsGrid.innerHTML = '';
        }
        switchProfileTab('videos');

        // Reset and init search input
        if (videoSearchInput) videoSearchInput.value = '';
        if (clearVideoSearch) clearVideoSearch.classList.add('hidden');
        if (filteredVideoCount) filteredVideoCount.textContent = `(${vids.length} videos)`;

        // Handle featured card if a video link was pasted
        if (postedVideoURL && vids.length > 0 && featuredVideoBox) {
            const featured = vids[0];
            if (featuredTitle) featuredTitle.textContent = featured.title || featured.description || 'Selected Video';
            if (featuredDesc) featuredDesc.textContent = featured.description || '';
            const mins = Math.floor((featured.duration || 0) / 60);
            const secs = String((featured.duration || 0) % 60).padStart(2, '0');
            if (featuredDuration) featuredDuration.textContent = `${mins}:${secs}`;
            if (featuredViews) featuredViews.textContent = featured.view_count ? `${Number(featured.view_count).toLocaleString()} views` : '';
            if (featuredTranscribeBtn) {
                featuredTranscribeBtn.onclick = (e) => {
                    const forceW = forceWhisperToggle ? forceWhisperToggle.checked : false;
                    transcribeSingleVideo(postedVideoURL, forceW, featured.title, featuredTranscribeBtn, featured.description);
                };
            }
            featuredVideoBox.classList.remove('hidden');
        } else if (featuredVideoBox) {
            featuredVideoBox.classList.add('hidden');
        }

        renderVideoCards(allProfileVideos);
        if (profileSection) {
            profileSection.classList.remove('hidden');
            profileSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function renderVideoCards(vids, query = '') {
        videoGrid.innerHTML = '';

        if (!vids || vids.length === 0) {
            if (query) {
                videoGrid.innerHTML = `
                    <div class="no-match-box">
                        <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em;">No Results</div>
                        <h4>No videos found matching "${escapeHTML(query)}"</h4>
                        <p class="text-muted">Try searching another keyword, or clear the search to see all videos.</p>
                        <button id="resetSearchBtn" class="pill-btn secondary" style="margin-top: 1rem; cursor: pointer; border-radius: 9999px; padding: 0.4rem 1rem;">Clear Search</button>
                    </div>
                `;
                const resetBtn = document.getElementById('resetSearchBtn');
                if (resetBtn) {
                    resetBtn.onclick = () => {
                        videoSearchInput.value = '';
                        clearVideoSearch.classList.add('hidden');
                        filteredVideoCount.textContent = `(${allProfileVideos.length} videos)`;
                        renderVideoCards(allProfileVideos);
                        videoSearchInput.focus();
                    };
                }
            } else {
                videoGrid.innerHTML = '<p class="text-muted" style="padding: 1.5rem; text-align: center; grid-column: 1 / -1;">No public videos found for this account.</p>';
            }
            return;
        }

        vids.forEach(v => {
            const card = document.createElement('div');
            card.className = 'video-card';

            const duration = v.duration || v.Duration || 0;
            const mins = Math.floor(duration / 60);
            const secs = String(duration % 60).padStart(2, '0');
            const durationStr = `${mins}:${secs}`;
            const title = v.title || v.Title || 'Untitled Video';
            const desc = v.description || v.Description || '';
            const thumbnail = v.thumbnail || v.Thumbnail || '';
            const videoUrl = v.url || v.URL || '';
            const cleanTitle = stripHashtags(title);
            const cleanDesc = stripHashtags(desc);

            const highlightedTitle = highlightText(cleanTitle || title, query);
            let descSnippetHtml = '';
            if (cleanDesc) {
                if (query && searchScope !== 'titles' && cleanDesc.toLowerCase().includes(query.toLowerCase())) {
                    descSnippetHtml = `<div class="video-desc-snippet" title="Matched in caption">${highlightText(cleanDesc, query)}</div>`;
                } else if (!query && cleanDesc !== title) {
                    descSnippetHtml = `<div class="video-desc-snippet">${escapeHTML(cleanDesc)}</div>`;
                }
            }

            card.innerHTML = `
                <div class="thumbnail-wrapper">
                    <img class="thumbnail-img" src="${thumbnail}" alt="TikTok Video" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23222%22/></svg>'">
                    <span class="duration-pill">${durationStr}</span>
                </div>
                <div class="video-content">
                    <div class="video-title">${highlightedTitle}</div>
                    ${descSnippetHtml}
                    <div class="card-actions">
                        <button class="btn-transcribe" data-url="${videoUrl}">Transcribe Video</button>
                    </div>
                </div>
            `;

            const btn = card.querySelector('.btn-transcribe');
            if (btn) {
                btn.addEventListener('click', (e) => {
                    const targetUrl = e.currentTarget.dataset.url;
                    const forceW = forceWhisperToggle ? forceWhisperToggle.checked : false;
                    transcribeSingleVideo(targetUrl, forceW, cleanTitle || title, e.currentTarget, cleanDesc || desc);
                });
            }

            if (videoGrid) videoGrid.appendChild(card);
        });
    }

    function performVideoFilter() {
        const query = videoSearchInput.value.trim().toLowerCase();
        clearVideoSearch.classList.toggle('hidden', !query);

        if (!query) {
            filteredVideoCount.textContent = `(${allProfileVideos.length} videos)`;
            if (featuredTitle.textContent && featuredTitle.textContent !== 'Selected Video') {
                featuredVideoBox.classList.remove('hidden');
            }
            renderVideoCards(allProfileVideos);
            return;
        }

        // Hide featured video box during search so only matching search results are displayed
        featuredVideoBox.classList.add('hidden');

        const filtered = allProfileVideos.filter(v => {
            const rawTitle = v.title || v.Title || '';
            const cleanTitle = stripHashtags(rawTitle).toLowerCase();

            if (searchScope === 'titles') {
                return cleanTitle.includes(query);
            }

            const rawDesc = v.description || v.Description || '';
            const cleanDesc = stripHashtags(rawDesc).toLowerCase();

            return cleanTitle.includes(query) || cleanDesc.includes(query);
        });

        filteredVideoCount.textContent = `(Showing ${filtered.length} of ${allProfileVideos.length})`;
        renderVideoCards(filtered, videoSearchInput.value.trim());
    }

    // Video Keyword Filter Events
    videoSearchInput.addEventListener('input', performVideoFilter);

    if (scopeAllBtn && scopeTitleBtn) {
        scopeAllBtn.addEventListener('click', () => {
            searchScope = 'all';
            scopeAllBtn.classList.add('active');
            scopeTitleBtn.classList.remove('active');
            performVideoFilter();
        });

        scopeTitleBtn.addEventListener('click', () => {
            searchScope = 'titles';
            scopeTitleBtn.classList.add('active');
            scopeAllBtn.classList.remove('active');
            performVideoFilter();
        });
    }

    clearVideoSearch.addEventListener('click', () => {
        videoSearchInput.value = '';
        clearVideoSearch.classList.add('hidden');
        filteredVideoCount.textContent = `(${allProfileVideos.length} videos)`;
        if (featuredTitle.textContent && featuredTitle.textContent !== 'Selected Video') {
            featuredVideoBox.classList.remove('hidden');
        }
        renderVideoCards(allProfileVideos);
        videoSearchInput.focus();
    });

    // Profile Tab Switching
    function switchProfileTab(tabName) {
        if (!tabVideosBtn || !tabTopicsBtn) return;
        if (tabName === 'videos') {
            tabVideosBtn.classList.add('active');
            tabTopicsBtn.classList.remove('active');
            if (allVideosContainer) allVideosContainer.classList.remove('hidden');
            if (topicsContainer) topicsContainer.classList.add('hidden');
        } else if (tabName === 'topics') {
            tabTopicsBtn.classList.add('active');
            tabVideosBtn.classList.remove('active');
            if (topicsContainer) topicsContainer.classList.remove('hidden');
            if (allVideosContainer) allVideosContainer.classList.add('hidden');
        }
    }

    if (tabVideosBtn) {
        tabVideosBtn.addEventListener('click', () => switchProfileTab('videos'));
    }
    if (tabTopicsBtn) {
        tabTopicsBtn.addEventListener('click', () => switchProfileTab('topics'));
    }

    // Discover & Cluster Profile Topics
    async function analyzeProfileTopics() {
        if (!allProfileVideos || allProfileVideos.length === 0) {
            alert('Please load a creator profile first by entering a TikTok link above.');
            return;
        }

        const deepseekKey = getDeepSeekKey();
        if (!deepseekKey) {
            keyModal.classList.remove('hidden');
            deepseekKeyInput.focus();
            return;
        }

        if (topicsEmptyState) topicsEmptyState.classList.add('hidden');
        if (topicsContent) topicsContent.classList.add('hidden');
        if (topicsLoadingState) topicsLoadingState.classList.remove('hidden');
        if (analyzeTopicsBtn) analyzeTopicsBtn.disabled = true;
        if (topicsSpinner) topicsSpinner.classList.remove('hidden');
        if (analyzeTopicsBtnText) analyzeTopicsBtnText.textContent = 'Analyzing...';

        const payloadVideos = allProfileVideos.map(v => ({
            id: String(v.id || v.ID || ''),
            url: v.url || v.URL || '',
            title: stripHashtags(v.title || v.Title || ''),
            desc: stripHashtags(v.description || v.Description || '')
        }));

        const creator = (profileUsername ? profileUsername.textContent.replace('@', '').trim() : '') || 'creator';

        const rawCat = (activeCategoriesInput?.value || targetCategoriesInput?.value || '').trim();
        const categoriesList = rawCat ? rawCat.split(',').map(c => c.trim()).filter(Boolean) : [];

        try {
            const resp = await fetch('/api/profile-topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creator: creator,
                    videos: payloadVideos,
                    categories: categoriesList,
                    deepseek_key: deepseekKey
                })
            });

            const data = await resp.json();
            if (!resp.ok || !data.success) {
                throw new Error(data.error || 'Failed to analyze creator topics');
            }

            discoveredTopics = data.topics || [];
            if (tabTopicsBadge) tabTopicsBadge.textContent = String(discoveredTopics.length);
            if (topicsCountHeading) topicsCountHeading.textContent = `Discovered Topics (${discoveredTopics.length})`;

            renderTopicCards(discoveredTopics);

            if (topicsLoadingState) topicsLoadingState.classList.add('hidden');
            if (topicsContent) topicsContent.classList.remove('hidden');
        } catch (err) {
            if (topicsLoadingState) topicsLoadingState.classList.add('hidden');
            if (topicsEmptyState) topicsEmptyState.classList.remove('hidden');
            alert('Error discovering topics: ' + err.message);
        } finally {
            if (analyzeTopicsBtn) analyzeTopicsBtn.disabled = false;
            if (topicsSpinner) topicsSpinner.classList.add('hidden');
            if (analyzeTopicsBtnText) analyzeTopicsBtnText.textContent = 'Analyze Profile Topics';
        }
    }

    if (analyzeTopicsBtn) {
        analyzeTopicsBtn.addEventListener('click', analyzeProfileTopics);
    }
    if (reanalyzeTopicsBtn) {
        reanalyzeTopicsBtn.addEventListener('click', analyzeProfileTopics);
    }

    // Render Discovered Topic Cards
    const renderTopics = (topics) => renderTopicCards(topics);

    function renderTopicCards(topics) {
        if (!topicsGrid) return;
        topicsGrid.innerHTML = '';

        if (!topics || topics.length === 0) {
            topicsGrid.innerHTML = '<p class="text-muted" style="padding: 2rem; text-align: center; grid-column: 1 / -1;">No coherent topics could be grouped for this catalog.</p>';
            return;
        }

        topics.forEach((topic, idx) => {
            const card = document.createElement('div');
            card.className = 'topic-card';

            const rawIds = topic.video_ids || [];
            const idSet = new Set(rawIds.map(id => String(id)));
            let matchedVids = allProfileVideos.filter(v => idSet.has(String(v.id || v.ID || '')));

            if (matchedVids.length === 0 && rawIds.length > 0) {
                rawIds.forEach(rid => {
                    const found = allProfileVideos.find(v => String(v.id || v.ID || '') === String(rid) || (v.url && v.url.includes(String(rid))));
                    if (found && !matchedVids.includes(found)) matchedVids.push(found);
                });
            }

            if (matchedVids.length === 0) {
                matchedVids = allProfileVideos.slice(0, 2);
            }

            const videoCountLabel = `${matchedVids.length} ${matchedVids.length === 1 ? 'Video' : 'Videos'}`;

            let chipsHtml = '';
            matchedVids.slice(0, 3).forEach(v => {
                const thumb = v.thumbnail || v.Thumbnail || '';
                const vTitle = stripHashtags(v.title || v.Title || 'TikTok Video');
                chipsHtml += `
                    <div class="topic-video-chip">
                        <img class="topic-chip-thumb" src="${thumb}" alt="Thumbnail" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23222%22/></svg>'">
                        <span class="topic-chip-title">${escapeHTML(vTitle)}</span>
                    </div>
                `;
            });

            if (matchedVids.length > 3) {
                chipsHtml += `<div style="font-size: 0.76rem; color: #64748B; padding-left: 0.25rem;">+ ${matchedVids.length - 3} more videos in this topic</div>`;
            }

            const categoryBadgeHtml = topic.category ? `<span class="topic-category-badge">${escapeHTML(topic.category)}</span>` : '';
            const publishedBadgeHtml = topic.is_published ? `<span class="topic-published-badge">Published</span>` : '';
            const publishBtnText = topic.is_published ? 'Mark as Draft' : 'Mark as Published';
            const publishBtnClass = topic.is_published ? 'btn-topic-publish is-published' : 'btn-topic-publish';

            card.innerHTML = `
                <div class="topic-card-top">
                    <div class="topic-badges-row">
                        <span class="topic-badge-count">${videoCountLabel}</span>
                        ${categoryBadgeHtml}
                        ${publishedBadgeHtml}
                        <button class="btn-topic-dismiss" data-topic-id="${escapeHTML(topic.id || '')}" title="Dismiss this topic">Dismiss</button>
                    </div>
                    <h4 class="topic-title">${escapeHTML(topic.title || 'Untitled Topic')}</h4>
                </div>
                <p class="topic-desc">${escapeHTML(topic.description || '')}</p>
                <div class="topic-videos-preview">
                    ${chipsHtml}
                </div>
                <div class="topic-card-actions">
                    <button class="btn-topic-view-transcripts" data-topic-idx="${idx}">
                        <span>View Transcripts</span>
                    </button>
                    <button class="btn-topic-draft" data-topic-idx="${idx}">
                        <span>Generate Article Draft</span>
                    </button>
                    <button class="${publishBtnClass}" data-topic-id="${escapeHTML(topic.id || '')}" data-topic-idx="${idx}" title="${topic.is_published ? 'Revert this topic to draft' : 'Mark this topic as published'}">
                        <span>${publishBtnText}</span>
                    </button>
                </div>
            `;

            const dismissBtn = card.querySelector('.btn-topic-dismiss');
            if (dismissBtn) {
                dismissBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const topicId = topic.id;
                    const uname = profileUsername ? profileUsername.textContent.replace(/^@/, '') : '';
                    if (!topicId || !uname) return;
                    try {
                        await fetch(`/api/profile-topics?creator=${encodeURIComponent(uname)}&id=${encodeURIComponent(topicId)}`, {
                            method: 'DELETE'
                        });
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            card.remove();
                            discoveredTopics = discoveredTopics.filter(t => t.id !== topicId);
                            if (tabTopicsBadge) tabTopicsBadge.textContent = discoveredTopics.length > 0 ? discoveredTopics.length : '0';
                            if (discoveredTopics.length === 0) {
                                if (topicsEmptyState) topicsEmptyState.classList.remove('hidden');
                                if (topicsContent) topicsContent.classList.add('hidden');
                            }
                        }, 200);
                    } catch (err) {
                        console.error('Failed to dismiss topic:', err);
                    }
                });
            }

            const publishBtn = card.querySelector('.btn-topic-publish');
            if (publishBtn) {
                publishBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const topicId = topic.id;
                    const uname = profileUsername ? profileUsername.textContent.replace(/^@/, '') : '';
                    if (!topicId || !uname) return;

                    const newStatus = !topic.is_published;
                    topic.is_published = newStatus;
                    updateCardPublishState(card, topic);

                    if (currentTopicContext && currentTopicContext.topic && currentTopicContext.topic.id === topicId) {
                        currentTopicContext.topic.is_published = newStatus;
                        updateStudioPublishButton(newStatus);
                    }

                    try {
                        const resp = await fetch(`/api/profile-topics?creator=${encodeURIComponent(uname)}&id=${encodeURIComponent(topicId)}&is_published=${newStatus}`, {
                            method: 'PATCH'
                        });
                        const data = await resp.json();
                        if (!resp.ok || !data.success) {
                            throw new Error(data.error || 'Server error');
                        }
                    } catch (err) {
                        console.error('Failed to update topic publish status:', err);
                        topic.is_published = !newStatus;
                        updateCardPublishState(card, topic);
                        if (currentTopicContext && currentTopicContext.topic && currentTopicContext.topic.id === topicId) {
                            currentTopicContext.topic.is_published = !newStatus;
                            updateStudioPublishButton(!newStatus);
                        }
                    }
                });
            }

            const viewTranscriptsBtn = card.querySelector('.btn-topic-view-transcripts');
            if (viewTranscriptsBtn) {
                viewTranscriptsBtn.addEventListener('click', () => {
                    openTopicStudio(topic, matchedVids, 'transcripts', viewTranscriptsBtn);
                });
            }

            const draftBtn = card.querySelector('.btn-topic-draft');
            if (draftBtn) {
                draftBtn.addEventListener('click', () => {
                    openTopicStudio(topic, matchedVids, 'draft', draftBtn);
                });
            }

            topicsGrid.appendChild(card);
        });
    }

    function updateCardPublishState(card, topic) {
        if (!card) return;
        const badgesRow = card.querySelector('.topic-badges-row');
        if (badgesRow) {
            let pubBadge = badgesRow.querySelector('.topic-published-badge');
            if (topic.is_published) {
                if (!pubBadge) {
                    pubBadge = document.createElement('span');
                    pubBadge.className = 'topic-published-badge';
                    pubBadge.textContent = 'Published';
                    const dismissBtn = badgesRow.querySelector('.btn-topic-dismiss');
                    if (dismissBtn) {
                        badgesRow.insertBefore(pubBadge, dismissBtn);
                    } else {
                        badgesRow.appendChild(pubBadge);
                    }
                }
            } else if (pubBadge) {
                pubBadge.remove();
            }
        }

        const pubBtn = card.querySelector('.btn-topic-publish');
        if (pubBtn) {
            if (topic.is_published) {
                pubBtn.classList.add('is-published');
                pubBtn.title = 'Revert this topic to draft';
                const span = pubBtn.querySelector('span');
                if (span) span.textContent = 'Mark as Draft';
            } else {
                pubBtn.classList.remove('is-published');
                pubBtn.title = 'Mark this topic as published';
                const span = pubBtn.querySelector('span');
                if (span) span.textContent = 'Mark as Published';
            }
        }
    }

    function updateStudioPublishButton(isPublished) {
        if (!toggleTopicPublishBtn) return;
        if (!currentTopicContext || !currentTopicContext.topic || !currentTopicContext.topic.id) {
            toggleTopicPublishBtn.classList.add('hidden');
            return;
        }
        toggleTopicPublishBtn.classList.remove('hidden');
        if (isPublished) {
            toggleTopicPublishBtn.classList.add('is-published');
            toggleTopicPublishBtn.textContent = 'Published (Mark Draft)';
            toggleTopicPublishBtn.title = 'Revert this topic to draft';
        } else {
            toggleTopicPublishBtn.classList.remove('is-published');
            toggleTopicPublishBtn.textContent = 'Mark Published';
            toggleTopicPublishBtn.title = 'Mark this topic as published';
        }
    }

    // Open Topic Studio with real spoken dialogue retrieval & dual-transcript switching
    async function openTopicStudio(topic, matchedVideos, targetViewMode = 'draft', triggerBtn = null) {
        let origBtnHtml = '';
        if (triggerBtn) {
            origBtnHtml = triggerBtn.innerHTML;
            triggerBtn.innerHTML = '<span>Retrieving Transcripts...</span>';
            triggerBtn.classList.add('loading');
            triggerBtn.disabled = true;
        }

        // Open modal in live loading state
        if (transcriptVideoTitle) transcriptVideoTitle.textContent = topic.title || 'Topic Transcripts';
        if (headerVideoTitle) headerVideoTitle.textContent = topic.title || 'Topic Studio';
        if (activeSourceChip) activeSourceChip.textContent = `Topic Cluster &bull; ${matchedVideos.length} Videos`;
        if (sourceBadge) sourceBadge.textContent = topic.category || 'Topic Cluster';
        if (langBadge) langBadge.textContent = 'Multi-Source';
        if (wordsBadge) wordsBadge.textContent = 'Loading...';
        if (durationBadge) durationBadge.classList.add('hidden');
        if (aiTitleCard) aiTitleCard.classList.add('hidden');
        if (sourceComparisonBar) sourceComparisonBar.classList.add('hidden');
        if (retranscribeBanner) retranscribeBanner.classList.add('hidden');

        modalLoadingTitle.textContent = 'Retrieving Spoken Dialogue for Topic Videos...';
        modalLoadingSub.textContent = 'Checking SQLite cache, TikTok native subtitles, and Whisper Large-v3 speech...';
        modalLoadingBox.classList.remove('hidden');
        modalLoadingBox.style.display = 'flex';
        transcriptModal.classList.remove('hidden');

        try {
            const uname = profileUsername ? profileUsername.textContent.replace(/^@/, '') : '';
            const groqKey = getApiKey();

            const resp = await fetch('/api/topic-transcripts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic_id: topic.id || '',
                    creator: uname,
                    videos: matchedVideos.map(v => ({
                        id: String(v.id || v.ID || ''),
                        url: v.url || v.URL || '',
                        title: stripHashtags(v.title || v.Title || ''),
                        desc: stripHashtags(v.description || v.Description || '')
                    })),
                    groq_key: groqKey,
                    force_whisper: false
                })
            });

            const data = await resp.json();
            if (!resp.ok || !data.success) {
                throw new Error(data.error || 'Failed to fetch topic transcripts');
            }

            const transcripts = data.transcripts || [];
            const combinedText = data.combined_text || '';

            currentTopicContext = {
                topic: topic,
                matchedVideos: matchedVideos,
                topicVideoTranscripts: transcripts,
                customCombinedTranscript: combinedText
            };
            updateStudioPublishButton(topic.is_published);
            currentVideoURL = '';
            savedTikTokResult = null;
            savedWhisperResult = null;
            activeTranscriptSource = 'topic';
            currentDraft = '';
            rawMdVisible = false;

            currentResult = {
                video_title: topic.title,
                video_desc: topic.description,
                full_text: combinedText.trim(),
                word_count: countWords(combinedText),
                source: 'topic_cluster',
                language: 'Multi-Source',
                duration: 0
            };

            if (wordsBadge) wordsBadge.textContent = `${countWords(combinedText)} source words`;
            modalLoadingBox.classList.add('hidden');
            modalLoadingBox.style.display = 'none';

            if (targetViewMode === 'draft') {
                const deepseekKey = getDeepSeekKey();
                if (!deepseekKey) {
                    keyModal.classList.remove('hidden');
                    deepseekKeyInput.focus();
                    return;
                }
                currentViewMode = 'draft';
                if (stepTranscriptBtn) stepTranscriptBtn.classList.remove('active');
                if (viewDraftBtn) viewDraftBtn.classList.add('active');
                if (step1ViewToggles) step1ViewToggles.classList.add('hidden');
                if (transcriptContent) transcriptContent.classList.add('hidden');
                if (draftContainer) draftContainer.classList.remove('hidden');
                if (downloadMdBtn) downloadMdBtn.classList.remove('hidden');
                if (downloadTxtBtn) downloadTxtBtn.classList.add('hidden');
                if (downloadJsonBtn) downloadJsonBtn.classList.add('hidden');
                if (copyText) copyText.textContent = 'Copy Draft';
                await fetchTopicArticleDraft();
            } else {
                currentViewMode = 'paragraphs';
                if (stepTranscriptBtn) stepTranscriptBtn.classList.add('active');
                if (viewDraftBtn) viewDraftBtn.classList.remove('active');
                if (step1ViewToggles) step1ViewToggles.classList.remove('hidden');
                if (viewParagraphsBtn) viewParagraphsBtn.classList.add('active');
                if (viewTimestampsBtn) viewTimestampsBtn.classList.add('hidden');
                if (transcriptContent) transcriptContent.classList.remove('hidden');
                if (draftContainer) draftContainer.classList.add('hidden');
                if (downloadMdBtn) downloadMdBtn.classList.add('hidden');
                if (downloadTxtBtn) downloadTxtBtn.classList.remove('hidden');
                if (downloadJsonBtn) downloadJsonBtn.classList.remove('hidden');
                if (copyText) copyText.textContent = 'Copy';
                renderTranscriptBody();
            }
        } catch (err) {
            alert('Error loading topic transcripts: ' + err.message);
            transcriptModal.classList.add('hidden');
        } finally {
            modalLoadingBox.classList.add('hidden');
            modalLoadingBox.style.display = 'none';
            if (triggerBtn) {
                triggerBtn.innerHTML = origBtnHtml;
                triggerBtn.classList.remove('loading');
                triggerBtn.disabled = false;
            }
        }
    }

    async function fetchTopicArticleDraft() {
        if (!currentTopicContext || !currentTopicContext.topic) return;

        const deepseekKey = getDeepSeekKey();
        if (!deepseekKey) {
            keyModal.classList.remove('hidden');
            deepseekKeyInput.focus();
            return;
        }

        const researchVal = (draftInlineResearchInput && draftInlineResearchInput.value.trim()) ||
                            (draftResearchInput && draftResearchInput.value.trim()) || '';

        if (draftResearchInput && !draftResearchInput.value && researchVal) {
            draftResearchInput.value = researchVal;
        }
        if (draftInlineResearchInput && !draftInlineResearchInput.value && researchVal) {
            draftInlineResearchInput.value = researchVal;
        }

        if (draftEmptyState) draftEmptyState.classList.add('hidden');
        if (draftPreviewWrap) draftPreviewWrap.classList.add('hidden');
        if (draftLoadingState) draftLoadingState.classList.remove('hidden');

        const includeSummary = toggleIncludeSummary ? toggleIncludeSummary.checked : true;
        const includeReferences = toggleIncludeReferences ? toggleIncludeReferences.checked : true;
        const enableWebResearch = toggleWebResearch ? toggleWebResearch.checked : true;
        const tavilyKey = getTavilyKey();

        if (enableWebResearch && !tavilyKey) {
            keyModal.classList.remove('hidden');
            if (tavilyKeyInput) tavilyKeyInput.focus();
            alert('A Tavily API key is required to perform live web research.\n\nPlease enter your free Tavily key in the API Settings modal (or uncheck "Web Research Grounding" if you wish to draft without web search).');
            return;
        }

        if (enableWebResearch) {
            if (draftLoadingTitle) draftLoadingTitle.textContent = '🌐 Researching Web & Synthesizing Topic Draft...';
            if (draftLoadingDesc) draftLoadingDesc.textContent = 'Tavily is gathering external scholarly and historical sources to ground this article...';
        } else {
            if (draftLoadingTitle) draftLoadingTitle.textContent = 'Synthesizing Topic Draft...';
            if (draftLoadingDesc) draftLoadingDesc.textContent = 'DeepSeek is synthesizing multiple videos into an article draft...';
        }

        let videosPayload = [];
        if (currentTopicContext.topicVideoTranscripts && currentTopicContext.topicVideoTranscripts.length > 0) {
            videosPayload = currentTopicContext.topicVideoTranscripts.map(tv => ({
                id: tv.video_id || tv.id || tv.ID || '',
                title: tv.title || tv.Title || '',
                desc: tv.desc || tv.description || tv.Desc || '',
                url: tv.url || tv.URL || '',
                transcript: tv.active_text || tv.transcript || tv.ActiveText || ''
            }));
        } else if (currentTopicContext.matchedVideos && currentTopicContext.matchedVideos.length > 0) {
            videosPayload = currentTopicContext.matchedVideos.map(mv => ({
                id: String(mv.id || mv.ID || ''),
                title: mv.title || mv.Title || '',
                desc: mv.description || mv.Description || mv.desc || '',
                url: mv.url || mv.URL || '',
                transcript: mv.transcript || ''
            }));
        } else if (currentTopicContext.customCombinedTranscript) {
            videosPayload = [{
                id: 'source_material',
                title: currentTopicContext.topic.title || 'Topic Source Material',
                desc: currentTopicContext.topic.description || '',
                url: '',
                transcript: currentTopicContext.customCombinedTranscript
            }];
        } else if (currentDraft && currentDraft.trim()) {
            videosPayload = [{
                id: 'draft_material',
                title: (currentTopicContext.topic && currentTopicContext.topic.title) || 'Draft Source Material',
                desc: (currentTopicContext.topic && currentTopicContext.topic.description) || '',
                url: '',
                transcript: currentDraft.trim()
            }];
        } else if (currentResult && currentResult.full_text) {
            videosPayload = [{
                id: 'studio_material',
                title: currentResult.video_title || 'Source Material',
                desc: currentResult.video_desc || '',
                url: '',
                transcript: currentResult.full_text
            }];
        }

        try {
            const resp = await fetch('/api/generate-topic-draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic_title: currentTopicContext.topic.title || '',
                    topic_desc: currentTopicContext.topic.description || '',
                    category: currentTopicContext.topic.category || '',
                    videos: videosPayload,
                    research_prompt: researchVal,
                    include_summary: includeSummary,
                    include_references: includeReferences,
                    enable_web_research: enableWebResearch,
                    deepseek_key: deepseekKey,
                    tavily_key: tavilyKey
                })
            });

            const data = await resp.json();
            if (data.success && (data.draft || data.article)) {
                currentDraft = data.draft || data.article || '';
                const summaryText = (data.executive_summary || data.summary || '').trim();

                if (summaryText && executiveSummaryCard && summaryTextarea) {
                    summaryTextarea.value = summaryText;
                    if (summaryMetaCount) summaryMetaCount.textContent = `${countWords(summaryText)} words`;
                    executiveSummaryCard.classList.remove('hidden');
                } else if (executiveSummaryCard) {
                    executiveSummaryCard.classList.add('hidden');
                    if (summaryTextarea) summaryTextarea.value = '';
                }

                if (draftRendered) draftRendered.innerHTML = renderMarkdown(currentDraft);
                if (draftRaw) draftRaw.value = currentDraft;
                if (data.web_research) renderResearchGroundingTray(data.web_research);
                if (draftLoadingState) draftLoadingState.classList.add('hidden');
                if (draftPreviewWrap) draftPreviewWrap.classList.remove('hidden');
            } else {
                throw new Error(data.error || 'Failed to generate topic article draft');
            }
        } catch (err) {
            if (draftLoadingState) draftLoadingState.classList.add('hidden');
            if (draftEmptyState) draftEmptyState.classList.remove('hidden');
            alert('Error generating topic draft: ' + err.message);
        }
    }

    function stripHashtags(text) {
        if (!text) return '';
        return text.replace(/#\S+/g, '').replace(/\s+/g, ' ').trim();
    }

    function escapeRegex(string) {
        return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    function highlightText(text, query) {
        if (!text) return '';
        const escaped = escapeHTML(text);
        if (!query || !query.trim()) return escaped;
        const qEsc = escapeRegex(query.trim());
        const regex = new RegExp(`(${qEsc})`, 'gi');
        return escaped.replace(regex, '<mark class="kw-highlight">$1</mark>');
    }

    async function transcribeSingleVideo(videoURL, forceWhisper, fallbackTitle = '', triggerBtn = null, fallbackDesc = '') {
        currentTopicContext = null;
        if (toggleTopicPublishBtn) toggleTopicPublishBtn.classList.add('hidden');
        if (currentVideoURL !== videoURL) {
            savedTikTokResult = null;
            savedWhisperResult = null;
        }
        currentVideoURL = videoURL;
        currentDraft = '';
        rawMdVisible = false;
        
        let origBtnText = '';
        if (triggerBtn) {
            origBtnText = triggerBtn.innerHTML;
            triggerBtn.innerHTML = 'Transcribing...';
            triggerBtn.classList.add('loading');
            triggerBtn.disabled = true;
        }

        // Open modal in live loading state
        if (transcriptVideoTitle) transcriptVideoTitle.textContent = fallbackTitle || 'Transcribing Video...';
        if (headerVideoTitle) headerVideoTitle.textContent = fallbackTitle || 'Transcribing Video...';
        if (activeSourceChip) activeSourceChip.textContent = forceWhisper ? 'Whisper Large-v3' : 'Analyzing Video';
        if (sourceBadge) sourceBadge.textContent = forceWhisper ? 'Whisper Large-v3' : 'Analyzing Video';
        if (langBadge) langBadge.textContent = 'Speech AI';
        if (wordsBadge) wordsBadge.textContent = '...';
        if (durationBadge) durationBadge.classList.add('hidden');
        if (aiTitleCard) aiTitleCard.classList.add('hidden');
        if (sourceComparisonBar) sourceComparisonBar.classList.add('hidden');
        if (draftContainer) draftContainer.classList.add('hidden');

        // Reset view modes to paragraphs
        currentViewMode = 'paragraphs';
        if (stepTranscriptBtn) stepTranscriptBtn.classList.add('active');
        if (viewDraftBtn) viewDraftBtn.classList.remove('active');
        if (step1ViewToggles) step1ViewToggles.classList.remove('hidden');
        if (viewParagraphsBtn) viewParagraphsBtn.classList.add('active');
        if (viewTimestampsBtn) viewTimestampsBtn.classList.remove('active');
        if (downloadMdBtn) downloadMdBtn.classList.add('hidden');

        modalLoadingTitle.textContent = 'Transcribing Video...';
        modalLoadingSub.textContent = 'Extracting speech directly from audio stream with Whisper Large-v3 AI...';
        modalLoadingBox.classList.remove('hidden');
        modalLoadingBox.style.display = 'flex';
        transcriptModal.classList.remove('hidden');

        setLoading(true, 'Processing Video Transcript...', 'Extracting speech with Whisper Large-v3 AI...');

        try {
            const userPrompt = (modalInlineWhisperPrompt && modalInlineWhisperPrompt.value.trim()) ||
                              (whisperPromptInput && whisperPromptInput.value.trim()) ||
                              (modalWhisperPromptInput && modalWhisperPromptInput.value.trim()) ||
                              localStorage.getItem('whisper_prompt') || '';

            let finalPrompt = userPrompt;
            if (finalPrompt.length > 500) {
                finalPrompt = finalPrompt.substring(0, 497) + '...';
            }

            const langVal = (whisperLangSelect ? whisperLangSelect.value : '') ||
                            (modalWhisperLangSelect ? modalWhisperLangSelect.value : '') ||
                            localStorage.getItem('whisper_lang') || 'auto';

            const resp = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: videoURL,
                    force_whisper: forceWhisper,
                    groq_key: getApiKey(),
                    prompt: finalPrompt,
                    language: langVal,
                })
            });

            const data = await resp.json();
            if (!resp.ok || !data.success) {
                throw new Error(data.error || 'Transcription failed');
            }

            const raw = data.data;
            const isWhisperResult = (raw.source === 'groq_whisper');
            const resultObj = {
                source: raw.source || raw.Source || (isWhisperResult ? 'groq_whisper' : 'tiktok_subtitles'),
                video_title: raw.video_title || raw.VideoTitle || fallbackTitle || 'TikTok Video Transcript',
                video_desc: fallbackDesc || '',
                ai_title: raw.ai_title || raw.AITitle || '',
                language: raw.language || raw.Language || '',
                full_text: raw.full_text || raw.FullText || '',
                word_count: raw.word_count || raw.WordCount || 0,
                duration: raw.duration || raw.Duration || 0,
                segments: raw.segments || raw.Segments || []
            };

            if (isWhisperResult) {
                savedWhisperResult = resultObj;
                activeTranscriptSource = 'whisper';
            } else {
                savedTikTokResult = resultObj;
                activeTranscriptSource = 'tiktok';
            }

            if (raw.video_id) {
                cachedTranscripts[String(raw.video_id)] = resultObj;
            }
            if (videoURL) {
                cachedTranscripts[videoURL] = resultObj;
            }

            openTranscriptModal();
        } catch (err) {
            transcriptModal.classList.add('hidden');
            alert('Error during transcription: ' + err.message);
        } finally {
            setLoading(false);
            if (triggerBtn) {
                triggerBtn.innerHTML = origBtnText;
                triggerBtn.classList.remove('loading');
                triggerBtn.disabled = false;
            }
        }
    }

    function openTranscriptModal() {
        modalLoadingBox.classList.add('hidden');
        modalLoadingBox.style.display = 'none';

        // Select which result is currently active
        let activeResult = (activeTranscriptSource === 'whisper') ? savedWhisperResult : savedTikTokResult;
        if (!activeResult) {
            activeResult = savedWhisperResult || savedTikTokResult || currentResult;
        }
        currentResult = activeResult;

        if (headerVideoTitle) {
            headerVideoTitle.textContent = currentResult?.video_title || 'TikTok Video';
        }
        if (transcriptVideoTitle) {
            transcriptVideoTitle.textContent = currentResult?.video_title || 'TikTok Video';
        }
        if (modalVideoLink) {
            modalVideoLink.href = currentVideoURL || '#';
            modalVideoLink.style.display = currentVideoURL ? 'inline-block' : 'none';
        }
        if (transcriptVideoCaption) {
            transcriptVideoCaption.textContent = currentResult?.video_desc || 'No caption available for this video.';
        }
        if (modalInlineWhisperPrompt) {
            modalInlineWhisperPrompt.value = localStorage.getItem('whisper_prompt') || IGBO_DEFAULT_PROMPT;
        }

        // Handle Comparison Switcher
        if (sourceComparisonBar) {
            if (savedWhisperResult && savedTikTokResult) {
                sourceComparisonBar.classList.remove('hidden');
                if (switchWhisperBtn) switchWhisperBtn.classList.toggle('active', activeTranscriptSource === 'whisper');
                if (switchTikTokBtn) switchTikTokBtn.classList.toggle('active', activeTranscriptSource === 'tiktok');
                if (comparisonHint) comparisonHint.textContent = 'Comparing AI transcription vs original TikTok captions';
            } else {
                sourceComparisonBar.classList.add('hidden');
            }
        }

        // Update active chip & status strip
        updateModalStatusStrip(currentResult);

        if (currentResult?.ai_title) {
            aiTitleText.textContent = currentResult.ai_title;
        } else {
            fetchAITitle();
        }

        // Reset step view to Step 1: Transcript
        currentViewMode = 'paragraphs';
        if (stepTranscriptBtn) stepTranscriptBtn.classList.add('active');
        if (viewDraftBtn) viewDraftBtn.classList.remove('active');
        if (step1ViewToggles) step1ViewToggles.classList.remove('hidden');
        if (viewParagraphsBtn) viewParagraphsBtn.classList.add('active');
        if (viewTimestampsBtn) viewTimestampsBtn.classList.remove('active');
        if (transcriptContent) transcriptContent.classList.remove('hidden');
        if (draftContainer) draftContainer.classList.add('hidden');
        if (downloadMdBtn) downloadMdBtn.classList.add('hidden');
        if (downloadTxtBtn) downloadTxtBtn.classList.remove('hidden');
        if (downloadJsonBtn) downloadJsonBtn.classList.remove('hidden');
        if (copyText) copyText.textContent = 'Copy';

        // Reset draft box state
        if (draftEmptyState) draftEmptyState.classList.remove('hidden');
        if (draftLoadingState) draftLoadingState.classList.add('hidden');
        if (draftPreviewWrap) draftPreviewWrap.classList.add('hidden');

        renderTranscriptBody();
        transcriptModal.classList.remove('hidden');
    }

    function updateModalStatusStrip(res) {
        if (!res) return;
        const isWhisper = (res.source === 'groq_whisper');
        const sourceLabel = isWhisper ? 'Whisper Large-v3' : 'TikTok Captions';
        if (activeSourceChip) activeSourceChip.textContent = sourceLabel;
        if (sourceBadge) sourceBadge.textContent = sourceLabel;
        if (wordsBadge) wordsBadge.textContent = `${res.word_count || 0} words`;
        if (durationBadge) {
            durationBadge.textContent = res.duration ? formatTime(res.duration) : '';
            durationBadge.classList.toggle('hidden', !res.duration);
        }
        if (langBadge) {
            langBadge.textContent = res.language ? `Lang: ${res.language}` : 'Auto-detected';
        }
    }

    async function fetchAITitle() {
        if (!currentResult || !currentResult.full_text) {
            aiTitleText.innerHTML = '<span style="opacity: 0.6; font-size: 0.85rem;">No transcript available for title generation</span>';
            return;
        }

        const apiKey = getApiKey();
        if (!apiKey) {
            aiTitleText.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.6rem; padding: 0.3rem 0;">
                    <span style="font-size: 0.85rem; color: #f1fa8c;">Groq API key is required to generate AI title</span>
                    <button id="openKeyFromTitleBtn" class="pill-btn primary" style="font-size: 0.78rem; padding: 0.35rem 0.85rem; cursor: pointer; background: var(--accent); color: #fff; border: none; border-radius: 9999px;">Enter Free Groq Key</button>
                </div>
            `;
            const openBtn = document.getElementById('openKeyFromTitleBtn');
            if (openBtn) {
                openBtn.onclick = () => {
                    keyModal.classList.remove('hidden');
                    groqKeyInput.focus();
                };
            }
            return;
        }

        aiTitleText.innerHTML = '<span style="opacity: 0.75; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 0.5rem;"><span class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></span> Crafting title with Groq Llama 3.3...</span>';
        try {
            const resp = await fetch('/api/generate-title', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript: currentResult.full_text,
                    groq_key: apiKey,
                })
            });
            const data = await resp.json();
            if (data.success && data.ai_title) {
                currentResult.ai_title = data.ai_title;
                aiTitleText.textContent = data.ai_title;
            } else {
                const errMsg = data.error || 'Failed to generate title';
                aiTitleText.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.6rem; padding: 0.3rem 0;">
                        <span style="font-size: 0.82rem; color: #ff6e6e;">${escapeHTML(errMsg)}</span>
                        <button id="fixKeyBtn" class="pill-btn secondary" style="font-size: 0.75rem; padding: 0.3rem 0.7rem; cursor: pointer; border-radius: 9999px;">Edit Key</button>
                    </div>
                `;
                const fixBtn = document.getElementById('fixKeyBtn');
                if (fixBtn) {
                    fixBtn.onclick = () => {
                        keyModal.classList.remove('hidden');
                        groqKeyInput.focus();
                    };
                }
            }
        } catch (e) {
            aiTitleText.innerHTML = `<span style="font-size: 0.85rem; color: #ff6e6e;">Connection error: ${escapeHTML(e.message)}. Click Regenerate to retry.</span>`;
        }
    }

    if (regenerateTitleBtn) {
        regenerateTitleBtn.addEventListener('click', () => {
            fetchAITitle();
        });
    }

    function countWords(str) {
        if (!str) return 0;
        const matched = str.trim().match(/\S+/g);
        return matched ? matched.length : 0;
    }

    // Synchronize research directive inputs between empty state and preview toolbar
    if (draftResearchInput && draftInlineResearchInput) {
        draftResearchInput.addEventListener('input', () => {
            draftInlineResearchInput.value = draftResearchInput.value;
        });
        draftInlineResearchInput.addEventListener('input', () => {
            draftResearchInput.value = draftInlineResearchInput.value;
        });
    }

    // Live Web Research Grounding via Tavily
    async function triggerWebResearch(buttonEl) {
        const userFocus = (draftInlineResearchInput && draftInlineResearchInput.value.trim()) ||
                          (draftResearchInput && draftResearchInput.value.trim()) || '';
        
        let title = '';
        let desc = '';
        let transcript = '';

        if (currentTopicContext && currentTopicContext.topic) {
            title = currentTopicContext.topic.title || '';
            desc = currentTopicContext.topic.description || '';
            transcript = currentDraft || '';
        } else if (currentResult) {
            title = currentResult.video_title || '';
            desc = currentResult.video_desc || '';
            transcript = currentResult.full_text || '';
        }

        const tavilyKey = getTavilyKey();
        if (!tavilyKey) {
            keyModal.classList.remove('hidden');
            if (tavilyKeyInput) tavilyKeyInput.focus();
            alert('A Tavily API key is required to research the web.\n\nPlease enter your free Tavily key in the API Settings modal.');
            return;
        }

        const originalHtml = buttonEl ? buttonEl.innerHTML : '';
        if (buttonEl) {
            buttonEl.disabled = true;
            buttonEl.innerHTML = '<span>🔎 Searching web...</span>';
        }

        try {
            const resp = await fetch('/api/research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_title: title,
                    video_description: desc,
                    transcript: transcript,
                    user_angle: userFocus,
                    tavily_key: getTavilyKey()
                })
            });

            const data = await resp.json();
            if (data.success && (data.answer || (data.results && data.results.length > 0))) {
                let researchNote = '';
                if (data.answer) {
                    researchNote = data.answer.trim();
                } else if (data.results && data.results.length > 0) {
                    researchNote = data.results.map(r => `${r.title}: ${r.content}`).slice(0, 2).join('; ');
                }

                if (userFocus && !researchNote.toLowerCase().includes(userFocus.toLowerCase())) {
                    researchNote = `${userFocus}\n\n[Verified Web Research]: ${researchNote}`;
                }

                renderResearchGroundingTray({
                    query: data.query,
                    answer: data.answer,
                    results: data.results
                });

                if (draftEmptyState) {
                    draftPreviewWrap.classList.remove('hidden');
                }

                if (buttonEl) {
                    buttonEl.innerHTML = '<span>✓ Researched!</span>';
                    setTimeout(() => {
                        buttonEl.innerHTML = originalHtml;
                    }, 2500);
                }
            } else {
                throw new Error(data.error || 'No relevant search results found');
            }
        } catch (err) {
            alert(err.message || 'Web research failed. Please configure your Tavily API key in Settings.');
            if (buttonEl) buttonEl.innerHTML = originalHtml;
        } finally {
            if (buttonEl) buttonEl.disabled = false;
        }
    }

    if (fetchResearchBtn) {
        fetchResearchBtn.addEventListener('click', () => triggerWebResearch(fetchResearchBtn));
    }
    if (inlineFetchResearchBtn) {
        inlineFetchResearchBtn.addEventListener('click', () => triggerWebResearch(inlineFetchResearchBtn));
    }

    // Article Draft Generation with DeepSeek
    async function fetchArticleDraft() {
        if (currentTopicContext) {
            await fetchTopicArticleDraft();
            return;
        }

        if (!currentResult || !currentResult.full_text) {
            alert('No transcript available to write draft from');
            return;
        }

        const deepseekKey = getDeepSeekKey();
        if (!deepseekKey) {
            keyModal.classList.remove('hidden');
            deepseekKeyInput.focus();
            return;
        }

        const researchVal = (draftInlineResearchInput && draftInlineResearchInput.value.trim()) ||
                            (draftResearchInput && draftResearchInput.value.trim()) || '';

        if (draftResearchInput && !draftResearchInput.value && researchVal) {
            draftResearchInput.value = researchVal;
        }
        if (draftInlineResearchInput && !draftInlineResearchInput.value && researchVal) {
            draftInlineResearchInput.value = researchVal;
        }

        const includeSummary = toggleIncludeSummary ? toggleIncludeSummary.checked : true;
        const includeReferences = toggleIncludeReferences ? toggleIncludeReferences.checked : true;
        const enableWebResearch = toggleWebResearch ? toggleWebResearch.checked : true;
        const creatorName = (profileUsername ? profileUsername.textContent.replace(/^@/, '') : '') || '';
        const tavilyKey = getTavilyKey();

        if (enableWebResearch && !tavilyKey) {
            keyModal.classList.remove('hidden');
            if (tavilyKeyInput) tavilyKeyInput.focus();
            alert('A Tavily API key is required to perform live web research.\n\nPlease enter your free Tavily key in the API Settings modal (or uncheck "Web Research Grounding" if you wish to draft without web search).');
            return;
        }

        draftEmptyState.classList.add('hidden');
        draftPreviewWrap.classList.add('hidden');
        draftLoadingState.classList.remove('hidden');

        if (enableWebResearch) {
            if (draftLoadingTitle) draftLoadingTitle.textContent = '🌐 Researching Web & Composing Draft...';
            if (draftLoadingDesc) draftLoadingDesc.textContent = 'Tavily is gathering verified web sources, checking citations, and grounding DeepSeek...';
        } else {
            if (draftLoadingTitle) draftLoadingTitle.textContent = 'Composing Article Draft...';
            if (draftLoadingDesc) draftLoadingDesc.textContent = 'DeepSeek is writing in an engaging human voice...';
        }

        try {
            const resp = await fetch('/api/generate-draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript: currentResult.full_text,
                    video_title: currentResult.video_title || '',
                    video_description: currentResult.video_desc || '',
                    video_url: currentVideoURL || '',
                    creator: creatorName,
                    research_prompt: researchVal,
                    include_summary: includeSummary,
                    include_references: includeReferences,
                    enable_web_research: enableWebResearch,
                    deepseek_key: deepseekKey,
                    tavily_key: tavilyKey
                })
            });

            const data = await resp.json();
            if (data.success && (data.draft || data.article)) {
                currentDraft = data.draft || data.article || '';
                const summaryText = (data.executive_summary || data.summary || '').trim();

                if (summaryText && executiveSummaryCard && summaryTextarea) {
                    summaryTextarea.value = summaryText;
                    if (summaryMetaCount) summaryMetaCount.textContent = `${countWords(summaryText)} words`;
                    executiveSummaryCard.classList.remove('hidden');
                } else if (executiveSummaryCard) {
                    executiveSummaryCard.classList.add('hidden');
                    if (summaryTextarea) summaryTextarea.value = '';
                }

                draftRendered.innerHTML = renderMarkdown(currentDraft);
                draftRaw.value = currentDraft;
                if (data.web_research) renderResearchGroundingTray(data.web_research);
                draftLoadingState.classList.add('hidden');
                draftPreviewWrap.classList.remove('hidden');
            } else {
                throw new Error(data.error || 'Failed to generate draft');
            }
        } catch (err) {
            draftLoadingState.classList.add('hidden');
            draftEmptyState.classList.remove('hidden');
            alert('Error generating article draft: ' + err.message);
        }
    }

    if (generateDraftBtn) {
        generateDraftBtn.addEventListener('click', fetchArticleDraft);
    }
    if (regenerateDraftBtn) {
        regenerateDraftBtn.addEventListener('click', fetchArticleDraft);
    }

    // Live Edit Markdown Draft
    if (draftRaw) {
        draftRaw.addEventListener('input', () => {
            currentDraft = draftRaw.value;
            if (draftRendered) draftRendered.innerHTML = renderMarkdown(currentDraft);
        });
    }

    // Toggle Raw Markdown vs Rendered Preview
    if (toggleRawMdBtn) {
        toggleRawMdBtn.addEventListener('click', () => {
            rawMdVisible = !rawMdVisible;
            if (rawMdVisible) {
                if (draftRendered) draftRendered.classList.add('hidden');
                if (draftRaw) draftRaw.classList.remove('hidden');
                toggleRawMdBtn.textContent = 'View Preview';
            } else {
                if (draftRaw) draftRaw.classList.add('hidden');
                if (draftRendered) draftRendered.classList.remove('hidden');
                toggleRawMdBtn.textContent = 'Edit Markdown';
            }
        });
    }

    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', async () => {
            const md = (draftRaw && !draftRaw.classList.contains('hidden')) ? draftRaw.value : currentDraft;
            if (!md || !md.trim()) {
                alert('No article draft content to save.');
                return;
            }

            const title = (transcriptVideoTitle ? transcriptVideoTitle.textContent.trim() : '') || currentResult?.video_title || 'Untitled Draft';
            const category = currentTopicContext?.topic?.category || '';
            const prompt = (draftInlineResearchInput && draftInlineResearchInput.value.trim()) ||
                           (draftResearchInput && draftResearchInput.value.trim()) || '';

            saveDraftBtn.disabled = true;
            const origText = saveDraftBtn.textContent;
            saveDraftBtn.textContent = 'Saving...';

            const payload = {
                title: title,
                category: category,
                research_prompt: prompt,
                executive_summary: summaryTextarea ? summaryTextarea.value.trim() : '',
                markdown_content: md
            };
            if (currentTopicContext) {
                if (currentTopicContext.topicVideoTranscripts && currentTopicContext.topicVideoTranscripts.length > 0) {
                    payload.source_json = JSON.stringify(currentTopicContext.topicVideoTranscripts);
                } else if (currentTopicContext.matchedVideos && currentTopicContext.matchedVideos.length > 0) {
                    payload.source_json = JSON.stringify(currentTopicContext.matchedVideos);
                }
            }

            try {
                const resp = await fetch('/api/library/drafts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await resp.json();
                if (!resp.ok || !data.success) {
                    throw new Error(data.error || 'Failed to save draft');
                }
                saveDraftBtn.textContent = 'Saved to Library!';
                setTimeout(() => {
                    saveDraftBtn.textContent = origText;
                    saveDraftBtn.disabled = false;
                }, 2000);
            } catch (err) {
                alert('Error saving draft to library: ' + err.message);
                saveDraftBtn.textContent = origText;
                saveDraftBtn.disabled = false;
            }
        });
    }

    if (toggleTopicPublishBtn) {
        toggleTopicPublishBtn.addEventListener('click', async () => {
            if (!currentTopicContext || !currentTopicContext.topic || !currentTopicContext.topic.id) return;
            const topic = currentTopicContext.topic;
            const topicId = topic.id;
            const uname = profileUsername ? profileUsername.textContent.replace(/^@/, '') : '';
            if (!topicId || !uname) return;

            const newStatus = !topic.is_published;
            topic.is_published = newStatus;
            updateStudioPublishButton(newStatus);

            const inList = discoveredTopics.find(t => t.id === topicId);
            if (inList) inList.is_published = newStatus;

            if (topicsGrid) {
                const pubBtn = topicsGrid.querySelector(`.btn-topic-publish[data-topic-id="${CSS.escape(topicId)}"]`);
                if (pubBtn) {
                    const card = pubBtn.closest('.topic-card');
                    if (card) updateCardPublishState(card, topic);
                }
            }

            try {
                const resp = await fetch(`/api/profile-topics?creator=${encodeURIComponent(uname)}&id=${encodeURIComponent(topicId)}&is_published=${newStatus}`, {
                    method: 'PATCH'
                });
                const data = await resp.json();
                if (!resp.ok || !data.success) {
                    throw new Error(data.error || 'Server error');
                }
            } catch (err) {
                console.error('Failed to update topic publish status from studio:', err);
                topic.is_published = !newStatus;
                if (inList) inList.is_published = !newStatus;
                updateStudioPublishButton(!newStatus);
                if (topicsGrid) {
                    const pubBtn = topicsGrid.querySelector(`.btn-topic-publish[data-topic-id="${CSS.escape(topicId)}"]`);
                    if (pubBtn) {
                        const card = pubBtn.closest('.topic-card');
                        if (card) updateCardPublishState(card, topic);
                    }
                }
            }
        });
    }

    // Render Transcript Body (Paragraphs, In-place Editor, Timestamps, or Topic Multi-Video Dual Sources)
    function renderTranscriptBody() {
        if (!currentResult) return;

        if (currentTopicContext && currentTopicContext.topicVideoTranscripts && currentTopicContext.topicVideoTranscripts.length > 0) {
            renderTopicMultiVideoTranscripts();
            return;
        }

        if (currentViewMode === 'paragraphs') {
            const txt = currentResult.full_text || 'No speech detected in this audio.';
            transcriptContent.innerHTML = `<div class="transcript-paragraph">${escapeHTML(txt)}</div>`;
        } else if (currentViewMode === 'edit') {
            const txt = currentResult.full_text || '';
            const wc = countWords(txt);
            transcriptContent.innerHTML = `
                <div class="transcript-editor-wrap">
                    <div class="transcript-editor-notice">
                        <span>Edit mode: Correct spellings, clan names, or misheard terms. Changes apply automatically to DeepSeek.</span>
                        <span id="liveEditWordCount">${wc} words</span>
                    </div>
                    <textarea id="transcriptLiveEditor" class="transcript-live-editor" placeholder="Type or correct transcription text here...">${escapeHTML(txt)}</textarea>
                </div>
            `;
            const editor = document.getElementById('transcriptLiveEditor');
            if (editor) {
                editor.addEventListener('input', () => {
                    const updated = editor.value;
                    currentResult.full_text = updated;
                    if (currentTopicContext) {
                        currentTopicContext.customCombinedTranscript = updated;
                    }
                    if (activeTranscriptSource === 'whisper' && savedWhisperResult) {
                        savedWhisperResult.full_text = updated;
                    } else if (activeTranscriptSource === 'tiktok' && savedTikTokResult) {
                        savedTikTokResult.full_text = updated;
                    }
                    const newWc = countWords(updated);
                    currentResult.word_count = newWc;
                    if (wordsBadge) wordsBadge.textContent = newWc + ' words';
                    const liveWc = document.getElementById('liveEditWordCount');
                    if (liveWc) liveWc.textContent = newWc + ' words';
                });
            }
        } else if (currentViewMode === 'timestamps') {
            if (currentResult.segments && currentResult.segments.length > 0) {
                let html = '';
                currentResult.segments.forEach(seg => {
                    const startStr = formatTime(seg.start);
                    const endStr = formatTime(seg.end);
                    html += `
                        <div class="timestamp-segment">
                            <span class="segment-time">[${startStr} - ${endStr}]</span>
                            <span class="segment-text">${escapeHTML(seg.text)}</span>
                        </div>
                    `;
                });
                transcriptContent.innerHTML = html;
            } else {
                const txt = currentResult.full_text || 'No speech detected in this audio.';
                transcriptContent.innerHTML = `<div class="transcript-paragraph">${escapeHTML(txt)}</div>`;
            }
        }
    }

    function renderTopicMultiVideoTranscripts() {
        if (!currentTopicContext || !currentTopicContext.topicVideoTranscripts) return;
        const vts = currentTopicContext.topicVideoTranscripts;
        const isEdit = (currentViewMode === 'edit');

        let totalWords = 0;
        vts.forEach(vt => {
            totalWords += countWords(vt.activeText || '');
        });

        let html = `
            <div class="topic-transcripts-container">
                <div class="topic-transcripts-master-bar">
                    <div>
                        <strong>Topic Sources</strong>: ${vts.length} videos &bull; <span id="topicTotalWordsBadge">${totalWords} words total</span>
                    </div>
                    <div class="topic-transcripts-master-actions">
                        <button class="btn-master-source" id="btnMasterWhisper">Use All Whisper AI</button>
                        <button class="btn-master-source" id="btnMasterTikTok">Use All TikTok Captions</button>
                    </div>
                </div>
        `;

        vts.forEach((vt, idx) => {
            const hasWhisper = !!(vt.whisper_transcript && vt.whisper_transcript.full_text);
            const hasTikTok = !!(vt.tiktok_transcript && vt.tiktok_transcript.full_text);
            const whisperWords = hasWhisper ? vt.whisper_transcript.word_count : 0;
            const tiktokWords = hasTikTok ? vt.tiktok_transcript.word_count : 0;

            const isWhisperActive = (vt.activeSource === 'whisper');
            const isTikTokActive = (vt.activeSource === 'tiktok');

            html += `
                <div class="topic-video-item-card" data-vidx="${idx}">
                    <div class="topic-video-item-header">
                        <div class="topic-video-item-title-group">
                            <span class="topic-video-index-badge">Video ${idx + 1}</span>
                            <span>${escapeHTML(vt.title || 'Video ' + (idx + 1))}</span>
                        </div>
                        <div class="topic-video-dual-toggles">
                            ${hasWhisper ? `
                                <button class="btn-video-source-pill ${isWhisperActive ? 'active' : ''}" data-vidx="${idx}" data-source="whisper">
                                    Whisper AI (${whisperWords}w)
                                </button>
                            ` : `
                                <button class="btn-video-run-whisper" data-vidx="${idx}" data-url="${escapeHTML(vt.url || '')}">
                                    + Transcribe Whisper
                                </button>
                            `}
                            ${hasTikTok ? `
                                <button class="btn-video-source-pill ${isTikTokActive ? 'active' : ''}" data-vidx="${idx}" data-source="tiktok">
                                    TikTok Captions (${tiktokWords}w)
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    ${vt.desc ? `<div class="topic-video-caption-hint">Caption: ${escapeHTML(vt.desc)}</div>` : ''}
                    ${isEdit ? `
                        <textarea class="topic-video-editor-box" data-vidx="${idx}" placeholder="Edit transcription text for Video ${idx + 1}...">${escapeHTML(vt.activeText || '')}</textarea>
                    ` : `
                        <div class="topic-video-transcript-box">${escapeHTML(vt.activeText || 'No spoken dialogue available for this video.')}</div>
                    `}
                </div>
            `;
        });

        html += `</div>`;
        transcriptContent.innerHTML = html;

        // Wire master toggles
        const masterWhisper = document.getElementById('btnMasterWhisper');
        if (masterWhisper) {
            masterWhisper.onclick = () => {
                vts.forEach(vt => {
                    if (vt.whisper_transcript && vt.whisper_transcript.full_text) {
                        vt.activeSource = 'whisper';
                        vt.activeText = vt.whisper_transcript.full_text;
                    }
                });
                recompileTopicCombinedText();
                renderTopicMultiVideoTranscripts();
            };
        }

        const masterTikTok = document.getElementById('btnMasterTikTok');
        if (masterTikTok) {
            masterTikTok.onclick = () => {
                vts.forEach(vt => {
                    if (vt.tiktok_transcript && vt.tiktok_transcript.full_text) {
                        vt.activeSource = 'tiktok';
                        vt.activeText = vt.tiktok_transcript.full_text;
                    }
                });
                recompileTopicCombinedText();
                renderTopicMultiVideoTranscripts();
            };
        }

        // Wire per-video source pills
        transcriptContent.querySelectorAll('.btn-video-source-pill').forEach(btn => {
            btn.onclick = () => {
                const vidx = parseInt(btn.getAttribute('data-vidx'), 10);
                const source = btn.getAttribute('data-source');
                const vt = vts[vidx];
                if (!vt) return;
                if (source === 'whisper' && vt.whisper_transcript) {
                    vt.activeSource = 'whisper';
                    vt.activeText = vt.whisper_transcript.full_text;
                } else if (source === 'tiktok' && vt.tiktok_transcript) {
                    vt.activeSource = 'tiktok';
                    vt.activeText = vt.tiktok_transcript.full_text;
                }
                recompileTopicCombinedText();
                renderTopicMultiVideoTranscripts();
            };
        });

        // Wire per-video run whisper button
        transcriptContent.querySelectorAll('.btn-video-run-whisper').forEach(btn => {
            btn.onclick = async () => {
                const vidx = parseInt(btn.getAttribute('data-vidx'), 10);
                const vt = vts[vidx];
                if (!vt || !vt.url) return;
                btn.textContent = 'Transcribing with Whisper...';
                btn.disabled = true;
                try {
                    const groqKey = getApiKey();
                    const resp = await fetch('/api/transcribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            url: vt.url,
                            force_whisper: true,
                            groq_key: groqKey,
                            prompt: '',
                            language: 'auto'
                        })
                    });
                    const data = await resp.json();
                    if (!resp.ok || !data.success) {
                        throw new Error(data.error || 'Whisper transcription failed');
                    }
                    vt.whisper_transcript = data.data;
                    vt.activeSource = 'whisper';
                    vt.activeText = data.data.full_text || '';
                    recompileTopicCombinedText();
                    renderTopicMultiVideoTranscripts();
                } catch (err) {
                    alert('Whisper failed for video: ' + err.message);
                    btn.textContent = '+ Transcribe Whisper';
                    btn.disabled = false;
                }
            };
        });

        // Wire live edit textareas
        transcriptContent.querySelectorAll('.topic-video-editor-box').forEach(textarea => {
            textarea.oninput = () => {
                const vidx = parseInt(textarea.getAttribute('data-vidx'), 10);
                const vt = vts[vidx];
                if (vt) {
                    vt.activeText = textarea.value;
                    recompileTopicCombinedText();
                }
            };
        });
    }

    function recompileTopicCombinedText() {
        if (!currentTopicContext || !currentTopicContext.topicVideoTranscripts) return;
        const vts = currentTopicContext.topicVideoTranscripts;
        const parts = [];
        let totalW = 0;
        vts.forEach((vt, i) => {
            let part = `=== VIDEO ${i + 1}: ${vt.title || 'Video ' + (i + 1)} ===\n`;
            if (vt.desc) part += `Caption: ${vt.desc}\n`;
            if (vt.activeText) {
                part += `Spoken Transcript (${vt.activeSource}):\n${vt.activeText}\n`;
            } else {
                part += `Spoken Transcript: (No spoken dialogue)\n`;
            }
            parts.push(part);
            totalW += countWords(vt.activeText || '');
        });
        const combined = parts.join('\n');
        currentTopicContext.customCombinedTranscript = combined;
        if (currentResult) {
            currentResult.full_text = combined;
            currentResult.word_count = totalW;
        }
        if (wordsBadge) wordsBadge.textContent = `${totalW} source words`;
        const totalWBadge = document.getElementById('topicTotalWordsBadge');
        if (totalWBadge) totalWBadge.textContent = `${totalW} words total`;
    }

    // Version Comparison Switcher Listeners
    if (switchWhisperBtn) {
        switchWhisperBtn.addEventListener('click', () => {
            if (!savedWhisperResult) return;
            activeTranscriptSource = 'whisper';
            currentResult = savedWhisperResult;
            switchWhisperBtn.classList.add('active');
            if (switchTikTokBtn) switchTikTokBtn.classList.remove('active');
            updateModalStatusStrip(savedWhisperResult);
            renderTranscriptBody();
        });
    }

    if (switchTikTokBtn) {
        switchTikTokBtn.addEventListener('click', () => {
            if (!savedTikTokResult) return;
            activeTranscriptSource = 'tiktok';
            currentResult = savedTikTokResult;
            switchTikTokBtn.classList.add('active');
            if (switchWhisperBtn) switchWhisperBtn.classList.remove('active');
            updateModalStatusStrip(savedTikTokResult);
            renderTranscriptBody();
        });
    }

    // Step 1: Transcript Navigation
    if (stepTranscriptBtn) {
        stepTranscriptBtn.addEventListener('click', () => {
            currentViewMode = 'paragraphs';
            stepTranscriptBtn.classList.add('active');
            viewDraftBtn.classList.remove('active');
            if (step1ViewToggles) step1ViewToggles.classList.remove('hidden');
            if (savedWhisperResult && savedTikTokResult && sourceComparisonBar && !currentTopicContext) {
                sourceComparisonBar.classList.remove('hidden');
            } else if (sourceComparisonBar) {
                sourceComparisonBar.classList.add('hidden');
            }
            if (viewParagraphsBtn) viewParagraphsBtn.classList.add('active');
            if (viewEditBtn) viewEditBtn.classList.remove('active');
            if (viewTimestampsBtn) {
                viewTimestampsBtn.classList.remove('active');
                viewTimestampsBtn.classList.toggle('hidden', !!currentTopicContext);
            }
            if (transcriptContent) transcriptContent.classList.remove('hidden');
            if (draftContainer) draftContainer.classList.add('hidden');
            if (downloadMdBtn) downloadMdBtn.classList.add('hidden');
            if (downloadTxtBtn) downloadTxtBtn.classList.remove('hidden');
            if (downloadJsonBtn) downloadJsonBtn.classList.remove('hidden');
            if (copyText) copyText.textContent = 'Copy';
            renderTranscriptBody();
        });
    }

    // Step 2: Article Draft Navigation
    if (viewDraftBtn) {
        viewDraftBtn.addEventListener('click', () => {
            currentViewMode = 'draft';
            viewDraftBtn.classList.add('active');
            if (stepTranscriptBtn) stepTranscriptBtn.classList.remove('active');
            if (step1ViewToggles) step1ViewToggles.classList.add('hidden');
            if (sourceComparisonBar) sourceComparisonBar.classList.add('hidden');
            if (transcriptContent) transcriptContent.classList.add('hidden');
            if (draftContainer) draftContainer.classList.remove('hidden');
            if (downloadMdBtn) downloadMdBtn.classList.remove('hidden');
            if (downloadTxtBtn) downloadTxtBtn.classList.add('hidden');
            if (downloadJsonBtn) downloadJsonBtn.classList.add('hidden');
            if (copyText) copyText.textContent = 'Copy Draft';

            if (currentDraft) {
                if (draftEmptyState) draftEmptyState.classList.add('hidden');
                if (draftLoadingState) draftLoadingState.classList.add('hidden');
                if (draftPreviewWrap) draftPreviewWrap.classList.remove('hidden');
            } else {
                if (draftEmptyState) draftEmptyState.classList.remove('hidden');
                if (draftLoadingState) draftLoadingState.classList.add('hidden');
                if (draftPreviewWrap) draftPreviewWrap.classList.add('hidden');
            }
        });
    }

    // Step 1 View Sub-toggles (Clean Text vs Edit vs Timestamps)
    if (viewParagraphsBtn) {
        viewParagraphsBtn.addEventListener('click', () => {
            currentViewMode = 'paragraphs';
            viewParagraphsBtn.classList.add('active');
            if (viewEditBtn) viewEditBtn.classList.remove('active');
            if (viewTimestampsBtn) viewTimestampsBtn.classList.remove('active');
            renderTranscriptBody();
        });
    }

    if (viewEditBtn) {
        viewEditBtn.addEventListener('click', () => {
            currentViewMode = 'edit';
            viewEditBtn.classList.add('active');
            if (viewParagraphsBtn) viewParagraphsBtn.classList.remove('active');
            if (viewTimestampsBtn) viewTimestampsBtn.classList.remove('active');
            renderTranscriptBody();
            const editor = document.getElementById('transcriptLiveEditor');
            if (editor) editor.focus();
        });
    }

    if (viewTimestampsBtn) {
        viewTimestampsBtn.addEventListener('click', () => {
            currentViewMode = 'timestamps';
            viewTimestampsBtn.classList.add('active');
            if (viewParagraphsBtn) viewParagraphsBtn.classList.remove('active');
            if (viewEditBtn) viewEditBtn.classList.remove('active');
            renderTranscriptBody();
        });
    }

    // Re-run with Whisper Large-v3
    if (retranscribeBtn) {
        retranscribeBtn.addEventListener('click', () => {
            if (!currentVideoURL) return;
            if (transcriptModal) transcriptModal.classList.add('hidden');
            transcribeSingleVideo(currentVideoURL, true, currentResult?.video_title, null, currentResult?.video_desc || '');
        });
    }

    // Copy to clipboard (copies draft when in draft view, otherwise transcript)
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            if (!currentResult) return;
            let textToCopy = '';

            if (currentViewMode === 'draft' && currentDraft) {
                const articleText = (draftRaw && !draftRaw.classList.contains('hidden')) ? draftRaw.value : currentDraft;
                const summaryVal = summaryTextarea ? summaryTextarea.value.trim() : '';
                if (summaryVal && executiveSummaryCard && !executiveSummaryCard.classList.contains('hidden')) {
                    textToCopy = `## Executive Summary\n${summaryVal}\n\n---\n\n${articleText}`;
                } else {
                    textToCopy = articleText;
                }
            } else {
                textToCopy = currentResult.full_text || '';
            }

            if (!textToCopy) return;

            try {
                await navigator.clipboard.writeText(textToCopy);
                if (copyText) {
                    copyText.textContent = currentViewMode === 'draft' ? 'Draft Copied!' : 'Copied!';
                    setTimeout(() => { copyText.textContent = 'Copy'; }, 2000);
                }
            } catch (e) {
                alert('Failed to copy');
            }
        });
    }

    // Download TXT
    if (downloadTxtBtn) {
        downloadTxtBtn.addEventListener('click', () => {
            if (!currentResult || !currentResult.full_text) return;
            const blob = new Blob([currentResult.full_text], { type: 'text/plain;charset=utf-8' });
            const filename = sanitizeFilename((currentResult.video_title || 'transcript') + '.txt');
            downloadFile(blob, filename);
        });
    }

    // Download JSON
    if (downloadJsonBtn) {
        downloadJsonBtn.addEventListener('click', () => {
            if (!currentResult) return;
            const jsonStr = JSON.stringify(currentResult, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
            const filename = sanitizeFilename((currentResult.video_title || 'transcript') + '.json');
            downloadFile(blob, filename);
        });
    }

    // Download Markdown Draft
    if (downloadMdBtn) {
        downloadMdBtn.addEventListener('click', () => {
            const articleText = (draftRaw && !draftRaw.classList.contains('hidden')) ? draftRaw.value : currentDraft;
            const summaryVal = summaryTextarea ? summaryTextarea.value.trim() : '';
            if (!articleText && !summaryVal) {
                alert('Please generate the article draft first');
                return;
            }
            let fullDoc = articleText;
            if (summaryVal && executiveSummaryCard && !executiveSummaryCard.classList.contains('hidden')) {
                fullDoc = `## Executive Summary\n${summaryVal}\n\n---\n\n${articleText}`;
            }
            const blob = new Blob([fullDoc], { type: 'text/markdown;charset=utf-8' });
            const filename = sanitizeFilename((currentResult?.video_title || 'article') + '_draft.md');
            downloadFile(blob, filename);
        });
    }

    function downloadFile(blob, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    function sanitizeFilename(name) {
        return name.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'document';
    }

    if (closeTranscriptModal) {
        closeTranscriptModal.addEventListener('click', () => {
            if (transcriptModal) transcriptModal.classList.add('hidden');
        });
    }

    if (transcriptModal) {
        transcriptModal.addEventListener('click', (e) => {
            if (e.target === transcriptModal) {
                transcriptModal.classList.add('hidden');
            }
        });
    }

    if (keyModal) {
        keyModal.addEventListener('click', (e) => {
            if (e.target === keyModal) {
                keyModal.classList.add('hidden');
            }
        });
    }

    // Studio Library Event Handlers & Modal
    if (libraryBtn) {
        libraryBtn.addEventListener('click', () => {
            if (libraryModal) {
                libraryModal.classList.remove('hidden');
                loadLibraryDrafts();
            }
        });
    }

    if (closeLibraryModal) {
        closeLibraryModal.addEventListener('click', () => {
            if (libraryModal) libraryModal.classList.add('hidden');
        });
    }

    if (libraryModal) {
        libraryModal.addEventListener('click', (e) => {
            if (e.target === libraryModal) {
                libraryModal.classList.add('hidden');
            }
        });
    }

    if (libTabDrafts) {
        libTabDrafts.addEventListener('click', () => {
            switchLibTab('drafts');
            loadLibraryDrafts();
        });
    }

    if (libTabProfiles) {
        libTabProfiles.addEventListener('click', () => {
            switchLibTab('profiles');
            loadLibraryProfiles();
        });
    }

    function switchLibTab(tab) {
        if (!libTabDrafts || !libTabProfiles) return;
        if (tab === 'drafts') {
            libTabDrafts.classList.add('active');
            libTabProfiles.classList.remove('active');
            if (libDraftsPane) libDraftsPane.classList.remove('hidden');
            if (libProfilesPane) libProfilesPane.classList.add('hidden');
        } else {
            libTabProfiles.classList.add('active');
            libTabDrafts.classList.remove('active');
            if (libProfilesPane) libProfilesPane.classList.remove('hidden');
            if (libDraftsPane) libDraftsPane.classList.add('hidden');
        }
    }

    async function loadLibraryDrafts() {
        if (!libDraftsList) return;
        if (libDraftsLoading) libDraftsLoading.classList.remove('hidden');
        if (libDraftsEmpty) libDraftsEmpty.classList.add('hidden');
        libDraftsList.innerHTML = '';

        try {
            const resp = await fetch('/api/library/drafts');
            const data = await resp.json();
            if (!resp.ok || !data.success) {
                throw new Error(data.error || 'Failed to load drafts');
            }

            const drafts = data.drafts || [];
            if (drafts.length === 0) {
                if (libDraftsEmpty) libDraftsEmpty.classList.remove('hidden');
                return;
            }

            drafts.forEach(d => {
                const card = document.createElement('div');
                card.className = 'lib-item-card';

                const catBadge = d.category ? `<span class="lib-item-category">${escapeHTML(d.category)}</span>` : '';
                const promptPreview = d.research_prompt ? `<div class="lib-item-prompt">${escapeHTML(d.research_prompt)}</div>` : '';
                const dateStr = d.created_at ? new Date(d.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                const wordCountStr = `${d.word_count || 0} words`;

                card.innerHTML = `
                    <div class="lib-item-header">
                        <div class="lib-item-title-wrap">
                            ${catBadge}
                            <h4 class="lib-item-title">${escapeHTML(d.title || 'Untitled Draft')}</h4>
                        </div>
                    </div>
                    ${promptPreview}
                    <div class="lib-item-footer">
                        <div class="lib-item-meta">
                            <span>${escapeHTML(wordCountStr)}</span>
                            <span>&bull;</span>
                            <span>${escapeHTML(dateStr)}</span>
                        </div>
                        <div class="lib-item-actions">
                            <button class="lib-btn lib-open-draft-btn">Open in Studio</button>
                            <button class="lib-btn danger lib-delete-draft-btn">Delete</button>
                        </div>
                    </div>
                `;

                const openBtn = card.querySelector('.lib-open-draft-btn');
                if (openBtn) {
                    openBtn.onclick = () => openSavedDraftInStudio(d);
                }

                const delBtn = card.querySelector('.lib-delete-draft-btn');
                if (delBtn) {
                    delBtn.onclick = async () => {
                        if (!confirm(`Are you sure you want to delete "${d.title}"?`)) return;
                        delBtn.disabled = true;
                        delBtn.textContent = 'Deleting...';
                        try {
                            const delResp = await fetch(`/api/library/draft?id=${encodeURIComponent(d.id)}`, {
                                method: 'DELETE'
                            });
                            const delData = await delResp.json();
                            if (!delResp.ok || !delData.success) {
                                throw new Error(delData.error || 'Failed to delete draft');
                            }
                            loadLibraryDrafts();
                        } catch (err) {
                            alert('Error deleting draft: ' + err.message);
                            delBtn.disabled = false;
                            delBtn.textContent = 'Delete';
                        }
                    };
                }

                libDraftsList.appendChild(card);
            });
        } catch (err) {
            libDraftsList.innerHTML = `<p class="text-muted" style="text-align: center; padding: 1.5rem;">Error loading drafts: ${escapeHTML(err.message)}</p>`;
        } finally {
            if (libDraftsLoading) libDraftsLoading.classList.add('hidden');
        }
    }

    async function loadLibraryProfiles() {
        if (!libProfilesList) return;
        if (libProfilesLoading) libProfilesLoading.classList.remove('hidden');
        if (libProfilesEmpty) libProfilesEmpty.classList.add('hidden');
        libProfilesList.innerHTML = '';

        try {
            const resp = await fetch('/api/library/profiles');
            const data = await resp.json();
            if (!resp.ok || !data.success) {
                throw new Error(data.error || 'Failed to load profiles');
            }

            const profiles = data.profiles || [];
            if (profiles.length === 0) {
                if (libProfilesEmpty) libProfilesEmpty.classList.remove('hidden');
                return;
            }

            profiles.forEach(p => {
                const card = document.createElement('div');
                card.className = 'lib-profile-card';

                const uname = p.username || 'creator';
                const initial = uname.charAt(0).toUpperCase();
                const videoCountStr = `${p.video_count || 0} cached videos`;
                const topicCountStr = (p.topic_count && p.topic_count > 0) ? `${p.topic_count} analyzed topics` : '';
                const dateStr = p.last_scraped_at ? new Date(p.last_scraped_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

                card.innerHTML = `
                    <div class="lib-profile-info">
                        <div class="lib-profile-avatar">${escapeHTML(initial)}</div>
                        <div class="lib-profile-names">
                            <span class="lib-profile-handle">@${escapeHTML(uname)}</span>
                            <span class="lib-profile-stat">${escapeHTML(videoCountStr)}${topicCountStr ? ' &bull; ' + escapeHTML(topicCountStr) : ''} &bull; ${escapeHTML(dateStr)}</span>
                        </div>
                    </div>
                    <div class="lib-profile-actions">
                        <button class="lib-btn lib-load-profile-btn">Load Profile</button>
                    </div>
                `;

                const loadBtn = card.querySelector('.lib-load-profile-btn');
                if (loadBtn) {
                    loadBtn.onclick = () => loadCachedProfile(p);
                }

                libProfilesList.appendChild(card);
            });
        } catch (err) {
            libProfilesList.innerHTML = `<p class="text-muted" style="text-align: center; padding: 1.5rem;">Error loading profiles: ${escapeHTML(err.message)}</p>`;
        } finally {
            if (libProfilesLoading) libProfilesLoading.classList.add('hidden');
        }
    }

    function extractDraftSectionsClient(raw) {
        if (!raw) return { summary: '', article: '' };
        const trimmed = raw.trim();
        if (trimmed.includes('<<<EXECUTIVE_SUMMARY>>>')) {
            const m = trimmed.match(/<<<EXECUTIVE_SUMMARY>>>\s*([\s\S]*?)\s*<<<END_EXECUTIVE_SUMMARY>>>/);
            const sum = m ? m[1].trim() : '';
            let art = trimmed;
            const artM = trimmed.match(/<<<ARTICLE_BODY>>>\s*([\s\S]*?)(?:<<<END_ARTICLE_BODY>>>|$)/);
            if (artM) {
                art = artM[1].trim();
            } else if (m) {
                const endPos = trimmed.indexOf('<<<END_EXECUTIVE_SUMMARY>>>');
                art = trimmed.slice(endPos + '<<<END_EXECUTIVE_SUMMARY>>>'.length).trim();
            }
            return { summary: sum, article: art };
        }
        if (trimmed.includes('**Core Premise:**')) {
            let startIdx = trimmed.indexOf('## Executive Summary');
            if (startIdx === -1) startIdx = trimmed.indexOf('> **Core Premise:**');
            if (startIdx !== -1) {
                const post = trimmed.slice(startIdx);
                const match = post.search(/\n\s*#[^#]|\n\s*##\s/);
                if (match > 20) {
                    const splitIdx = startIdx + match;
                    let sum = trimmed.slice(startIdx, splitIdx).replace(/##\s*Executive\s*Summary/g, '').replace(/^>\s?/gm, '').trim();
                    let art = (trimmed.slice(0, startIdx) + '\n\n' + trimmed.slice(splitIdx)).trim();
                    return { summary: sum, article: art };
                }
            }
        }
        return { summary: '', article: trimmed };
    }

    function openSavedDraftInStudio(draft) {
        if (!draft) return;
        let sourceVideos = [];
        if (draft.source_json) {
            try {
                sourceVideos = typeof draft.source_json === 'string' ? JSON.parse(draft.source_json) : draft.source_json;
                if (!Array.isArray(sourceVideos)) sourceVideos = [];
            } catch (e) {
                sourceVideos = [];
            }
        }

        let summaryText = (draft.executive_summary || '').trim();
        let articleText = (draft.markdown_content || '').trim();

        if (!summaryText && articleText) {
            const clientSplit = extractDraftSectionsClient(articleText);
            if (clientSplit.summary) {
                summaryText = clientSplit.summary;
                articleText = clientSplit.article;
            }
        }

        if (summaryText && executiveSummaryCard && summaryTextarea) {
            summaryTextarea.value = summaryText;
            if (summaryMetaCount) summaryMetaCount.textContent = `${countWords(summaryText)} words`;
            executiveSummaryCard.classList.remove('hidden');
        } else if (executiveSummaryCard) {
            executiveSummaryCard.classList.add('hidden');
            if (summaryTextarea) summaryTextarea.value = '';
        }

        const matchedDiscoveredTopic = discoveredTopics.find(t => t.id === draft.topic_id);
        const isPub = matchedDiscoveredTopic ? !!matchedDiscoveredTopic.is_published : false;

        currentTopicContext = {
            topic: {
                id: draft.topic_id || '',
                title: draft.title || 'Saved Draft',
                description: draft.research_prompt || '',
                category: draft.category || '',
                is_published: isPub
            },
            matchedVideos: sourceVideos,
            topicVideoTranscripts: sourceVideos,
            customCombinedTranscript: sourceVideos.length > 0 ? '' : (articleText || '')
        };
        updateStudioPublishButton(isPub);
        currentVideoURL = '';
        savedTikTokResult = null;
        savedWhisperResult = null;
        activeTranscriptSource = 'topic';
        currentDraft = articleText;
        rawMdVisible = false;

        currentResult = {
            video_title: draft.title || 'Saved Draft',
            video_desc: draft.research_prompt || '',
            full_text: articleText || '',
            word_count: draft.word_count || countWords(currentDraft),
            source: 'sqlite_library',
            language: 'Article Draft',
            duration: 0
        };

        if (headerVideoTitle) headerVideoTitle.textContent = draft.title || 'Saved Draft';
        if (transcriptVideoTitle) transcriptVideoTitle.textContent = draft.title || 'Saved Draft';
        if (modalVideoLink) modalVideoLink.style.display = 'none';
        if (transcriptVideoCaption) transcriptVideoCaption.textContent = draft.research_prompt ? `Research Angle: ${draft.research_prompt}` : '';
        if (activeSourceChip) activeSourceChip.textContent = draft.category ? `${draft.category} &bull; Saved Draft` : 'Library Draft';
        if (sourceBadge) sourceBadge.textContent = draft.category || 'Library Draft';
        if (langBadge) langBadge.textContent = 'Markdown';
        if (wordsBadge) wordsBadge.textContent = `${draft.word_count || countWords(currentDraft)} words`;
        if (durationBadge) durationBadge.classList.add('hidden');
        if (aiTitleCard) aiTitleCard.classList.add('hidden');
        if (sourceComparisonBar) sourceComparisonBar.classList.add('hidden');
        if (retranscribeBanner) retranscribeBanner.classList.add('hidden');

        if (draftResearchInput) draftResearchInput.value = draft.research_prompt || '';
        if (draftInlineResearchInput) draftInlineResearchInput.value = draft.research_prompt || '';

        currentViewMode = 'draft';
        if (stepTranscriptBtn) stepTranscriptBtn.classList.remove('active');
        if (viewDraftBtn) viewDraftBtn.classList.add('active');
        if (step1ViewToggles) step1ViewToggles.classList.add('hidden');
        if (transcriptContent) transcriptContent.classList.add('hidden');
        if (draftContainer) draftContainer.classList.remove('hidden');
        if (draftEmptyState) draftEmptyState.classList.add('hidden');
        if (draftLoadingState) draftLoadingState.classList.add('hidden');
        if (draftPreviewWrap) draftPreviewWrap.classList.remove('hidden');
        if (draftRendered) draftRendered.innerHTML = renderMarkdown(currentDraft);
        if (draftRaw) {
            draftRaw.value = currentDraft;
            draftRaw.classList.add('hidden');
        }
        if (toggleRawMdBtn) toggleRawMdBtn.textContent = 'Edit Markdown';
        if (downloadMdBtn) downloadMdBtn.classList.remove('hidden');
        if (downloadTxtBtn) downloadTxtBtn.classList.add('hidden');
        if (downloadJsonBtn) downloadJsonBtn.classList.add('hidden');
        if (copyText) copyText.textContent = 'Copy Draft';

        if (libraryModal) libraryModal.classList.add('hidden');
        if (transcriptModal) transcriptModal.classList.remove('hidden');
    }

    function loadCachedProfile(profileRecord) {
        if (!profileRecord || !profileRecord.username) return;
        if (libraryModal) libraryModal.classList.add('hidden');
        if (urlInput) {
            urlInput.value = `https://www.tiktok.com/@${profileRecord.username}`;
            if (clearInput) clearInput.classList.remove('hidden');
        }
        fetchProfile(profileRecord.username);
    }

    // Client-side Markdown to HTML renderer for preview
    function renderMarkdown(md) {
        if (!md) return '';
        const lines = md.split('\n');
        const html = [];
        let inList = false;
        let listType = ''; // 'ul' or 'ol'
        let inTable = false;
        let inBlockquote = false;
        let blockquoteLines = [];

        function closeBlockquote() {
            if (inBlockquote) {
                const innerHtml = blockquoteLines.map(l => {
                    const trimmed = l.trim();
                    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                        return `<li class="bq-li">${formatInline(trimmed.slice(2))}</li>`;
                    }
                    if (trimmed === '') return '';
                    return `<p>${formatInline(trimmed)}</p>`;
                }).join('');
                html.push(`<blockquote>${innerHtml}</blockquote>`);
                inBlockquote = false;
                blockquoteLines = [];
            }
        }
        function closeList() {
            if (inList) {
                html.push(listType === 'ul' ? '</ul>' : '</ol>');
                inList = false;
                listType = '';
            }
        }
        function closeTable() {
            if (inTable) {
                html.push('</tbody></table>');
                inTable = false;
            }
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (!line) {
                closeBlockquote();
                closeList();
                closeTable();
                continue;
            }

            // Blockquote
            if (line.startsWith('>')) {
                closeList();
                closeTable();
                inBlockquote = true;
                const stripped = line.replace(/^>\s?/, '');
                blockquoteLines.push(stripped);
                continue;
            } else {
                closeBlockquote();
            }

            // Headers
            if (line.startsWith('# ')) {
                closeList(); closeTable();
                html.push(`<h1>${formatInline(line.slice(2))}</h1>`);
                continue;
            }
            if (line.startsWith('## ')) {
                closeList(); closeTable();
                html.push(`<h2>${formatInline(line.slice(3))}</h2>`);
                continue;
            }
            if (line.startsWith('### ')) {
                closeList(); closeTable();
                html.push(`<h3>${formatInline(line.slice(4))}</h3>`);
                continue;
            }

            // Horizontal Rule
            if (line === '---' || line === '***') {
                closeList(); closeTable();
                html.push('<hr>');
                continue;
            }

            // Table
            if (line.startsWith('|') && line.endsWith('|')) {
                closeList();
                const cols = line.split('|').slice(1, -1).map(c => c.trim());
                if (cols.every(c => /^[-:]+$/.test(c))) {
                    // Separator line
                    continue;
                }
                if (!inTable) {
                    inTable = true;
                    html.push('<table><thead><tr>');
                    cols.forEach(c => html.push(`<th>${formatInline(c)}</th>`));
                    html.push('</tr></thead><tbody>');
                } else {
                    html.push('<tr>');
                    cols.forEach(c => html.push(`<td>${formatInline(c)}</td>`));
                    html.push('</tr>');
                }
                continue;
            } else {
                closeTable();
            }

            // Unordered List
            if (line.startsWith('* ') || line.startsWith('- ')) {
                closeTable();
                if (!inList || listType !== 'ul') {
                    closeList();
                    inList = true;
                    listType = 'ul';
                    html.push('<ul>');
                }
                html.push(`<li>${formatInline(line.slice(2))}</li>`);
                continue;
            }

            // Ordered List
            const numMatch = line.match(/^(\d+)\.\s+(.*)/);
            if (numMatch) {
                closeTable();
                if (!inList || listType !== 'ol') {
                    closeList();
                    inList = true;
                    listType = 'ol';
                    html.push('<ol>');
                }
                html.push(`<li>${formatInline(numMatch[2])}</li>`);
                continue;
            }

            // Regular Paragraph
            closeList(); closeTable();
            html.push(`<p>${formatInline(line)}</p>`);
        }

        closeBlockquote();
        closeList();
        closeTable();
        return html.join('');
    }

    function formatInline(str) {
        let escaped = escapeHTML(str);
        // Links: [Text](url) -> <a href="url" target="_blank" rel="noopener noreferrer" class="draft-link">Text</a>
        escaped = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="draft-link">$1</a>');
        // Bold
        escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italics: *text* or _text_
        escaped = escaped.replace(/(^|[^\*])\*([^\*\n]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');
        // Inline code
        escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
        return escaped;
    }

    function setLoading(isLoading, title = '', subtitle = '') {
        if (isLoading) {
            loadingBanner.classList.remove('hidden');
            loadingTitle.textContent = title;
            loadingSubtitle.textContent = subtitle;
            submitBtn.disabled = true;
            btnText.textContent = 'Processing...';
            mainSpinner.classList.remove('hidden');
        } else {
            loadingBanner.classList.add('hidden');
            submitBtn.disabled = false;
            btnText.textContent = 'Fetch & Transcribe';
            mainSpinner.classList.add('hidden');
        }
    }

    function formatTime(seconds) {
        if (seconds === undefined || seconds === null) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${String(secs).padStart(2, '0')}`;
    }

    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
});
