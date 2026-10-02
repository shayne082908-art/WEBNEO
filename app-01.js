
const app = document.querySelector('#app');
const restoreInput = document.querySelector('#restore-input');

const state = {
  library: null,
  view: 'shelf',
  bookId: null,
  chapterId: null,
  mode: 'manuscript',
  navOpen: false,
  placeholderOpen: false,
  formatOpen: false,
  saveState: 'Saved',
  storageBackend: 'browser',
  composing: false,
  lastSelection: null,
  authorMenuOpen: false,
  bookMenuId: null,
  coverTargetId: null,
  wordCountScope: 'chapter'
};

let saveTimer = null;
let sprintTimer = null;
let toastTimer = null;

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function htmlFragment(value = '') {
  const tpl = document.createElement('template');
  tpl.innerHTML = value;
  return tpl.content;
}

function plainText(html = '') {
  const node = document.createElement('div');
  node.innerHTML = html;
  node.querySelectorAll('.placeholder-mark,.darling-anchor,.scene-break').forEach(el => el.remove());
  return node.textContent || '';
}

function wordCount(html = '') {
  const text = plainText(html).trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function bookWordCount(book) {
  return book.chapterOrder.reduce((sum, id) => sum + wordCount(book.chapters[id]?.html), 0);
}

function localDayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function ensureToday(book) {
  book.stats ||= { days: {} };
  book.stats.days ||= {};
  const key = localDayKey();
  if (!book.stats.days[key]) {
    book.stats.days[key] = { startWords: bookWordCount(book), openedAt: new Date().toISOString() };
  }
  return book.stats.days[key];
}

function todayWords(book) {
  const day = ensureToday(book);
  return Math.max(0, bookWordCount(book) - Number(day.startWords || 0));
}

function setSaveState(label) {
  state.saveState = label;
  document.querySelectorAll('[data-save-state]').forEach(el => { el.textContent = label; });
}

async function persist({ immediate = false } = {}) {
  clearTimeout(saveTimer);
  setSaveState('Saving…');
  const run = async () => {
    const result = await saveLibrary(state.library);
    state.storageBackend = result.backend;
    setSaveState('Saved');
  };
  if (immediate) return run();
  saveTimer = setTimeout(run, 300);
}

function toast(message) {
  let el = document.querySelector('#toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function render() {
  document.documentElement.dataset.theme = state.library?.settings?.theme || 'night';
  if (!state.library?.settings?.onboardingComplete) { renderOnboarding(); return; }
  if (state.view === 'editor' && state.bookId) renderEditor();
  else renderShelf();
}

function activeAuthor() {
  return state.library.settings.activeAuthor || state.library.settings.authorName || '';
}

function authorLabel(name = activeAuthor()) { return name?.trim() || 'Anonymous'; }

function ensureAuthorShelf(author = activeAuthor()) {
  let shelf = state.library.shelves.find(item => (item.author || '') === author);
  if (!shelf) {
    shelf = { id: crypto.randomUUID(), name: 'Works in Progress', author, bookIds: [] };
    state.library.shelves.push(shelf);
  }
  return shelf;
}

function renderOnboarding() {
  const settings = state.library.settings;
  app.innerHTML = `<main class="onboarding"><section class="onboarding-card">
    <div class="eyebrow">Welcome to WEBNEO</div><h1>Set up your writing chair.</h1>
    <p>Like NEO, this is a book-writing app first. Pick the defaults once and get out of the way.</p>
    <label>Your name <input id="onboard-author" value="${escapeHtml(settings.authorName || '')}" placeholder="Anonymous" /></label>
    <fieldset><legend>How do you start?</legend><label><input type="radio" name="writer-mode" value="pantser" ${settings.writerMode !== 'plotter' ? 'checked' : ''}/> Pantser · open on the manuscript</label><label><input type="radio" name="writer-mode" value="plotter" ${settings.writerMode === 'plotter' ? 'checked' : ''}/> Plotter · open on the outline</label></fieldset>
    <div class="onboarding-grid"><label>Page typeface <select id="onboard-font"><option>Georgia</option><option>Palatino</option><option>Garamond</option><option>Times New Roman</option></select></label><label class="checkline"><input id="onboard-dropcap" type="checkbox" ${settings.defaultDropCap !== false ? 'checked' : ''}/> Use drop caps</label></div>
    <div class="onboarding-preview"><span>A</span>ll stories begin with a page that makes you want to keep typing.</div>
    <button class="primary onboarding-go" data-action="finish-onboarding">Start writing</button>
  </section></main>`;
  document.querySelector('#onboard-font').value = settings.defaultFont || 'Georgia';
  app.querySelector('[data-action="finish-onboarding"]').addEventListener('click', async () => {
    const name = document.querySelector('#onboard-author').value.trim();
    settings.authorName = name; settings.activeAuthor = name;
    settings.penNames = [...new Set([...(settings.penNames || []), name].filter(Boolean))];
    settings.writerMode = document.querySelector('input[name="writer-mode"]:checked')?.value || 'pantser';
    settings.defaultFont = document.querySelector('#onboard-font').value || 'Georgia';
    settings.defaultDropCap = document.querySelector('#onboard-dropcap').checked;
    settings.onboardingComplete = true;
    state.library.shelves.forEach(shelf => { if (shelf.author == null || shelf.author === '') shelf.author = name; });
    ensureAuthorShelf(name); await persist({ immediate: true }); renderShelf();
  });
}

function renderShelf() {
  stopSprintTicker();
  const lib = state.library;
  const author = activeAuthor();
  const shelvesForAuthor = lib.shelves.filter(shelf => (shelf.author || '') === author);
  if (!shelvesForAuthor.length) shelvesForAuthor.push(ensureAuthorShelf(author));
  const shelves = shelvesForAuthor.map(shelf => {
    const books = shelf.bookIds.map(id => lib.books[id]).filter(Boolean);
    return `
      <section class="shelf" data-shelf-id="${shelf.id}">
        <div class="shelf-line">
          <button class="shelf-drag" draggable="true" data-shelf-drag="${shelf.id}" title="Drag shelf">⠿</button>
          <button class="shelf-label" data-action="rename-shelf" data-shelf="${shelf.id}">${escapeHtml(shelf.name)}</button>
          <div class="shelf-tools"><button data-action="shelf-up" data-shelf="${shelf.id}" title="Move shelf up">↑</button><button data-action="shelf-down" data-shelf="${shelf.id}" title="Move shelf down">↓</button></div>
        </div>
        <div class="book-row" data-drop-shelf="${shelf.id}">
          ${books.map(bookCard).join('')}
          <button class="book-card add-book" data-action="new-book" data-shelf="${shelf.id}" aria-label="Create a new book">
            <span class="plus">+</span><span>New book</span>
          </button>
        </div>
      </section>`;
  }).join('');

  app.innerHTML = `
    <main class="shelf-view">
      <header class="shelf-header">
        <div><div class="eyebrow">Browser edition · Build 04 parity pass</div><h1>NEO <span>WEB</span></h1></div>
        <div class="header-actions">
          <div class="author-wrap"><button class="quiet author-chip" data-action="authors">${escapeHtml(authorLabel())} ▾</button>${renderAuthorMenu()}</div>
          <button class="quiet" data-action="add-shelf">+ Shelf</button>
          <button class="quiet" data-action="backup">Backup</button>
          <button class="quiet" data-action="restore">Restore</button>
          <button class="icon-button" data-action="theme" aria-label="Toggle theme">◐</button>
        </div>
      </header>
      <div class="shelf-intro"><p>Your library behaves like a bookshelf now: separate shelves per author identity, movable books, rerollable covers, and goal progress on the spine.</p><span class="storage-pill">Offline-first · ${escapeHtml(state.storageBackend)}</span></div>
      <div class="shelves-wrap">${shelves}</div>
      <footer class="source-note">Build 04 · NEO parity before expansion</footer>
      ${renderBookMenu()}
      <input id="cover-input" type="file" accept="image/*" hidden />
    </main>`;
  bindShelfEvents();
}

function renderAuthorMenu() {
  if (!state.authorMenuOpen) return '';
  const names = [...new Set([state.library.settings.authorName, ...(state.library.settings.penNames || [])].filter(Boolean))];
  const choices = (names.length ? names : ['']).map(name => `<button data-action="switch-author" data-author="${escapeHtml(name)}" class="${name === activeAuthor() ? 'active' : ''}">${escapeHtml(authorLabel(name))}</button>`).join('');
  return `<div class="author-menu">${choices}<button data-action="add-author">+ Add pen name</button></div>`;
}

function coverInlineStyle(book) {
  const cover = book.cover || {};
  return `--book-hue:${Number(cover.hue) || 0};--cover-tilt:${((Number(cover.template) || 0) - 2.5) * 3}deg`;
}

function bookCard(book) {
  const count = bookWordCount(book);
  const goal = Math.max(1, Number(book.goal) || 80000);
  const progress = Math.min(100, Math.round((count / goal) * 100));
  const cover = book.cover || {};
  const custom = cover.customImage ? `<img class="custom-cover" src="${escapeHtml(cover.customImage)}" alt="" />` : '';
  return `<article class="book-card book-item" draggable="true" data-book="${book.id}">
    <button class="book-open" data-action="open-book" data-book="${book.id}">
      <div class="book-cover cover-style-${Number(cover.style) || 0} cover-template-${Number(cover.template) || 0}" style="${coverInlineStyle(book)}">${custom}<div class="book-art"></div><div class="book-grain"></div><div class="book-title">${escapeHtml(book.title || 'Untitled')}</div><div class="book-author">${escapeHtml(book.author || authorLabel())}</div><div class="book-progress" aria-label="${progress}% of word goal"><span style="width:${progress}%"></span></div></div>
      <div class="book-meta">${count.toLocaleString()} words · ${progress}%</div>
    </button>
    <button class="book-more" data-action="book-menu" data-book="${book.id}" aria-label="Book options">•••</button>
  </article>`;
}

function renderBookMenu() {
  const id = state.bookMenuId;
  const book = id && state.library.books[id];
  if (!book) return '';
  const currentShelf = state.library.shelves.find(shelf => shelf.bookIds.includes(id));
  const moveTargets = state.library.shelves.filter(shelf => (shelf.author || '') === activeAuthor() && shelf.id !== currentShelf?.id);
  return `<div class="modal-backdrop" data-action="close-book-menu"><section class="book-sheet" role="dialog" aria-modal="true" onclick="event.stopPropagation()"><div class="drawer-head"><span>${escapeHtml(book.title)}</span><button class="icon-button" data-action="close-book-menu">×</button></div>
    <label class="setting-row"><span>Book goal</span><input data-book-goal="${id}" type="number" min="1" step="1000" value="${Number(book.goal) || 80000}" /></label>
    <div class="book-sheet-actions"><button data-action="reroll-cover" data-book="${id}">↻ Reroll cover</button><button data-action="choose-cover" data-book="${id}">Choose cover image</button>${book.cover?.customImage ? `<button data-action="clear-cover" data-book="${id}">Use generated cover</button>` : ''}</div>
    ${moveTargets.length ? `<div class="book-move"><span>Move to shelf</span>${moveTargets.map(s => `<button data-action="move-book" data-book="${id}" data-shelf="${s.id}">${escapeHtml(s.name)}</button>`).join('')}</div>` : ''}
    <button class="danger-button" data-action="remove-book" data-book="${id}">Remove book</button>
  </section></div>`;
}

function reorderShelf(id, delta) {
  const author = activeAuthor();
  const visibleIds = state.library.shelves.filter(s => (s.author || '') === author).map(s => s.id);
  const pos = visibleIds.indexOf(id), target = pos + delta;
  if (pos < 0 || target < 0 || target >= visibleIds.length) return;
  const a = state.library.shelves.findIndex(s => s.id === visibleIds[pos]);
  const b = state.library.shelves.findIndex(s => s.id === visibleIds[target]);
  [state.library.shelves[a], state.library.shelves[b]] = [state.library.shelves[b], state.library.shelves[a]];
  persist({ immediate: true }); renderShelf();
}

function moveBookToShelf(bookId, shelfId) {
  state.library.shelves.forEach(shelf => { shelf.bookIds = shelf.bookIds.filter(id => id !== bookId); });
  state.library.shelves.find(shelf => shelf.id === shelfId)?.bookIds.push(bookId);
  state.bookMenuId = null; persist({ immediate: true }); renderShelf();
}

function rerollCover(book) {
  book.cover ||= {};
  book.cover.hue = Math.floor(Math.random() * 360);
  book.cover.style = Math.floor(Math.random() * 6);
  book.cover.template = Math.floor(Math.random() * 6);
  book.cover.customImage = '';
  persist(); renderShelf();
}

function bindShelfEvents() {
  app.querySelectorAll('[data-action="new-book"]').forEach(btn => btn.addEventListener('click', async () => {
    const title = prompt('Book title?', 'Untitled'); if (title === null) return;
    const settings = state.library.settings;
    const book = makeBook({ title: title.trim() || 'Untitled', author: activeAuthor(), defaults: { fontFamily: settings.defaultFont, dropCap: settings.defaultDropCap } });
    state.library.books[book.id] = book;
    state.library.shelves.find(s => s.id === btn.dataset.shelf)?.bookIds.push(book.id);
    await persist({ immediate: true }); openBook(book.id);
  }));
  app.querySelectorAll('[data-action="open-book"]').forEach(btn => btn.addEventListener('click', () => openBook(btn.dataset.book)));
  app.querySelectorAll('[data-action="book-menu"]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); state.bookMenuId = btn.dataset.book; renderShelf(); }));
  app.querySelectorAll('[data-action="close-book-menu"]').forEach(btn => btn.addEventListener('click', () => { state.bookMenuId = null; renderShelf(); }));
  app.querySelectorAll('[data-action="reroll-cover"]').forEach(btn => btn.addEventListener('click', () => rerollCover(state.library.books[btn.dataset.book])));
  app.querySelectorAll('[data-action="choose-cover"]').forEach(btn => btn.addEventListener('click', () => { state.coverTargetId = btn.dataset.book; document.querySelector('#cover-input').click(); }));
  app.querySelectorAll('[data-action="clear-cover"]').forEach(btn => btn.addEventListener('click', () => { state.library.books[btn.dataset.book].cover.customImage = ''; persist(); renderShelf(); }));
  app.querySelectorAll('[data-action="move-book"]').forEach(btn => btn.addEventListener('click', () => moveBookToShelf(btn.dataset.book, btn.dataset.shelf)));
  app.querySelectorAll('[data-book-goal]').forEach(input => input.addEventListener('change', () => { state.library.books[input.dataset.bookGoal].goal = Math.max(1, Number(input.value) || 1); persist({ immediate: true }); renderShelf(); }));
  app.querySelectorAll('[data-action="remove-book"]').forEach(btn => btn.addEventListener('click', () => { const book=state.library.books[btn.dataset.book]; if(!confirm(`Remove “${book.title}”? Your browser backup can still restore it.`)) return; state.library.shelves.forEach(s=>s.bookIds=s.bookIds.filter(id=>id!==book.id)); delete state.library.books[book.id]; state.bookMenuId=null; persist({immediate:true}); renderShelf(); }));
  app.querySelector('[data-action="add-shelf"]')?.addEventListener('click', () => { const name=prompt('Shelf name?','New Shelf'); if(name===null)return; state.library.shelves.push({id:crypto.randomUUID(),name:name.trim()||'New Shelf',author:activeAuthor(),bookIds:[]}); persist({immediate:true});renderShelf(); });
  app.querySelectorAll('[data-action="rename-shelf"]').forEach(btn => btn.addEventListener('click', () => { const shelf=state.library.shelves.find(s=>s.id===btn.dataset.shelf); const name=prompt('Rename shelf',shelf.name); if(name===null)return; shelf.name=name.trim()||shelf.name; persist();renderShelf(); }));
  app.querySelectorAll('[data-action="shelf-up"]').forEach(btn => btn.addEventListener('click', () => reorderShelf(btn.dataset.shelf,-1)));
  app.querySelectorAll('[data-action="shelf-down"]').forEach(btn => btn.addEventListener('click', () => reorderShelf(btn.dataset.shelf,1)));
  app.querySelector('[data-action="authors"]')?.addEventListener('click', () => { state.authorMenuOpen=!state.authorMenuOpen; renderShelf(); });
  app.querySelectorAll('[data-action="switch-author"]').forEach(btn => btn.addEventListener('click', () => { state.library.settings.activeAuthor=btn.dataset.author; state.authorMenuOpen=false; ensureAuthorShelf(btn.dataset.author); persist({immediate:true});renderShelf(); }));
  app.querySelector('[data-action="add-author"]')?.addEventListener('click', () => { const name=prompt('Pen name?',''); if(name===null||!name.trim())return; const n=name.trim(); state.library.settings.penNames=[...new Set([...(state.library.settings.penNames||[]),n])]; state.library.settings.activeAuthor=n; ensureAuthorShelf(n); state.authorMenuOpen=false; persist({immediate:true});renderShelf(); });
  app.querySelector('[data-action="backup"]')?.addEventListener('click', () => exportLibrary(state.library));
  app.querySelector('[data-action="restore"]')?.addEventListener('click', () => restoreInput.click());
  app.querySelector('[data-action="theme"]')?.addEventListener('click', toggleTheme);
  document.querySelector('#cover-input')?.addEventListener('change', e => { const file=e.target.files?.[0]; e.target.value=''; if(!file||!state.coverTargetId)return; if(file.size>3_000_000){toast('Choose an image under 3 MB for reliable tablet storage.');return;} const reader=new FileReader(); reader.onload=()=>{ const book=state.library.books[state.coverTargetId]; if(book){book.cover ||= {}; book.cover.customImage=String(reader.result); persist({immediate:true});} state.coverTargetId=null; state.bookMenuId=null; renderShelf();}; reader.readAsDataURL(file); });
  app.querySelectorAll('.book-item').forEach(card => card.addEventListener('dragstart', e => { e.dataTransfer.setData('text/webneo-book', card.dataset.book); e.dataTransfer.effectAllowed='move'; }));
  app.querySelectorAll('[data-drop-shelf]').forEach(row => { row.addEventListener('dragover', e => { if(e.dataTransfer.types.includes('text/webneo-book')){e.preventDefault();row.classList.add('drop-ready');} }); row.addEventListener('dragleave',()=>row.classList.remove('drop-ready')); row.addEventListener('drop', e => { const id=e.dataTransfer.getData('text/webneo-book'); if(id){e.preventDefault();moveBookToShelf(id,row.dataset.dropShelf);} }); });
  app.querySelectorAll('[data-shelf-drag]').forEach(handle => handle.addEventListener('dragstart', e => { e.dataTransfer.setData('text/webneo-shelf',handle.dataset.shelfDrag); e.stopPropagation(); }));
  app.querySelectorAll('.shelf').forEach(section => { section.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('text/webneo-shelf'))e.preventDefault();}); section.addEventListener('drop',e=>{const id=e.dataTransfer.getData('text/webneo-shelf'); if(!id||id===section.dataset.shelfId)return; e.preventDefault(); const visible=state.library.shelves.filter(s=>(s.author||'')===activeAuthor()).map(s=>s.id); const from=visible.indexOf(id),to=visible.indexOf(section.dataset.shelfId); if(from<0||to<0)return; const arr=state.library.shelves; const ai=arr.findIndex(s=>s.id===id), bi=arr.findIndex(s=>s.id===section.dataset.shelfId); const [moved]=arr.splice(ai,1); const newBi=arr.findIndex(s=>s.id===section.dataset.shelfId); arr.splice(to>from?newBi+1:newBi,0,moved); persist({immediate:true});renderShelf(); }); });
}

function openBook(bookId) {
  const book = state.library.books[bookId];
  if (!book) return;
  ensureToday(book);
  state.bookId = bookId;
  state.chapterId = book.lastChapterId && book.chapters[book.lastChapterId]
    ? book.lastChapterId
    : book.chapterOrder[0];
  state.view = 'editor';
  state.mode = state.library.settings.writerMode === 'plotter' && bookWordCount(book) === 0 ? 'outline' : 'manuscript';
  state.navOpen = false;
  state.placeholderOpen = false;
  state.formatOpen = false;
  render();
  requestAnimationFrame(() => document.querySelector('#manuscript-editor')?.focus());
}

function chapterKicker(book, chapterId) {
  const chapter = book.chapters[chapterId];
  if (chapter?.kind === 'prologue') return 'Prologue';
  if (chapter?.kind === 'epilogue') return 'Epilogue';
  let n = 0;
  for (const id of book.chapterOrder) {
    if (book.chapters[id]?.kind !== 'prologue' && book.chapters[id]?.kind !== 'epilogue') n += 1;
    if (id === chapterId) return `Chapter ${n}`;
  }
  return 'Chapter';
}

