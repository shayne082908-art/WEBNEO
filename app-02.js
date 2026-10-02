function outlineGhostHtml(chapter) {
  const sections = (chapter.outlineSections || []).filter(section => !section.consumed && section.note?.trim());
  return sections.map(section => `<p class="outline-ghost" data-outline-ghost="${section.id}" title="Start typing to replace this outline note">${escapeHtml(section.note)}</p>`).join('');
}

function renderChapterList(book) {
  return book.chapterOrder.map(id => {
    const ch = book.chapters[id];
    const active = id === state.chapterId ? 'active' : '';
    const hasPlaceholder = book.placeholders.some(p => !p.resolved && p.chapterId === id);
    return `<div class="chapter-entry ${active}"><button class="chapter-link ${active}" data-action="open-chapter" data-chapter="${id}"><span>${hasPlaceholder ? '<b class="chapter-dot">•</b>' : ''}${escapeHtml(chapterKicker(book,id))}${ch.title && !/^Chapter \d+$/i.test(ch.title) ? ` · ${escapeHtml(ch.title)}` : ''}</span><small>${wordCount(ch.html)} words</small></button>${active ? `<textarea class="chapter-note" data-chapter-note="${id}" placeholder="What happens in this chapter?">${escapeHtml(ch.note || '')}</textarea>` : ''}</div>`;
  }).join('');
}

function renderEditor() {
  stopSprintTicker();
  const book = state.library.books[state.bookId];
  const chapter = book.chapters[state.chapterId] || book.chapters[book.chapterOrder[0]];
  state.chapterId = chapter.id;
  ensureToday(book);

  const total = bookWordCount(book);
  const chapterWords = wordCount(chapter.html);
  const daily = todayWords(book);
  const settings = book.viewSettings || {};
  const scopeCount = state.wordCountScope === 'book' ? total : chapterWords;
  const scopeLabel = state.wordCountScope === 'book' ? 'book' : 'chapter';

  app.innerHTML = `
    <main class="editor-shell ${settings.typewriter ? 'typewriter-on' : ''} ${settings.spellcheck ? 'spellcheck-on' : ''}">
      <div class="edge-reveal edge-left" data-action="chapters" aria-hidden="true"></div><div class="edge-reveal edge-right" data-action="placeholder-panel" aria-hidden="true"></div>
      <header class="editor-topbar">
        <button class="icon-button" data-action="shelf" aria-label="Back to bookshelf">←</button>
        <button class="icon-button nav-toggle" data-action="chapters" aria-label="Show chapters">☰</button>
        <div class="editor-book-title" contenteditable="true" spellcheck="false" data-field="book-title">${escapeHtml(book.title || 'Untitled')}</div>
        <div class="editor-status"><span data-save-state>${state.saveState}</span><span>·</span><span>${total.toLocaleString()} words</span>${settings.spellcheck ? '<span class="spell-state">· spellcheck</span>' : ''}</div>
        <button class="icon-button desktop-tool" data-action="save-darling" title="Keep selected text as a Darling" aria-label="Keep selected text as a Darling">♡</button>
        <button class="icon-button" data-action="placeholder" title="Drop a placeholder" aria-label="Drop a placeholder">◆</button>
        <button class="icon-button" data-action="format" title="Writing view settings" aria-label="Writing view settings">Aa</button>
      </header>

      <aside class="chapter-drawer ${state.navOpen ? 'open' : ''}" aria-label="Chapters"><div class="drawer-head"><span>Chapters</span><button class="icon-button" data-action="close-chapters" aria-label="Close chapters">×</button></div><div class="chapter-list">${renderChapterList(book)}</div><button class="new-chapter" data-action="new-chapter">+ New chapter</button><div class="drawer-hint">Enter ×2 → *** · Enter ×3 → new chapter</div></aside>

      <aside class="right-drawer ${state.placeholderOpen ? 'open' : ''}" aria-label="Placeholders"><div class="drawer-head"><span>Placeholders</span><button class="icon-button" data-action="close-placeholders" aria-label="Close placeholders">×</button></div><div class="placeholder-list">${renderPlaceholderItems(book)}</div><button class="new-chapter" data-action="new-placeholder">+ Drop placeholder here</button></aside>

      <aside class="format-sheet ${state.formatOpen ? 'open' : ''}" aria-label="Writing view settings">
        <div class="drawer-head"><span>Writing view</span><button class="icon-button" data-action="close-format" aria-label="Close writing view">×</button></div>
        <label class="setting-row"><span>Text size</span><input data-setting="font-size" type="range" min="16" max="28" step="1" value="${Number(settings.fontSize) || 20}" /></label>
        <label class="setting-row"><span>Typeface</span><select data-setting="font-family"><option>Georgia</option><option>Palatino</option><option>Garamond</option><option>Times New Roman</option></select></label>
        <label class="setting-row"><span>Drop cap</span><input data-setting="drop-cap" type="checkbox" ${settings.dropCap !== false ? 'checked' : ''} /></label>
        <label class="setting-row"><span>Focus paragraph</span><input data-setting="focus" type="checkbox" ${settings.focusMode ? 'checked' : ''} /></label>
        <label class="setting-row"><span>Typewriter scrolling</span><input data-setting="typewriter" type="checkbox" ${settings.typewriter ? 'checked' : ''} /></label>
        <label class="setting-row"><span>Spellcheck pass</span><input data-setting="spellcheck" type="checkbox" ${settings.spellcheck ? 'checked' : ''} /></label>
        <label class="setting-row"><span>Chapter type</span><select data-setting="chapter-kind"><option value="chapter">Chapter</option><option value="prologue">Prologue</option><option value="epilogue">Epilogue</option></select></label>
        <button class="quiet wide" data-action="theme">Toggle page theme</button>
        <p class="sheet-help">Shift+Enter starts a poetry paragraph. Ctrl/Cmd+; toggles spellcheck. Smart punctuation turns -- into — and ... into ….</p>
      </aside>

      <div class="drawer-scrim ${(state.navOpen || state.placeholderOpen || state.formatOpen) ? 'show' : ''}" data-action="close-all"></div>

      <section class="paper-scroll">${state.mode === 'manuscript' ? `<article class="paper ${settings.dropCap === false ? 'no-dropcap' : ''}" style="--manuscript-size:${Number(settings.fontSize) || 20}px;--manuscript-font:${escapeHtml(settings.fontFamily || 'Georgia')}"><div class="chapter-kicker">${escapeHtml(chapterKicker(book, chapter.id))}</div><div class="chapter-title" contenteditable="true" spellcheck="false" data-field="chapter-title">${escapeHtml(chapter.title || '')}</div>${book.ideaForge?.pinned ? `<aside class="pinned-spark"><span>Writing spark</span><p>${escapeHtml(book.ideaForge.pinned.text)}</p><button data-action="unpin-idea">×</button></aside>` : ''}<div id="manuscript-editor" class="manuscript ${settings.focusMode ? 'focus-mode' : ''}" contenteditable="true" role="textbox" aria-multiline="true" spellcheck="${settings.spellcheck ? 'true' : 'false'}">${outlineGhostHtml(chapter)}${chapter.html || '<p><br></p>'}</div></article>` : renderAuxView(book)}</section>

      <footer class="editor-bottombar"><nav class="mode-tabs" aria-label="Writing tools">${modeButton('manuscript', 'Manuscript')}${modeButton('notes', 'Notes')}${modeButton('outline', 'Outline')}${modeButton('darlings', `Darlings${book.darlings.length ? ` · ${book.darlings.length}` : ''}`)}${modeButton('ideas', 'Idea Forge')}${modeButton('goals', 'Goals')}</nav><div class="bottom-counters"><button class="counter-button" data-action="goals">${daily.toLocaleString()} / ${(book.dailyGoal || 500).toLocaleString()} today</button><button class="counter-button" data-action="word-scope">${scopeCount.toLocaleString()} ${scopeLabel}</button><span class="sprint-mini" data-sprint-mini></span></div></footer>
    </main>`;

  const fontSelect = app.querySelector('[data-setting="font-family"]'); if (fontSelect) fontSelect.value = settings.fontFamily || 'Georgia';
  const kindSelect = app.querySelector('[data-setting="chapter-kind"]'); if (kindSelect) kindSelect.value = chapter.kind || 'chapter';
  bindEditorEvents();
  if (book.sprint?.active) startSprintTicker(book);
  if (state.mode === 'manuscript') requestAnimationFrame(updateFocusParagraph);
}

function modeButton(mode, label) {
  return `<button class="mode-tab ${state.mode === mode ? 'active' : ''}" data-action="mode" data-mode="${mode}">${label}</button>`;
}

function renderPlaceholderItems(book) {
  const open = book.placeholders.filter(p => !p.resolved);
  if (!open.length) return '<div class="empty-state"><strong>No loose threads.</strong><span>Drop a marker when you need a name, fact, date, or fix and keep writing.</span></div>';
  return open.map(item => {
    const ch = book.chapters[item.chapterId];
    return `<article class="placeholder-item">
      <button class="placeholder-jump" data-action="jump-placeholder" data-placeholder="${item.id}">
        <strong>${escapeHtml(item.note)}</strong>
        <span>${escapeHtml(ch?.title || 'Chapter')}</span>
      </button>
      <button class="resolve-button" data-action="resolve-placeholder" data-placeholder="${item.id}">Done</button>
    </article>`;
  }).join('');
}

function renderAuxView(book) {
  if (state.mode === 'notes') return `<article class="paper aux-paper"><div class="aux-eyebrow">Notes</div><p class="aux-hint">A private scratchpad for this book. Characters, continuity, research crumbs, whatever keeps the draft moving.</p><div id="aux-editor" class="aux-editor" data-aux="notes" contenteditable="true" spellcheck="false">${book.notesHtml || '<p><br></p>'}</div></article>`;
  if (state.mode === 'outline') return renderOutline(book);

  if (state.mode === 'darlings') {
    return `<article class="paper aux-paper collection-paper">
      <div class="aux-eyebrow">Darlings</div>
      <h2>Keep the bodies.</h2>
      <p class="aux-hint">Select text in the manuscript and tap ♡. It leaves the draft but remembers the exact place it came from.</p>
      ${book.darlings.length ? `<div class="darling-list">${book.darlings.map(renderDarling).join('')}</div>` : '<div class="large-empty">No darlings yet.</div>'}
    </article>`;
  }

  if (state.mode === 'ideas') return renderIdeaForge(book);
  if (state.mode === 'goals') return renderGoals(book);
  return '';
}

function renderOutline(book) {
  return `<article class="paper aux-paper outline-paper"><div class="aux-eyebrow">Outline</div><h2>Draw the map, or ignore it.</h2><p class="aux-hint">Chapter notes live in the left panel. Section beats below become gray ghost paragraphs in the manuscript until you start typing over them.</p><div class="outline-list">${book.chapterOrder.map(id => { const ch=book.chapters[id]; return `<section class="outline-chapter ${id===state.chapterId?'active':''}"><div class="outline-chapter-head"><b>${escapeHtml(chapterKicker(book,id))}${ch.title&&!/^Chapter \d+$/i.test(ch.title)?` · ${escapeHtml(ch.title)}`:''}</b><button data-action="outline-open" data-chapter="${id}">Open</button></div><textarea data-outline-summary="${id}" placeholder="Chapter summary">${escapeHtml(ch.summary||'')}</textarea><div class="outline-sections">${(ch.outlineSections||[]).map((section,index)=>`<div class="outline-section"><span>${index+1}</span><input data-outline-section="${id}" data-section="${section.id}" value="${escapeHtml(section.note||'')}" placeholder="Scene / section beat"/><button data-action="delete-outline-section" data-chapter="${id}" data-section="${section.id}">×</button></div>`).join('')}</div><button class="quiet" data-action="add-outline-section" data-chapter="${id}">+ Section beat</button></section>`; }).join('')}</div></article>`;
}

function renderDarling(item) {
  const text = plainText(item.html).trim();
  return `<article class="darling-card">
    <blockquote>${escapeHtml(text || '(empty passage)')}</blockquote>
    <div class="darling-actions">
      <span>${new Date(item.createdAt).toLocaleDateString()}</span>
      <button data-action="restore-darling" data-darling="${item.id}">Restore</button>
      <button class="danger-quiet" data-action="delete-darling" data-darling="${item.id}">Discard</button>
    </div>
  </article>`;
}


const IDEA_BANK = {
  protagonist: [
    'a night-shift archivist who remembers other people’s dreams', 'a disgraced cartographer who can no longer recognize roads',
    'a child translator for a family that lies professionally', 'a locksmith who has never opened the same door twice',
    'a wedding photographer who only notices what people are hiding', 'an exhausted ghostwriter whose client may not exist',
    'a ferry operator who knows every passenger except one', 'a botanist keeping a forbidden plant alive in an apartment',
    'a substitute teacher who receives letters from next week', 'a small-town mechanic rebuilding a car that belonged to a stranger'
  ],
  desire: [
    'wants to leave before anyone notices what they have done', 'needs one person to believe an impossible story',
    'is trying to recover something they deliberately forgot', 'must finish a promise made to someone who is gone',
    'wants to be ordinary for exactly one week', 'is desperate to keep two people from meeting',
    'needs to prove a beautiful thing was not an accident', 'wants permission to stop being useful',
    'must win back a place they once fled', 'needs to learn why everyone else remembers the same event differently'
  ],
  pressure: [
    'but every attempt makes the situation more public', 'while a deadline keeps moving closer without explanation',
    'and the only helpful witness is lying about something else', 'while someone begins copying their private decisions',
    'but success would hurt the person they are trying to protect', 'and a harmless ritual starts producing real consequences',
    'while the town quietly agrees not to discuss what happened', 'but the evidence points toward the person they trust most',
    'and the easiest solution requires becoming the person they dislike', 'while an old mistake suddenly becomes valuable to someone dangerous'
  ],
  turn: [
    'Then the supposed problem asks for help.', 'Then they discover they have already succeeded once and forgotten it.',
    'Then the person they are protecting confesses first.', 'Then an object they threw away returns with a note inside.',
    'Then the deadline passes and nothing happens, which is worse.', 'Then a stranger thanks them for something they have not done yet.',
    'Then the villain offers evidence that makes perfect sense.', 'Then the safest room in the story becomes the least trustworthy place.',
    'Then the secret becomes useful only if everyone learns it.', 'Then they realize the choice was designed for them personally.'
  ],
  setting: [
    'during the final week before a coastal town is abandoned', 'inside a museum being renovated while still open to visitors',
    'on an overnight train with no scheduled stops', 'in a neighborhood where every house has the same floor plan except one',
    'during a heat wave that keeps knocking out the power', 'at a family-run hotel preparing for its centennial celebration',
    'in a university library after the semester has ended', 'on a tiny island receiving its first cell tower',
    'inside a shopping mall that is slowly being demolished around the remaining stores', 'in a mountain village reachable only when the weather allows'
  ],
  image: [
    'a key warm from someone else’s hand', 'rainwater trapped inside a sealed glass frame', 'a chair facing the wrong direction in an empty room',
    'a voicemail with breathing but no voice', 'fresh paint covering only one sentence on a wall', 'a paper cup with a name nobody recognizes',
    'a row of shoes outside a locked door', 'an envelope that smells faintly of smoke', 'a cracked mirror repaired with clear tape', 'a receipt for something that cannot be bought'
  ],
  constraint: [
    'Write the scene without using any dialogue tags.', 'Let the most important fact appear only through what characters avoid saying.',
    'Use one ordinary object three times, changing its meaning each time.', 'Keep the entire scene in one physical room.',
    'Do not describe anyone’s face.', 'Make the conflict worsen because someone is genuinely kind.',
    'Begin after the obvious dramatic event has already happened.', 'Let every paragraph contain one concrete sensory detail.',
    'Give the viewpoint character a wrong assumption that the reader can detect.', 'End with an action rather than an explanation.'
  ],
  opening: [
    'Start with an interruption that seems trivial but changes the day.', 'Open on someone cleaning up evidence of an event the reader has not seen.',
    'Begin with a character rehearsing a sentence they never get to say.', 'Open with a familiar place containing one impossible detail.',
    'Start at the exact moment a routine stops working.', 'Begin with someone receiving something they absolutely did not order.',
    'Open with a question whose honest answer would ruin the relationship.', 'Start with a character pretending not to recognize someone.',
    'Begin with the aftermath of a celebration nobody enjoyed.', 'Open with a tiny decision that cannot be undone.'
  ]
};

const IDEA_GENRES = ['Any','Literary','Fantasy','Science fiction','Mystery','Romance','Horror','Thriller','Historical','Speculative'];
const IDEA_MOODS = ['Any','Tender','Uneasy','Playful','Melancholy','Hopeful','Intimate','Strange','Tense','Bittersweet'];

function ideaState(book) {
  book.ideaForge ||= { mode: 'premise', genre: 'Any', mood: 'Any', current: null, locks: {}, saved: [], pinned: null };
  book.ideaForge.locks ||= {};
  book.ideaForge.saved ||= [];
  return book.ideaForge;
}

function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
function ideaKeys(mode) {
  if (mode === 'scene') return ['setting','pressure','image','constraint'];
  if (mode === 'character') return ['protagonist','desire','image','turn'];
  if (mode === 'constraint') return ['opening','constraint','image','turn'];
  return ['protagonist','desire','pressure','turn'];
}
function composeIdea(book) {
  const f = ideaState(book), c = f.current || {}, prefix = [f.genre !== 'Any' ? f.genre : '', f.mood !== 'Any' ? f.mood : ''].filter(Boolean).join(' · ');
  if (f.mode === 'scene') return `${prefix ? prefix + '. ' : ''}Set the scene ${c.setting}. ${cap(c.pressure)} Work in ${c.image}. ${c.constraint}`;
  if (f.mode === 'character') return `${prefix ? prefix + '. ' : ''}Write about ${c.protagonist} who ${c.desire}, ${c.pressure}. Keep returning to ${c.image}. ${c.turn}`;
  if (f.mode === 'constraint') return `${prefix ? prefix + '. ' : ''}${c.opening} ${c.constraint} Include ${c.image}. ${c.turn}`;
  return `${prefix ? prefix + '. ' : ''}${cap(c.protagonist)} ${c.desire}, ${c.pressure}. ${c.turn}`;
}
function cap(s='') { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function generateIdea(book, { rerollKey = null } = {}) {
  const f = ideaState(book), keys = ideaKeys(f.mode), old = f.current || {}, next = {};
  keys.forEach(key => { next[key] = (f.locks[key] && old[key] && key !== rerollKey) ? old[key] : pick(IDEA_BANK[key]); });
  f.current = next;
  f.currentText = composeIdea(book);
  persist();
}
function renderIdeaForge(book) {
  const f = ideaState(book);
  if (!f.current) generateIdea(book);
  const keys = ideaKeys(f.mode);
  return `<article class="paper aux-paper idea-paper">
    <div class="aux-eyebrow">Idea Forge</div>
    <h2>Give the blank page something to argue with.</h2>
    <p class="aux-hint">Offline prompt generation. Lock the pieces you like, reroll the rest, then pin the spark above your manuscript or turn it into a timed practice.</p>
    <div class="idea-toolbar">
      <div class="idea-modes">${[['premise','Premise'],['scene','Scene'],['character','Character'],['constraint','Challenge']].map(([m,l]) => `<button class="idea-mode ${f.mode===m?'active':''}" data-action="idea-mode" data-idea-mode="${m}">${l}</button>`).join('')}</div>
      <label>Genre<select data-idea-filter="genre">${IDEA_GENRES.map(x=>`<option ${f.genre===x?'selected':''}>${x}</option>`).join('')}</select></label>
      <label>Mood<select data-idea-filter="mood">${IDEA_MOODS.map(x=>`<option ${f.mood===x?'selected':''}>${x}</option>`).join('')}</select></label>
    </div>
    <section class="spark-card">
      <div class="spark-label">Current spark</div>
      <blockquote>${escapeHtml(f.currentText || composeIdea(book))}</blockquote>
      <div class="ingredient-grid">${keys.map(key => `<div class="ingredient ${f.locks[key]?'locked':''}"><span>${escapeHtml(key)}</span><p>${escapeHtml(f.current[key])}</p><div><button data-action="idea-lock" data-idea-key="${key}">${f.locks[key]?'Locked':'Lock'}</button><button data-action="idea-reroll-one" data-idea-key="${key}">↻</button></div></div>`).join('')}</div>
      <div class="spark-actions"><button class="primary" data-action="idea-reroll">Reroll unlocked</button><button data-action="idea-save">♡ Save</button><button data-action="idea-copy">Copy</button><button data-action="idea-pin">Pin to manuscript</button><button data-action="idea-practice">Start 15-min practice</button></div>
    </section>
    <section class="saved-sparks"><div class="aux-eyebrow">Saved sparks</div>${f.saved.length ? f.saved.map(item => `<article class="saved-spark"><p>${escapeHtml(item.text)}</p><div><button data-action="idea-use-saved" data-idea-id="${item.id}">Use</button><button class="danger-quiet" data-action="idea-delete-saved" data-idea-id="${item.id}">Delete</button></div></article>`).join('') : '<div class="large-empty">Nothing saved yet.</div>'}</section>
  </article>`;
}

function progressSeries(book, days = 30) {
  const out = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const rec = book.stats?.days?.[key] || {};
    out.push({ key, label: `${d.getMonth()+1}/${d.getDate()}`, words: key === localDayKey() ? todayWords(book) : Number(rec.words || 0) });
  }
  return out;
}

function renderProgressChart(book) {
  const points = progressSeries(book, 30), goal = Number(book.dailyGoal) || 500;
  const max = Math.max(goal, ...points.map(p => p.words), 1);
  const bars = points.map((p,i) => { const h=Math.max(1,Math.round(p.words/max*100)); const hit=p.words>=goal?'hit':''; return `<i class="day-bar ${hit}" style="height:${h}%" title="${p.label}: ${p.words} words"></i>`; }).join('');
  return `<section class="progress-card"><div class="progress-head"><div><div class="aux-eyebrow">Last 30 days</div><h2>Keep the line moving.</h2></div><span>${points.filter(p=>p.words>=goal).length} goal days</span></div><div class="progress-chart"><div class="goal-line" style="bottom:${Math.min(100,goal/max*100)}%"><span>${goal}</span></div>${bars}</div><div class="chart-labels"><span>${points[0].label}</span><span>Today</span></div></section>`;
}

function renderGoals(book) {
  const words = bookWordCount(book);
  const today = todayWords(book);
  const bookPct = Math.min(100, Math.round(words / Math.max(1, book.goal || 80000) * 100));
  const dayPct = Math.min(100, Math.round(today / Math.max(1, book.dailyGoal || 500) * 100));
  return `<article class="paper aux-paper goals-paper"><div class="aux-eyebrow">Momentum</div><div class="goal-grid"><section class="goal-card"><span>Today</span><strong>${today.toLocaleString()}</strong><small>of ${(book.dailyGoal || 500).toLocaleString()} words</small><div class="goal-track"><i style="width:${dayPct}%"></i></div><label>Daily goal <input data-goal="daily" type="number" min="1" step="50" value="${book.dailyGoal || 500}" /></label></section><section class="goal-card"><span>Book</span><strong>${words.toLocaleString()}</strong><small>of ${(book.goal || 80000).toLocaleString()} words</small><div class="goal-track"><i style="width:${bookPct}%"></i></div><label>Book goal <input data-goal="book" type="number" min="1" step="1000" value="${book.goal || 80000}" /></label></section></div>${renderProgressChart(book)}<section class="sprint-card"><div><div class="aux-eyebrow">Word sprint</div><h2 data-sprint-clock>${book.sprint?.active ? sprintClockText(book) : 'Pick a chair.'}</h2><p data-sprint-copy>${book.sprint?.active ? sprintProgressText(book) : 'A small timer, a blank page, no bargaining.'}</p></div><div class="sprint-buttons">${book.sprint?.active ? '<button class="primary" data-action="end-sprint">End sprint</button>' : [10,15,25,45].map(n=>`<button data-action="start-sprint" data-minutes="${n}">${n} min</button>`).join('')}</div></section></article>`;
}

