function createPlaceholder(book) {
  if (state.mode !== 'manuscript') {
    state.mode = 'manuscript';
    renderEditor();
    requestAnimationFrame(() => createPlaceholder(book));
    return;
  }
  const editor = document.querySelector('#manuscript-editor');
  const saved = validSavedRange(editor);
  const note = prompt('What do you need to come back to?', '');
  if (note === null) return;
  editor.focus();
  if (saved) restoreRange(saved); else placeCaretAtEnd(editor);

  const id = crypto.randomUUID();
  const mark = document.createElement('span');
  mark.className = 'placeholder-mark';
  mark.dataset.placeholderId = id;
  mark.contentEditable = 'false';
  mark.title = note.trim() || 'Placeholder';
  mark.textContent = '◆';

  const sel = getSelection();
  const range = sel.rangeCount ? sel.getRangeAt(0) : document.createRange();
  range.deleteContents();
  range.insertNode(mark);
  range.setStartAfter(mark);
  range.collapse(true);
  sel.removeAllRanges(); sel.addRange(range);

  book.placeholders.push({ id, chapterId: state.chapterId, note: note.trim() || 'Come back here', createdAt: new Date().toISOString(), resolved: false });
  editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
  toast('Placeholder dropped. Keep moving.');
}

function resolvePlaceholder(book, id) {
  const item = book.placeholders.find(p => p.id === id);
  if (!item) return;
  const chapter = book.chapters[item.chapterId];
  if (chapter) {
    const box = document.createElement('div');
    box.innerHTML = chapter.html;
    box.querySelector(`[data-placeholder-id="${CSS.escape(id)}"]`)?.remove();
    chapter.html = box.innerHTML;
  }
  item.resolved = true;
  persist({ immediate: true });
  renderEditor();
  toast('Placeholder resolved.');
}

function jumpPlaceholder(book, id) {
  const item = book.placeholders.find(p => p.id === id);
  if (!item) return;
  state.mode = 'manuscript'; state.chapterId = item.chapterId; state.placeholderOpen = false;
  book.lastChapterId = state.chapterId;
  renderEditor();
  requestAnimationFrame(() => {
    const mark = document.querySelector(`[data-placeholder-id="${CSS.escape(id)}"]`);
    mark?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    mark?.classList.add('pulse');
    document.querySelector('#manuscript-editor')?.focus();
  });
}

function saveDarling(book) {
  if (state.mode !== 'manuscript') { toast('Select a passage in the manuscript first.'); return; }
  const editor = document.querySelector('#manuscript-editor');
  const saved = validSavedRange(editor);
  if (!saved || saved.collapsed) { toast('Select the passage you want to keep first.'); return; }
  restoreRange(saved);
  const selection = getSelection();
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  const fragment = range.extractContents();
  const box = document.createElement('div');
  box.append(fragment.cloneNode(true));
  const html = box.innerHTML;
  if (!plainText(html).trim()) { toast('That selection is empty.'); return; }

  const id = crypto.randomUUID();
  const anchor = document.createElement('span');
  anchor.className = 'darling-anchor';
  anchor.dataset.darlingAnchor = id;
  anchor.contentEditable = 'false';
  anchor.textContent = '';
  range.insertNode(anchor);
  range.setStartAfter(anchor); range.collapse(true);
  selection.removeAllRanges(); selection.addRange(range);

  book.darlings.unshift({ id, chapterId: state.chapterId, html, createdAt: new Date().toISOString() });
  editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContent' }));
  toast('Darling kept. The draft gets to breathe.');
}

function restoreDarling(book, id) {
  const index = book.darlings.findIndex(d => d.id === id);
  if (index < 0) return;
  const item = book.darlings[index];
  const chapter = book.chapters[item.chapterId];
  if (!chapter) return;

  const box = document.createElement('div');
  box.innerHTML = chapter.html;
  const anchor = box.querySelector(`[data-darling-anchor="${CSS.escape(id)}"]`);
  if (anchor) anchor.replaceWith(htmlFragment(item.html));
  else box.insertAdjacentHTML('beforeend', item.html);
  chapter.html = box.innerHTML;
  book.darlings.splice(index, 1);
  state.chapterId = item.chapterId;
  state.mode = 'manuscript';
  persist({ immediate: true });
  renderEditor();
  toast('Darling restored to its old haunt.');
}

function deleteDarling(book, id) {
  const item = book.darlings.find(d => d.id === id);
  if (!item) return;
  if (!confirm('Discard this Darling permanently?')) return;
  const chapter = book.chapters[item.chapterId];
  if (chapter) {
    const box = document.createElement('div');
    box.innerHTML = chapter.html;
    box.querySelector(`[data-darling-anchor="${CSS.escape(id)}"]`)?.remove();
    chapter.html = box.innerHTML;
  }
  book.darlings = book.darlings.filter(d => d.id !== id);
  persist({ immediate: true }); renderEditor();
}

function openChapter(id) {
  const book = state.library.books[state.bookId];
  if (!book.chapters[id]) return;
  state.chapterId = id;
  book.lastChapterId = id;
  state.mode = 'manuscript'; state.navOpen = false;
  renderEditor();
  requestAnimationFrame(() => document.querySelector('#manuscript-editor')?.focus());
}

async function createNewChapter(book, { fromFlow = false } = {}) {
  const id = crypto.randomUUID();
  const number = book.chapterOrder.length + 1;
  book.chapterOrder.push(id);
  book.chapters[id] = { id, title: `Chapter ${number}`, kind: 'chapter', note: '', summary: '', outlineSections: [], html: '<p><br></p>' };
  book.lastChapterId = id;
  state.chapterId = id;
  state.mode = 'manuscript'; state.navOpen = false;
  await persist({ immediate: true });
  renderEditor();
  requestAnimationFrame(() => document.querySelector('#manuscript-editor')?.focus());
  if (fromFlow) toast(`Chapter ${number}. Keep going.`);
}

function changeViewSetting(book, input) {
  book.viewSettings ||= {};
  const key = input.dataset.setting;
  if (key === 'font-size') book.viewSettings.fontSize = Number(input.value);
  if (key === 'font-family') book.viewSettings.fontFamily = input.value;
  if (key === 'drop-cap') book.viewSettings.dropCap = input.checked;
  if (key === 'focus') book.viewSettings.focusMode = input.checked;
  if (key === 'typewriter') book.viewSettings.typewriter = input.checked;
  if (key === 'spellcheck') book.viewSettings.spellcheck = input.checked;
  if (key === 'chapter-kind') book.chapters[state.chapterId].kind = input.value;
  persist();

  const paper = document.querySelector('.paper');
  const editor = document.querySelector('#manuscript-editor');
  if (paper) {
    paper.style.setProperty('--manuscript-size', `${book.viewSettings.fontSize || 20}px`);
    paper.style.setProperty('--manuscript-font', book.viewSettings.fontFamily || 'Georgia');
    paper.classList.toggle('no-dropcap', book.viewSettings.dropCap === false);
  }
  if (editor) editor.spellcheck = !!book.viewSettings.spellcheck;
  editor?.classList.toggle('focus-mode', !!book.viewSettings.focusMode);
  document.querySelector('.editor-shell')?.classList.toggle('typewriter-on', !!book.viewSettings.typewriter);
  if (key === 'spellcheck' || key === 'chapter-kind') { renderEditor(); return; }
  updateFocusParagraph();
}

function updateFocusParagraph() {
  const editor = document.querySelector('#manuscript-editor');
  if (!editor?.classList.contains('focus-mode')) return;
  editor.querySelectorAll('p,div').forEach(el => el.classList.remove('active-paragraph'));
  const block = currentBlock(editor);
  block?.classList.add('active-paragraph');
}

function scrollCaretToMiddle() {
  const sel = getSelection();
  if (!sel?.rangeCount) return;
  const rect = sel.getRangeAt(0).getBoundingClientRect();
  if (!rect.height && !rect.width) return;
  const target = window.innerHeight * 0.48;
  const delta = rect.top - target;
  if (Math.abs(delta) > 45) document.querySelector('.paper-scroll')?.scrollBy({ top: delta, behavior: 'smooth' });
}

function changeGoal(book, input) {
  const value = Math.max(1, Number(input.value) || 1);
  if (input.dataset.goal === 'daily') book.dailyGoal = value;
  else book.goal = value;
  persist({ immediate: true }); renderEditor();
}

function startSprint(book, minutes) {
  book.sprint = {
    active: true,
    startedAt: Date.now(),
    durationMinutes: minutes,
    startWords: bookWordCount(book)
  };
  persist({ immediate: true });
  state.mode = 'manuscript';
  renderEditor();
  toast(`${minutes}-minute sprint started.`);
}

function endSprint(book, completed) {
  if (!book.sprint?.active) return;
  const added = Math.max(0, bookWordCount(book) - Number(book.sprint.startWords || 0));
  const minutes = book.sprint.durationMinutes;
  book.sprint = { ...book.sprint, active: false, endedAt: Date.now(), words: added };
  persist({ immediate: true });
  stopSprintTicker();
  renderEditor();
  toast(completed ? `Sprint complete · ${added} words.` : `Sprint ended · ${added} words in ${minutes} min.`);
}

function sprintClockText(book) {
  if (!book.sprint?.active) return '';
  const end = Number(book.sprint.startedAt) + Number(book.sprint.durationMinutes) * 60000;
  const left = Math.max(0, end - Date.now());
  const min = Math.floor(left / 60000);
  const sec = Math.floor((left % 60000) / 1000);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function sprintProgressText(book) {
  if (!book.sprint?.active) return '';
  return `${Math.max(0, bookWordCount(book) - Number(book.sprint.startWords || 0)).toLocaleString()} words this sprint`;
}

function startSprintTicker(book) {
  stopSprintTicker();
  const tick = () => {
    if (!book.sprint?.active) return;
    const end = Number(book.sprint.startedAt) + Number(book.sprint.durationMinutes) * 60000;
    if (Date.now() >= end) { endSprint(book, true); return; }
    document.querySelector('[data-sprint-clock]')?.replaceChildren(document.createTextNode(sprintClockText(book)));
    document.querySelector('[data-sprint-copy]')?.replaceChildren(document.createTextNode(sprintProgressText(book)));
    document.querySelectorAll('[data-sprint-mini]').forEach(el => { el.textContent = `Sprint ${sprintClockText(book)}`; });
  };
  tick();
  sprintTimer = setInterval(tick, 1000);
}

function stopSprintTicker() {
  if (sprintTimer) clearInterval(sprintTimer);
  sprintTimer = null;
}

function updateCountsWithoutRerender() {
  const book = state.library.books[state.bookId];
  const chapter = book.chapters[state.chapterId];
  const scope = document.querySelector('[data-action="word-scope"]');
  if (scope) scope.textContent = state.wordCountScope === 'book' ? `${bookWordCount(book).toLocaleString()} book` : `${wordCount(chapter.html).toLocaleString()} chapter`;
  const top = document.querySelector('.editor-status span:nth-child(3)');
  if (top) top.textContent = `${bookWordCount(book).toLocaleString()} words`;
  const daily = document.querySelector('[data-action="goals"]');
  if (daily) daily.textContent = `${todayWords(book).toLocaleString()} / ${(book.dailyGoal || 500).toLocaleString()} today`;
  if (book.sprint?.active) document.querySelectorAll('[data-sprint-mini]').forEach(el => { el.textContent = `Sprint ${sprintClockText(book)}`; });
}

async function toggleTheme() {
  state.library.settings.theme = state.library.settings.theme === 'night' ? 'paper' : 'night';
  await persist({ immediate: true });
  render();
}

restoreInput.addEventListener('change', async () => {
  const file = restoreInput.files?.[0];
  restoreInput.value = '';
  if (!file) return;
  try {
    state.library = await importLibrary(file);
    state.view = 'shelf';
    render();
  } catch (err) {
    alert(err.message || 'Could not restore that backup.');
  }
});

async function init() {
  state.library = await loadLibrary();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  render();
}

init();
