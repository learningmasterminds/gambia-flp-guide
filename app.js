/**
 * Gambia FLP - Interactive Teacher Guide Application Logic
 * Multi-language ECD 2 Term 1 (8 languages of instruction)
 */

// Initialize Telegram WebApp SDK if present
if (window.Telegram && window.Telegram.WebApp) {
  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();
  if (tg.setHeaderColor) {
    tg.setHeaderColor('#091a24');
  }
}

// State Management
const state = {
  currentGrade: 'ecd3',
  currentLanguage: 'wolof',
  currentWeek: 1,
  currentDay: 1,
  curriculumData: null,
  activeLesson: null,
  timerSeconds: 1800, // 30 minutes
  timerInterval: null,
  timerRunning: false,
  isPlayingAudio: false,
  audioElement: null,
  activeTracks: [],
  selectedTrackIndex: 0
};

// DOM Element References
const elements = {
  weekContainer: document.getElementById('week-scroll-container'),
  dayButtons: document.querySelectorAll('.day-btn'),
  heroBadge: document.getElementById('hero-lesson-badge'),
  heroTypeBadge: document.getElementById('hero-type-badge'),
  heroTitle: document.getElementById('hero-lesson-title'),
  heroTheme: document.getElementById('hero-lesson-theme'),
  heroLetter: document.getElementById('hero-target-letter'),
  heroVocab: document.getElementById('hero-vocab-words'),
  heroRoutine: document.getElementById('hero-routine-summary'),
  outcomesList: document.getElementById('outcomes-list'),
  materialsTags: document.getElementById('materials-tags'),
  stepsList: document.getElementById('steps-list'),
  homeworkText: document.getElementById('homework-text'),
  timerClock: document.getElementById('timer-clock'),
  timerStatus: document.getElementById('timer-status'),
  timerStartBtn: document.getElementById('timer-start-btn'),
  timerResetBtn: document.getElementById('timer-reset-btn'),
  timerProgressFill: document.getElementById('timer-progress-fill'),
  audioBtn: document.getElementById('play-audio-btn'),
  audioTitle: document.getElementById('audio-title'),
  audioSub: document.getElementById('audio-sub'),
  playBtnText: document.getElementById('play-btn-text'),
  playIcon: document.getElementById('play-icon'),
  audioTracksRow: document.getElementById('audio-tracks-row'),
  audioProgressWrap: document.getElementById('audio-progress-wrap'),
  audioTimeCurrent: document.getElementById('audio-time-current'),
  audioTimeDuration: document.getElementById('audio-time-duration'),
  audioSeekerFill: document.getElementById('audio-seeker-fill'),
  searchOverlay: document.getElementById('search-overlay'),
  searchToggleBtn: document.getElementById('search-toggle-btn'),
  searchCloseBtn: document.getElementById('search-close-btn'),
  searchInput: document.getElementById('search-input'),
  searchResults: document.getElementById('search-results'),
  aiCoachBtn: document.getElementById('ai-coach-btn'),
  coachModal: document.getElementById('coach-modal-overlay'),
  coachCloseBtn: document.getElementById('coach-close-btn'),
  coachMessages: document.getElementById('coach-messages'),
  coachInput: document.getElementById('coach-input'),
  coachSendBtn: document.getElementById('coach-send-btn'),
  coachPrompts: document.getElementById('coach-prompts'),
  shareBtn: document.getElementById('share-lesson-btn'),
  printBtn: document.getElementById('print-lesson-btn'),
  toast: document.getElementById('toast-notification')
};

// Toast notification helper
function showToast(msg, duration = 3000) {
  elements.toast.textContent = msg;
  elements.toast.classList.remove('hidden');
  setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, duration);
}

// Grade registry
const GRADES = {
  ecd2: { label: 'ECD 2 · Term 1', code: 'ECD 2' },
  ecd3: { label: 'ECD 3 · Term 1', code: 'ECD 3' }
};

const DEFAULT_GRADE = 'ecd3';
const DEFAULT_LANGUAGE = 'wolof';

// Language registry
const LANGUAGES = {
  wolof:    { label: 'Wolof' },
  seereer:  { label: 'Seereer' },
  mandinka: { label: 'Mandinka' },
  pulaar:   { label: 'Pulaar' },
  jola:     { label: 'Jola' },
  soninke:  { label: 'Soninke' },
  manjaku:  { label: 'Manjaku' },
  english:  { label: 'English' }
};

// Curriculum data files by grade and language
const CURRICULUM_FILES = {
  ecd2: {
    wolof:    { label: 'Wolof',    file: './data/wolof_ecd2_term1.json',    audioDir: 'wolof' },
    seereer:  { label: 'Seereer',  file: './data/seereer_ecd2_term1.json',  audioDir: null },
    mandinka: { label: 'Mandinka', file: './data/mandinka_ecd2_term1.json', audioDir: null },
    pulaar:   { label: 'Pulaar',   file: './data/pulaar_ecd2_term1.json',   audioDir: null },
    jola:     { label: 'Jola',     file: './data/jola_ecd2_term1.json',     audioDir: null },
    soninke:  { label: 'Soninke',  file: './data/soninke_ecd2_term1.json',  audioDir: null },
    manjaku:  { label: 'Manjaku',  file: './data/manjaku_ecd2_term1.json',  audioDir: null },
    english:  { label: 'English',  file: './data/english_ecd2_term1.json',  audioDir: null }
  },
  ecd3: {
    wolof:    { label: 'Wolof',    file: './data/wolof_ecd3_term1.json',    audioDir: null },
    seereer:  { label: 'Seereer',  file: './data/seereer_ecd3_term1.json',  audioDir: null },
    mandinka: { label: 'Mandinka', file: './data/mandinka_ecd3_term1.json', audioDir: null },
    pulaar:   { label: 'Pulaar',   file: './data/pulaar_ecd3_term1.json',   audioDir: null },
    jola:     { label: 'Jola',     file: './data/jola_ecd3_term1.json',     audioDir: null },
    soninke:  { label: 'Soninke',  file: './data/soninke_ecd3_term1.json',  audioDir: null },
    manjaku:  { label: 'Manjaku',  file: './data/manjaku_ecd3_term1.json',  audioDir: null },
    english:  { label: 'English',  file: './data/english_ecd3_term1.json',  audioDir: null }
  }
};

// Audio tracks catalog scoped by grade -> language -> week
const AUDIO_TRACK_CATALOG = {
  ecd2: {
    wolof: {
      1: [
        {
          id: 'w01_song',
          type: 'song',
          title: '🎵 Song: Yaay Bóoy fan ngaa dem yow',
          subtitle: 'Traditional rhythm chant for oral routine',
          sources: ['./audio/wolof/wol_ecd2_w01_song.m4a', './audio/wolof/wol_ecd2_w01_song.mp4']
        },
        {
          id: 'w01_letter_a',
          type: 'letter',
          title: '🔤 Letter Sound: /a/ (almoor)',
          subtitle: 'Phonemic pronunciation & teacher model',
          sources: ['./audio/wolof/wol_ecd2_w01_letter_a.ogg', './audio/wolof/wol_ecd2_w01_letter_a.mp3.ogg']
        },
        {
          id: 'w01_vocab',
          type: 'vocab',
          title: '🗣️ Vocabulary: golo · banaana',
          subtitle: 'Target key vocabulary pronunciation',
          sources: ['./audio/wolof/wol_ecd2_w01_vocab.ogg', './audio/wolof/wol_ecd2_w01_vocab.mp3.ogg']
        },
        {
          id: 'w01_story',
          type: 'story',
          title: '📖 Story: Golo gi ak banaana bi',
          subtitle: 'Full expressive story read-aloud',
          sources: ['./audio/wolof/wol_ecd2_w01_story.ogg', './audio/wolof/wol_ecd2_w01_story.mp3.ogg']
        }
      ]
    }
  },
  ecd3: {}
};

// Current language label, for UI strings that must name the language.
function currentLanguageLabel() {
  const meta = state.curriculumData && state.curriculumData.metadata;
  if (meta && meta.language) return meta.language;
  const entry = LANGUAGES[state.currentLanguage];
  return entry ? entry.label : '';
}

// Current grade label
function currentGradeLabel() {
  const meta = state.curriculumData && state.curriculumData.metadata;
  if (meta && meta.grade) return meta.grade;
  const entry = GRADES[state.currentGrade];
  return entry ? entry.code : 'ECD 3';
}

// Tracks for the active grade, language and week, or [] when none are recorded.
function tracksFor(langKey, week) {
  const gradeKey = state.currentGrade || 'ecd3';
  const byGrade = AUDIO_TRACK_CATALOG[gradeKey];
  if (!byGrade) return [];
  const byLang = byGrade[langKey];
  if (!byLang) return [];
  return byLang[week] || [];
}

// Switch Grade Dynamically
async function switchGrade(gradeKey) {
  if (!GRADES[gradeKey]) {
    console.error('Unknown grade:', gradeKey);
    return;
  }
  await switchCurriculum(state.currentLanguage, gradeKey);
}

// Switch Language Dynamically
async function switchLanguage(langKey) {
  if (!LANGUAGES[langKey]) {
    console.error('Unknown language:', langKey);
    showToast('⚠️ Unknown language selected.');
    return;
  }
  await switchCurriculum(langKey, state.currentGrade);
}

// Switch Curriculum (Language & Grade)
async function switchCurriculum(langKey, gradeKey) {
  const gradeTable = CURRICULUM_FILES[gradeKey];
  const entry = gradeTable ? gradeTable[langKey] : null;
  if (!entry) {
    console.error('Unknown dataset:', gradeKey, langKey);
    showToast('⚠️ Dataset not found.');
    return;
  }

  // Stop audio playback
  stopAudioPlayback();
  state.activeTracks = [];
  state.selectedTrackIndex = 0;

  let data;
  try {
    const res = await fetch(entry.file);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    data = await res.json();
  } catch (err) {
    console.error('Failed to load dataset', gradeKey, langKey, err);
    showToast(`⚠️ Could not load ${entry.label} ${GRADES[gradeKey].code}. Still showing ${currentLanguageLabel()} ${currentGradeLabel()}.`);
    syncSelects();
    return;
  }

  state.currentGrade = gradeKey;
  state.currentLanguage = langKey;
  state.curriculumData = data;
  state.currentWeek = 1;
  state.currentDay = 1;
  applyLanguageChrome();
  renderWeekPills();
  elements.dayButtons.forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.day, 10) === 1);
  });
  loadLesson(1, 1);
  showToast(`🗣️ Switched to ${currentLanguageLabel()} ${currentGradeLabel()}`);
}

// Keep select inputs in step with state
function syncSelects() {
  const lSel = document.getElementById('language-select');
  if (lSel && lSel.value !== state.currentLanguage) lSel.value = state.currentLanguage;
  const gSel = document.getElementById('grade-select');
  if (gSel && gSel.value !== state.currentGrade) gSel.value = state.currentGrade;
}

// Language and grade specific chrome
function applyLanguageChrome() {
  const label = currentLanguageLabel();
  const gLabel = currentGradeLabel();
  document.title = `Gambia FLP - Interactive Teacher Guide (${label} ${gLabel})`;
  const sub = document.getElementById('audio-sub');
  if (sub) sub.textContent = `Select a track to listen in ${label}`;
  syncSelects();
}

// Load Curriculum Data
async function loadCurriculum() {
  const params = new URLSearchParams(location.search);
  const wantedLang = (params.get('lang') || '').toLowerCase();
  if (LANGUAGES[wantedLang]) state.currentLanguage = wantedLang;

  const wantedGrade = (params.get('grade') || '').toLowerCase();
  if (GRADES[wantedGrade]) state.currentGrade = wantedGrade;

  const wk = parseInt(params.get('week'), 10);
  const dy = parseInt(params.get('day'), 10);
  if (wk >= 1 && wk <= 10) state.currentWeek = wk;
  if (dy >= 1 && dy <= 5) state.currentDay = dy;

  const gradeTable = CURRICULUM_FILES[state.currentGrade] || CURRICULUM_FILES[DEFAULT_GRADE];
  const entry = gradeTable[state.currentLanguage] || gradeTable[DEFAULT_LANGUAGE];
  try {
    const res = await fetch(entry.file);
    if (!res.ok) throw new Error('Failed to load JSON: HTTP ' + res.status);
    state.curriculumData = await res.json();
  } catch (err) {
    console.error('Curriculum data failed to load:', err);
    showToast('Could not load lesson data. Check your connection and reload.', 6000);
    return;
  }
  applyLanguageChrome();
  initApp();
}

let listenersInitialized = false;

// Initialize Application UI
function initApp() {
  renderWeekPills();
  if (!listenersInitialized) {
    setupEventListeners();
    listenersInitialized = true;
  }
  loadLesson(state.currentWeek, state.currentDay);
}

// Render Week Selector Pills
function renderWeekPills() {
  elements.weekContainer.innerHTML = '';
  const totalWeeks = state.curriculumData.metadata.total_weeks || 10;

  for (let w = 1; w <= totalWeeks; w++) {
    const pill = document.createElement('button');
    pill.className = `week-pill ${w === state.currentWeek ? 'active' : ''}`;
    pill.dataset.week = w;
    
    // Find week theme from first lesson of that week
    const firstLesson = state.curriculumData.lessons.find(l => l.week === w);
    const themeName = firstLesson && firstLesson.theme ? ` · ${firstLesson.theme}` : '';
    pill.textContent = `Week ${w}${themeName}`;

    pill.addEventListener('click', () => {
      document.querySelectorAll('.week-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.currentWeek = w;
      loadLesson(state.currentWeek, state.currentDay);
    });

    elements.weekContainer.appendChild(pill);
  }
}

// Load and Render Active Lesson
function loadLesson(week, day) {
  if (!state.curriculumData) return;

  const lesson = state.curriculumData.lessons.find(l => l.week === week && l.day_number === day);
  if (!lesson) {
    console.error(`Lesson not found for Week ${week}, Day ${day}`);
    return;
  }

  state.activeLesson = lesson;

  // Stop any active audio when switching lessons
  stopAudioPlayback();

  // Update Hero Card Meta
  elements.heroBadge.textContent = `Lesson ${lesson.lesson_number}`;
  elements.heroTypeBadge.textContent = lesson.lesson_type;
  elements.heroTitle.textContent = `Week ${lesson.week}, Day ${lesson.day_number} (${lesson.day_name}): ${lesson.lesson_type}`;
  elements.heroTheme.innerHTML = `Weekly Theme: <strong>${escapeHtml(lesson.theme || 'Not specified')}</strong>`;

  // Specs
  // target_letter is absent for most lessons across every language; say so
  // rather than implying an alphabet-chant lesson that may not be one.
  const heroLetter = (lesson.target_letter || '').trim();
  elements.heroLetter.textContent = heroLetter && heroLetter.length <= 3 ? heroLetter : '—';
  elements.heroVocab.textContent = lesson.vocabulary && lesson.vocabulary.length > 0
    ? lesson.vocabulary.join(' · ')
    : '—';
  
  const routineSteps = lesson.activities.map(a => a.title).slice(0, 3).join(' → ');
  elements.heroRoutine.textContent = routineSteps || 'Oral Language → Sounds → Writing';

  // Setup Audio Tracks for this Week & Day
  setupAudioForLesson(week, day, lesson);

  // Outcomes
  elements.outcomesList.innerHTML = '';
  if (lesson.learning_outcomes && lesson.learning_outcomes.length > 0) {
    lesson.learning_outcomes.forEach(out => {
      const li = document.createElement('li');
      li.textContent = out;
      elements.outcomesList.appendChild(li);
    });
  } else {
    elements.outcomesList.innerHTML = '<li class="not-extracted">Learning outcomes were not captured for this lesson in the source Teacher Guide.</li>';
  }

  // Materials
  elements.materialsTags.innerHTML = '';
  if (lesson.materials && lesson.materials.length > 0) {
    lesson.materials.forEach(mat => {
      const span = document.createElement('span');
      span.className = 'tag-item';
      span.textContent = mat;
      elements.materialsTags.appendChild(span);
    });
  } else {
    elements.materialsTags.innerHTML = '<span class="tag-item not-extracted">Not listed in the source guide</span>';
  }

  // Steps Guidance
  elements.stepsList.innerHTML = '';
  lesson.activities.forEach((act, idx) => {
    const card = document.createElement('div');
    card.className = 'step-card';

    // Check if step has an associated audio track to show inline play button
    let stepAudioBtn = '';
    // Order matters: 'song' is checked before 'sound', otherwise a step called
    // "Learning Sounds" matches the song branch and offers the wrong track.
    const lowerTitle = act.title.toLowerCase();
    const has = (type) => state.activeTracks.some(t => t.type === type);
    let stepTrack = null;
    let stepLabel = '';
    if (lowerTitle.includes('song') || lowerTitle.includes('wóy') || lowerTitle.includes('chant') || lowerTitle.includes('rhyme')) {
      stepTrack = 'song'; stepLabel = '▶️ Song';
    } else if (lowerTitle.includes('sound') || lowerTitle.includes('letter') || lowerTitle.includes('araf') || lowerTitle.includes('alphabet')) {
      // No hardcoded '/a/' fallback: that was Wolof week 1 leaking into every
      // other language and week.
      const tl = (lesson.target_letter || '').trim();
      stepTrack = 'letter';
      stepLabel = tl && tl.length <= 3 ? `▶️ Letter /${tl}/` : '▶️ Letter Sound';
    } else if (lowerTitle.includes('read aloud') || lowerTitle.includes('story') || lowerTitle.includes('léeb')) {
      stepTrack = 'story'; stepLabel = '▶️ Story';
    } else if (lowerTitle.includes('vocabulary') || lowerTitle.includes('baat')) {
      stepTrack = 'vocab'; stepLabel = '▶️ Vocab';
    }
    // Only offer a button when that track exists for this week, so teachers
    // are not given a control that silently does nothing.
    if (stepTrack && has(stepTrack)) {
      stepAudioBtn = `<button class="step-audio-btn" onclick="playStepTrack('${stepTrack}')">${stepLabel}</button>`;
    }

    // Format content cleanly into structured HTML
    const formattedHtml = formatActivityContent(act.content);

    card.innerHTML = `
      <div class="step-card-header">
        <div class="step-title-wrap">
          <div class="step-num-badge">${act.step || idx + 1}</div>
          <div class="step-title">${escapeHtml(act.title)}</div>
        </div>
        ${stepAudioBtn}
        ${act.duration_mins ? `<span class="step-duration">⏱️ ${act.duration_mins} mins</span>` : ''}
      </div>
      <div class="step-body">${formattedHtml}</div>
    `;

    elements.stepsList.appendChild(card);
  });

  // Homework
  if (lesson.homework) {
    elements.homeworkText.classList.remove('not-extracted');
    elements.homeworkText.textContent = lesson.homework;
  } else {
    elements.homeworkText.textContent = 'No homework was specified for this lesson in the source Teacher Guide.';
    elements.homeworkText.classList.add('not-extracted');
  }

  // Reset timer to 30:00 on new lesson load
  resetTimer();
}

// Clean Structured Formatter for Activity Content

// Re-join hard-wrapped continuation lines onto the bullet they belong to,
// so a wrapped sentence is not broken out into its own paragraph.
function coalesceLines(content) {
  const raw = content.split('\n');
  const out = [];
  const isBullet = (t) => /^[•-]\s*/.test(t);

  for (let i = 0; i < raw.length; i++) {
    const line = raw[i].trim();
    if (!line) continue;

    if (isBullet(line)) {
      out.push(line);
      continue;
    }

    // The next non-empty source line decides heading vs. continuation.
    let next = '';
    for (let j = i + 1; j < raw.length; j++) {
      if (raw[j].trim()) { next = raw[j].trim(); break; }
    }

    const looksLikeHeading =
      line.length < 50 &&
      !/[.,;:]$/.test(line) &&
      !line.includes(':') &&
      isBullet(next);

    const prevIsBullet = out.length > 0 && isBullet(out[out.length - 1]);

    if (prevIsBullet && !looksLikeHeading) {
      out[out.length - 1] += ' ' + line;
    } else {
      out.push(line);
    }
  }
  return out;
}

function formatActivityContent(content) {
  if (!content) return '';

  const lines = coalesceLines(content);
  const isBullet = (t) => /^[•-]\s*/.test(t);
  let html = '';
  let inBulletList = false;

  const closeList = () => {
    if (inBulletList) { html += '</ul>'; inBulletList = false; }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    if (isBullet(rawLine)) {
      if (!inBulletList) {
        html += '<ul class="step-bullet-list">';
        inBulletList = true;
      }
      const bulletText = rawLine.replace(/^[•-]\s*/, '').trim();

      if (/^(Say|Waxandoor)\s*:\s*/i.test(bulletText)) {
        const sayText = bulletText.replace(/^(Say|Waxandoor)\s*:\s*/i, '');
        html += `<li class="bullet-item"><div class="teacher-dialogue"><strong>🗣️ Say (${escapeHtml(currentLanguageLabel())}):</strong> <em>${escapeHtml(sayText)}</em></div></li>`;
      } else {
        html += `<li class="bullet-item">${escapeHtml(bulletText)}</li>`;
      }
      continue;
    }

    closeList();

    const nextIsBullet = i < lines.length - 1 && isBullet(lines[i + 1]);

    if (rawLine.length < 50 && !/[.,;]$/.test(rawLine) && !rawLine.includes(':') && nextIsBullet) {
      html += `<h4 class="step-subheading">📌 ${escapeHtml(rawLine)}</h4>`;
    } else if (/^(Say|Waxandoor)\s*:\s*/i.test(rawLine)) {
      const sayText = rawLine.replace(/^(Say|Waxandoor)\s*:\s*/i, '');
      html += `<div class="teacher-dialogue"><strong>🗣️ Say:</strong> <em>${escapeHtml(sayText)}</em></div>`;
    } else if (/^(Words|Baat yi)\s*:\s*/i.test(rawLine)) {
      html += `<div class="words-highlight-box"><strong>🔤 ${escapeHtml(rawLine)}</strong></div>`;
    } else {
      html += `<p class="step-paragraph">${escapeHtml(rawLine)}</p>`;
    }
  }

  closeList();
  return html;
}

// Setup Audio Tracks and Selector Chips
function setupAudioForLesson(week, day, lesson) {
  // Scoped to the active language. A language with no recordings yet gets an
  // empty list -- it must never inherit another language's tracks.
  const weekTracks = tracksFor(state.currentLanguage, week);

  state.activeTracks = weekTracks;

  if (weekTracks.length === 0) {
    state.selectedTrackIndex = 0;
    renderAudioTrackChips();
    showAudioEmptyState();
    return;
  }

  // Prefer the story track on a read-aloud day.
  if ((lesson.lesson_type || '').includes('Read Aloud')) {
    const storyIdx = weekTracks.findIndex(t => t.type === 'story');
    state.selectedTrackIndex = storyIdx >= 0 ? storyIdx : 0;
  } else {
    state.selectedTrackIndex = 0;
  }

  renderAudioTrackChips();
  updateAudioPlayerDisplay();
}

// Shown when the active language/week has no studio recordings yet.
function showAudioEmptyState() {
  const label = currentLanguageLabel();
  const titleEl = document.getElementById('audio-title');
  const subEl = document.getElementById('audio-sub');
  const playBtn = document.getElementById('play-audio-btn');
  const progressWrap = document.getElementById('audio-progress-wrap');
  const bar = document.getElementById('audio-companion-bar');

  if (titleEl) titleEl.textContent = 'Audio companion not yet available';
  if (subEl) subEl.textContent = `Studio recordings for ${label} are still in production.`;
  if (playBtn) {
    playBtn.disabled = true;
    playBtn.classList.remove('is-playing');
    playBtn.setAttribute('aria-disabled', 'true');
  }
  if (progressWrap) progressWrap.classList.add('hidden');
  if (bar) bar.classList.add('audio-unavailable');
}

// Render Track Selection Chips
function renderAudioTrackChips() {
  const container = document.getElementById('audio-tracks-row');
  if (!container) return;
  container.innerHTML = '';

  state.activeTracks.forEach((track, idx) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `track-chip ${idx === state.selectedTrackIndex ? 'active' : ''}`;
    chip.innerHTML = track.title;
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      selectAudioTrack(idx);
    });
    container.appendChild(chip);
  });
}

function selectAudioTrack(idx) {
  if (idx < 0 || idx >= state.activeTracks.length) return;
  const wasPlaying = state.isPlayingAudio;
  stopAudioPlayback();
  state.selectedTrackIndex = idx;
  renderAudioTrackChips();
  updateAudioPlayerDisplay();
  if (wasPlaying) {
    startAudioPlayback();
  }
}

function updateAudioPlayerDisplay() {
  const track = state.activeTracks[state.selectedTrackIndex];
  if (!track) return;
  const titleEl = document.getElementById('audio-title');
  const subEl = document.getElementById('audio-sub');
  const btnTextEl = document.getElementById('play-btn-text');
  const playBtn = document.getElementById('play-audio-btn');
  const playIcon = document.getElementById('play-icon');
  const progressWrap = document.getElementById('audio-progress-wrap');

  const bar = document.getElementById('audio-companion-bar');
  if (bar) bar.classList.remove('audio-unavailable');
  if (playBtn) {
    playBtn.disabled = false;
    playBtn.removeAttribute('aria-disabled');
  }
  if (titleEl) titleEl.textContent = track.title;
  if (subEl) subEl.textContent = track.subtitle;
  if (btnTextEl) btnTextEl.textContent = 'Listen';
  if (playBtn) playBtn.classList.remove('is-playing');
  if (playIcon) playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
  if (progressWrap) progressWrap.classList.add('hidden');
}

// Helper: Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Sticky Header Timer Logic
function updateTimerDisplay() {
  const mins = Math.floor(state.timerSeconds / 60);
  const secs = state.timerSeconds % 60;
  elements.timerClock.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Update progress bar
  if (elements.timerProgressFill) {
    const pct = ((1800 - state.timerSeconds) / 1800) * 100;
    elements.timerProgressFill.style.width = `${pct}%`;
  }

  // Warning colors
  if (state.timerRunning) {
    if (state.timerSeconds <= 300) {
      elements.timerClock.className = 'timer-clock timer-warning';
    } else {
      elements.timerClock.className = 'timer-clock timer-running';
    }
  } else {
    elements.timerClock.className = 'timer-clock';
  }
}

function startTimer() {
  if (state.timerRunning) {
    clearInterval(state.timerInterval);
    state.timerRunning = false;
    elements.timerStartBtn.textContent = 'Resume';
    elements.timerStatus.textContent = 'Paused';
    updateTimerDisplay();
    return;
  }

  state.timerRunning = true;
  elements.timerStartBtn.textContent = 'Pause';
  elements.timerResetBtn.classList.remove('hidden');
  elements.timerStatus.textContent = 'In progress';
  updateTimerDisplay();

  state.timerInterval = setInterval(() => {
    if (state.timerSeconds > 0) {
      state.timerSeconds--;
      updateTimerDisplay();
      if (state.timerSeconds === 300) {
        showToast('⏱️ 5 Minutes remaining in this 30-min lesson!');
      }
    } else {
      clearInterval(state.timerInterval);
      state.timerRunning = false;
      elements.timerStatus.textContent = 'Done 🎉';
      elements.timerStartBtn.textContent = 'Restart';
      showToast('🎉 30-Minute Lesson Complete!');
      updateTimerDisplay();
      playChime();
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(state.timerInterval);
  state.timerRunning = false;
  state.timerSeconds = 1800;
  updateTimerDisplay();
  elements.timerStartBtn.textContent = 'Start';
  elements.timerStatus.textContent = 'Ready';
  elements.timerResetBtn.classList.add('hidden');
  if (elements.timerProgressFill) {
    elements.timerProgressFill.style.width = '0%';
  }
}

// HTML5 Real Audio Playback Engine
function toggleAudioPlayback() {
  if (state.isPlayingAudio) {
    stopAudioPlayback();
  } else {
    startAudioPlayback();
  }
}

function startAudioPlayback() {
  const track = state.activeTracks[state.selectedTrackIndex];
  if (!track) return;

  if (state.audioElement) {
    state.audioElement.pause();
    state.audioElement = null;
  }

  state.isPlayingAudio = true;
  if (elements.playBtnText) elements.playBtnText.textContent = 'Playing...';
  if (elements.audioBtn) elements.audioBtn.classList.add('is-playing');
  if (elements.playIcon) elements.playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';

  if (elements.audioProgressWrap) {
    elements.audioProgressWrap.classList.remove('hidden');
  }

  // Create audio element with source cascade
  const audio = new Audio();
  state.audioElement = audio;

  let sourceIndex = 0;
  let handledIndex = -1;
  // onerror and play().catch can both fire for one failure; only advance once.
  function failCurrentSource(err) {
    if (err && err.name === 'NotAllowedError') {
      showToast('Tap the Listen button to start audio.');
      stopAudioPlayback();
      return;
    }
    const idx = sourceIndex - 1;
    if (idx === handledIndex) return;
    handledIndex = idx;
    tryNextSource();
  }
  function tryNextSource() {
    if (sourceIndex < track.sources.length) {
      audio.src = track.sources[sourceIndex];
      sourceIndex++;
      audio.load();
      audio.play().catch(e => {
        console.warn(`Source ${audio.src} failed, trying next`, e);
        failCurrentSource(e);
      });
    } else {
      console.log('No local audio file found, using audio tone model');
      playChime();
      showToast(`🎙️ Audio model: ${track.title}`);
      setTimeout(() => {
        stopAudioPlayback();
      }, 3500);
    }
  }

  audio.addEventListener('timeupdate', () => {
    if (audio.duration && elements.audioSeekerFill) {
      const pct = (audio.currentTime / audio.duration) * 100;
      elements.audioSeekerFill.style.width = `${pct}%`;
      const curM = Math.floor(audio.currentTime / 60);
      const curS = Math.floor(audio.currentTime % 60);
      const durM = Math.floor(audio.duration / 60);
      const durS = Math.floor(audio.duration % 60);
      elements.audioTimeCurrent.textContent = `${curM}:${String(curS).padStart(2, '0')}`;
      elements.audioTimeDuration.textContent = `${durM}:${String(durS).padStart(2, '0')}`;
    }
  });

  audio.addEventListener('ended', () => {
    stopAudioPlayback();
  });

  audio.addEventListener('error', () => {
    failCurrentSource();
  });

  tryNextSource();
}

function stopAudioPlayback() {
  if (state.audioElement) {
    state.audioElement.pause();
    state.audioElement = null;
  }
  state.isPlayingAudio = false;
  // Guarded: this runs at the top of loadLesson(), so a missing control must
  // never throw and take the whole lesson render down with it.
  if (elements.playBtnText) elements.playBtnText.textContent = 'Listen';
  if (elements.audioBtn) elements.audioBtn.classList.remove('is-playing');
  if (elements.playIcon) elements.playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
}

// Global helper for in-step play buttons
window.playStepTrack = function(trackType) {
  const idx = state.activeTracks.findIndex(t => t.type === trackType);
  if (idx < 0) return;
  selectAudioTrack(idx);
  startAudioPlayback();
};

// Web Audio Chime / Pronunciation Tone
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.log('Audio not supported', e);
  }
}

// AI Curriculum Coach Logic
function handleCoachQuery(userQuery) {
  if (!userQuery || !userQuery.trim()) return;

  // Append user message
  const userMsgDiv = document.createElement('div');
  userMsgDiv.className = 'coach-msg msg-user';
  userMsgDiv.innerHTML = `<p>${escapeHtml(userQuery)}</p>`;
  elements.coachMessages.appendChild(userMsgDiv);
  elements.coachInput.value = '';
  elements.coachMessages.scrollTop = elements.coachMessages.scrollHeight;

  // Simulate AI Thinking
  const typingDiv = document.createElement('div');
  typingDiv.className = 'coach-msg msg-ai';
  typingDiv.innerHTML = `<p><em>Curriculum coach is formulating response...</em></p>`;
  elements.coachMessages.appendChild(typingDiv);
  elements.coachMessages.scrollTop = elements.coachMessages.scrollHeight;

  setTimeout(() => {
    typingDiv.remove();
    const aiResponse = generateCoachResponse(userQuery, state.activeLesson);
    const aiMsgDiv = document.createElement('div');
    aiMsgDiv.className = 'coach-msg msg-ai';
    aiMsgDiv.innerHTML = `<p>${aiResponse}</p>`;
    elements.coachMessages.appendChild(aiMsgDiv);
    elements.coachMessages.scrollTop = elements.coachMessages.scrollHeight;
  }, 700);
}

// Pedagogical Knowledge Response Generator
function generateCoachResponse(query, lesson) {
  const q = query.toLowerCase();
  const letter = lesson.target_letter || 'a';
  const theme = lesson.theme || 'Community';

  if (q.includes('letter') || q.includes('sound') || q.includes('struggl')) {
    return `<strong>Remediation Strategy for Letter /${letter}/:</strong><br>1. <strong>Auditory Isolation</strong>: Pick a familiar ${currentLanguageLabel()} word starting with <strong>${letter}</strong> and exaggerate the first sound three times before saying the whole word.<br>2. <strong>Visual &amp; Tactile</strong>: Have the pupil trace the shape of '<strong>${letter}</strong>' in the sand tray or on their palm before writing on paper.<br>3. <strong>Peer Model</strong>: Pair the struggling learner with a partner and have them chant the sound together in ${currentLanguageLabel()}.`;
  }
  
  if (q.includes('game') || q.includes('circle') || q.includes('warm up')) {
    return `<strong>Quick 3-Min Circle Time Game:</strong><br>• <strong>'Damaa Def Yëngu' (Action Clapping)</strong>: Clap a rhythmic 3-beat pattern (<em>Tàccu-Tàccu-Tàccu</em>) and have pupils echo it immediately.<br>• <strong>Theme Greeting</strong>: Go around the circle and have each child hold up their right hand (*loxo ndeyjoor*) and greet their neighbour with <em>'Jàmma ngeen fanaan, [Name]!'</em>`;
  }

  if (q.includes('pencil') || q.includes('grip') || q.includes('writing')) {
    return `<strong>Fine Motor & Pencil Grip Coaching:</strong><br>1. <strong>Hand Warmup</strong>: Have pupils press their palms together firmly for 10 seconds, then shake their hands out like wet water droplets.<br>2. <strong>Pinch & Point Rule</strong>: Teach them to grip with the thumb and index finger like a bird beak (*càmmoo jëm ndeyjoor* — move left to right).<br>3. <strong>Air Tracing</strong>: Trace large strokes in the air with their arms before writing with pencils.`;
  }

  if (q.includes('translate') || q.includes('meaning') || q.includes('english')) {
    return `<strong>English Overview for Lesson ${lesson.lesson_number}:</strong><br>• Focus: ${lesson.lesson_type} under the theme <em>${theme}</em>.<br>• Language of instruction: <em>${currentLanguageLabel()}</em>; the scripted teacher lines in each step are the phrases to model aloud.<br>• Objective: Reinforce decoding readiness and oral expressive language.`;
  }

  return `<strong>Teaching Tip for Lesson ${lesson.lesson_number} (${lesson.lesson_type}):</strong><br>Remember to adhere strictly to the <strong>30-minute pacing</strong>. Keep transitions between Circle Time (10m), Sounds (5m), Letter of the Week (5m), and Writing (5m) snappy and active. Praise pupil participation in ${currentLanguageLabel()} throughout.`;
}

// Setup Event Listeners
function setupEventListeners() {
  // Grade Selector
  const gradeSelect = document.getElementById('grade-select');
  if (gradeSelect) {
    gradeSelect.addEventListener('change', (e) => {
      switchGrade(e.target.value);
    });
  }

  // Language Selector
  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      switchLanguage(e.target.value);
    });
  }

  // Day Tab Buttons
  elements.dayButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.dayButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentDay = parseInt(btn.dataset.day, 10);
      loadLesson(state.currentWeek, state.currentDay);
    });
  });

  // Timer Buttons
  elements.timerStartBtn.addEventListener('click', startTimer);
  elements.timerResetBtn.addEventListener('click', resetTimer);

  // Audio Button
  elements.audioBtn.addEventListener('click', toggleAudioPlayback);

  // Search Toggle
  elements.searchToggleBtn.addEventListener('click', () => {
    elements.searchOverlay.classList.remove('hidden');
    elements.searchInput.focus();
  });
  elements.searchCloseBtn.addEventListener('click', () => {
    elements.searchOverlay.classList.add('hidden');
  });

  // Search Live Query
  elements.searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      elements.searchResults.innerHTML = '';
      return;
    }
    const matches = state.curriculumData.lessons.filter(l => {
      const actText = l.activities.map(a => a.content + ' ' + a.title).join(' ');
      return (l.theme && l.theme.toLowerCase().includes(q)) ||
             (l.target_letter && l.target_letter.toLowerCase().includes(q)) ||
             (l.vocabulary && l.vocabulary.some(v => v.toLowerCase().includes(q))) ||
             actText.toLowerCase().includes(q);
    });

    elements.searchResults.innerHTML = '';
    if (matches.length === 0) {
      elements.searchResults.innerHTML = `<div style="padding: 12px; color: var(--text-muted); font-size: 13px;">No lessons found matching "${escapeHtml(q)}".</div>`;
      return;
    }

    matches.slice(0, 10).forEach(m => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `
        <strong style="color: var(--accent-gold); font-size: 13px;">Lesson ${m.lesson_number} (Week ${m.week}, Day ${m.day_number})</strong>
        <div style="font-size: 12px; color: var(--text-primary);">${escapeHtml(m.lesson_type)} · Theme: ${escapeHtml(m.theme || 'Community')}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${m.target_letter ? `Letter: ${m.target_letter}` : ''} ${m.vocabulary && m.vocabulary.length ? `· Vocab: ${m.vocabulary.join(', ')}` : ''}</div>
      `;
      item.addEventListener('click', () => {
        elements.searchOverlay.classList.add('hidden');
        state.currentWeek = m.week;
        state.currentDay = m.day_number;
        renderWeekPills();
        elements.dayButtons.forEach(b => {
          b.classList.toggle('active', parseInt(b.dataset.day, 10) === state.currentDay);
        });
        loadLesson(state.currentWeek, state.currentDay);
      });
      elements.searchResults.appendChild(item);
    });
  });

  // AI Coach Modal
  elements.aiCoachBtn.addEventListener('click', () => {
    elements.coachModal.classList.remove('hidden');
  });
  elements.coachCloseBtn.addEventListener('click', () => {
    elements.coachModal.classList.add('hidden');
  });

  // Coach Send Button
  elements.coachSendBtn.addEventListener('click', () => {
    handleCoachQuery(elements.coachInput.value);
  });
  elements.coachInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleCoachQuery(elements.coachInput.value);
  });

  // Coach Prompt Chips
  elements.coachPrompts.querySelectorAll('.prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      handleCoachQuery(chip.dataset.query);
    });
  });

  // Share to Telegram / Clipboard
  elements.shareBtn.addEventListener('click', () => {
    const l = state.activeLesson;
    const shareText = `📚 *Gambia FLP - ${currentLanguageLabel()} ${currentGradeLabel()} (Term 1)*\n\n📌 *Lesson ${l.lesson_number} (Week ${l.week}, Day ${l.day_number} - ${l.day_name})*\n🏷️ *Type*: ${l.lesson_type}\n🌱 *Theme*: ${l.theme || 'Community'}\n🔤 *Target Letter*: ${l.target_letter || 'Alphabet'}\n🗣️ *Key Vocab*: ${(l.vocabulary || []).join(', ')}\n⏱️ *Duration*: 30 Minutes\n\n📖 *Open Full Interactive Guide*: https://t.me/GambiaFLPBot`;

    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.sendData) {
      window.Telegram.WebApp.sendData(shareText);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      showToast('📋 Lesson summary copied to clipboard!');
    }
  });

  // Print Card
  elements.printBtn.addEventListener('click', () => {
    window.print();
  });

  setupInstallPrompt();
}

// ---------------------------------------------------------------------------
// Install as an app (Add to Home Screen)
// Chrome/Edge/Samsung Internet fire `beforeinstallprompt`; we hold the event
// and show the Install button. iOS Safari has no prompt API, so the button
// shows a short instruction instead. Once running standalone, the button hides.
// ---------------------------------------------------------------------------
let deferredInstallPrompt = null;

function isStandaloneDisplay() {
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
    || window.navigator.standalone === true;
}

function isIosSafari() {
  const ua = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  return isIos && isSafari;
}

function setupInstallPrompt() {
  const btn = document.getElementById('install-btn');
  if (!btn) return;

  if (isStandaloneDisplay()) {
    btn.classList.add('hidden');
    return;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    btn.classList.remove('hidden');
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    btn.classList.add('hidden');
    showToast('✅ Installed! Open Gambia FLP from your home screen - it works offline.', 5000);
  });

  // iOS never fires beforeinstallprompt; surface the manual route instead.
  if (isIosSafari()) {
    btn.classList.remove('hidden');
  }

  btn.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice.catch(() => null);
      deferredInstallPrompt = null;
      if (choice && choice.outcome === 'accepted') {
        btn.classList.add('hidden');
      }
      return;
    }
    if (isIosSafari()) {
      showToast('📲 Tap Share (□↑) then "Add to Home Screen" to install.', 7000);
      return;
    }
    showToast('📲 Open the browser menu (⋮) and choose "Install app" or "Add to Home screen".', 7000);
  });
}

// Fallback Embedded Dataset (Ensures 100% offline capability without web server)
// Kept for compatibility; there is a single load path now.
function loadEmbeddedFallback() {
  return loadCurriculum();
}

// Start application
document.addEventListener('DOMContentLoaded', loadCurriculum);
