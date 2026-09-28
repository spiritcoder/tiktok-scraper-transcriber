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

    // Load saved API keys from localStorage
    const savedGroqKey = localStorage.getItem('groq_api_key');
    if (savedGroqKey) {
        groqKeyInput.value = savedGroqKey;
    }
    const savedDeepSeekKey = localStorage.getItem('deepseek_api_key');
    if (savedDeepSeekKey) {
        deepseekKeyInput.value = savedDeepSeekKey;
    }
    updateKeyIndicator();

    function updateKeyIndicator() {
        const hasGroq = !!(groqKeyInput.value.trim() || localStorage.getItem('groq_api_key'));
        const hasDeepSeek = !!(deepseekKeyInput.value.trim() || localStorage.getItem('deepseek_api_key'));

        if (hasGroq || hasDeepSeek) {
            keyIndicator.classList.add('active');
            let labels = [];
            if (hasGroq) labels.push('Groq');
            if (hasDeepSeek) labels.push('DeepSeek');
            keyLabel.textContent = labels.join(' + ') + ' Active';
        } else {
            keyIndicator.classList.remove('active');
            keyLabel.textContent = 'API & Whisper Settings';
        }
    }

    function getApiKey() {
        return groqKeyInput.value.trim() || localStorage.getItem('groq_api_key') || '';
    }

    function getDeepSeekKey() {
        return deepseekKeyInput.value.trim() || localStorage.getItem('deepseek_api_key') || '';
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
    apiKeyBtn.addEventListener('click', () => {
        keyModal.classList.remove('hidden');
    });

    closeKeyModal.addEventListener('click', () => {
        keyModal.classList.add('hidden');
    });

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

    // Clear input
    urlInput.addEventListener('input', () => {
        clearInput.classList.toggle('hidden', !urlInput.value);
    });

    clearInput.addEventListener('click', () => {
        urlInput.value = '';
        clearInput.classList.add('hidden');
        urlInput.focus();
    });

    // Example Chips
    document.querySelectorAll('.example-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            urlInput.value = chip.dataset.url;
            clearInput.classList.remove('hidden');
            handleSearch();
        });
    });

    // Submit handler
    submitBtn.addEventListener('click', handleSearch);
    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

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

            renderProfile(data.data, postedVideoURL);
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

    function renderProfile(profile, postedVideoURL = null) {
        if (!profile) return;
        const uname = profile.username || profile.Username || 'creator';
        profileUsername.textContent = '@' + uname;
        profileInitial.textContent = uname ? uname.charAt(0).toUpperCase() : '@';

        const vids = profile.videos || profile.Videos || [];
        allProfileVideos = vids;
        profileMeta.textContent = `Found ${vids.length} videos from this creator`;
        
        // Reset and init search input
        videoSearchInput.value = '';
        clearVideoSearch.classList.add('hidden');
        filteredVideoCount.textContent = `(${vids.length} videos)`;

        // Handle featured card if a video link was pasted
        if (postedVideoURL && vids.length > 0) {
            const featured = vids[0];
            featuredTitle.textContent = featured.title || featured.description || 'Selected Video';
            featuredDesc.textContent = featured.description || '';
            const mins = Math.floor((featured.duration || 0) / 60);
            const secs = String((featured.duration || 0) % 60).padStart(2, '0');
            featuredDuration.textContent = `${mins}:${secs}`;
            featuredViews.textContent = featured.view_count ? `${Number(featured.view_count).toLocaleString()} views` : '';
            featuredTranscribeBtn.onclick = (e) => {
                transcribeSingleVideo(postedVideoURL, forceWhisperToggle.checked, featured.title, featuredTranscribeBtn, featured.description);
            };
            featuredVideoBox.classList.remove('hidden');
        } else {
            featuredVideoBox.classList.add('hidden');
        }

        renderVideoCards(allProfileVideos);
        profileSection.classList.remove('hidden');
        profileSection.scrollIntoView({ behavior: 'smooth' });
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
            btn.addEventListener('click', (e) => {
                const targetUrl = e.currentTarget.dataset.url;
                transcribeSingleVideo(targetUrl, forceWhisperToggle.checked, cleanTitle || title, e.currentTarget, cleanDesc || desc);
            });

            videoGrid.appendChild(card);
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

    regenerateTitleBtn.addEventListener('click', () => {
        fetchAITitle();
    });

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

    // Article Draft Generation with DeepSeek
    async function fetchArticleDraft() {
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

        draftEmptyState.classList.add('hidden');
        draftPreviewWrap.classList.add('hidden');
        draftLoadingState.classList.remove('hidden');

        try {
            const resp = await fetch('/api/generate-draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript: currentResult.full_text,
                    video_title: currentResult.video_title || '',
                    video_description: currentResult.video_desc || '',
                    research_prompt: researchVal,
                    deepseek_key: deepseekKey,
                })
            });

            const data = await resp.json();
            if (data.success && data.draft) {
                currentDraft = data.draft;
                draftRendered.innerHTML = renderMarkdown(currentDraft);
                draftRaw.value = currentDraft;
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

    generateDraftBtn.addEventListener('click', fetchArticleDraft);
    regenerateDraftBtn.addEventListener('click', fetchArticleDraft);

    // Live Edit Markdown Draft
    if (draftRaw) {
        draftRaw.addEventListener('input', () => {
            currentDraft = draftRaw.value;
            draftRendered.innerHTML = renderMarkdown(currentDraft);
        });
    }

    // Toggle Raw Markdown vs Rendered Preview
    toggleRawMdBtn.addEventListener('click', () => {
        rawMdVisible = !rawMdVisible;
        if (rawMdVisible) {
            draftRendered.classList.add('hidden');
            draftRaw.classList.remove('hidden');
            toggleRawMdBtn.textContent = 'View Preview';
        } else {
            draftRaw.classList.add('hidden');
            draftRendered.classList.remove('hidden');
            toggleRawMdBtn.textContent = 'Edit Markdown';
        }
    });

    // Render Transcript Body (Paragraphs, In-place Editor, or Timestamps)
    function renderTranscriptBody() {
        if (!currentResult) return;

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
            if (savedWhisperResult && savedTikTokResult && sourceComparisonBar) {
                sourceComparisonBar.classList.remove('hidden');
            }
            if (viewParagraphsBtn) viewParagraphsBtn.classList.add('active');
            if (viewEditBtn) viewEditBtn.classList.remove('active');
            if (viewTimestampsBtn) viewTimestampsBtn.classList.remove('active');
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
            draftEmptyState.classList.add('hidden');
            draftLoadingState.classList.add('hidden');
            draftPreviewWrap.classList.remove('hidden');
        } else {
            draftEmptyState.classList.remove('hidden');
            draftLoadingState.classList.add('hidden');
            draftPreviewWrap.classList.add('hidden');
        }
    });

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
    retranscribeBtn.addEventListener('click', () => {
        if (!currentVideoURL) return;
        transcriptModal.classList.add('hidden');
        transcribeSingleVideo(currentVideoURL, true, currentResult?.video_title, null, currentResult?.video_desc || '');
    });

    // Copy to clipboard (copies draft when in draft view, otherwise transcript)
    copyBtn.addEventListener('click', async () => {
        if (!currentResult) return;
        let textToCopy = '';

        if (currentViewMode === 'draft' && currentDraft) {
            textToCopy = currentDraft;
        } else {
            textToCopy = currentResult.full_text || '';
        }

        if (!textToCopy) return;

        try {
            await navigator.clipboard.writeText(textToCopy);
            copyText.textContent = currentViewMode === 'draft' ? 'Draft Copied!' : 'Copied!';
            setTimeout(() => { copyText.textContent = 'Copy'; }, 2000);
        } catch (e) {
            alert('Failed to copy');
        }
    });

    // Download TXT
    downloadTxtBtn.addEventListener('click', () => {
        if (!currentResult || !currentResult.full_text) return;
        const blob = new Blob([currentResult.full_text], { type: 'text/plain;charset=utf-8' });
        const filename = sanitizeFilename((currentResult.video_title || 'transcript') + '.txt');
        downloadFile(blob, filename);
    });

    // Download JSON
    downloadJsonBtn.addEventListener('click', () => {
        if (!currentResult) return;
        const jsonStr = JSON.stringify(currentResult, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        const filename = sanitizeFilename((currentResult.video_title || 'transcript') + '.json');
        downloadFile(blob, filename);
    });

    // Download Markdown Draft
    downloadMdBtn.addEventListener('click', () => {
        if (!currentDraft) {
            alert('Please generate the article draft first');
            return;
        }
        const blob = new Blob([currentDraft], { type: 'text/markdown;charset=utf-8' });
        const filename = sanitizeFilename((currentResult?.video_title || 'article') + '_draft.md');
        downloadFile(blob, filename);
    });

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

    closeTranscriptModal.addEventListener('click', () => {
        transcriptModal.classList.add('hidden');
    });

    transcriptModal.addEventListener('click', (e) => {
        if (e.target === transcriptModal) {
            transcriptModal.classList.add('hidden');
        }
    });

    keyModal.addEventListener('click', (e) => {
        if (e.target === keyModal) {
            keyModal.classList.add('hidden');
        }
    });

    // Client-side Markdown to HTML renderer for preview
    function renderMarkdown(md) {
        if (!md) return '';
        const lines = md.split('\n');
        const html = [];
        let inList = false;
        let listType = ''; // 'ul' or 'ol'
        let inTable = false;

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
                closeList();
                closeTable();
                continue;
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

            // Blockquote
            if (line.startsWith('> ')) {
                closeList(); closeTable();
                html.push(`<blockquote>${formatInline(line.slice(2))}</blockquote>`);
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

        closeList();
        closeTable();
        return html.join('');
    }

    function formatInline(str) {
        let escaped = escapeHTML(str);
        // Bold
        escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
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
