/**
 * chat.js — Main Chatbot Controller (Tamil Vedic & KP Astrology)
 * Features:
 *  - Conversational intake: Name -> DOB -> TOB -> POB (with search & auto-complete)
 *  - Calculates full chart (Lagna, Rasi, Nakshatra, Dasha-Bhukti, Doshas)
 *  - Tamil Voice Input (Web Speech API ta-IN, continuous mode) with 5-second silence countdown
 *  - 3-Panel synchronization: Left Data Input, Center AI Chatbot, Right Jadhagam Kattam
 *  - Prominent Tamil Astrology display: லக்னம், ராசி, நட்சத்திரம், நடப்பு தசை-புக்தி
 *  - Traditional South Indian 4x4 Rasi Kattam with Lagna & Grahas
 *  - AI interpretation through secure PHP proxy (api/gemini.php)
 *  - Slot booking & payment integration
 */

'use strict';

(function() {
  const STATES = Object.freeze({
    GREETING:   'GREETING',
    GET_NAME:   'GET_NAME',
    GET_DOB:    'GET_DOB',
    GET_TOB:    'GET_TOB',
    GET_POB:    'GET_POB',
    COMPUTING:  'COMPUTING',
    SHOW_CHART: 'SHOW_CHART',
    FOLLOWUP:   'FOLLOWUP',
    AI_ANSWER:  'AI_ANSWER',
  });

  const userData = {
    name:      '',
    dob:       '',   // DD/MM/YYYY
    tob:       '',   // HH:MM (24h)
    pob:       '',   // City name
    lat:       13.0827,
    lon:       80.2707,
    tz:        5.5,
    chartData: null,
  };

  /* ---------------- Tamil Astrological Dictionaries ---------------- */
  const TAMIL_SIGNS = [
    'மேஷம்', 'ரிஷபம்', 'மிதுனம்', 'கடகம்',
    'சிம்மம்', 'கன்னி', 'துலாம்', 'விருச்சிகம்',
    'தனுசு', 'மகரம்', 'கும்பம்', 'மீனம்'
  ];

  const TAMIL_NAKS = [
    'அஸ்வினி', 'பரணி', 'கிருத்திகை', 'ரோகிணி', 'மிருகசீரிஷம்',
    'திருவாதிரை', 'புனர்பூசம்', 'பூசம்', 'ஆயில்யம்', 'மகம்',
    'பூரம்', 'உத்திரம்', 'ஹஸ்தம்', 'சித்திரை', 'சுவாதி',
    'விசாகம்', 'அனுஷம்', 'கேட்டை', 'மூலம்', 'பூராடம்',
    'உத்திராடம்', 'திருவோணம்', 'அவிட்டம்', 'சதயம்',
    'பூரட்டாதி', 'உத்திரட்டாதி', 'ரேவதி'
  ];

  const TAMIL_PLANETS = {
    Su: { name: 'சூரியன்', short: 'சூரி' },
    Mo: { name: 'சந்திரன்', short: 'சந்' },
    Ma: { name: 'செவ்வாய்', short: 'செவ்' },
    Me: { name: 'புதன்', short: 'புத' },
    Ju: { name: 'குரு', short: 'குரு' },
    Ve: { name: 'சுக்கிரன்', short: 'சுக்' },
    Sa: { name: 'சனி', short: 'சனி' },
    Ra: { name: 'ராகு', short: 'ராகு' },
    Ke: { name: 'கேது', short: 'கேது' }
  };

  function getTamilLordName(code) {
    if (!code) return '-';
    const c = code.substring(0, 2);
    return TAMIL_PLANETS[c] ? TAMIL_PLANETS[c].name : code;
  }

  function getTamilShortPlanet(code) {
    if (!code) return '';
    const c = code.substring(0, 2);
    return TAMIL_PLANETS[c] ? TAMIL_PLANETS[c].short : code;
  }

  let currentState = STATES.GREETING;
  let recognition = null;
  let isListening = false;
  let silenceTimer = null;
  let countdownInterval = null;
  let remainingSilence = 5;
  let accumulatedTranscript = '';
  let cityDebounceTimer = null;
  let leftCityDebounceTimer = null;
  let selectedCity = null;

  document.addEventListener('DOMContentLoaded', () => {
    // Chat Panel Elements
    const chatMessages       = document.getElementById('chatMessages');
    const userInput          = document.getElementById('userInput');
    const sendBtn            = document.getElementById('sendBtn');
    const micBtn             = document.getElementById('micBtn');
    const typingDots         = document.getElementById('typingDots');
    const cityDropdown       = document.getElementById('cityDropdown');
    const countdownBanner    = document.getElementById('voiceCountdownBanner');
    const countdownText      = document.getElementById('voiceCountdownText');
    const voiceSendNowBtn    = document.getElementById('voiceSendNowBtn');

    // Left Panel Elements
    const lpName             = document.getElementById('lpName');
    const lpDob              = document.getElementById('lpDob');
    const lpTob              = document.getElementById('lpTob');
    const lpPob              = document.getElementById('lpPob');
    const lpLat              = document.getElementById('lpLat');
    const lpLon              = document.getElementById('lpLon');
    const lpAyan             = document.getElementById('lpAyan');
    const leftCalcBtn        = document.getElementById('leftCalcBtn');
    const leftResetBtn       = document.getElementById('leftResetBtn');
    const leftCityDropdown   = document.getElementById('leftCityDropdown');

    // Right Panel Elements
    const metaLaknam         = document.getElementById('metaLaknam');
    const metaLaknamSub      = document.getElementById('metaLaknamSub');
    const metaRaasi          = document.getElementById('metaRaasi');
    const metaRaasiLord      = document.getElementById('metaRaasiLord');
    const metaNatchatram     = document.getElementById('metaNatchatram');
    const metaNatchatramPada = document.getElementById('metaNatchatramPada');
    const metaDasha          = document.getElementById('metaDasha');
    const metaDashaEnd       = document.getElementById('metaDashaEnd');
    const centerNativeName   = document.getElementById('centerNativeName');
    const doshaBadges        = document.getElementById('doshaBadges');
    const grahaDegreesTable  = document.getElementById('grahaDegreesTable');
    const parigaramContainer = document.getElementById('parigaramContainer');

    // 27 Nakshatra Parigaram Data Loader
    let parigaramList = [];
    async function loadParigaramDatabase() {
      try {
        const res = await fetch('data/parigaram_data.json');
        if (res.ok) {
          const raw = await res.text();
          if (!raw.trim().startsWith('<')) {
            parigaramList = JSON.parse(raw);
          }
        }
      } catch (err) {
        // static or offline fallback
      }
    }
    loadParigaramDatabase();

    // Mobile Navigation Tabs
    const mobileTabs         = document.querySelectorAll('#mobileTabs .tab-btn');
    const panels = {
      inputPanel:  document.getElementById('inputPanel'),
      chatPanel:   document.getElementById('chatPanel'),
      kattamPanel: document.getElementById('kattamPanel')
    };

    /* ---------------- Mobile Tab Switching ---------------- */
    mobileTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        mobileTabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetId = btn.dataset.target;
        Object.keys(panels).forEach(id => {
          if (panels[id]) {
            if (id === targetId) {
              panels[id].classList.add('active-mobile-panel');
            } else {
              panels[id].classList.remove('active-mobile-panel');
            }
          }
        });
      });
    });

    function switchToMobileTab(tabId) {
      const btn = document.querySelector(`#mobileTabs .tab-btn[data-target="${tabId}"]`);
      if (btn) btn.click();
    }

    /* ---------------- Sparkle Particle Generator ---------------- */
    function spawnSparkle() {
      const container = document.getElementById('sparkleContainer');
      if (!container) return;
      const el = document.createElement('div');
      el.className = 'sparkle';
      el.style.left = `${Math.random() * 100}%`;
      el.style.top  = `${40 + Math.random() * 60}%`;
      const size = 4 + Math.random() * 6;
      el.style.width  = `${size}px`;
      el.style.height = `${size}px`;
      el.style.animationDuration = `${2 + Math.random() * 2}s`;
      container.appendChild(el);
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }
    setInterval(spawnSparkle, 750);

    /* ---------------- Star Burst on Tap/Click ---------------- */
    document.addEventListener('click', (e) => {
      if (['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const count = 7;
      for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'burst-star';
        const angle = (2 * Math.PI * i) / count;
        const dist = 35 + Math.random() * 25;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        star.style.left = `${e.clientX}px`;
        star.style.top  = `${e.clientY}px`;
        star.style.setProperty('--tx', `${dx}px`);
        star.style.setProperty('--ty', `${dy}px`);
        document.body.appendChild(star);
        star.addEventListener('animationend', () => star.remove(), { once: true });
      }
    });

    /* ---------------- Chat Message Rendering ---------------- */
    function addMessage(text, sender = 'bot', isHTML = false) {
      const msg = document.createElement('div');
      msg.className = `message ${sender}`;

      const avatar = document.createElement('div');
      avatar.className = 'msg-avatar';
      avatar.textContent = (sender === 'bot') ? '🪐' : '👤';

      const bubble = document.createElement('div');
      bubble.className = 'msg-bubble';

      if (isHTML) {
        bubble.innerHTML = text;
      } else {
        bubble.textContent = text;
      }

      const time = document.createElement('div');
      time.className = 'msg-time';
      const now = new Date();
      time.textContent = `${p2(now.getHours())}:${p2(now.getMinutes())}`;

      bubble.appendChild(time);
      msg.appendChild(avatar);
      msg.appendChild(bubble);
      chatMessages.appendChild(msg);

      scrollToBottom();
    }

    function scrollToBottom() {
      chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
    }

    function showTyping() {
      typingDots.classList.remove('hidden');
      scrollToBottom();
    }

    function hideTyping() {
      typingDots.classList.add('hidden');
    }

    function botSay(text, isHTML = false, delayMs = 600) {
      showTyping();
      return new Promise((resolve) => {
        setTimeout(() => {
          hideTyping();
          addMessage(text, 'bot', isHTML);
          resolve();
        }, delayMs);
      });
    }

    /* ---------------- City Autocomplete Dropdown (Chat & Left Panel) ---------------- */
    function hideCityDropdown() {
      cityDropdown.innerHTML = '';
      cityDropdown.classList.add('hidden');
    }

    function hideLeftCityDropdown() {
      if (leftCityDropdown) {
        leftCityDropdown.innerHTML = '';
        leftCityDropdown.classList.add('hidden');
      }
    }

    function showCityDropdown(cities, targetDropdown = cityDropdown, onSelect) {
      targetDropdown.innerHTML = '';
      if (!cities || cities.length === 0) {
        targetDropdown.classList.add('hidden');
        return;
      }
      cities.forEach((city) => {
        const opt = document.createElement('div');
        opt.className = 'city-option';
        const label = city.state ? `${city.name}, ${city.state} (${city.country})` : `${city.name} (${city.country})`;
        opt.textContent = label;
        opt.addEventListener('click', () => {
          onSelect(city);
        });
        targetDropdown.appendChild(opt);
      });
      targetDropdown.classList.remove('hidden');
    }

    let citiesCache = null;
    let citiesLoadingPromise = null;

    async function loadCitiesDatabase() {
      if (citiesCache && citiesCache.length > 0) return citiesCache;
      if (citiesLoadingPromise) return citiesLoadingPromise;

      citiesLoadingPromise = (async () => {
        try {
          const res = await fetch('data/cities.json');
          if (res.ok) {
            const raw = await res.text();
            if (!raw.trim().startsWith('<')) {
              citiesCache = JSON.parse(raw);
              return citiesCache;
            }
          }
        } catch (e) {
          // fetch error
        }
        return [];
      })();

      return citiesLoadingPromise;
    }
    loadCitiesDatabase();

    async function searchCities(query) {
      if (!query || query.trim().length < 2) return [];
      const q = query.trim().toLowerCase();

      // 1. Instant client-side lookup from static JSON (works on GitHub Pages & PHP alike, 0ms latency)
      const list = await loadCitiesDatabase();
      if (list && list.length > 0) {
        return list.filter((c) => {
          const name = (c.name || '').toLowerCase();
          const state = (c.state || '').toLowerCase();
          const country = (c.country || '').toLowerCase();
          return name.includes(q) || state.includes(q) || country.includes(q);
        }).slice(0, 20);
      }

      // 2. Safe fallback to api/cities.php if running on dynamic PHP server
      try {
        const res = await fetch(`api/cities.php?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) return [];
        const raw = await res.text();
        if (raw.trim().startsWith('<')) return [];
        return JSON.parse(raw);
      } catch (e) {
        return [];
      }
    }

    function handleChatCitySelected(city) {
      selectedCity = city;
      userData.pob = city.name;
      userData.lat = parseFloat(city.lat);
      userData.lon = parseFloat(city.lon);
      userData.tz  = parseFloat(city.tz || 5.5);

      syncUserDataToLeftPanel();

      const latField = document.getElementById('chartLat');
      const lonField = document.getElementById('chartLon');
      const tzField  = document.getElementById('chartTz');
      if (latField) latField.value = city.lat;
      if (lonField) lonField.value = city.lon;
      if (tzField)  tzField.value  = userData.tz;

      addMessage(city.name, 'user');
      userInput.value = '';
      hideCityDropdown();
      advanceState();
    }

    function handleLeftCitySelected(city) {
      if (lpPob) lpPob.value = city.name;
      if (lpLat) lpLat.value = city.lat;
      if (lpLon) lpLon.value = city.lon;
      userData.pob = city.name;
      userData.lat = parseFloat(city.lat);
      userData.lon = parseFloat(city.lon);
      userData.tz  = parseFloat(city.tz || 5.5);
      hideLeftCityDropdown();
    }

    // Auto-search city if typed and sent in chat
    async function fetchAndAutoSelectCity(query) {
      const list = await searchCities(query);
      if (list && list.length > 0) {
        handleChatCitySelected(list[0]);
        return;
      }

      // Default fallback (Chennai coordinates)
      userData.pob = query;
      userData.lat = 13.0827;
      userData.lon = 80.2707;
      userData.tz  = 5.5;
      syncUserDataToLeftPanel();

      addMessage(query, 'user');
      userInput.value = '';
      hideCityDropdown();
      advanceState();
    }

    /* ---------------- Chat Input Handler ---------------- */
    function handleSend() {
      // Clear voice timers if sending
      clearVoiceTimers();
      hideVoiceCountdown();

      const raw = userInput.value.trim();
      if (!raw) return;

      if (currentState === STATES.GET_POB) {
        if (selectedCity && selectedCity.name.toLowerCase() === raw.toLowerCase()) {
          handleChatCitySelected(selectedCity);
          return;
        }
        fetchAndAutoSelectCity(raw);
        return;
      }

      addMessage(raw, 'user');
      userInput.value = '';
      processUserInput(raw);
    }

    userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    });
    sendBtn.addEventListener('click', handleSend);

    userInput.addEventListener('input', () => {
      if (currentState === STATES.GET_POB) {
        clearTimeout(cityDebounceTimer);
        cityDebounceTimer = setTimeout(async () => {
          const list = await searchCities(userInput.value);
          showCityDropdown(list, cityDropdown, handleChatCitySelected);
        }, 250);
      }
    });

    document.addEventListener('click', (e) => {
      if (cityDropdown && !cityDropdown.contains(e.target) && e.target !== userInput) {
        hideCityDropdown();
      }
      if (leftCityDropdown && !leftCityDropdown.contains(e.target) && e.target !== lpPob) {
        hideLeftCityDropdown();
      }
    });

    /* ---------------- Two-Way Data Sync Between Panels ---------------- */
    function syncUserDataToLeftPanel() {
      if (lpName && userData.name) lpName.value = userData.name;
      if (lpDob  && userData.dob)  lpDob.value  = userData.dob;
      if (lpTob  && userData.tob)  lpTob.value  = userData.tob;
      if (lpPob  && userData.pob)  lpPob.value  = userData.pob;
      if (lpLat  && userData.lat)  lpLat.value  = userData.lat;
      if (lpLon  && userData.lon)  lpLon.value  = userData.lon;
    }

    function syncLeftPanelToUserData() {
      if (lpName) userData.name = lpName.value.trim();
      if (lpDob)  userData.dob  = lpDob.value.trim();
      if (lpTob)  userData.tob  = lpTob.value.trim();
      if (lpPob)  userData.pob  = lpPob.value.trim();
      if (lpLat)  userData.lat  = parseFloat(lpLat.value) || 13.0827;
      if (lpLon)  userData.lon  = parseFloat(lpLon.value) || 80.2707;
      userData.tz = 5.5;
    }

    // Left panel city search
    if (lpPob) {
      lpPob.addEventListener('input', () => {
        clearTimeout(leftCityDebounceTimer);
        leftCityDebounceTimer = setTimeout(async () => {
          const list = await searchCities(lpPob.value);
          showCityDropdown(list, leftCityDropdown, handleLeftCitySelected);
        }, 250);
      });
    }

    // Left Panel Calculate Button
    if (leftCalcBtn) {
      leftCalcBtn.addEventListener('click', async () => {
        syncLeftPanelToUserData();

        if (!userData.name) {
          alert('தயவுசெய்து உங்கள் பெயரை உள்ளிடவும்.');
          if (lpName) lpName.focus();
          return;
        }
        if (!isValidDOB(userData.dob)) {
          alert('தேதி வடிவம் தவறாக உள்ளது. DD/MM/YYYY வடிவில் உள்ளிடவும் (உதாரணம்: 15/08/1995).');
          if (lpDob) lpDob.focus();
          return;
        }
        if (!isValidTOB(userData.tob)) {
          alert('நேர வடிவம் தவறாக உள்ளது. HH:MM (24 மணி நேரம்) வடிவில் உள்ளிடவும் (உதாரணம்: 14:30).');
          if (lpTob) lpTob.focus();
          return;
        }

        currentState = STATES.COMPUTING;
        addMessage(`📝 ஜாதக விவரங்கள் உள்ளீடு செய்யப்பட்டது:\nபெயர்: ${userData.name}\nதேதி: ${userData.dob}\nநேரம்: ${userData.tob}\nஊர்: ${userData.pob || 'Chennai'}`, 'user');
        await calculateAndDisplayChart();
      });
    }

    // Left Panel Reset Button
    if (leftResetBtn) {
      leftResetBtn.addEventListener('click', () => {
        if (lpName) lpName.value = '';
        if (lpDob)  lpDob.value  = '';
        if (lpTob)  lpTob.value  = '';
        if (lpPob)  lpPob.value  = '';
        if (lpLat)  lpLat.value  = '13.0827';
        if (lpLon)  lpLon.value  = '80.2707';
        userData.name = '';
        userData.dob  = '';
        userData.tob  = '';
        userData.pob  = '';
        resetKattamPanel();
      });
    }

    /* ---------------- Tamil Voice Input (ta-IN) with 5-Second Silence Timer ---------------- */
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    let savedPlaceholder = '';

    function showVoiceCountdown(seconds) {
      if (!countdownBanner) return;
      countdownBanner.classList.remove('hidden');
      if (countdownText) {
        countdownText.textContent = `🗣️ குரல் கேட்கப்பட்டது... இன்னும் ${seconds} வினாடிகளில் அனுப்பப்படும் (பேச்சை தொடரலாம்)`;
      }
    }

    function hideVoiceCountdown() {
      if (countdownBanner) {
        countdownBanner.classList.add('hidden');
      }
    }

    function clearVoiceTimers() {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
    }

    function resetSilenceCountdown() {
      clearVoiceTimers();
      remainingSilence = 5;
      showVoiceCountdown(remainingSilence);

      countdownInterval = setInterval(() => {
        remainingSilence--;
        if (remainingSilence > 0) {
          showVoiceCountdown(remainingSilence);
        } else {
          clearVoiceTimers();
        }
      }, 1000);

      silenceTimer = setTimeout(() => {
        clearVoiceTimers();
        hideVoiceCountdown();
        stopListening();
        handleSend();
      }, 5000);
    }

    if (voiceSendNowBtn) {
      voiceSendNowBtn.addEventListener('click', () => {
        clearVoiceTimers();
        hideVoiceCountdown();
        stopListening();
        handleSend();
      });
    }

    micBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!SpeechRec) {
        alert('உங்கள் உலாவியில் நேரடி குரல் உள்ளீடு வசதி இல்லை (Web Speech API not supported). தயவுசெய்து Google Chrome அல்லது Microsoft Edge உலாவியைப் பயன்படுத்தவும்.');
        return;
      }
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    });

    function startListening() {
      if (!SpeechRec) return;

      try {
        if (recognition) {
          const old = recognition;
          recognition = null;
          try { old.abort(); } catch (_) {}
        }

        accumulatedTranscript = '';
        recognition = new SpeechRec();
        recognition.lang = 'ta-IN';
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          isListening = true;
          micBtn.classList.add('listening');
          micBtn.title = 'பேசுவதை நிறுத்த அழுத்தவும்';
          savedPlaceholder = userInput.placeholder;
          userInput.placeholder = '🎤 தமிழில் முழுமையாகப் பேசுங்கள்... (Listening in Tamil)...';
          if (countdownBanner) {
            countdownBanner.classList.remove('hidden');
            if (countdownText) countdownText.textContent = '🎤 பேசத் தொடங்குங்கள்... பேசி முடித்ததும் 5 வினாடிகள் மௌனத்தில் தானாக அனுப்பப்படும்';
          }
        };

        recognition.onresult = (event) => {
          let interimText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              accumulatedTranscript += ' ' + transcript;
            } else {
              interimText += transcript;
            }
          }

          const combined = (accumulatedTranscript + ' ' + interimText).trim();
          if (combined) {
            userInput.value = combined;
            // Voice input detected! Wait for 5 seconds of silence before sending
            resetSilenceCountdown();
          }
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition notice:', event.error);
          if (['not-allowed', 'audio-capture', 'service-not-allowed', 'network'].includes(event.error)) {
            if (event.error === 'not-allowed') {
              alert('மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது. Browser settings-ல் மைக்ரோஃபோன் அனுமதியை இயக்கிவிட்டு மீண்டும் முயற்சிக்கவும்.');
            } else if (event.error === 'audio-capture') {
              userInput.placeholder = 'மைக்ரோஃபோன் இணைப்பில் சிக்கல் உள்ளது. மைக் இணைப்பைச் சரிபார்க்கவும்.';
            }
            stopListening();
            return;
          }

          if (event.error === 'aborted') {
            stopListening();
            return;
          }

          if (event.error === 'no-speech') {
            // If user hasn't spoken anything yet, stop listening cleanly to avoid infinite loop
            if (!userInput.value.trim() && !accumulatedTranscript.trim()) {
              stopListening();
              userInput.placeholder = 'குரல் கேட்கவில்லை. மீண்டும் மைக் அழுத்திப் பேசவும்...';
            }
          }
        };

        recognition.onend = () => {
          // Clean termination without recursive restart loops
          if (isListening) {
            isListening = false;
            micBtn.classList.remove('listening');
            micBtn.title = 'குரல் உள்ளீடு / Voice input';
            if (savedPlaceholder) userInput.placeholder = savedPlaceholder;

            const finalVal = userInput.value.trim();
            if (finalVal) {
              clearVoiceTimers();
              hideVoiceCountdown();
              setTimeout(() => {
                handleSend();
              }, 400);
            } else {
              clearVoiceTimers();
              hideVoiceCountdown();
            }
          } else {
            stopListening();
          }
        };

        recognition.start();

      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        stopListening();
      }
    }

    function stopListening() {
      isListening = false;
      micBtn.classList.remove('listening');
      micBtn.title = 'குரல் உள்ளீடு / Voice input';
      if (savedPlaceholder) {
        userInput.placeholder = savedPlaceholder;
      }
      clearVoiceTimers();
      hideVoiceCountdown();
      if (recognition) {
        const rec = recognition;
        recognition = null;
        try { rec.abort(); } catch (_) {}
      }
    }

    /* ---------------- Chat Flow Machine ---------------- */
    async function startChat() {
      currentState = STATES.GREETING;
      await delay(400);
      await botSay('வணக்கம்! நான் உங்கள் தமிழ் ஜோதிட AI உதவியாளர். 🙏\nஉங்கள் பெயர் என்ன?');
      currentState = STATES.GET_NAME;
      userInput.placeholder = 'உங்கள் பெயரை உள்ளிடவும்...';
      userInput.focus();
    }

    async function processUserInput(input) {
      switch (currentState) {
        case STATES.GET_NAME:
          userData.name = input;
          syncUserDataToLeftPanel();
          currentState = STATES.GET_DOB;
          await botSay(`மகிழ்ச்சி ${userData.name}! ⭐\nஉங்கள் பிறந்த தேதியை உள்ளிடவும் (DD/MM/YYYY):`);
          userInput.placeholder = 'உதாரணம்: 15/08/1995';
          break;

        case STATES.GET_DOB:
          if (!isValidDOB(input)) {
            await botSay('தேதி வடிவம் தவறாக உள்ளது. தயவுசெய்து DD/MM/YYYY என்ற முறையில் உள்ளிடவும் (உதாரணம்: 24/10/1995):');
            return;
          }
          userData.dob = input;
          syncUserDataToLeftPanel();
          currentState = STATES.GET_TOB;
          await botSay('உங்கள் பிறந்த நேரத்தை உள்ளிடவும் (HH:MM, 24 மணி நேர வடிவம்):');
          userInput.placeholder = 'உதாரணம்: 10:30 அல்லது 18:45';
          break;

        case STATES.GET_TOB:
          if (!isValidTOB(input)) {
            await botSay('நேர வடிவம் தவறாக உள்ளது. தயவுசெய்து HH:MM (24 மணி நேரம்) என்ற முறையில் உள்ளிடவும் (உதாரணம்: 14:30):');
            return;
          }
          userData.tob = input;
          syncUserDataToLeftPanel();
          currentState = STATES.GET_POB;
          await botSay('நீங்கள் பிறந்த ஊர் / நகரம் எது? (தட்டச்சு செய்து பட்டியலில் இருந்து தேர்வு செய்யவும்):');
          userInput.placeholder = 'நகரத்தின் பெயரை தட்டச்சு செய்யவும்... எ.கா. Chennai';
          break;

        case STATES.FOLLOWUP:
        case STATES.AI_ANSWER:
          await sendToAI(input);
          break;

        default:
          break;
      }
    }

    async function advanceState() {
      if (currentState === STATES.GET_POB) {
        currentState = STATES.COMPUTING;
        await calculateAndDisplayChart();
      }
    }

    /* ---------------- Chart Calculation & Display ---------------- */
    async function calculateAndDisplayChart() {
      userInput.disabled = true;
      sendBtn.disabled   = true;
      await botSay('உங்கள் ஜாதகம் துல்லியமாகக் கணக்கிடப்படுகிறது... ⭐');

      try {
        const ayanKind = lpAyan ? lpAyan.value : 'lahiri';
        let chartData = null;
        if (typeof computeChart === 'function') {
          chartData = computeChart({
            name:     userData.name,
            dob:      userData.dob,
            tob:      userData.tob,
            lat:      userData.lat,
            lon:      userData.lon,
            tzOffset: userData.tz,
            ayanamsaKind: ayanKind
          });
        }

        userData.chartData = chartData;
        window.CURRENT_CHART_DATA = chartData;
        window.CHAT_USER_DATA = {
          name: userData.name,
          dob:  userData.dob,
          tob:  userData.tob,
          pob:  userData.pob
        };

        let doshaReport = null;
        if (typeof analyseDosha === 'function') {
          doshaReport = analyseDosha(chartData);
        } else if (typeof analyzeDoshas === 'function') {
          doshaReport = analyzeDoshas(chartData);
        }

        // Render Right Panel Kattam & Astrometa Cards
        renderJadhagamKattam(chartData, doshaReport);

        const summaryHTML = buildChartSummaryHTML(chartData, doshaReport);
        await delay(600);
        addMessage(summaryHTML, 'bot', true);

        await delay(500);
        await botSay(
          `${userData.name}, உங்கள் ஜாதகம் மற்றும் ராசி கட்டம் வலதுபுறம் தயாராகிவிட்டது! 🌟\n` +
          `நீங்கள் என்ன வழிகாட்டல் அறிய விரும்புகிறீர்கள்?\n` +
          `• திருமணம் & தாம்பத்தியம் (Marriage timing)\n` +
          `• தொழில் & வியாபாரம் (Career / Business)\n` +
          `• பொதுவான உடல்நலம் (General Health)\n` +
          `அல்லது உங்கள் சொந்தக் கேள்வியைக் கேளுங்கள்:`
        );

        currentState = STATES.FOLLOWUP;
        userInput.placeholder = 'உங்கள் கேள்வியை தட்டச்சு செய்யவும் அல்லது பேசவும்...';
        userInput.disabled = false;
        sendBtn.disabled   = false;
        userInput.focus();

      } catch (err) {
        console.error('Calculation error:', err);
        userInput.disabled = false;
        sendBtn.disabled   = false;
        await botSay('மன்னிக்கவும்! ஜாதகம் கணக்கிடுவதில் பிழை ஏற்பட்டது. தயவுசெய்து பிறந்த விவரங்களைச் சரிபார்க்கவும்.');
        currentState = STATES.GET_DOB;
      }
    }

    /* ---------------- Right Panel: Render South Indian Kattam & Tamil Details ---------------- */
    function renderJadhagamKattam(chartData, doshaReport) {
      if (!chartData) return;

      const { lagna, rasi, planets, dasha, name } = chartData;

      // 1. Prominent Tamil Astrology Cards
      if (metaLaknam) {
        const signTamil = TAMIL_SIGNS[lagna.sign_no] || lagna.sign;
        metaLaknam.textContent = `${signTamil} (${lagna.degree})`;
      }
      if (metaLaknamSub) {
        const lordTamil = getTamilLordName(lagna.lord);
        const nakTamil  = TAMIL_NAKS[lagna.nak_no] || lagna.nakshatra;
        metaLaknamSub.textContent = `அதிபதி: ${lordTamil} | ${nakTamil} (${lagna.pada}ம் பாதம்)`;
      }

      if (metaRaasi) {
        metaRaasi.textContent = TAMIL_SIGNS[rasi.sign_no] || rasi.sign;
      }
      if (metaRaasiLord) {
        const rasiLordTamil = getTamilLordName(rasi.lord);
        metaRaasiLord.textContent = `ராசி அதிபதி: ${rasiLordTamil} (${rasi.degree})`;
      }

      if (metaNatchatram) {
        metaNatchatram.textContent = TAMIL_NAKS[rasi.nak_no] || rasi.nakshatra;
      }
      if (metaNatchatramPada) {
        metaNatchatramPada.textContent = `${rasi.pada}ம் பாதம் (நட்சத்திர அதிபதி: ${getTamilLordName(rasi.star_lord)})`;
      }

      if (metaDasha && dasha?.current) {
        const curDashaName  = getTamilLordName(dasha.current.planet);
        const curBhuktiName = dasha.current.bhukti ? getTamilLordName(dasha.current.bhukti.planet || dasha.current.bhukti.sub) : '';
        metaDasha.textContent = `${curDashaName} தசை ${curBhuktiName ? '- ' + curBhuktiName + ' புக்தி' : ''}`;
      }
      if (metaDashaEnd && dasha?.current) {
        const endDate = dasha.current.bhukti?.end || dasha.current.end || '';
        metaDashaEnd.textContent = endDate ? `முடிவு காலம்: ${endDate}` : 'நடப்பு தசை காலம்';
      }

      if (centerNativeName) {
        centerNativeName.textContent = name || 'ஜாதகர்';
      }

      // 2. Clear all 12 cells in South Indian Chart
      for (let s = 0; s < 12; s++) {
        const cell = document.getElementById(`cell-${s}`);
        const pCont = document.getElementById(`planets-${s}`);
        if (cell) {
          cell.classList.remove('cell-lagna');
          const existingBadge = cell.querySelector('.lagna-badge');
          if (existingBadge) existingBadge.remove();
        }
        if (pCont) {
          pCont.innerHTML = '';
        }
      }

      // Highlight Lagna Cell
      const lagnaCell = document.getElementById(`cell-${lagna.sign_no}`);
      if (lagnaCell) {
        lagnaCell.classList.add('cell-lagna');
        const badge = document.createElement('span');
        badge.className = 'lagna-badge';
        badge.textContent = 'லக்னம்';
        lagnaCell.appendChild(badge);
      }

      // Populate Planets into their respective sign cells
      if (Array.isArray(planets)) {
        planets.forEach(p => {
          const pCont = document.getElementById(`planets-${p.sign_no}`);
          if (pCont) {
            const tag = document.createElement('span');
            tag.className = `planet-tag ${p.retro ? 'retro' : ''}`;
            const shortName = getTamilShortPlanet(p.code);
            tag.textContent = `${shortName}${p.retro ? '(வ)' : ''}`;
            tag.title = `${p.name} - ${p.degree} (${p.retro ? 'வக்ரம்' : 'நேர்'})`;
            pCont.appendChild(tag);
          }
        });
      }

      // 3. Dosha Badges
      if (doshaBadges) {
        doshaBadges.innerHTML = '';
        if (doshaReport) {
          // Sevvai Dosha
          const sevvaiPill = document.createElement('span');
          if (doshaReport.sevvai_dosha?.present) {
            sevvaiPill.className = 'dosha-pill warning';
            sevvaiPill.textContent = 'செவ்வாய் தோஷம் உண்டு';
          } else {
            sevvaiPill.className = 'dosha-pill positive';
            sevvaiPill.textContent = 'செவ்வாய் தோஷம் இல்லை ✓';
          }
          doshaBadges.appendChild(sevvaiPill);

          // Gajakesari Yoga
          if (doshaReport.gajakesari?.present || doshaReport.gajakesari_yoga?.present) {
            const gkPill = document.createElement('span');
            gkPill.className = 'dosha-pill positive';
            gkPill.textContent = 'கஜகேசரி யோகம் உண்டு ★';
            doshaBadges.appendChild(gkPill);
          }

          // Raja Yoga
          if (Array.isArray(doshaReport.raja_yogam) && doshaReport.raja_yogam.length > 0) {
            const ryPill = document.createElement('span');
            ryPill.className = 'dosha-pill positive';
            ryPill.textContent = 'ராஜ யோகம் உண்டு ★';
            doshaBadges.appendChild(ryPill);
          }

          // Kala Sarpa
          if (doshaReport.kala_sarpa?.present) {
            const ksPill = document.createElement('span');
            ksPill.className = 'dosha-pill warning';
            ksPill.textContent = 'காலசர்ப்ப தோஷம்';
            doshaBadges.appendChild(ksPill);
          }

          // Naga Dosha
          if (doshaReport.naga_dosha?.present) {
            const nagaPill = document.createElement('span');
            nagaPill.className = 'dosha-pill warning';
            nagaPill.textContent = 'நாக தோஷம்';
            doshaBadges.appendChild(nagaPill);
          }
        }
      }

      // 4. Planetary Longitudes Table
      if (grahaDegreesTable && Array.isArray(planets)) {
        let rows = planets.map(p => {
          const tamilPlName = getTamilLordName(p.code);
          const tamilSign   = TAMIL_SIGNS[p.sign_no] || p.sign;
          const tamilNak    = TAMIL_NAKS[p.nak_no] || p.nakshatra;
          const status      = p.retro ? '<span style="color:#ffaa55;">வக்ரம்</span>' : 'நேர்';
          return `
            <tr>
              <td><strong>${tamilPlName}</strong></td>
              <td>${tamilSign}</td>
              <td>${p.degree}</td>
              <td>${p.house}ம் பாவம்</td>
              <td>${tamilNak} (${p.pada})</td>
              <td>${status}</td>
            </tr>
          `;
        }).join('');

        grahaDegreesTable.innerHTML = `
          <table class="graha-table">
            <thead>
              <tr>
                <th>கிரகம்</th><th>ராசி</th><th>பாகை</th><th>பாவம்</th><th>நட்சத்திரம்</th><th>நிலை</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        `;
      }

      // 5. Render 27 Nakshatra Parigaram Sthalam Card
      if (parigaramContainer && rasi) {
        const pIndex = (typeof rasi.nak_no === 'number') ? rasi.nak_no : (lagna.nak_no || 0);
        let pData = parigaramList[pIndex];
        if (!pData && parigaramList.length > 0) {
          pData = parigaramList.find(item => item.name_en.toLowerCase() === (rasi.nakshatra || '').toLowerCase()) || parigaramList[0];
        }

        if (pData) {
          parigaramContainer.innerHTML = `
            <div class="parigaram-temple-name">🛕 ${pData.temple}</div>
            <div class="parigaram-temple-place">📍 ${pData.temple_place}</div>
            <div class="parigaram-item"><span class="parigaram-label">அதிதேவதை:</span> ${pData.deity} | <span class="parigaram-label">விருட்சம்:</span> ${pData.maram}</div>
            <div class="parigaram-item"><span class="parigaram-label">மிருகம்:</span> ${pData.mirugam} | <span class="parigaram-label">பறவை:</span> ${pData.pakshi}</div>
            <div class="parigaram-gayatri-box">📜 <strong>நட்சத்திர காயத்ரி மந்திரம்:</strong><br>${pData.gayatri}</div>
            <div class="parigaram-remedy-box">🙏 <strong>வழிபாட்டு பரிகாரம்:</strong> ${pData.remedy}</div>
          `;
        }
      }
    }

    function resetKattamPanel() {
      if (metaLaknam)         metaLaknam.textContent = '--';
      if (metaLaknamSub)      metaLaknamSub.textContent = 'பாகை விவரம்';
      if (metaRaasi)          metaRaasi.textContent = '--';
      if (metaRaasiLord)      metaRaasiLord.textContent = 'ராசி அதிபதி';
      if (metaNatchatram)     metaNatchatram.textContent = '--';
      if (metaNatchatramPada) metaNatchatramPada.textContent = 'பாதம் விவரம்';
      if (metaDasha)          metaDasha.textContent = '--';
      if (metaDashaEnd)       metaDashaEnd.textContent = 'கால அளவு';
      if (centerNativeName)   centerNativeName.textContent = 'ஜாதகர் குறிப்பு';
      if (doshaBadges)        doshaBadges.innerHTML = '';
      if (grahaDegreesTable)  grahaDegreesTable.innerHTML = '';
      if (parigaramContainer) {
        parigaramContainer.innerHTML = '<p style="color: rgba(255,255,255,0.65); font-size: 0.8rem; padding: 4px 0;">ஜாதகம் கணிக்கப்பட்டதும் உங்கள் நட்சத்திரத்திற்கான பரிகாரக் கோவில், காயத்ரி மந்திரம் மற்றும் வழிபாட்டு முறைகள் இங்கு தோன்றும்.</p>';
      }

      for (let s = 0; s < 12; s++) {
        const cell = document.getElementById(`cell-${s}`);
        const pCont = document.getElementById(`planets-${s}`);
        if (cell) {
          cell.classList.remove('cell-lagna');
          const badge = cell.querySelector('.lagna-badge');
          if (badge) badge.remove();
        }
        if (pCont) pCont.innerHTML = '';
      }
    }

    /* ---------------- Chart Summary HTML Template (In Chat) ---------------- */
    function buildChartSummaryHTML(c, d) {
      if (!c) return '<p>ஜாதகத் தரவுகள் கிடைக்கவில்லை.</p>';

      const lagnaSign = c.lagna ? `${TAMIL_SIGNS[c.lagna.sign_no]} (${c.lagna.degree})` : '-';
      const rasiSign  = c.rasi ? `${TAMIL_SIGNS[c.rasi.sign_no]} (${c.rasi.degree})` : '-';
      const nakshatra = c.rasi ? (TAMIL_NAKS[c.rasi.nak_no] || c.rasi.nakshatra) : '-';
      const dashaStr  = c.dasha?.current ? `${getTamilLordName(c.dasha.current.planet)} தசை (${c.dasha.current.end} வரை)` : '-';
      const bhuktiStr = c.dasha?.current?.bhukti ? `${getTamilLordName(c.dasha.current.bhukti.planet || c.dasha.current.bhukti.sub)} புக்தி` : '-';

      // Dosha chips
      let doshaChips = '';
      if (d) {
        if (d.sevvai_dosha?.present) {
          doshaChips += '<span class="dosha-chip badge-warning">செவ்வாய் தோஷம் உண்டு</span> ';
        } else {
          doshaChips += '<span class="dosha-chip badge-success">செவ்வாய் தோஷம் இல்லை ✓</span> ';
        }

        if (d.gajakesari?.present || d.gajakesari_yoga?.present) {
          doshaChips += '<span class="dosha-chip badge-success">கஜகேசரி யோகம் உண்டு ★</span> ';
        }

        if (d.kala_sarpa?.present) {
          doshaChips += '<span class="dosha-chip badge-warning">காலசர்ப்ப அமைப்பு உண்டு</span> ';
        }
      }

      return `
        <div class="chart-card">
          <h3 class="chart-header">⭐ ${c.name} அவர்களின் ஜாதகக் குறிப்பு ⭐</h3>
          <table class="chart-table">
            <tr><th>லக்னம்:</th><td>${lagnaSign}</td><th>ராசி:</th><td>${rasiSign}</td></tr>
            <tr><th>நட்சத்திரம்:</th><td>${nakshatra}</td><th>பாதம்:</th><td>${c.rasi?.pada || 1}ம் பாதம்</td></tr>
            <tr><th>நடப்பு தசை:</th><td colspan="3">${dashaStr} - ${bhuktiStr}</td></tr>
          </table>

          <div class="dosha-chips-container" style="margin: 10px 0;">
            ${doshaChips}
          </div>
          <p style="font-size:0.8rem; color:#facc15; margin-top:4px;">👉 முழுமையான ராசி கட்டம் மற்றும் கிரக நிலைகள் வலதுபுறத் திரையில் காட்டப்பட்டுள்ளன.</p>
        </div>
      `;
    }

    /* ---------------- AI Question & Answer with Gemini Proxy & Client Fallback ---------------- */
    async function sendToAI(question) {
      showTyping();
      userInput.disabled = true;
      sendBtn.disabled   = true;

      // Determine topic
      let topic = 'general';
      const qLower = question.toLowerCase();
      if (qLower.includes('பரிகாரம்') || qLower.includes('கோவில்') || qLower.includes('ஸ்தலம்') || qLower.includes('மந்திரம்') || qLower.includes('remedy') || qLower.includes('parigaram') || qLower.includes('தோஷம்')) {
        topic = 'parigaram';
      } else if (qLower.includes('திருமணம்') || qLower.includes('கல்யாணம்') || qLower.includes('marriage') || qLower.includes('மனைவி') || qLower.includes('கணவர்')) {
        topic = 'marriage';
      } else if (qLower.includes('வேலை') || qLower.includes('தொழில்') || qLower.includes('வியாபாரம்') || qLower.includes('career') || qLower.includes('job') || qLower.includes('business') || qLower.includes('திசை') || qLower.includes('வடக்கு') || qLower.includes('கிழக்கு') || qLower.includes('தெற்கு') || qLower.includes('மேற்கு')) {
        topic = 'career';
      } else if (qLower.includes('உடல்நலம்') || qLower.includes('நோய்') || qLower.includes('ஆரோக்யம்') || qLower.includes('health')) {
        topic = 'health';
      }

      let aiReply = null;

      // 1. Try PHP Gemini Proxy (works on PHP server)
      try {
        const res = await fetch('api/gemini.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chart:    userData.chartData,
            question: question,
            topic:    topic
          })
        });

        if (res.ok) {
          const raw = await res.text();
          if (!raw.trim().startsWith('<')) {
            const data = JSON.parse(raw);
            if (data && data.success && data.reply) {
              aiReply = data.reply;
            }
          }
        }
      } catch (err) {
        // Fallback gracefully without unhandled errors
      }

      // 2. Try Client-side Gemini API if key is present in localStorage or window
      if (!aiReply) {
        const clientKey = window.GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
        if (clientKey) {
          try {
            const prompt = `ஜாதகர் பெயர்: ${userData.name || 'அன்பர்'}\nலக்னம்: ${userData.chartData?.lagna?.sign || '-'}\nராசி: ${userData.chartData?.rasi?.sign || '-'}\nநட்சத்திரம்: ${userData.chartData?.nakshatra?.name || '-'}\nகேள்வி: ${question}\nதலைப்பு: ${topic}\nதயவுசெய்து தமிழ் மொழியில் விரிவான, மரியாதையான, நடைமுறைக்கேற்ற ஜோதிட வழிகாட்டலை வழங்கவும்.`;
            const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${clientKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.6, maxOutputTokens: 2048 }
              })
            });
            if (gRes.ok) {
              const gData = await gRes.json();
              const gText = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (gText) aiReply = gText;
            }
          } catch (e) {
            // fallback to client engine
          }
        }
      }

      // 3. Built-in Comprehensive Vedic Astrological Engine (works 100% offline & on GitHub Pages)
      if (!aiReply) {
        aiReply = generateVedicAstrologyGuidance(userData.chartData, question, topic, userData.name);
      }

      hideTyping();
      addMessage(formatBotReply(aiReply), 'bot', true);

      userInput.disabled = false;
      sendBtn.disabled   = false;
      userInput.focus();
      currentState = STATES.AI_ANSWER;
    }

    /* ---------------- In-Depth Vedic Astrological Engine ---------------- */
    function generateVedicAstrologyGuidance(chart, question, topic, userName) {
      const name = userName || 'அன்பர்';
      const lagna = chart?.lagna?.sign || 'மேஷம்';
      const lagnaLord = chart?.lagna?.lord || 'செவ்வாய்';
      const rasi = chart?.rasi?.sign || 'ரிஷபம்';
      const rasiLord = chart?.rasi?.lord || 'சுக்கிரன்';
      const nakshatra = chart?.nakshatra?.name || 'ரோகிணி';
      const pada = chart?.nakshatra?.pada || '1';
      const nakLord = chart?.nakshatra?.lord || 'சந்திரன்';
      const sevvai = chart?.doshas?.sevvai?.present ? 'செவ்வாய் தோஷம் உள்ளது' : 'செவ்வாய் தோஷம் இல்லை';

      // Find Nakshatra Parigaram details
      const parigaram = findNakshatraParigaram(nakshatra);

      let text = `வணக்கம் **${name}** அவர்களே! உங்கள் ஜாதகக் கணிப்புகளின் அடிப்படையிலான ஜோதிட வழிகாட்டல் இதோ:\n\n`;
      text += `### 🌟 ஜாதக அடிப்படைக் கூறுகள்\n`;
      text += `* **லக்னம்**: ${lagna} (அதிபதி: ${lagnaLord})\n`;
      text += `* **ராசி**: ${rasi} (அதிபதி: ${rasiLord})\n`;
      text += `* **நட்சத்திரம்**: ${nakshatra} (பாதம் ${pada}, அதிபதி: ${nakLord})\n`;
      text += `* **செவ்வாய் தோஷம்**: ${sevvai}\n\n`;

      if (topic === 'career') {
        text += `### 💼 தொழில் மற்றும் உத்தியோக ஆய்வு (Career & Business Guidance)\n`;
        text += `உங்கள் லக்னமான **${lagna}** மற்றும் ராசியான **${rasi}** அடிப்படையில், 10-ஆம் பாவகம் உங்களின் கர்ம ஸ்தானத்தைக் குறிக்கிறது.\n\n`;
        text += `* **ஏற்ற தொழில் துறைகள்**: தகவல் தொழில்நுட்பம் (IT & Software), மேலாண்மை, வர்த்தகம், கல்வி, ஆலோசனை, நிதி மற்றும் மக்கள் தொடர்புத் துறைகளில் நீங்கள் விரைவான முன்னேற்றமும் புகழும் அடைய வாய்ப்புகள் பிரகாசமாக உள்ளன.\n`;
        text += `* **சுய தொழில் / வியாபாரம்**: நீங்கள் சொந்தமாக தொழில் தொடங்க நினைத்தால், புதன் மற்றும் குருவின் ஆசி பெற்ற வியாபாரம், சேவைத் துறை (Service Sector) அல்லது தொழில்நுட்பத் துறையைத் தேர்ந்தெடுக்கலாம்.\n\n`;

        text += `### 🧭 சாதகமான திசைகள் (Auspicious Directions Analysis)\n`;
        text += `நீங்கள் குறிப்பிட்ட திசை சார்ந்த கேள்விக்கான ஆழமான ஜோதிட விளக்கம்:\n\n`;
        text += `1. **வடக்கு திசை (North - புதன் பகவான்)**:\n`;
        text += `   * புதன் அறிவு, வர்த்தகம், கணிதம் மற்றும் தகவல் தொடர்புக்கு அதிபதி.\n`;
        text += `   * நீங்கள் தகவல் தொழில்நுட்பம் (IT), கம்ப்யூட்டர், மென்பொருள், ஆடிட்டிங், இணைய வர்த்தகம் அல்லது புத்திசாலித்தனமான வியாபாரம் தொடங்க வடக்கு திசை **மிகவும் சாதகமான வெற்றியைத் தரும்**.\n\n`;
        text += `2. **கிழக்கு திசை (East - சூரிய பகவான் & குரு)**:\n`;
        text += `   * சூரியன் ஆன்ம காரகன், அதிகாரத்திற்கும் தலைமைத்துவத்திற்கும் அதிபதி.\n`;
        text += `   * அரசு சார்ந்த பணிகள், நிர்வாக தலைமைப் பதவிகள், கல்வி நிறுவனங்கள், மருத்துவத் துறை மற்றும் உயர்மட்ட வியாபாரக் கூட்டாண்மைகளுக்கு கிழக்கு திசை **மரியாதையையும் புகழையும் பெற்றுத்தரும்**.\n\n`;
        text += `> **வழிகாட்டல் முடிவு**: உங்கள் லக்னம் மற்றும் ராசி பலத்தின்படி, வர்த்தகம் மற்றும் தொழில்நுட்ப வளர்ச்சிக்கு **வடக்கு திசையும்**, அதிகாரம் மற்றும் நிர்வாக வளர்ச்சிக்கு **கிழக்கு திசையும்** இரண்டும் யோகமானவை. ஆரம்ப கட்டத்தில் உங்கள் தற்போதைய இருப்பிடத்திலிருந்து **வடக்கு அல்லது வடகிழக்கு (ஈசானியம்)** நோக்கி அடியெடுத்து வைப்பது மிகச் சிறந்த சுப பலன்களை வழங்கும்.\n\n`;

      } else if (topic === 'marriage') {
        text += `### 💍 திருமணம் & தாம்பத்திய ஆய்வு (Marriage & Relationships)\n`;
        text += `* **களத்திர ஸ்தானம் (7-ஆம் பாவம்)**: உங்கள் லக்னமான ${lagna}-க்குரிய 7-ஆம் அதிபதி மற்றும் களத்திர காரகன் சுக்கிரனின் அமைப்பு திருமண பந்தத்தை நிர்ணயிக்கிறது.\n`;
        text += `* **தோஷ நிலை**: உங்கள் ஜாதகத்தில் **${sevvai}**. எனவே குடும்ப வாழ்க்கை சீராக அமைய பரஸ்பர புரிதலும் நல்ல பொருத்தமும் அவசியமாகும்.\n`;
        text += `* **பொருத்தமான திசை**: உங்கள் பிறப்பிடத்திலிருந்து கிழக்கு அல்லது வடக்கு திசையில் இருந்து வரன் அமைய அதிக வாய்ப்புள்ளது.\n`;
        text += `* **பரிகாரம்**: வெள்ளிக்கிழமைகளில் மகாலட்சுமி தாயாருக்கு நெய்தீபம் ஏற்றி வழிபட திருமணத் தடைகள் நீங்கி நல்வாழ்க்கை அமையும்.\n\n`;

      } else if (topic === 'parigaram') {
        text += `### 🪔 நட்சத்திர பரிகார ஸ்தலம் & வழிபாடு (Remedy & Temple)\n`;
        if (parigaram) {
          text += `உங்கள் ஜென்ம நட்சத்திரமான **${nakshatra}**-க்குரிய பரிகார விபரம்:\n\n`;
          text += `* **பரிகாரத் திருத்தலம்**: ${parigaram.temple}\n`;
          text += `* **அமைவிடம்**: ${parigaram.temple_place}\n`;
          text += `* **மூலவர் & தெய்வம்**: ${parigaram.deity}\n`;
          text += `* **தல விருட்சம்**: ${parigaram.maram}\n`;
          text += `* **மிருகம் / பட்சி**: ${parigaram.mirugam} / ${parigaram.pakshi}\n`;
          text += `* **தலச் சிறப்பு**: ${parigaram.temple_desc}\n\n`;
          text += `* **வழிபாட்டு முறை**: ${parigaram.remedy}\n\n`;
          if (parigaram.gayatri) {
            text += `* **நட்சத்திர காயத்ரி மந்திரம்**:\n  _"${parigaram.gayatri}"_\n\n`;
          }
        } else {
          text += `உங்கள் நட்சத்திர நாளான **${nakshatra}** அன்று அருகிலுள்ள சிவாலயம் அல்லது பெருமாள் கோவிலில் நெய் தீபம் ஏற்றி அர்ச்சனை செய்வது சகல தோஷங்களையும் நிவர்த்தி செய்யும்.\n\n`;
        }

      } else {
        text += `### 🔮 பொதுவான வாழ்க்கை வழிகாட்டல்\n`;
        text += `* லக்னாதிபதி **${lagnaLord}** மற்றும் ராசிநாதன் **${rasiLord}** பலம் உங்கள் தனித்துவமான திறன்களையும் ஆற்றலையும் உயர்த்துகிறது.\n`;
        text += `* உங்கள் அறிவாற்றலும் விடாமுயற்சியும் உங்களை எந்தவொரு கடினமான சூழ்நிலையிலும் வழிநடத்தும்.\n`;
        text += `* முக்கியமான காரியங்களை உங்கள் ஜென்ம நட்சத்திர நாளிலும், சுப திதிகளிலும் தொடங்குவது தொடர் வெற்றியைத் தரும்.\n\n`;
      }

      // Add Nakshatra Temple highlight if not already detailed in parigaram section
      if (topic !== 'parigaram' && parigaram) {
        text += `### ⛩️ ஜென்ம நட்சத்திர பரிகார ஸ்தலம்\n`;
        text += `உங்கள் நட்சத்திரமான **${nakshatra}**-க்குரிய சிறப்புத் திருத்தலம்: **${parigaram.temple}** (${parigaram.temple_place}). இந்த தலத்தில் வழிபட சகல காரியத் தடைகளும் நீங்கி சுபிட்சம் பெருகும்.\n\n`;
      }

      text += `> ⚠️ **குறிப்பு**: இது ஒரு பொதுவான ஜோதிட வழிகாட்டல் மட்டுமே (Guidance Only). உங்கள் ஜாதகத்தை முழுமையாக ஆராய்ந்து நேரில் வழிகாட்டல் பெற கீழே உள்ள **Slot பதிவு செய்யுங்கள்** பொத்தானைப் பயன்படுத்தி ஆலோசனையை முன்பதிவு செய்யலாம்.`;

      return text;
    }

    /* Helper: Find Parigaram for Nakshatra */
    function findNakshatraParigaram(nakName) {
      if (!nakName) return null;
      const clean = nakName.trim().toLowerCase();
      if (parigaramList && parigaramList.length > 0) {
        const found = parigaramList.find(p => {
          const nTa = (p.nakshatram || '').toLowerCase();
          const nEn = (p.name_en || '').toLowerCase();
          return clean.includes(nTa) || nTa.includes(clean) || clean.includes(nEn) || nEn.includes(clean);
        });
        if (found) return found;
      }
      return null;
    }

    /* ---------------- Format Bot Markdown Reply to HTML ---------------- */
    function formatBotReply(text) {
      if (!text) return '';
      let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Headings: ### Header or ## Header
      html = html.replace(/^###\s*(.+)$/gm, '<h4 class="bot-heading">$1</h4>');
      html = html.replace(/^##\s*(.+)$/gm, '<h3 class="bot-heading">$1</h3>');

      // Bold: **text**
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

      // Bullet points: * or -
      html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
      html = html.replace(/(<li>.+<\/li>\n?)+/g, '<ul class="bot-list">$&</ul>');

      // Paragraph spacing
      html = html.replace(/\n\n/g, '<div style="height:8px;"></div>');
      html = html.replace(/\n/g, '<br>');

      return html;
    }

    /* ---------------- Utility Helpers ---------------- */
    function p2(n) { return String(n).padStart(2, '0'); }
    function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

    function isValidDOB(str) {
      if (!str) return false;
      const parts = str.split('/');
      if (parts.length !== 3) return false;
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      return (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1920 && y <= 2030);
    }

    function isValidTOB(str) {
      if (!str) return false;
      const parts = str.split(':');
      if (parts.length < 2) return false;
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      return (h >= 0 && h <= 23 && m >= 0 && m <= 59);
    }

    // Launch initial chat
    startChat();
  });
})();