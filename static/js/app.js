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
    const viewParagraphsBtn = document.getElementById('viewParagraphsBtn');
    const viewTimestampsBtn = document.getElementById('viewTimestampsBtn');
    const copyBtn = document.getElementById('copyBtn');
    const copyText = document.getElementById('copyText');
    const downloadTxtBtn = document.getElementById('downloadTxtBtn');
    const downloadJsonBtn = document.getElementById('downloadJsonBtn');
    const retranscribeBanner = document.getElementById('retranscribeBanner');
    const retranscribeBtn = document.getElementById('retranscribeBtn');

    // State
    let currentResult = null;
    let currentVideoURL = '';
    let currentViewMode = 'paragraphs'; // 'paragraphs' | 'timestamps'
    let allProfileVideos = [];
    let searchScope = 'all'; // 'all' | 'titles'

    // Load saved API key from localStorage
    const savedKey = localStorage.getItem('groq_api_key');
    if (savedKey) {
        groqKeyInput.value = savedKey;
        keyIndicator.classList.add('active');
        keyLabel.textContent = 'Groq Key Active';
    }

    // Modal controls for API Key
    apiKeyBtn.addEventListener('click', () => {
        keyModal.classList.remove('hidden');
    });

    closeKeyModal.addEventListener('click', () => {
        keyModal.classList.add('hidden');
    });

    groqKeyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveKeyBtn.click();
    });

    saveKeyBtn.addEventListener('click', () => {
        const val = groqKeyInput.value.trim();
        if (val) {
            localStorage.setItem('groq_api_key', val);
            keyIndicator.classList.add('active');
            keyLabel.textContent = 'Groq Key Active';
            keyModal.classList.add('hidden');
            // If transcript modal is open, auto-generate AI title immediately
            if (currentResult && currentResult.full_text) {
                fetchAITitle();
            }
        } else {
            localStorage.removeItem('groq_api_key');
            keyIndicator.classList.remove('active');
            keyLabel.textContent = 'Set Groq Key';
            keyModal.classList.add('hidden');
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

    function getApiKey() {
        return localStorage.getItem('groq_api_key') || '';
    }

    function isVideoURL(str) {
        return str.includes('/video/') || str.includes('vm.tiktok.com') || str.includes('vt.tiktok.com');
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
                transcribeSingleVideo(postedVideoURL, forceWhisperToggle.checked, featured.title, featuredTranscribeBtn);
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
                transcribeSingleVideo(targetUrl, forceWhisperToggle.checked, title, e.currentTarget);
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

    async function transcribeSingleVideo(videoURL, forceWhisper, fallbackTitle = '', triggerBtn = null) {
        currentVideoURL = videoURL;
        
        // Immediate visual feedback on clicked button
        let origBtnText = '';
        if (triggerBtn) {
            origBtnText = triggerBtn.innerHTML;
            triggerBtn.innerHTML = 'Transcribing...';
            triggerBtn.classList.add('loading');
            triggerBtn.disabled = true;
        }

        // Open modal immediately in live loading state
        transcriptVideoTitle.textContent = fallbackTitle || 'Transcribing Video...';
        sourceBadge.textContent = forceWhisper ? 'Whisper Large-v3' : 'Analyzing Video';
        sourceBadge.className = 'source-badge whisper';
        langBadge.textContent = 'Speech AI';
        wordsBadge.textContent = '...';
        durationBadge.classList.add('hidden');
        aiTitleCard.classList.add('hidden');
        transcriptToolbar.classList.add('hidden');
        transcriptContent.classList.add('hidden');
        retranscribeBanner.classList.add('hidden');

        modalLoadingTitle.textContent = 'Transcribing Video...';
        modalLoadingSub.textContent = 'Extracting speech and generating transcript with Whisper Large-v3 AI...';
        modalLoadingBox.classList.remove('hidden');
        modalLoadingBox.style.display = 'block';
        transcriptToolbar.style.display = 'none';
        transcriptContent.style.display = 'none';
        transcriptModal.classList.remove('hidden');

        setLoading(true, 'Processing Video Transcript...', 'Extracting speech with Whisper Large-v3 AI...');

        try {
            const resp = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: videoURL,
                    force_whisper: forceWhisper,
                    groq_key: getApiKey(),
                })
            });

            const data = await resp.json();
            if (!resp.ok || !data.success) {
                throw new Error(data.error || 'Transcription failed');
            }

            const raw = data.data;
            currentResult = {
                source: raw.source || raw.Source || '',
                video_title: raw.video_title || raw.VideoTitle || fallbackTitle || 'TikTok Video Transcript',
                ai_title: raw.ai_title || raw.AITitle || '',
                language: raw.language || raw.Language || '',
                full_text: raw.full_text || raw.FullText || '',
                word_count: raw.word_count || raw.WordCount || 0,
                duration: raw.duration || raw.Duration || 0,
                segments: raw.segments || raw.Segments || []
            };
            openTranscriptModal(currentResult);
        } catch (err) {
            transcriptModal.classList.add('hidden');
            alert('Transcription Error: ' + err.message);
        } finally {
            setLoading(false);
            if (triggerBtn) {
                triggerBtn.innerHTML = origBtnText;
                triggerBtn.classList.remove('loading');
                triggerBtn.disabled = false;
            }
        }
    }

    function openTranscriptModal(result) {
        modalLoadingBox.classList.add('hidden');
        modalLoadingBox.style.display = 'none';
        transcriptToolbar.classList.remove('hidden');
        transcriptToolbar.style.display = 'flex';
        transcriptContent.classList.remove('hidden');
        transcriptContent.style.display = 'block';

        transcriptVideoTitle.textContent = result.video_title || 'TikTok Video Transcript';
        
        // AI Title Display
        // AI Title Display
        aiTitleCard.classList.remove('hidden');
        aiTitleCard.style.display = 'block';
        if (result.ai_title) {
            aiTitleText.textContent = result.ai_title;
        } else {
            fetchAITitle();
        }

        if (result.source === 'groq_whisper') {
            sourceBadge.textContent = 'Groq Whisper Large-v3';
            sourceBadge.className = 'source-badge whisper';
            retranscribeBanner.classList.add('hidden');
        } else {
            sourceBadge.textContent = 'TikTok Captions';
            sourceBadge.className = 'source-badge';
            retranscribeBanner.classList.remove('hidden');
        }

        langBadge.textContent = result.language ? `Lang: ${result.language}` : 'Detected';
        wordsBadge.textContent = `${result.word_count || 0} words`;
        durationBadge.textContent = result.duration ? `${result.duration.toFixed(1)}s` : '';
        durationBadge.classList.toggle('hidden', !result.duration);

        renderTranscriptBody();
        transcriptModal.classList.remove('hidden');
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

    // AI Title Regenerate button handler
    regenerateTitleBtn.addEventListener('click', () => {
        fetchAITitle();
    });

    function renderTranscriptBody() {
        if (!currentResult) return;

        if (currentViewMode === 'paragraphs') {
            const txt = currentResult.full_text || 'No speech detected in this audio.';
            transcriptContent.innerHTML = `<div class="transcript-paragraph">${escapeHTML(txt)}</div>`;
        } else {
            // Timestamps view
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

    // View toggles
    viewParagraphsBtn.addEventListener('click', () => {
        currentViewMode = 'paragraphs';
        viewParagraphsBtn.classList.add('active');
        viewTimestampsBtn.classList.remove('active');
        renderTranscriptBody();
    });

    viewTimestampsBtn.addEventListener('click', () => {
        currentViewMode = 'timestamps';
        viewTimestampsBtn.classList.add('active');
        viewParagraphsBtn.classList.remove('active');
        renderTranscriptBody();
    });

    // Re-run with Whisper Large-v3
    retranscribeBtn.addEventListener('click', () => {
        if (!currentVideoURL) return;
        transcriptModal.classList.add('hidden');
        transcribeSingleVideo(currentVideoURL, true, currentResult?.video_title);
    });

    // Copy to clipboard
    copyBtn.addEventListener('click', async () => {
        if (!currentResult || !currentResult.full_text) return;
        try {
            await navigator.clipboard.writeText(currentResult.full_text);
            copyText.textContent = 'Copied!';
            setTimeout(() => { copyText.textContent = 'Copy'; }, 2000);
        } catch (e) {
            alert('Failed to copy');
        }
    });

    // Download TXT
    downloadTxtBtn.addEventListener('click', () => {
        if (!currentResult || !currentResult.full_text) return;
        const blob = new Blob([currentResult.full_text], { type: 'text/plain;charset=utf-8' });
        downloadFile(blob, 'transcript.txt');
    });

    // Download JSON
    downloadJsonBtn.addEventListener('click', () => {
        if (!currentResult) return;
        const jsonStr = JSON.stringify(currentResult, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        downloadFile(blob, 'transcript.json');
    });

    function downloadFile(blob, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    closeTranscriptModal.addEventListener('click', () => {
        transcriptModal.classList.add('hidden');
    });

    function setLoading(isLoading, title = '', subtitle = '') {
        if (isLoading) {
            submitBtn.disabled = true;
            mainSpinner.classList.remove('hidden');
            btnText.textContent = 'Processing...';
            loadingTitle.textContent = title;
            loadingSubtitle.textContent = subtitle;
            loadingBanner.classList.remove('hidden');
        } else {
            submitBtn.disabled = false;
            mainSpinner.classList.add('hidden');
            btnText.textContent = 'Fetch & Transcribe';
            loadingBanner.classList.add('hidden');
        }
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
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

    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
