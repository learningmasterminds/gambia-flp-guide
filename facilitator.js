/**
 * Gambia FLP - Facilitator Guide (teacher-training agenda)
 *
 * Renders one of two abridged facilitator guides for the trainers who deliver
 * the GNLOI teacher training:
 *   literacy  data/facilitator_guide.json            6 training days -> sessions
 *   numeracy  data/facilitator_guide_numeracy.json   modules -> sessions
 * Navigation is Day (or Module) -> Session (not language/grade/week/day as in
 * app.js), and each session is a sequence of facilitation blocks
 * ("Facilitator Focus", "Whole Group Discussion", ...) with Say / Do / Ask cues.
 *
 * Deep links: facilitator.html?day=2&session=3
 *             facilitator.html?guide=numeracy&module=2&session=3
 */

if (window.Telegram && window.Telegram.WebApp) {
  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();
  if (tg.setHeaderColor) tg.setHeaderColor('#091a24');
}

const GUIDES = {
  literacy: { file: './data/facilitator_guide.json', group: 'Day', param: 'day' },
  numeracy: { file: './data/facilitator_guide_numeracy.json', group: 'Module', param: 'module' }
};
const HUB_URL = 'https://learningmasterminds.github.io/gambia-flp-guide/';

// Icons for the facilitation modes in the guide's left-hand column.
const MODE_ICONS = {
  'Facilitator Focus': '🧠',
  'Whole Group Discussion': '🎭',
  'Pair, Whole Group Discussion': '👥',
  'Pair, Whole Group Activity': '👥',
  'Reflect Together': '🪞',
  'Pair Activity': '🤝',
  'Pair Discussion': '🤝',
  'Group Activity': '👨‍👩‍👧',
  'Group Discussion': '👨‍👩‍👧',
  'Small Group Activity': '👨‍👩‍👧',
  'Whole Group Activity': '🎭',
  'Think Pair Share': '💭',
  'Take Feedback': '📝',
  'Flip Classroom': '🔄',
  'Individual Activity': '✍️',
  'Role Play': '🎬',
  'Demonstration': '🎯',
  'Facilitator Demonstration': '🎯',
  'Pair Practice Activity': '🤝',
  'Case Study': '🔎'
};

// Cue labels -> visual treatment. "Say" is the facilitator's spoken script,
// styled like the teacher dialogue in the lesson pages.
const CUE_STYLES = {
  say: { cls: 'fac-cue-say', icon: '🗣️' },
  says: { cls: 'fac-cue-say', icon: '🗣️' },
  do: { cls: 'fac-cue-do', icon: '✅' },
  'quick do': { cls: 'fac-cue-do', icon: '✅' },
  ask: { cls: 'fac-cue-ask', icon: '❓' },
  'ask participants': { cls: 'fac-cue-ask', icon: '❓' },
  'then ask': { cls: 'fac-cue-ask', icon: '❓' },
  display: { cls: 'fac-cue-display', icon: '🖥️' },
  write: { cls: 'fac-cue-display', icon: '🖊️' },
  reinforce: { cls: 'fac-cue-key', icon: '📌' },
  'key message': { cls: 'fac-cue-key', icon: '⭐' },
  remember: { cls: 'fac-cue-key', icon: '📌' },
  note: { cls: 'fac-cue-note', icon: '📝' },
  'facilitator note': { cls: 'fac-cue-note', icon: '📝' },
  explain: { cls: 'fac-cue-say', icon: '💬' },
  learners: { cls: 'fac-cue-response', icon: '🧒' },
  teacher: { cls: 'fac-cue-say', icon: '👩‍🏫' },
  'teacher and learners': { cls: 'fac-cue-response', icon: '👩‍🏫' },
  'expected response': { cls: 'fac-cue-response', icon: '💡' },
  'expected answer': { cls: 'fac-cue-response', icon: '💡' },
  'possible responses': { cls: 'fac-cue-response', icon: '💡' },
  homework: { cls: 'fac-cue-key', icon: '🏡' },
  task: { cls: 'fac-cue-do', icon: '🧩' },
  example: { cls: 'fac-cue-display', icon: '🔎' },
  skill: { cls: 'fac-cue-display', icon: '🎯' }
};

const state = {
  guideKey: 'literacy',
  guide: null,
  days: [],
  dayIndex: 0,
  sessionIndex: 0,
  timerTotal: 1800,
  timerSeconds: 1800,
  timerInterval: null,
  timerRunning: false
};

const el = {
  dayScroll: document.getElementById('day-scroll-container'),
  sessionScroll: document.getElementById('session-scroll-container'),
  heroBadge: document.getElementById('hero-session-badge'),
  heroTiming: document.getElementById('hero-timing-badge'),
  heroTitle: document.getElementById('hero-session-title'),
  heroSub: document.getElementById('hero-session-sub'),
  heroModes: document.getElementById('hero-modes'),
  heroSteps: document.getElementById('hero-steps'),
  heroSource: document.getElementById('hero-source-label'),
  materials: document.getElementById('materials-tags'),
  overviewTitle: document.getElementById('day-overview-title'),
  overviewList: document.getElementById('day-overview-list'),
  stepsList: document.getElementById('steps-list'),
  stepsTotal: document.getElementById('steps-total-time'),
  prevBtn: document.getElementById('prev-session-btn'),
  nextBtn: document.getElementById('next-session-btn'),
  shareBtn: document.getElementById('share-session-btn'),
  printBtn: document.getElementById('print-session-btn'),
  sourceNote: document.getElementById('fac-source-note'),
  guideVersion: document.getElementById('fac-guide-version'),
  hubLink: document.getElementById('hub-link'),
  timerClock: document.getElementById('timer-clock'),
  timerStatus: document.getElementById('timer-status'),
  timerStartBtn: document.getElementById('timer-start-btn'),
  timerResetBtn: document.getElementById('timer-reset-btn'),
  timerProgressFill: document.getElementById('timer-progress-fill'),
  searchToggle: document.getElementById('search-toggle-btn'),
  searchOverlay: document.getElementById('search-overlay'),
  searchInput: document.getElementById('search-input'),
  searchClose: document.getElementById('search-close-btn'),
  searchResults: document.getElementById('search-results'),
  toast: document.getElementById('toast-notification')
};

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// Escape, then honour the soft line breaks the source uses for small
// diagrams ("Teacher Guide ↓ Pupil Materials ↓ ...").
function textHtml(text) {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

function showToast(msg, duration = 3000) {
  el.toast.textContent = msg;
  el.toast.classList.remove('hidden');
  setTimeout(() => el.toast.classList.add('hidden'), duration);
}

function currentDay() { return state.days[state.dayIndex]; }
function groupLabel() { return GUIDES[state.guideKey].group; }
// "Day 2" / "Module 2"; the numeracy guide's module 0 is its introduction.
function groupName(d) {
  if (state.guideKey === 'numeracy' && d.day === 0) return d.title || 'Before the Training';
  return `${groupLabel()} ${d.day}`;
}
function currentSession() { return currentDay().sessions[state.sessionIndex]; }

function sessionModes(session) {
  const out = [];
  session.blocks.forEach(b => (b.modes || []).forEach(m => { if (!out.includes(m)) out.push(m); }));
  return out;
}

function modeChip(mode) {
  const icon = MODE_ICONS[mode] || '•';
  return `<span class="fac-mode-chip">${icon} ${escapeHtml(mode)}</span>`;
}

// ---------------------------------------------------------------------------
// Loading and navigation
// ---------------------------------------------------------------------------
let listenersReady = false;

// Parsed guides, so switching back to a guide already opened does not wait on
// the network (the service worker answers data requests network-first).
const guideCache = {};
let pendingGuide = null;

async function loadGuide(guideKey, fromUrl = true) {
  const params = new URLSearchParams(location.search);
  if (!guideKey) guideKey = (params.get('guide') || '').toLowerCase() === 'numeracy' ? 'numeracy' : 'literacy';
  pendingGuide = guideKey;
  let guide;
  try {
    if (!guideCache[guideKey]) {
      guideCache[guideKey] = fetch(GUIDES[guideKey].file).then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      });
    }
    guide = await guideCache[guideKey];
  } catch (err) {
    delete guideCache[guideKey];
    console.error('Facilitator guide failed to load:', err);
    showToast('Could not load the facilitator guide. Check your connection and reload.', 6000);
    return;
  }
  if (pendingGuide !== guideKey) return;   // a later switch won the race
  // The numeracy guide groups sessions by module; give it the day shape the
  // rest of this file walks (d.day is the module number there).
  const days = guide.days || (guide.modules || []).map(m => ({ day: m.module, title: m.title, sessions: m.sessions }));
  if (!days.length) {
    showToast('The facilitator guide has no sessions.', 6000);
    return;
  }
  state.guideKey = guideKey;
  state.guide = guide;
  state.days = days;
  state.dayIndex = 0;
  state.sessionIndex = 0;

  const wantedDay = fromUrl ? parseInt(params.get(GUIDES[guideKey].param), 10) : NaN;
  const wantedSession = fromUrl ? parseInt(params.get('session'), 10) : NaN;
  const dIdx = state.days.findIndex(d => d.day === wantedDay);
  if (dIdx >= 0) {
    state.dayIndex = dIdx;
    const sIdx = state.days[dIdx].sessions.findIndex(s => s.session === wantedSession);
    if (sIdx >= 0) state.sessionIndex = sIdx;
  }

  const meta = state.guide.metadata || {};
  if (el.guideVersion) el.guideVersion.textContent = `${meta.title || 'Facilitator Guide'} · ${meta.version || ''}`.trim();
  if (el.sourceNote) {
    el.sourceNote.textContent = `Source: ${meta.programme || 'Gambia FLP teacher training'} — ${meta.title || 'Facilitator Guide'}, ${meta.version || ''}. ` +
      `${meta.note || ''}`;
  }
  document.title = `Gambia FLP - ${guideKey === 'numeracy' ? 'Numeracy ' : ''}Facilitator Guide (${meta.version || 'Teacher Training'})`;
  document.querySelectorAll('.fac-guide-btn').forEach(b => {
    const on = b.dataset.guide === guideKey;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  const dayNav = document.getElementById('day-nav');
  if (dayNav) dayNav.setAttribute('aria-label', guideKey === 'numeracy' ? 'Select module' : 'Select training day');
  if (el.hubLink) el.hubLink.setAttribute('href', guideKey === 'numeracy' ? './?subject=numeracy&grade=grade1' : './');
  if (el.searchInput) {
    el.searchInput.placeholder = guideKey === 'numeracy'
      ? 'Search sessions: CPA, screener, place value, games...'
      : 'Search sessions: screener, blending, PLC, songs...';
    el.searchInput.value = '';
    el.searchResults.innerHTML = '';
  }

  if (!listenersReady) {
    setupEventListeners();
    listenersReady = true;
  }
  renderDayPills();
  renderSessionChips();
  renderSession();
}

function goTo(dayIndex, sessionIndex, scroll = true) {
  state.dayIndex = dayIndex;
  state.sessionIndex = sessionIndex;
  renderDayPills();
  renderSessionChips();
  renderSession();
  if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderDayPills() {
  el.dayScroll.innerHTML = '';
  state.days.forEach((d, i) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = `week-pill ${i === state.dayIndex ? 'active' : ''}`;
    const short = d.title && d.title.length > 26 ? d.title.slice(0, 25).trim() + '…' : d.title;
    pill.textContent = state.guideKey === 'numeracy'
      ? `${groupName(d)}${d.day ? ' · ' + short : ''}`
      : `Day ${d.day} · ${d.sessions.length} session${d.sessions.length === 1 ? '' : 's'}`;
    pill.title = `${d.title ? d.title + ' - ' : ''}${d.sessions.length} session${d.sessions.length === 1 ? '' : 's'}`;
    pill.addEventListener('click', () => goTo(i, 0));
    el.dayScroll.appendChild(pill);
  });
  const active = el.dayScroll.querySelector('.active');
  if (active) {
    el.dayScroll.scrollLeft = Math.max(0, active.offsetLeft - (el.dayScroll.clientWidth - active.offsetWidth) / 2);
  }
}

function renderSessionChips() {
  el.sessionScroll.innerHTML = '';
  currentDay().sessions.forEach((s, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `fac-session-chip ${i === state.sessionIndex ? 'active' : ''}`;
    const short = s.title.length > 26 ? s.title.slice(0, 25).trim() + '…' : s.title;
    chip.innerHTML = `<span class="fac-chip-num">S${s.session}</span><span class="fac-chip-title">${escapeHtml(short)}</span>`;
    chip.title = s.title;
    chip.addEventListener('click', () => goTo(state.dayIndex, i));
    el.sessionScroll.appendChild(chip);
  });
  // Centre the active chip horizontally without touching the page scroll
  // (scrollIntoView also scrolls the document on a deep-linked load).
  const active = el.sessionScroll.querySelector('.active');
  if (active) {
    el.sessionScroll.scrollLeft = Math.max(0, active.offsetLeft - (el.sessionScroll.clientWidth - active.offsetWidth) / 2);
  }
}

// ---------------------------------------------------------------------------
// Session rendering
// ---------------------------------------------------------------------------
function renderSession() {
  const day = currentDay();
  const s = currentSession();
  const minutes = s.duration_mins || 30;
  const nDays = state.guide.metadata.total_days || state.days[state.days.length - 1].day;
  const numeracy = state.guideKey === 'numeracy';

  el.heroBadge.textContent = numeracy
    ? `${day.day ? 'Module ' + day.day : 'Introduction'} · ${/^Session/.test(s.source_label) ? s.source_label : 'Session ' + s.session}`
    : `Day ${day.day} · Session ${s.session}`;
  el.heroTiming.textContent = `⏱️ ${minutes} Mins`;
  el.heroTitle.textContent = s.title || `Session ${s.session}`;
  el.heroSub.innerHTML = numeracy
    ? `${escapeHtml(groupName(day))}${day.day ? ': <strong>' + escapeHtml(day.title) + '</strong>' : ''} · session ${s.session} of ${day.sessions.length}`
    : `Training day <strong>${day.day} of ${nDays}</strong> · session ${s.session} of ${day.sessions.length}`;

  const modes = sessionModes(s);
  el.heroModes.innerHTML = modes.length ? modes.map(modeChip).join(' ') : '—';
  el.heroSteps.textContent = `${s.blocks.length} step${s.blocks.length === 1 ? '' : 's'}`;
  // the document's own numbering, which repeats and skips (two "Session 7"s
  // on Day 1), so trainers can match a printed page to the screen
  el.heroSource.textContent = s.source_label || '—';
  el.stepsTotal.textContent = `${minutes} Mins Total`;

  // Materials
  el.materials.innerHTML = '';
  if (s.materials && s.materials.length) {
    s.materials.forEach(m => {
      const span = document.createElement('span');
      span.className = 'tag-item';
      span.textContent = m;
      el.materials.appendChild(span);
    });
  } else {
    el.materials.innerHTML = '<span class="tag-item not-extracted">Not listed for this session in the source guide</span>';
  }

  // Day overview
  el.overviewTitle.textContent = numeracy
    ? `📚 ${groupName(day)} overview (${day.sessions.length} session${day.sessions.length === 1 ? '' : 's'})`
    : `🗓️ Day ${day.day} overview (${day.sessions.length} sessions)`;
  el.overviewList.innerHTML = '';
  day.sessions.forEach((o, i) => {
    const li = document.createElement('li');
    li.className = i === state.sessionIndex ? 'active' : '';
    li.innerHTML = `<button type="button" class="fac-overview-btn"><span class="fac-overview-num">S${o.session}</span> ${escapeHtml(o.title)} <span class="fac-overview-mins">${o.duration_mins || 30} min</span></button>`;
    li.querySelector('button').addEventListener('click', () => goTo(state.dayIndex, i));
    el.overviewList.appendChild(li);
  });

  // Blocks
  el.stepsList.innerHTML = '';
  s.blocks.forEach((b, idx) => {
    const card = document.createElement('div');
    card.className = 'step-card fac-block';
    const modesHtml = (b.modes || []).length ? `<div class="fac-mode-row">${b.modes.map(modeChip).join('')}</div>` : '';
    card.innerHTML = `
      <div class="step-card-header">
        <div class="step-title-wrap">
          <div class="step-num-badge">${idx + 1}</div>
          <div class="step-title">${escapeHtml(b.title || (b.modes && b.modes[0]) || 'Step ' + (idx + 1))}</div>
        </div>
        ${b.duration_mins ? `<span class="step-duration">⏱️ ${b.duration_mins} min</span>` : ''}
      </div>
      ${modesHtml}
      <div class="step-body">${renderContent(b.content)}</div>`;
    el.stepsList.appendChild(card);
  });

  // Pager
  const first = state.dayIndex === 0 && state.sessionIndex === 0;
  const lastDay = state.dayIndex === state.days.length - 1;
  const last = lastDay && state.sessionIndex === day.sessions.length - 1;
  el.prevBtn.disabled = first;
  el.nextBtn.disabled = last;

  // URL reflects the session so the address bar is shareable
  try {
    const url = new URL(location.href);
    ['guide', 'day', 'module'].forEach(k => url.searchParams.delete(k));
    if (numeracy) url.searchParams.set('guide', 'numeracy');
    url.searchParams.set(GUIDES[state.guideKey].param, day.day);
    url.searchParams.set('session', s.session);
    history.replaceState(null, '', url);
  } catch (e) { /* file:// or sandboxed */ }

  state.timerTotal = minutes * 60;
  resetTimer();
}

// Segments -> HTML. A cue ("Say:", "Do:") opens a group that holds the
// bullets and paragraphs that follow it, until the next cue or sub-heading,
// so the script reads the way the printed guide does.
function renderContent(segments) {
  let html = '';
  let group = null;      // { cls, icon, label, items: [] }
  let list = null;       // open bullet list html
  let listLevel = 0;

  const closeList = () => {
    if (list !== null) {
      while (listLevel > 0) { list += '</ul>'; listLevel--; }
      list += '</ul>';
      emit(list);
      list = null;
    }
  };
  const emit = (h) => { if (group) group.items.push(h); else html += h; };
  const closeGroup = () => {
    closeList();
    if (group) {
      const body = group.items.join('');
      const head = group.text
        ? `<div class="fac-cue-head"><span class="fac-cue-label">${group.icon} ${escapeHtml(group.label)}</span> <span class="fac-cue-text">${textHtml(group.text)}</span></div>`
        : `<div class="fac-cue-head"><span class="fac-cue-label">${group.icon} ${escapeHtml(group.label)}</span></div>`;
      html += `<div class="fac-cue ${group.cls}">${head}${body}</div>`;
      group = null;
    }
  };

  segments.forEach(seg => {
    switch (seg.type) {
      case 'cue': {
        closeGroup();
        const style = CUE_STYLES[seg.label.toLowerCase()] || { cls: 'fac-cue-generic', icon: '▪️' };
        group = { cls: style.cls, icon: style.icon, label: seg.label, text: seg.text || '', items: [] };
        break;
      }
      case 'bullet': {
        const lvl = seg.level || 0;
        if (list === null) { list = '<ul class="step-bullet-list">'; listLevel = 0; }
        while (listLevel < lvl) { list += '<ul class="step-bullet-list fac-sub-list">'; listLevel++; }
        while (listLevel > lvl) { list += '</ul>'; listLevel--; }
        list += `<li class="bullet-item">${textHtml(seg.text)}</li>`;
        break;
      }
      case 'heading':
        closeList();
        // What follows "Display:" is the thing to show (a diagram, a word),
        // so bold lines stay inside that box; elsewhere they start a new part.
        if (group && group.cls !== 'fac-cue-display') closeGroup();
        emit(`<h4 class="step-subheading">${textHtml(seg.text)}</h4>`);
        break;
      case 'note':
        closeList();
        emit(`<p class="fac-note">📝 ${textHtml(seg.text)}</p>`);
        break;
      case 'table': {
        closeList();
        const rows = seg.rows || [];
        const [head, ...rest] = rows;
        let t = '<div class="fac-table-wrap"><table class="fac-table">';
        if (head) t += '<thead><tr>' + head.map(c => `<th>${textHtml(c)}</th>`).join('') + '</tr></thead>';
        t += '<tbody>' + rest.map(r => '<tr>' + r.map(c => `<td>${textHtml(c)}</td>`).join('') + '</tr>').join('') + '</tbody>';
        t += '</table></div>';
        emit(t);
        break;
      }
      default:
        closeList();
        emit(`<p class="step-paragraph">${textHtml(seg.text)}</p>`);
    }
  });
  closeGroup();
  return html;
}

// ---------------------------------------------------------------------------
// Search across every session
// ---------------------------------------------------------------------------
function blockText(b) {
  return [b.title, ...(b.modes || []), ...b.content.map(c => {
    if (c.type === 'table') return (c.rows || []).flat().join(' ');
    return (c.label ? c.label + ' ' : '') + (c.text || '');
  })].join(' ').toLowerCase();
}

function runSearch(q) {
  el.searchResults.innerHTML = '';
  if (!q) return;
  const hits = [];
  state.days.forEach((d, di) => d.sessions.forEach((s, si) => {
    const inTitle = s.title.toLowerCase().includes(q) || (s.materials || []).join(' ').toLowerCase().includes(q);
    const blockHit = s.blocks.find(b => blockText(b).includes(q));
    if (inTitle || blockHit) hits.push({ di, si, d, s, block: blockHit });
  }));
  if (!hits.length) {
    el.searchResults.innerHTML = `<div style="padding: 12px; color: var(--text-muted); font-size: 13px;">No session mentions "${escapeHtml(q)}".</div>`;
    return;
  }
  hits.slice(0, 12).forEach(h => {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.innerHTML = `
      <strong style="color: var(--accent-gold); font-size: 13px;">${escapeHtml(groupName(h.d))} · ${escapeHtml(state.guideKey === 'numeracy' && /^Session/.test(h.s.source_label) ? h.s.source_label : 'Session ' + h.s.session)}</strong>
      <div style="font-size: 12px; color: var(--text-primary);">${escapeHtml(h.s.title)}</div>
      <div style="font-size: 11px; color: var(--text-muted);">${h.block ? 'Step: ' + escapeHtml(h.block.title || (h.block.modes || [])[0] || '') : 'Title / materials'} · ${h.s.duration_mins || 30} min</div>`;
    item.addEventListener('click', () => {
      el.searchOverlay.classList.add('hidden');
      goTo(h.di, h.si);
    });
    el.searchResults.appendChild(item);
  });
  if (hits.length > 12) {
    // appended as a node: innerHTML += would rebuild the results above and
    // drop their click handlers
    const more = document.createElement('div');
    more.style.cssText = 'padding: 8px 12px; color: var(--text-muted); font-size: 12px;';
    more.textContent = `…and ${hits.length - 12} more. Add another word to narrow it down.`;
    el.searchResults.appendChild(more);
  }
}

// ---------------------------------------------------------------------------
// Timer (same dock and behaviour as the classroom timer in app.js)
// ---------------------------------------------------------------------------
function updateTimerDisplay() {
  const mins = Math.floor(state.timerSeconds / 60);
  const secs = state.timerSeconds % 60;
  el.timerClock.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  if (el.timerProgressFill) {
    el.timerProgressFill.style.width = `${((state.timerTotal - state.timerSeconds) / state.timerTotal) * 100}%`;
  }
  if (state.timerRunning) {
    el.timerClock.className = state.timerSeconds <= 300 ? 'timer-clock timer-warning' : 'timer-clock timer-running';
  } else {
    el.timerClock.className = 'timer-clock';
  }
}

function startTimer() {
  if (state.timerRunning) {
    clearInterval(state.timerInterval);
    state.timerRunning = false;
    el.timerStartBtn.textContent = 'Resume';
    el.timerStatus.textContent = 'Paused';
    updateTimerDisplay();
    return;
  }
  state.timerRunning = true;
  el.timerStartBtn.textContent = 'Pause';
  el.timerResetBtn.classList.remove('hidden');
  el.timerStatus.textContent = 'In progress';
  updateTimerDisplay();
  state.timerInterval = setInterval(() => {
    if (state.timerSeconds > 0) {
      state.timerSeconds--;
      updateTimerDisplay();
      if (state.timerSeconds === 300) showToast('⏱️ 5 minutes remaining in this session.');
    } else {
      clearInterval(state.timerInterval);
      state.timerRunning = false;
      el.timerStatus.textContent = 'Done 🎉';
      el.timerStartBtn.textContent = 'Restart';
      showToast(`🎉 ${Math.round(state.timerTotal / 60)}-minute session complete.`);
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
  el.timerStartBtn.textContent = 'Start';
  el.timerStatus.textContent = 'Ready';
  el.timerResetBtn.classList.add('hidden');
  if (el.timerProgressFill) el.timerProgressFill.style.width = '0%';
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15);
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

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
function setupEventListeners() {
  el.timerStartBtn.addEventListener('click', startTimer);
  el.timerResetBtn.addEventListener('click', resetTimer);

  el.prevBtn.addEventListener('click', () => {
    if (state.sessionIndex > 0) return goTo(state.dayIndex, state.sessionIndex - 1);
    if (state.dayIndex > 0) return goTo(state.dayIndex - 1, state.days[state.dayIndex - 1].sessions.length - 1);
  });
  el.nextBtn.addEventListener('click', () => {
    if (state.sessionIndex < currentDay().sessions.length - 1) return goTo(state.dayIndex, state.sessionIndex + 1);
    if (state.dayIndex < state.days.length - 1) return goTo(state.dayIndex + 1, 0);
  });

  el.searchToggle.addEventListener('click', () => {
    el.searchOverlay.classList.remove('hidden');
    el.searchInput.focus();
  });
  el.searchClose.addEventListener('click', () => el.searchOverlay.classList.add('hidden'));
  el.searchInput.addEventListener('input', (e) => runSearch(e.target.value.toLowerCase().trim()));

  el.shareBtn.addEventListener('click', () => {
    const d = currentDay();
    const s = currentSession();
    const steps = s.blocks.map((b, i) => `${i + 1}. ${b.title || (b.modes || [])[0] || 'Step'}${b.duration_mins ? ` (${b.duration_mins} min)` : ''}`).join('\n');
    const numeracy = state.guideKey === 'numeracy';
    const where = numeracy ? `${groupName(d)}, ${/^Session/.test(s.source_label) ? s.source_label : 'Session ' + s.session}` : `Day ${d.day}, Session ${s.session}`;
    const link = numeracy ? `facilitator.html?guide=numeracy&module=${d.day}&session=${s.session}` : `facilitator.html?day=${d.day}&session=${s.session}`;
    const shareText = `🎓 *Gambia FLP - ${numeracy ? 'Numeracy ' : ''}Facilitator Guide (Teacher Training)*\n\n📌 *${where}: ${s.title}*\n⏱️ *Duration*: ${s.duration_mins || 30} Minutes\n📦 *Materials*: ${(s.materials || []).join(', ') || 'not listed'}\n\n📋 *Steps*\n${steps}\n\n📖 *Open Full Guide*: https://t.me/gambiaflp_bot\n🌐 ${HUB_URL}${link}`;
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
        () => showToast('📋 Session summary copied - paste it into your Telegram chat.'),
        () => showToast('⚠️ Could not copy. Use Print instead.')
      );
    }
  });

  el.printBtn.addEventListener('click', () => window.print());

  document.querySelectorAll('.fac-guide-btn').forEach(b => {
    b.addEventListener('click', () => {
      if (b.dataset.guide === state.guideKey) return;
      loadGuide(b.dataset.guide, false).then(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    });
  });
}

document.addEventListener('DOMContentLoaded', () => loadGuide());
