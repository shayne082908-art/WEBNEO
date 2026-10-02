function bindEditorEvents() {
  const book = state.library.books[state.bookId];
  const editor = document.querySelector('#manuscript-editor');
  const bookTitle = document.querySelector('[data-field="book-title"]');
  const chapterTitle = document.querySelector('[data-field="chapter-title"]');
  const auxEditor = document.querySelector('#aux-editor');

  if (editor) {
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch { /* optional */ }

    editor.addEventListener('beforeinput', e => {
      const block = currentBlock(editor);
      if (!block?.classList.contains('outline-ghost')) return;
      const sectionId = block.dataset.outlineGhost;
      const section = book.chapters[state.chapterId].outlineSections?.find(item => item.id === sectionId);
      if (section) section.consumed = true;
      block.classList.remove('outline-ghost');
      block.removeAttribute('data-outline-ghost');
      if (String(e.inputType || '').startsWith('insert')) block.textContent = '';
      persist();
    });

    editor.addEventListener('compositionstart', () => { state.composing = true; });
    editor.addEventListener('compositionend', () => {
      state.composing = false;
      applySmartPunctuation(editor);
      syncManuscript(editor, book);
    });

    editor.addEventListener('input', () => {
      if (!state.composing) applySmartPunctuation(editor);
      syncManuscript(editor, book);
      updateFocusParagraph();
      if (book.viewSettings?.typewriter) scrollCaretToMiddle();
    });

    editor.addEventListener('keydown', e => handleEditorKeydown(e, editor, book));
    editor.addEventListener('keyup', () => { rememberSelection(); updateFocusParagraph(); });
    editor.addEventListener('pointerup', () => { rememberSelection(); updateFocusParagraph(); });
    editor.addEventListener('click', e => {
      const mark = e.target.closest('.placeholder-mark');
      if (!mark) return;
      state.placeholderOpen = true;
      renderEditor();
    });
  }

  document.addEventListener('selectionchange', selectionChangeHandler, { once: true });

  auxEditor?.addEventListener('input', () => {
    book.notesHtml = auxEditor.innerHTML;
    book.updatedAt = new Date().toISOString();
    persist();
  });

  bookTitle?.addEventListener('input', () => {
    book.title = bookTitle.textContent.trim() || 'Untitled';
    book.updatedAt = new Date().toISOString();
    persist();
  });

  chapterTitle?.addEventListener('input', () => {
    book.chapters[state.chapterId].title = chapterTitle.textContent.trim() || 'Untitled chapter';
    book.updatedAt = new Date().toISOString();
    persist();
  });

  app.querySelectorAll('[data-chapter-note]').forEach(area => area.addEventListener('input', () => { book.chapters[area.dataset.chapterNote].note = area.value; persist(); }));
  app.querySelectorAll('[data-outline-summary]').forEach(area => area.addEventListener('input', () => { book.chapters[area.dataset.outlineSummary].summary = area.value; persist(); }));
  app.querySelectorAll('[data-outline-section]').forEach(input => input.addEventListener('input', () => { const chapter=book.chapters[input.dataset.outlineSection]; const section=chapter.outlineSections.find(item=>item.id===input.dataset.section); if(section){section.note=input.value;section.consumed=false;persist();} }));
  app.querySelectorAll('[data-action="add-outline-section"]').forEach(btn => btn.addEventListener('click', () => { const chapter=book.chapters[btn.dataset.chapter]; chapter.outlineSections ||= []; chapter.outlineSections.push({id:crypto.randomUUID(),note:'',consumed:false}); persist({immediate:true}); renderEditor(); }));
  app.querySelectorAll('[data-action="delete-outline-section"]').forEach(btn => btn.addEventListener('click', () => { const chapter=book.chapters[btn.dataset.chapter]; chapter.outlineSections=(chapter.outlineSections||[]).filter(item=>item.id!==btn.dataset.section); persist({immediate:true});renderEditor(); }));
  app.querySelectorAll('[data-action="outline-open"]').forEach(btn => btn.addEventListener('click', () => { state.chapterId=btn.dataset.chapter; book.lastChapterId=state.chapterId; state.mode='manuscript'; renderEditor(); requestAnimationFrame(()=>document.querySelector('#manuscript-editor')?.focus()); }));

  app.querySelectorAll('[data-action="shelf"]').forEach(btn => btn.addEventListener('click', async () => {
    await persist({ immediate: true });
    state.view = 'shelf';
    state.bookId = null;
    state.chapterId = null;
    state.mode = 'manuscript';
    render();
  }));

  app.querySelectorAll('[data-action="chapters"]').forEach(btn => btn.addEventListener('click', () => {
    state.navOpen = true; state.placeholderOpen = false; state.formatOpen = false; renderEditor();
  }));
  app.querySelectorAll('[data-action="placeholder-panel"]').forEach(btn => btn.addEventListener('click', () => { state.placeholderOpen = true; state.navOpen = false; state.formatOpen = false; renderEditor(); }));
  app.querySelectorAll('[data-action="close-chapters"]').forEach(btn => btn.addEventListener('click', () => { state.navOpen = false; renderEditor(); }));
  app.querySelectorAll('[data-action="close-placeholders"]').forEach(btn => btn.addEventListener('click', () => { state.placeholderOpen = false; renderEditor(); }));
  app.querySelectorAll('[data-action="close-format"]').forEach(btn => btn.addEventListener('click', () => { state.formatOpen = false; renderEditor(); }));
  app.querySelectorAll('[data-action="close-all"]').forEach(btn => btn.addEventListener('click', () => {
    state.navOpen = false; state.placeholderOpen = false; state.formatOpen = false; renderEditor();
  }));

  app.querySelectorAll('[data-action="open-chapter"]').forEach(btn => btn.addEventListener('click', () => openChapter(btn.dataset.chapter)));
  app.querySelector('[data-action="new-chapter"]')?.addEventListener('click', () => createNewChapter(book));

  app.querySelectorAll('[data-action="mode"]').forEach(btn => btn.addEventListener('click', () => {
    state.mode = btn.dataset.mode;
    state.navOpen = false; state.placeholderOpen = false; state.formatOpen = false;
    renderEditor();
  }));
  app.querySelectorAll('[data-action="goals"]').forEach(btn => btn.addEventListener('click', () => { state.mode = 'goals'; renderEditor(); }));
  app.querySelectorAll('[data-action="word-scope"]').forEach(btn => btn.addEventListener('click', () => { state.wordCountScope = state.wordCountScope === 'chapter' ? 'book' : 'chapter'; renderEditor(); }));

  app.querySelectorAll('[data-action="placeholder"],[data-action="new-placeholder"]').forEach(btn => {
    btn.addEventListener('pointerdown', e => { e.preventDefault(); rememberSelection(); });
    btn.addEventListener('click', () => createPlaceholder(book));
  });
  app.querySelector('[data-action="format"]')?.addEventListener('click', () => {
    state.formatOpen = true; state.placeholderOpen = false; state.navOpen = false; renderEditor();
  });

  const darlingBtn = app.querySelector('[data-action="save-darling"]');
  darlingBtn?.addEventListener('pointerdown', e => { e.preventDefault(); rememberSelection(); });
  darlingBtn?.addEventListener('click', () => saveDarling(book));

  app.querySelectorAll('[data-action="jump-placeholder"]').forEach(btn => btn.addEventListener('click', () => jumpPlaceholder(book, btn.dataset.placeholder)));
  app.querySelectorAll('[data-action="resolve-placeholder"]').forEach(btn => btn.addEventListener('click', () => resolvePlaceholder(book, btn.dataset.placeholder)));
  app.querySelectorAll('[data-action="restore-darling"]').forEach(btn => btn.addEventListener('click', () => restoreDarling(book, btn.dataset.darling)));
  app.querySelectorAll('[data-action="delete-darling"]').forEach(btn => btn.addEventListener('click', () => deleteDarling(book, btn.dataset.darling)));

  app.querySelectorAll('[data-action="idea-mode"]').forEach(btn => btn.addEventListener('click', () => { const f=ideaState(book); f.mode=btn.dataset.ideaMode; f.current=null; f.locks={}; generateIdea(book); renderEditor(); }));
  app.querySelectorAll('[data-idea-filter]').forEach(sel => sel.addEventListener('change', () => { const f=ideaState(book); f[sel.dataset.ideaFilter]=sel.value; f.currentText=composeIdea(book); persist(); renderEditor(); }));
  app.querySelectorAll('[data-action="idea-lock"]').forEach(btn => btn.addEventListener('click', () => { const f=ideaState(book); f.locks[btn.dataset.ideaKey]=!f.locks[btn.dataset.ideaKey]; persist(); renderEditor(); }));
  app.querySelectorAll('[data-action="idea-reroll-one"]').forEach(btn => btn.addEventListener('click', () => { const f=ideaState(book); f.locks[btn.dataset.ideaKey]=false; generateIdea(book,{rerollKey:btn.dataset.ideaKey}); renderEditor(); }));
  app.querySelector('[data-action="idea-reroll"]')?.addEventListener('click', () => { generateIdea(book); renderEditor(); });
  app.querySelector('[data-action="idea-save"]')?.addEventListener('click', () => { const f=ideaState(book); const text=f.currentText||composeIdea(book); if(!f.saved.some(x=>x.text===text)) f.saved.unshift({id:crypto.randomUUID(),text,createdAt:new Date().toISOString()}); persist(); renderEditor(); toast('Spark saved.'); });
  app.querySelector('[data-action="idea-copy"]')?.addEventListener('click', async () => { const text=ideaState(book).currentText||composeIdea(book); try{await navigator.clipboard.writeText(text);toast('Copied.');}catch{toast('Copy unavailable in this browser.');} });
  app.querySelector('[data-action="idea-pin"]')?.addEventListener('click', () => { const f=ideaState(book); f.pinned={text:f.currentText||composeIdea(book),createdAt:new Date().toISOString()}; persist(); state.mode='manuscript'; renderEditor(); toast('Spark pinned above the page.'); });
  app.querySelector('[data-action="unpin-idea"]')?.addEventListener('click', () => { ideaState(book).pinned=null; persist(); renderEditor(); });
  app.querySelector('[data-action="idea-practice"]')?.addEventListener('click', () => { const f=ideaState(book); f.pinned={text:f.currentText||composeIdea(book),createdAt:new Date().toISOString()}; persist(); startSprint(book,15); state.mode='manuscript'; renderEditor(); toast('15-minute practice started.'); });
  app.querySelectorAll('[data-action="idea-use-saved"]').forEach(btn => btn.addEventListener('click', () => { const f=ideaState(book), item=f.saved.find(x=>x.id===btn.dataset.ideaId); if(item){f.currentText=item.text; f.pinned={text:item.text,createdAt:new Date().toISOString()}; persist(); state.mode='manuscript'; renderEditor();} }));
  app.querySelectorAll('[data-action="idea-delete-saved"]').forEach(btn => btn.addEventListener('click', () => { const f=ideaState(book); f.saved=f.saved.filter(x=>x.id!==btn.dataset.ideaId); persist(); renderEditor(); }));

  app.querySelectorAll('[data-setting]').forEach(input => input.addEventListener('input', () => changeViewSetting(book, input)));
  app.querySelectorAll('[data-goal]').forEach(input => input.addEventListener('change', () => changeGoal(book, input)));
  app.querySelectorAll('[data-action="start-sprint"]').forEach(btn => btn.addEventListener('click', () => startSprint(book, Number(btn.dataset.minutes))));
  app.querySelectorAll('[data-action="end-sprint"]').forEach(btn => btn.addEventListener('click', () => endSprint(book, false)));
  app.querySelector('[data-action="theme"]')?.addEventListener('click', toggleTheme);
}

function selectionChangeHandler() {
  rememberSelection();
  updateFocusParagraph();
}

function syncManuscript(editor, book) {
  const chapter = book.chapters[state.chapterId];
  const clean = editor.cloneNode(true);
  clean.querySelectorAll('.outline-ghost').forEach(node => node.remove());
  chapter.html = clean.innerHTML;
  book.updatedAt = new Date().toISOString();
  book.lastChapterId = state.chapterId;
  const day = ensureToday(book); day.words = todayWords(book);
  persist();
  updateCountsWithoutRerender();
}

function handleEditorKeydown(e, editor, book) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault(); persist({ immediate: true }); return;
  }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'x') {
    e.preventDefault(); rememberSelection(); createPlaceholder(book); return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key === ';') { e.preventDefault(); book.viewSettings.spellcheck = !book.viewSettings.spellcheck; persist({immediate:true}); renderEditor(); toast(book.viewSettings.spellcheck ? 'Spellcheck on.' : 'Spellcheck off.'); return; }
  if (e.key === 'Enter' && e.shiftKey) {
    e.preventDefault(); insertPoetryParagraph(editor); return;
  }
  if (e.key !== 'Enter' || e.altKey || e.ctrlKey || e.metaKey || state.composing) return;

  const block = currentBlock(editor);
  if (!block || !isEmptyBlock(block)) return;
  const prev = block.previousElementSibling;

  if (prev?.classList.contains('scene-break')) {
    e.preventDefault();
    createNewChapter(book, { fromFlow: true });
    return;
  }

  e.preventDefault();
  block.className = 'scene-break';
  block.textContent = '***';
  block.setAttribute('contenteditable', 'false');
  const after = document.createElement('p');
  after.innerHTML = '<br>';
  block.after(after);
  placeCaretAtStart(after);
  editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertParagraph' }));
}

function currentBlock(editor) {
  const sel = getSelection();
  if (!sel?.rangeCount) return null;
  let node = sel.focusNode;
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  const block = node.closest?.('p,div');
  return block && editor.contains(block) ? block : null;
}

function isEmptyBlock(block) {
  return !block.classList.contains('scene-break') && !block.textContent.replace(/\u200B|\u00A0/g, '').trim();
}

function placeCaretAtStart(node) {
  const sel = getSelection();
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  node.scrollIntoView({ block: 'nearest' });
}

function placeCaretAtEnd(node) {
  const sel = getSelection();
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

function insertPoetryParagraph(editor) {
  const block = currentBlock(editor);
  if (!block) return;
  const p = document.createElement('p');
  p.className = 'poetry';
  p.innerHTML = '<br>';
  block.after(p);
  placeCaretAtStart(p);
  editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertParagraph' }));
}

function applySmartPunctuation(editor) {
  const sel = getSelection();
  if (!sel?.rangeCount || !sel.isCollapsed) return;
  let node = sel.focusNode;
  let offset = sel.focusOffset;
  if (!node || node.nodeType !== Node.TEXT_NODE || !editor.contains(node)) return;
  let before = node.data.slice(0, offset);
  let replacement = null;
  let remove = 0;

  if (before.endsWith('--')) { replacement = '—'; remove = 2; }
  else if (before.endsWith('...')) { replacement = '…'; remove = 3; }
  else {
    const last = before.at(-1);
    if (last === '"' || last === "'") {
      const prev = before.at(-2) || '';
      const next = node.data.at(offset) || '';
      const opening = !prev || /[\s([{—–]/.test(prev);
      if (last === '"') replacement = opening ? '“' : '”';
      else if (/\p{L}/u.test(prev) && /\p{L}/u.test(next)) replacement = '’';
      else replacement = opening ? '‘' : '’';
      remove = 1;
    }
  }

  if (!replacement) return;
  node.data = node.data.slice(0, offset - remove) + replacement + node.data.slice(offset);
  const range = document.createRange();
  range.setStart(node, offset - remove + replacement.length);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function rememberSelection() {
  const editor = document.querySelector('#manuscript-editor');
  const sel = getSelection();
  if (!editor || !sel?.rangeCount) return;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;
  state.lastSelection = range.cloneRange();
}

function validSavedRange(editor) {
  const range = state.lastSelection;
  if (!range || !editor) return null;
  try { return editor.contains(range.commonAncestorContainer) ? range : null; } catch { return null; }
}

function restoreRange(range) {
  if (!range) return false;
  const sel = getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  return true;
}

