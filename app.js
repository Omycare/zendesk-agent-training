// ─── STATE ───────────────────────────────────────────────────────────────────
const state = {
  lang: localStorage.getItem('zd-lang') || 'fr',
  mod: -1,
  les: 0,
  done: JSON.parse(localStorage.getItem('zd-done') || '{}'),
  answered: false
};

// ─── LANG ─────────────────────────────────────────────────────────────────────
function setLang(l) {
  state.lang = l;
  localStorage.setItem('zd-lang', l);
  document.documentElement.lang = l;
  document.getElementById('btn-fr').classList.toggle('active', l === 'fr');
  document.getElementById('btn-en').classList.toggle('active', l === 'en');
  document.getElementById('sl-label').textContent = l === 'fr' ? 'Formation Agent' : 'Agent Training';
  document.getElementById('sl-progress-lbl').textContent = l === 'fr' ? 'Progression' : 'Progress';
  renderSidebar();
  if (state.mod === -1) showWelcome();
  else showLesson(state.mod, state.les);
}

// ─── PROGRESS ────────────────────────────────────────────────────────────────
function totalLessons() { return MODULES.reduce((a, m) => a + m.lessons.length, 0); }
function doneLessons() { return Object.values(state.done).filter(Boolean).length; }
function updateProgress() {
  const pct = Math.round((doneLessons() / totalLessons()) * 100);
  document.getElementById('pbar-fill').style.width = pct + '%';
  document.getElementById('sl-progress-pct').textContent = pct + '%';
  localStorage.setItem('zd-done', JSON.stringify(state.done));
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function renderSidebar() {
  const nav = document.getElementById('modules-nav');
  nav.innerHTML = '';
  MODULES.forEach((mod, mi) => {
    const allDone = mod.lessons.every(l => state.done[l.key]);
    const isOpen = state.mod === mi;

    const item = document.createElement('div');
    item.className = 'mod-item' + (isOpen ? ' open' : '');

    const btn = document.createElement('button');
    btn.className = 'mod-btn' + (state.mod === mi ? ' active' : '') + (allDone ? ' done' : '');
    btn.innerHTML = `<span class="mod-icon">${mod.icon}</span><span class="mod-name">${mod.title[state.lang]}</span>${allDone ? '<span class="mod-check">✓</span>' : ''}`;
    btn.onclick = () => { state.mod = mi; state.les = 0; state.answered = false; renderSidebar(); showLesson(mi, 0); };

    const sub = document.createElement('div');
    sub.className = 'lessons-sub';
    mod.lessons.forEach((les, li) => {
      const lb = document.createElement('button');
      lb.className = 'les-btn' + (state.mod === mi && state.les === li ? ' active' : '') + (state.done[les.key] ? ' done' : '');
      lb.innerHTML = `<span class="les-dot"></span>${les.title[state.lang]}`;
      lb.onclick = (e) => { e.stopPropagation(); state.mod = mi; state.les = li; state.answered = false; renderSidebar(); showLesson(mi, li); };
      sub.appendChild(lb);
    });

    item.appendChild(btn);
    item.appendChild(sub);
    nav.appendChild(item);
  });
}

// ─── WELCOME ─────────────────────────────────────────────────────────────────
function showWelcome() {
  state.mod = -1;
  document.getElementById('breadcrumb').innerHTML = `<span>${state.lang === 'fr' ? 'Accueil' : 'Home'}</span>`;
  const L = state.lang;
  const page = document.getElementById('page');
  page.innerHTML = `
    <div class="welcome">
      <div class="lesson-tag">🎓 OmyCare</div>
      <h1>${L === 'fr' ? 'Formation Agent Zendesk' : 'Zendesk Agent Training'}</h1>
      <p class="sub">${L === 'fr' ? 'Maîtrisez toutes les fonctionnalités de Zendesk pour offrir une expérience client exceptionnelle. Formation interactive avec exercices pratiques.' : 'Master all Zendesk features to deliver an exceptional customer experience. Interactive training with practical exercises.'}</p>
      <button class="start-btn" onclick="startTraining()">${L === 'fr' ? '▶ Commencer la formation' : '▶ Start training'}</button>
      <div class="mod-grid">
        ${MODULES.map((m, i) => `
          <div class="mod-card" onclick="startMod(${i})">
            <div class="ic">${m.icon}</div>
            <div class="info">
              <div class="t">${m.title[L]}</div>
              <div class="s">${m.lessons.length} ${L === 'fr' ? 'leçon' : 'lesson'}${m.lessons.length > 1 ? 's' : ''}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
  renderSidebar();
  updateProgress();
}

function startTraining() { startMod(0); }
function startMod(i) { state.mod = i; state.les = 0; state.answered = false; renderSidebar(); showLesson(i, 0); }

// ─── LESSON ──────────────────────────────────────────────────────────────────
function showLesson(mi, li) {
  const mod = MODULES[mi];
  const les = mod.lessons[li];
  const L = state.lang;
  state.answered = false;
  selectedOpt = null;
  selectedCorrect = null;

  document.getElementById('breadcrumb').innerHTML = `<span style="cursor:pointer;color:var(--purple)" onclick="showWelcome()">${L === 'fr' ? 'Accueil' : 'Home'}</span> › <span>${mod.title[L]}</span> › <strong>${les.title[L]}</strong>`;

  const ex = les.exercise;
  const hasPrev = li > 0 || mi > 0;
  const isLast = mi === MODULES.length - 1 && li === mod.lessons.length - 1;
  const nextLabel = isLast ? (L === 'fr' ? '🎉 Terminer' : '🎉 Finish') : (L === 'fr' ? 'Suivant →' : 'Next →');

  let exerciseHtml = '';
  if (ex.type === 'none') {
    // No exercise for this lesson
  } else if (ex.type === 'sim') {
    // Simulator exercise, rendered separately after DOM insert
    exerciseHtml = `<div id="sim-exercise-container"></div>`;
  } else {
    // Quiz exercise
    const opts = ex.options.map((o, i) => `
      <div class="opt" id="opt-${i}" onclick="selectOpt(${i}, ${o.correct}, this, '${encodeURIComponent(JSON.stringify(o.feedback[L]))}')">
        <span class="opt-l">${String.fromCharCode(65 + i)}</span>
        ${o.text[L]}
      </div>`).join('');
    exerciseHtml = `
      <div class="exercise">
        <div class="ex-lbl">✏️ ${L === 'fr' ? 'Exercice pratique' : 'Practice exercise'}</div>
        <div class="ex-q">${ex.question[L]}</div>
        ${ex.context ? `<div class="ex-ctx">📋 ${ex.context[L]}</div>` : ''}
        <div class="options" id="options">${opts}</div>
        <button class="validate-btn" id="val-btn" disabled onclick="validate()">${L === 'fr' ? 'Valider ma réponse' : 'Validate answer'}</button>
        <div class="feedback" id="feedback"></div>
      </div>`;
  }

  document.getElementById('page').innerHTML = `
    <div class="content-area">
      <div class="lesson-header">
        <div class="lesson-tag">${mod.icon} ${mod.title[L]}</div>
        <h1 class="lesson-title">${les.title[L]}</h1>
        <p class="lesson-subtitle">${les.subtitle[L]}</p>
      </div>
      ${les.content[L]}
      ${exerciseHtml}
      <div class="lesson-nav">
        <button class="nav-btn prev" ${!hasPrev ? 'disabled' : ''} onclick="navPrev()">← ${L === 'fr' ? 'Précédent' : 'Previous'}</button>
        <span style="font-size:12px;color:var(--text-light)">${li + 1} / ${mod.lessons.length}</span>
        <button class="nav-btn next" id="next-btn" onclick="navNext()">${nextLabel}</button>
      </div>
    </div>`;

  // Render sim exercise after DOM is ready
  if (ex.type === 'sim') {
    const container = document.getElementById('sim-exercise-container');
    if (container && typeof renderSimExercise === 'function') {
      renderSimExercise(ex, container, L);
    }
  }

  updateProgress();
  window.scrollTo(0, 0);
}

// ─── EXERCISE ────────────────────────────────────────────────────────────────
let selectedOpt = null;
let selectedCorrect = null;
let selectedFeedback = null;

function selectOpt(idx, correct, el, feedbackEnc) {
  if (state.answered) return;
  document.querySelectorAll('.opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  selectedOpt = idx;
  selectedCorrect = correct;
  selectedFeedback = decodeURIComponent(feedbackEnc);
  document.getElementById('val-btn').disabled = false;
}

function validate() {
  if (state.answered) return;
  state.answered = true;
  document.getElementById('val-btn').disabled = true;

  const opts = document.querySelectorAll('.opt');
  opts.forEach((el, i) => {
    if (MODULES[state.mod].lessons[state.les].exercise.options[i].correct) el.classList.add('correct');
    else if (i === selectedOpt) el.classList.add('wrong');
  });

  const fb = document.getElementById('feedback');
  fb.className = 'feedback show ' + (selectedCorrect ? 'ok' : 'ko');
  const retryBtn = selectedCorrect ? '' : `<button class="sim-retry-btn" style="margin-left:12px" onclick="retryQuiz()">↺ ${state.lang==='fr'?'Réessayer':'Retry'}</button>`;
  fb.innerHTML = (selectedCorrect ? '✅ ' : '❌ ') + selectedFeedback + retryBtn;

  if (selectedCorrect) {
    state.done[MODULES[state.mod].lessons[state.les].key] = true;
    updateProgress();
    renderSidebar();
  }
}

function retryQuiz() {
  state.answered = false;
  selectedOpt = null;
  selectedCorrect = null;
  document.querySelectorAll('.opt').forEach(o => o.classList.remove('selected', 'correct', 'wrong'));
  const fb = document.getElementById('feedback');
  if (fb) { fb.className = 'feedback'; fb.innerHTML = ''; }
  const btn = document.getElementById('val-btn');
  if (btn) btn.disabled = true;
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
function navNext() {
  const mod = MODULES[state.mod];
  if (state.les < mod.lessons.length - 1) {
    state.les++;
  } else if (state.mod < MODULES.length - 1) {
    state.mod++;
    state.les = 0;
  } else {
    showComplete();
    return;
  }
  state.answered = false;
  selectedOpt = null;
  selectedCorrect = null;
  renderSidebar();
  showLesson(state.mod, state.les);
}

function navPrev() {
  if (state.les > 0) {
    state.les--;
  } else if (state.mod > 0) {
    state.mod--;
    state.les = MODULES[state.mod].lessons.length - 1;
  }
  state.answered = false;
  selectedOpt = null;
  selectedCorrect = null;
  renderSidebar();
  showLesson(state.mod, state.les);
}

// ─── COMPLETE ────────────────────────────────────────────────────────────────
function showComplete() {
  const L = state.lang;
  document.getElementById('page').innerHTML = `
    <div class="content-area">
      <div class="complete">
        <div class="trophy">🏆</div>
        <h2>${L === 'fr' ? 'Formation terminée !' : 'Training complete!'}</h2>
        <p>${L === 'fr' ? 'Félicitations ! Vous avez complété toutes les leçons de la formation Agent Zendesk OmyCare.' : 'Congratulations! You have completed all lessons of the OmyCare Zendesk Agent training.'}</p>
        <p style="font-size:13px;color:var(--text-light);margin-bottom:24px">${doneLessons()} / ${totalLessons()} ${L === 'fr' ? 'exercices réussis' : 'exercises completed'}</p>
        <button class="start-btn" onclick="showWelcome()">${L === 'fr' ? '↩ Revenir à l\'accueil' : '↩ Back to home'}</button>
      </div>
    </div>`;
}

// ─── INIT ────────────────────────────────────────────────────────────────────
setLang(state.lang);
showWelcome();
