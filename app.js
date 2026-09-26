/**
 * Gambia FLP - Interactive Teacher Guide Application Logic
 * Multi-language ECD 2, ECD 3 and Grade 1, Term 1 (8 languages of instruction)
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
  currentSubject: 'literacy', // 'literacy' | 'numeracy' (numeracy: Grade 1, national languages only)
  currentGrade: 'ecd3',
  currentLanguage: 'wolof',
  currentWeek: 1,
  currentDay: 1,
  currentSession: 0,      // index into the lesson's sessions (Grade 1 A/B); 0 otherwise
  curriculumData: null,
  activeLesson: null,     // the session view being shown (lesson merged with its session)
  timerTotal: 1800,       // seconds in the active session (30 min ECD; 60 min Grade 1 English)
  timerSeconds: 1800,
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
  ecd2:   { label: 'ECD 2 · Term 1',   code: 'ECD 2' },
  ecd3:   { label: 'ECD 3 · Term 1',   code: 'ECD 3' },
  grade1: { label: 'Grade 1 · Term 1', code: 'Grade 1' }
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
  },
  // Grade 1: the seven national languages carry two 30-minute sessions (A/B)
  // per day; English is one 60-minute lesson.
  grade1: {
    wolof:    { label: 'Wolof',    file: './data/wolof_grade1_term1.json',    audioDir: null },
    seereer:  { label: 'Seereer',  file: './data/seereer_grade1_term1.json',  audioDir: null },
    mandinka: { label: 'Mandinka', file: './data/mandinka_grade1_term1.json', audioDir: null },
    pulaar:   { label: 'Pulaar',   file: './data/pulaar_grade1_term1.json',   audioDir: null },
    jola:     { label: 'Jola',     file: './data/jola_grade1_term1.json',     audioDir: null },
    soninke:  { label: 'Soninke',  file: './data/soninke_grade1_term1.json',  audioDir: null },
    manjaku:  { label: 'Manjaku',  file: './data/manjaku_grade1_term1.json',  audioDir: null },
    english:  { label: 'English',  file: './data/english_grade1_term1.json',  audioDir: null }
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
  ecd3: {},
  grade1: {}
};

// Grade 1 Numeracy Teacher Guides (7 national languages; there is no English
// or ECD numeracy guide). Built by ../extract_numeracy_grade1.py. The data is
// units -> lessons, not weeks -> days; adaptNumeracy() maps it onto the
// lesson shape the rest of this file renders (unit = week pill, lesson = day tab).
const NUMERACY_FILES = {
  grade1: {
    wolof:    { label: 'Wolof',    file: './data/wolof_grade1_term1_numeracy.json' },
    seereer:  { label: 'Seereer',  file: './data/seereer_grade1_term1_numeracy.json' },
    mandinka: { label: 'Mandinka', file: './data/mandinka_grade1_term1_numeracy.json' },
    pulaar:   { label: 'Pulaar',   file: './data/pulaar_grade1_term1_numeracy.json' },
    jola:     { label: 'Jola',     file: './data/jola_grade1_term1_numeracy.json' },
    soninke:  { label: 'Soninke',  file: './data/soninke_grade1_term1_numeracy.json' },
    manjaku:  { label: 'Manjaku',  file: './data/manjaku_grade1_term1_numeracy.json' }
  }
};

// The grade <select> carries the subject too: "grade1-numeracy" is Grade 1
// Numeracy; every other value is a literacy grade.
function parseGradeValue(value) {
  const m = /^(\w+)-numeracy$/.exec(value || '');
  return m ? { grade: m[1], subject: 'numeracy' } : { grade: value, subject: 'literacy' };
}

function gradeValue() {
  return state.currentSubject === 'numeracy' ? `${state.currentGrade}-numeracy` : state.currentGrade;
}

function isNumeracy() {
  return state.currentSubject === 'numeracy';
}

function datasetEntry(langKey, gradeKey, subject) {
  const table = subject === 'numeracy' ? NUMERACY_FILES[gradeKey] : CURRICULUM_FILES[gradeKey];
  return table ? table[langKey] || null : null;
}

// Numeracy JSON -> the lesson shape app.js renders. Each lesson becomes a
// "day" of its unit, and its 60 minutes become step cards: the two warm-up
// slots (drawn from the unit's Mental Maths and Reinforcement pools), the
// new-content activities, and the Closure.
function adaptNumeracy(data) {
  const units = {};
  (data.units || []).forEach(u => { units[u.unit] = u; });
  const stepsText = (steps) => (steps || []).map(s => s.text).join(' ');
  const lessons = (data.lessons || []).map(l => {
    const u = units[l.unit] || { unit: l.unit, code: `1.${l.unit}`, title: '', mental: [], reinforcement: [], outcomes: [] };
    const pool = (kind, label, list, mins) => ({
      numeracy: 'pool', poolKind: kind, title: `${label} (2 or 3 activities)`, duration_mins: mins || 10,
      pool: list || [],
      content: (list || []).map(a => `${a.title} ${a.title_nl} ${stepsText(a.steps)}`).join(' ')
    });
    const acts = [
      pool('mental', 'Mental Maths', u.mental, l.mental_minutes),
      pool('reinforcement', 'Reinforcement', u.reinforcement, l.reinforcement_minutes)
    ];
    (l.activities || []).forEach(a => acts.push({
      numeracy: 'activity', title: a.title || a.code, duration_mins: a.minutes, code: a.code,
      title_nl: a.title_nl, steps: a.steps, pb_refs: a.pb_refs || [],
      content: `${a.code} ${a.title_nl} ${stepsText(a.steps)}`
    }));
    const closure = l.closure || null;
    if (closure) {
      acts.push({
        numeracy: 'closure', title: 'Closure', duration_mins: closure.minutes || 10,
        assessment: closure.assessment || '', content: closure.assessment || ''
      });
    }
    const pb = [];
    (l.activities || []).forEach(a => (a.pb_refs || []).forEach(r => { if (!pb.includes(r)) pb.push(r); }));
    return {
      subject: 'numeracy',
      week: l.unit,
      day_number: l.lesson_in_unit,
      day_name: `Lesson ${l.id}`,
      lesson_number: l.id,
      lesson_type: l.title,
      theme: u.title,
      unit_code: u.code || `1.${l.unit}`,
      unit_outcomes: u.outcomes || [],
      duration_mins: l.minutes || 60,
      learning_outcomes: l.objectives || [],
      materials: l.materials || [],
      target_letter: '',
      vocabulary: [],
      pb_refs: pb,
      has_closure: !!closure,
      activities: acts,
      homework: closure && closure.homework ? closure.homework : ''
    };
  });
  const meta = Object.assign({}, data.metadata, {
    total_weeks: (data.units || []).length || 11,
    grade: 'Grade 1 Numeracy'
  });
  return { metadata: meta, lessons, units: data.units || [], source_notes: data.source_notes || [] };
}

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

// A Grade 1 national-language lesson day is two 30-minute sessions (A and B),
// each with its own outcomes, type and steps. ECD and English lessons are a
// single session, so the lesson itself is the only session.
function sessionsOf(lesson) {
  return Array.isArray(lesson.sessions) && lesson.sessions.length ? lesson.sessions : [lesson];
}

// The lesson as seen through one of its sessions: day-level fields (week,
// day, lesson number) with the session's own content on top.
function lessonView(lesson, idx) {
  const sessions = sessionsOf(lesson);
  const i = Math.min(Math.max(idx || 0, 0), sessions.length - 1);
  const sess = sessions[i];
  return sess === lesson ? lesson : Object.assign({}, lesson, sess, {
    sessionIndex: i,
    sessionCount: sessions.length,
    theme: lesson.theme || ''
  });
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

// Switch Grade (and subject) Dynamically
async function switchGrade(value) {
  const { grade, subject } = parseGradeValue(value);
  if (!GRADES[grade]) {
    console.error('Unknown grade:', value);
    return;
  }
  let lang = state.currentLanguage;
  if (subject === 'numeracy' && !datasetEntry(lang, grade, subject)) {
    // no English numeracy guide: fall back to a national language
    lang = DEFAULT_LANGUAGE;
    await switchCurriculum(lang, grade, subject,
      '🔢 Numeracy guides are in the 7 national languages - showing Wolof Grade 1 Numeracy.');
    return;
  }
  await switchCurriculum(lang, grade, subject);
}

// Switch Language Dynamically
async function switchLanguage(langKey) {
  if (!LANGUAGES[langKey]) {
    console.error('Unknown language:', langKey);
    showToast('⚠️ Unknown language selected.');
    return;
  }
  await switchCurriculum(langKey, state.currentGrade, state.currentSubject);
}

// Parsed (and, for numeracy, adapted) datasets by file, so flipping back to a
// language or subject already opened does not wait on the network: the
// service worker answers data requests network-first.
const datasetCache = new Map();
let switchRequestId = 0;

function fetchDataset(file, subject) {
  if (!datasetCache.has(file)) {
    const p = fetch(file).then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(json => (subject === 'numeracy' ? adaptNumeracy(json) : json));
    p.catch(() => datasetCache.delete(file));
    datasetCache.set(file, p);
  }
  return datasetCache.get(file);
}

// Switch Curriculum (Language, Grade & Subject)
async function switchCurriculum(langKey, gradeKey, subject = state.currentSubject, notice = '') {
  const entry = datasetEntry(langKey, gradeKey, subject);
  if (!entry) {
    console.error('Unknown dataset:', subject, gradeKey, langKey);
    showToast('⚠️ Dataset not found.');
    syncSelects();
    return;
  }

  // Stop audio playback
  stopAudioPlayback();
  state.activeTracks = [];
  state.selectedTrackIndex = 0;

  const requestId = ++switchRequestId;
  let data;
  try {
    data = await fetchDataset(entry.file, subject);
  } catch (err) {
    if (requestId !== switchRequestId) return;
    console.error('Failed to load dataset', subject, gradeKey, langKey, err);
    const what = subject === 'numeracy' ? `${GRADES[gradeKey].code} Numeracy` : GRADES[gradeKey].code;
    showToast(`⚠️ Could not load ${entry.label} ${what}. Still showing ${currentLanguageLabel()} ${currentGradeLabel()}.`);
    syncSelects();
    return;
  }

  if (requestId !== switchRequestId) return;   // a later switch won the race

  state.currentSubject = subject;
  state.currentGrade = gradeKey;
  state.currentLanguage = langKey;
  state.curriculumData = data;
  state.currentWeek = 1;
  state.currentDay = 1;
  state.currentSession = 0;
  applyLanguageChrome();
  renderWeekPills();
  elements.dayButtons.forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.day, 10) === 1);
  });
  loadLesson(1, 1);
  if (notice) showToast(notice, 4500);
  else showToast(`🗣️ Switched to ${currentLanguageLabel()} ${currentGradeLabel()}`);
}

// Keep select inputs in step with state
function syncSelects() {
  const lSel = document.getElementById('language-select');
  if (lSel && lSel.value !== state.currentLanguage) lSel.value = state.currentLanguage;
  const gSel = document.getElementById('grade-select');
  if (gSel && gSel.value !== gradeValue()) gSel.value = gradeValue();
  // English has no numeracy guide
  if (lSel) {
    Array.from(lSel.options).forEach(o => {
      o.disabled = isNumeracy() && !datasetEntry(o.value, state.currentGrade, 'numeracy');
    });
  }
}

// Language and grade specific chrome
function applyLanguageChrome() {
  const label = currentLanguageLabel();
  const gLabel = currentGradeLabel();
  document.title = `Gambia FLP - Interactive Teacher Guide (${label} ${gLabel})`;
  const sub = document.getElementById('audio-sub');
  if (sub) sub.textContent = `Select a track to listen in ${label}`;
  syncSelects();
  applySubjectChrome();
}

// Labels that differ between the literacy and numeracy guides. The literacy
// wording is captured from the page on first call so it can be restored.
const LITERACY_CHROME = {};
function applySubjectChrome() {
  const num = isNumeracy();
  const set = (sel, key, numText, attr = 'textContent') => {
    const node = document.querySelector(sel);
    if (!node) return;
    if (!(key in LITERACY_CHROME)) LITERACY_CHROME[key] = node[attr];
    node[attr] = num ? numText : LITERACY_CHROME[key];
  };
  document.body.classList.toggle('subject-numeracy', num);
  set('#letter-spec-card .spec-label', 'letterLabel', 'Unit');
  set('#vocab-spec-card .spec-label', 'vocabLabel', 'Pupil Book');
  set('#routine-spec-card .spec-label', 'routineLabel', 'Lesson Flow');
  set('.outcomes-block h3', 'outcomesHead', 'Lesson Objectives (by the end of the lesson pupils will be able to):');
  set('#search-input', 'searchPh', 'Search activity, game, number, shape...', 'placeholder');
  set('.fac-callout-text span', 'facCallout', 'Delivering the Grade 1 numeracy teacher training? The session-by-session facilitation scripts are here.');
  // Trainers land on the guide that matches the subject being viewed
  document.querySelectorAll('a[href^="facilitator.html"]').forEach(a => {
    a.setAttribute('href', num ? 'facilitator.html?guide=numeracy' : 'facilitator.html');
  });
  const bar = document.getElementById('audio-companion-bar');
  if (bar) bar.classList.toggle('hidden', num);   // no audio companion for numeracy
  const chips = document.getElementById('coach-prompts');
  if (chips) {
    const defs = num ? NUMERACY_COACH_CHIPS : null;
    chips.querySelectorAll('.prompt-chip').forEach((chip, i) => {
      if (!chip.dataset.litQuery) { chip.dataset.litQuery = chip.dataset.query; chip.dataset.litText = chip.textContent; }
      chip.dataset.query = defs && defs[i] ? defs[i].query : chip.dataset.litQuery;
      chip.textContent = defs && defs[i] ? defs[i].text : chip.dataset.litText;
    });
  }
}

const NUMERACY_COACH_CHIPS = [
  { query: 'How do I support a pupil who is struggling with counting?', text: '💡 Counting support' },
  { query: 'Give me a quick mental maths warm up game.', text: '⚡ Mental maths game' },
  { query: 'How do I use concrete, pictorial and abstract steps in this lesson?', text: '🧮 Concrete → pictorial → abstract' }
];

// Day tabs: Mon-Fri for literacy; Lesson 1-5 of the unit for numeracy.
function renderDayTabs() {
  elements.dayButtons.forEach(btn => {
    const k = parseInt(btn.dataset.day, 10);
    const label = btn.querySelector('.day-label');
    const sub = btn.querySelector('.day-sub');
    if (!label || !sub) return;
    if (!btn.dataset.litLabel) { btn.dataset.litLabel = label.textContent; btn.dataset.litSub = sub.textContent; }
    if (isNumeracy()) {
      label.textContent = `1.${state.currentWeek}.${k}`;
      sub.textContent = `Lesson ${k}`;
    } else {
      label.textContent = btn.dataset.litLabel;
      sub.textContent = btn.dataset.litSub;
    }
  });
}

// Load Curriculum Data
async function loadCurriculum() {
  const params = new URLSearchParams(location.search);
  if ((params.get('subject') || '').toLowerCase() === 'numeracy') state.currentSubject = 'numeracy';

  const wantedLang = (params.get('lang') || '').toLowerCase();
  if (LANGUAGES[wantedLang]) state.currentLanguage = wantedLang;

  const wantedGrade = (params.get('grade') || '').toLowerCase();
  if (GRADES[wantedGrade]) state.currentGrade = wantedGrade;
  if (isNumeracy()) {
    if (!NUMERACY_FILES[state.currentGrade]) state.currentGrade = 'grade1';
    if (!datasetEntry(state.currentLanguage, state.currentGrade, 'numeracy')) state.currentLanguage = DEFAULT_LANGUAGE;
  }

  // numeracy deep links may say unit/lesson; week/day mean the same thing
  const wk = parseInt(params.get('week') || params.get('unit'), 10);
  const dy = parseInt(params.get('day') || params.get('lesson'), 10);
  if (wk >= 1 && wk <= 12) state.currentWeek = wk;
  if (dy >= 1 && dy <= 5) state.currentDay = dy;
  const sess = (params.get('session') || '').toLowerCase();
  if (sess === 'b' || sess === '2') state.currentSession = 1;

  let entry = datasetEntry(state.currentLanguage, state.currentGrade, state.currentSubject);
  if (!entry) {
    state.currentSubject = 'literacy';
    const gradeTable = CURRICULUM_FILES[state.currentGrade] || CURRICULUM_FILES[DEFAULT_GRADE];
    entry = gradeTable[state.currentLanguage] || gradeTable[DEFAULT_LANGUAGE];
  }
  try {
    state.curriculumData = await fetchDataset(entry.file, state.currentSubject);
    const total = state.curriculumData.metadata.total_weeks || 10;
    if (state.currentWeek > total) state.currentWeek = 1;
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
    pill.textContent = isNumeracy()
      ? `Unit ${firstLesson ? firstLesson.unit_code : '1.' + w}${themeName}`
      : `Week ${w}${themeName}`;

    pill.addEventListener('click', () => {
      document.querySelectorAll('.week-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.currentWeek = w;
      state.currentSession = 0;
      loadLesson(state.currentWeek, state.currentDay);
    });

    elements.weekContainer.appendChild(pill);
  }
}

// Load and Render Active Lesson
function loadLesson(week, day) {
  if (!state.curriculumData) return;

  let lesson = state.curriculumData.lessons.find(l => l.week === week && l.day_number === day);
  if (!lesson) {
    console.error(`Lesson not found for Week ${week}, Day ${day}`);
    return;
  }

  // Keep the day tabs in step with the lesson shown (deep links set the day
  // without a click, so the highlight used to stay on Monday).
  elements.dayButtons.forEach(b => b.classList.toggle('active', parseInt(b.dataset.day, 10) === day));
  renderDayTabs();

  if (lesson.subject === 'numeracy') {
    renderNumeracyLesson(lesson);
    return;
  }

  const dayLesson = lesson;
  renderSessionNav(dayLesson);
  lesson = lessonView(dayLesson, state.currentSession);
  state.activeLesson = lesson;

  // Stop any active audio when switching lessons
  stopAudioPlayback();

  // Update Hero Card Meta
  const sessionTag = lesson.sessionCount > 1 ? ` · Session ${lesson.session}` : '';
  const minutes = lesson.duration_mins || 30;
  elements.heroBadge.textContent = `Lesson ${lesson.lesson_number}${sessionTag}`;
  elements.heroTypeBadge.textContent = lesson.lesson_type || currentGradeLabel();
  elements.heroTitle.textContent = `Week ${lesson.week}, Day ${lesson.day_number} (${lesson.day_name})${sessionTag}: ${lesson.lesson_type || 'Lesson'}`;
  elements.heroTheme.innerHTML = `Weekly Theme: <strong>${escapeHtml(lesson.theme || 'Not specified')}</strong>`;
  const timingBadge = document.getElementById('hero-timing-badge');
  if (timingBadge) {
    timingBadge.textContent = lesson.sessionCount > 1
      ? `⏱️ ${minutes} Mins · ${lesson.sessionCount} sessions today`
      : `⏱️ ${minutes} Mins Daily`;
  }
  const totalBadge = document.getElementById('steps-total-time');
  if (totalBadge) totalBadge.textContent = `${minutes} Mins Total`;

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

  // Reset timer to the session length on new lesson load
  state.timerTotal = minutes * 60;
  resetTimer();
}

// ---------------------------------------------------------------------------
// Numeracy lesson (Grade 1): 60 minutes = Mental Maths 10 + Reinforcement 10
// (2 or 3 activities from the unit's pools) + new-content activities +
// Closure 10. Teacher lines ("Say:") are in the national language.
// ---------------------------------------------------------------------------
function renderNumeracyLesson(lesson) {
  renderSessionNav(lesson);           // hides the Session A/B toggle
  state.currentSession = 0;
  state.activeLesson = lesson;
  stopAudioPlayback();
  state.activeTracks = [];

  const minutes = lesson.duration_mins || 60;
  elements.heroBadge.textContent = `Lesson ${lesson.lesson_number}`;
  elements.heroTypeBadge.textContent = `Numeracy · Unit ${lesson.unit_code}`;
  elements.heroTitle.textContent = lesson.lesson_type || `Lesson ${lesson.lesson_number}`;
  elements.heroTheme.innerHTML = `Unit ${escapeHtml(lesson.unit_code)}: <strong>${escapeHtml(lesson.theme || 'Not specified')}</strong>`;
  const timingBadge = document.getElementById('hero-timing-badge');
  if (timingBadge) timingBadge.textContent = `⏱️ ${minutes} Mins Daily`;
  const totalBadge = document.getElementById('steps-total-time');
  if (totalBadge) totalBadge.textContent = `${minutes} Mins Total`;

  elements.heroLetter.textContent = lesson.unit_code;
  elements.heroVocab.textContent = lesson.pb_refs.length ? `Activity ${lesson.pb_refs.join(' · ')}` : '—';
  const nAct = lesson.activities.filter(a => a.numeracy === 'activity').length;
  elements.heroRoutine.textContent = ['Mental Maths', 'Reinforcement',
    `${nAct} ${nAct === 1 ? 'activity' : 'activities'}`].concat(lesson.has_closure ? ['Closure'] : []).join(' → ');

  // Objectives, then the unit's curriculum outcomes
  elements.outcomesList.innerHTML = '';
  if (lesson.learning_outcomes.length) {
    lesson.learning_outcomes.forEach(o => {
      const li = document.createElement('li');
      li.textContent = o;
      elements.outcomesList.appendChild(li);
    });
  } else {
    elements.outcomesList.innerHTML = '<li class="not-extracted">No objectives are printed for this lesson in the source Teacher Guide.</li>';
  }
  if (lesson.unit_outcomes.length) {
    const head = document.createElement('li');
    head.className = 'num-outcomes-head';
    head.textContent = `Unit ${lesson.unit_code} curriculum outcomes`;
    elements.outcomesList.appendChild(head);
    lesson.unit_outcomes.forEach(o => {
      const li = document.createElement('li');
      li.className = 'num-unit-outcome';
      li.innerHTML = `<span class="num-code">${escapeHtml(o.code)}</span> ${escapeHtml(o.text)}`;
      elements.outcomesList.appendChild(li);
    });
  }

  elements.materialsTags.innerHTML = '';
  if (lesson.materials.length) {
    lesson.materials.forEach(mat => {
      const span = document.createElement('span');
      span.className = 'tag-item';
      span.textContent = mat;
      elements.materialsTags.appendChild(span);
    });
  } else {
    elements.materialsTags.innerHTML = '<span class="tag-item not-extracted">Not listed in the source guide</span>';
  }

  elements.stepsList.innerHTML = '';
  lesson.activities.forEach((act, idx) => {
    const card = document.createElement('div');
    card.className = `step-card num-step num-step-${act.numeracy}`;
    card.innerHTML = `
      <div class="step-card-header">
        <div class="step-title-wrap">
          <div class="step-num-badge">${idx + 1}</div>
          <div class="step-title">${escapeHtml(act.title)}</div>
        </div>
        ${act.duration_mins ? `<span class="step-duration">⏱️ ${act.duration_mins} mins</span>` : ''}
      </div>
      <div class="step-body">${numeracyCardBody(act, lesson)}</div>`;
    elements.stepsList.appendChild(card);
  });
  if (!lesson.has_closure) {
    const note = document.createElement('p');
    note.className = 'step-paragraph not-extracted';
    note.textContent = 'This lesson has no Closure block in the source Teacher Guide.';
    elements.stepsList.appendChild(note);
  }

  if (lesson.homework) {
    elements.homeworkText.classList.remove('not-extracted');
    elements.homeworkText.textContent = lesson.homework;
  } else {
    elements.homeworkText.textContent = 'No homework task is given for this lesson in the source Teacher Guide.';
    elements.homeworkText.classList.add('not-extracted');
  }

  state.timerTotal = minutes * 60;
  resetTimer();
}

function numeracySteps(steps) {
  const lang = escapeHtml(currentLanguageLabel());
  return (steps || []).map(s => s.type === 'say'
    ? `<div class="teacher-dialogue"><strong>🗣️ Say (${lang}):</strong> <em>${escapeHtml(s.text)}</em></div>`
    : `<p class="step-paragraph">${escapeHtml(s.text)}</p>`).join('');
}

function numeracyCardBody(act, lesson) {
  if (act.numeracy === 'pool') {
    const what = act.poolKind === 'mental' ? 'Mental Maths' : 'Reinforcement';
    if (!act.pool.length) {
      return `<p class="step-paragraph not-extracted">The Teacher Guide lists no ${what} activities for Unit ${escapeHtml(lesson.unit_code)}. Use a short counting routine from the lesson.</p>`;
    }
    const items = act.pool.map(a => `
      <details class="num-pool-item">
        <summary><span class="num-code">${escapeHtml(a.code)}</span> <span class="num-pool-title">${escapeHtml(a.title)}</span>
          ${a.title_nl ? `<span class="num-nl-title">${escapeHtml(a.title_nl)}</span>` : ''}</summary>
        <div class="num-pool-body">${numeracySteps(a.steps)}</div>
      </details>`).join('');
    return `<p class="step-paragraph">Choose 2 or 3 of Unit ${escapeHtml(lesson.unit_code)}'s ${what.toLowerCase()} activities (tap one to open it):</p>${items}`;
  }
  if (act.numeracy === 'closure') {
    return act.assessment
      ? `<h4 class="step-subheading">📝 Assessment task</h4><p class="step-paragraph">${escapeHtml(act.assessment)}</p>`
      : '<p class="step-paragraph not-extracted">No assessment task is printed for this Closure.</p>';
  }
  const pb = act.pb_refs.length
    ? `<p class="num-pb-ref">📘 Pupil Book: Activity ${act.pb_refs.map(escapeHtml).join(', ')}</p>` : '';
  return `<div class="num-act-meta"><span class="num-code">${escapeHtml(act.code)}</span>` +
    (act.title_nl ? ` <span class="num-nl-title">${escapeHtml(act.title_nl)}</span>` : '') + `</div>` +
    numeracySteps(act.steps) + pb;
}

// Session A / B toggle, shown only when the day carries more than one session.
function renderSessionNav(dayLesson) {
  const nav = document.getElementById('session-nav');
  if (!nav) return;
  const sessions = sessionsOf(dayLesson);
  if (sessions.length < 2) {
    state.currentSession = 0;
    nav.classList.add('hidden');
    nav.innerHTML = '';
    return;
  }
  if (state.currentSession >= sessions.length) state.currentSession = 0;
  nav.innerHTML = '';
  sessions.forEach((sess, i) => {
    const btn = document.createElement('button');
    btn.className = `session-btn ${i === state.currentSession ? 'active' : ''}`;
    btn.type = 'button';
    btn.innerHTML = `<span class="session-label">Session ${escapeHtml(sess.session || String.fromCharCode(65 + i))}</span>` +
      `<span class="session-sub">${escapeHtml(sess.lesson_type || '')}${sess.duration_mins ? ` · ${sess.duration_mins} min` : ''}</span>`;
    btn.addEventListener('click', () => {
      if (state.currentSession === i) return;
      state.currentSession = i;
      loadLesson(state.currentWeek, state.currentDay);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    nav.appendChild(btn);
  });
  nav.classList.remove('hidden');
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
    const pct = ((state.timerTotal - state.timerSeconds) / state.timerTotal) * 100;
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
        showToast(`⏱️ 5 Minutes remaining in this ${Math.round(state.timerTotal / 60)}-min lesson!`);
      }
    } else {
      clearInterval(state.timerInterval);
      state.timerRunning = false;
      elements.timerStatus.textContent = 'Done 🎉';
      elements.timerStartBtn.textContent = 'Restart';
      showToast(`🎉 ${Math.round(state.timerTotal / 60)}-Minute Lesson Complete!`);
      updateTimerDisplay();
      playChime();
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(state.timerInterval);
  state.timerRunning = false;
  state.timerSeconds = state.timerTotal || 1800;
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
  if (lesson && lesson.subject === 'numeracy') return numeracyCoachResponse(query, lesson);
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

function shareLessonText(shareText) {
  // sendData only reaches the bot when the Mini App was opened from a
  // reply-keyboard button (no query_id); from the inline buttons the bot
  // uses it is a silent no-op, so the clipboard is the reliable route.
  const tg = window.Telegram && window.Telegram.WebApp;
  const canSend = tg && tg.sendData && tg.initDataUnsafe && !tg.initDataUnsafe.query_id && tg.initData;
  if (canSend) {
    tg.sendData(shareText);
    return;
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareText).then(
      () => showToast('📋 Lesson summary copied - paste it into your Telegram chat.'),
      () => showToast('⚠️ Could not copy. Use Print instead.')
    );
  }
}

// Numeracy answers are built from the lesson and its unit, not from the
// literacy tips above (letters, pencil grip) that do not apply.
function numeracyCoachResponse(query, lesson) {
  const q = query.toLowerCase();
  const lang = escapeHtml(currentLanguageLabel());
  const pools = lesson.activities.filter(a => a.numeracy === 'pool');
  const mental = (pools.find(p => p.poolKind === 'mental') || { pool: [] }).pool;
  const acts = lesson.activities.filter(a => a.numeracy === 'activity');

  if (q.includes('struggl') || q.includes('support') || q.includes('behind') || q.includes('count')) {
    return `<strong>Supporting a pupil in Lesson ${escapeHtml(lesson.lesson_number)}:</strong><br>` +
      `1. <strong>Go back to concrete</strong>: give the pupil counters, sticks or bottle caps and have them touch and move each one as they count aloud in ${lang}.<br>` +
      `2. <strong>Smaller numbers first</strong>: repeat the activity with numbers up to 5 before moving to 10.<br>` +
      `3. <strong>Pair them</strong> with a confident partner for the Pupil Book task${lesson.pb_refs.length ? ` (Activity ${escapeHtml(lesson.pb_refs.join(', '))})` : ''}, then check them first during the Closure.`;
  }
  if (q.includes('game') || q.includes('warm') || q.includes('mental')) {
    if (!mental.length) {
      return `Unit ${escapeHtml(lesson.unit_code)} has no Mental Maths list in the Teacher Guide. A quick option: count forwards and backwards to 10 in ${lang} and in English, clapping on each number.`;
    }
    return `<strong>Mental Maths for Unit ${escapeHtml(lesson.unit_code)}</strong> (pick 2 or 3, 10 minutes in total):<br>` +
      mental.map(a => `• ${escapeHtml(a.title)}${a.title_nl ? ` — <em>${escapeHtml(a.title_nl)}</em>` : ''}`).join('<br>');
  }
  if (q.includes('concrete') || q.includes('pictorial') || q.includes('abstract') || q.includes('cpa')) {
    return `<strong>Concrete → Pictorial → Abstract in this lesson:</strong><br>` +
      `• <strong>Concrete</strong>: pupils handle real objects (counters, classroom items) during ${escapeHtml(acts[0] ? acts[0].title : 'the main activity')}.<br>` +
      `• <strong>Pictorial</strong>: move to the pictures and dots in the Pupil Book${lesson.pb_refs.length ? ` (Activity ${escapeHtml(lesson.pb_refs.join(', '))})` : ''}.<br>` +
      `• <strong>Abstract</strong>: finish with numerals only — on the board or in jotters — before the Closure.`;
  }
  return `<strong>Teaching tip for Lesson ${escapeHtml(lesson.lesson_number)}:</strong><br>Keep to the <strong>60-minute plan</strong>: Mental Maths (10 min) → Reinforcement (10 min) → ` +
    `${acts.map(a => `${escapeHtml(a.title)}${a.duration_mins ? ` (${a.duration_mins} min)` : ''}`).join(' → ')} → Closure (10 min). ` +
    `Model each "Say" line in ${lang}, and use English number names only where the activity asks for them.`;
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
      state.currentSession = 0; // a new day starts with Session A
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
      const actText = sessionsOf(l)
        .flatMap(s => (s.activities || []).map(a => a.content + ' ' + a.title))
        .join(' ');
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
      if (m.subject === 'numeracy') {
        const hit = (m.activities || []).find(a => (a.content + ' ' + a.title).toLowerCase().includes(q));
        item.innerHTML = `
        <strong style="color: var(--accent-gold); font-size: 13px;">Lesson ${escapeHtml(m.lesson_number)} (Unit ${escapeHtml(m.unit_code)})</strong>
        <div style="font-size: 12px; color: var(--text-primary);">${escapeHtml(m.lesson_type)}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${hit ? 'In: ' + escapeHtml(hit.title) : escapeHtml(m.theme || '')}</div>
      `;
      } else {
      item.innerHTML = `
        <strong style="color: var(--accent-gold); font-size: 13px;">Lesson ${m.lesson_number} (Week ${m.week}, Day ${m.day_number})</strong>
        <div style="font-size: 12px; color: var(--text-primary);">${escapeHtml(m.lesson_type)} · Theme: ${escapeHtml(m.theme || 'Community')}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${m.target_letter ? `Letter: ${m.target_letter}` : ''} ${m.vocabulary && m.vocabulary.length ? `· Vocab: ${m.vocabulary.join(', ')}` : ''}</div>
      `;
      }
      item.addEventListener('click', () => {
        elements.searchOverlay.classList.add('hidden');
        state.currentWeek = m.week;
        state.currentDay = m.day_number;
        // Open the session that actually contains the match
        const hitIdx = sessionsOf(m).findIndex(s => (s.activities || []).some(a => (a.content + ' ' + a.title).toLowerCase().includes(q)));
        state.currentSession = hitIdx >= 0 ? hitIdx : 0;
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
    if (l.subject === 'numeracy') {
      const acts = l.activities.filter(a => a.numeracy === 'activity')
        .map(a => `• ${a.title}${a.duration_mins ? ` (${a.duration_mins} min)` : ''}`).join('\n');
      const text = `🔢 *Gambia FLP - ${currentLanguageLabel()} Grade 1 Numeracy (Term 1)*\n\n📌 *Lesson ${l.lesson_number}: ${l.lesson_type}*\n🧩 *Unit ${l.unit_code}*: ${l.theme}\n⏱️ *Duration*: ${l.duration_mins || 60} Minutes (Mental Maths 10 · Reinforcement 10 · Activities · Closure 10)\n\n📋 *Activities*\n${acts}\n${l.pb_refs.length ? `📘 *Pupil Book*: Activity ${l.pb_refs.join(', ')}\n` : ''}\n📖 *Open Full Interactive Guide*: https://t.me/gambiaflp_bot\n🌐 https://learningmasterminds.github.io/gambia-flp-guide/?subject=numeracy&grade=${state.currentGrade}&lang=${state.currentLanguage}&week=${l.week}&day=${l.day_number}`;
      shareLessonText(text);
      return;
    }
    const sessionTag = l.sessionCount > 1 ? ` · Session ${l.session}` : '';
    const sessionParam = l.sessionCount > 1 ? `&session=${String(l.session || 'a').toLowerCase()}` : '';
    const shareText = `📚 *Gambia FLP - ${currentLanguageLabel()} ${currentGradeLabel()} (Term 1)*\n\n📌 *Lesson ${l.lesson_number}${sessionTag} (Week ${l.week}, Day ${l.day_number} - ${l.day_name})*\n🏷️ *Type*: ${l.lesson_type}\n🌱 *Theme*: ${l.theme || 'Community'}\n🔤 *Target Letter*: ${l.target_letter || 'Alphabet'}\n🗣️ *Key Vocab*: ${(l.vocabulary || []).join(', ')}\n⏱️ *Duration*: ${l.duration_mins || 30} Minutes\n\n📖 *Open Full Interactive Guide*: https://t.me/gambiaflp_bot\n🌐 https://learningmasterminds.github.io/gambia-flp-guide/?grade=${state.currentGrade}&lang=${state.currentLanguage}&week=${l.week}&day=${l.day_number}${sessionParam}`;

    shareLessonText(shareText);
  });

  // Print Card
  elements.printBtn.addEventListener('click', () => {
    window.print();
  });
  // A closed <details> prints without its content, so open the numeracy
  // activity pools for printing and restore them afterwards.
  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('details.num-pool-item:not([open])').forEach(d => {
      d.dataset.printOpened = '1';
      d.open = true;
    });
  });
  window.addEventListener('afterprint', () => {
    document.querySelectorAll('details.num-pool-item[data-print-opened]').forEach(d => {
      d.open = false;
      delete d.dataset.printOpened;
    });
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
