const FILE_NAME = 'neo-web-library.json';
const FALLBACK_KEY = 'neo-web.library.v4';
const FALLBACK_PREV = 'neo-web.library.v3';
const LEGACY_KEY = 'neo-web.library.v2';
const SCHEMA_VERSION = 4;

function uuid() {
  return crypto.randomUUID();
}

function unique(values) {
  return [...new Set(values.filter(value => typeof value === 'string' && value.trim()).map(value => value.trim()))];
}

const emptyLibrary = () => ({
  version: SCHEMA_VERSION,
  settings: {
    authorName: '',
    activeAuthor: '',
    penNames: [],
    writerMode: 'pantser',
    defaultFont: 'Georgia',
    defaultDropCap: true,
    onboardingComplete: false,
    theme: 'night'
  },
  shelves: [
    { id: uuid(), name: 'Works in Progress', author: '', bookIds: [] }
  ],
  books: {}
});

function defaultCover(book = {}) {
  const old = book.cover && typeof book.cover === 'object' ? book.cover : {};
  const hash = [...String(book.id || book.title || '')].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return {
    hue: Number.isFinite(Number(old.hue)) ? Number(old.hue) : hash % 360,
    style: Number.isFinite(Number(old.style)) ? Number(old.style) % 6 : hash % 6,
    template: Number.isFinite(Number(old.template)) ? Number(old.template) % 6 : Math.floor(hash / 7) % 6,
    customImage: typeof old.customImage === 'string' ? old.customImage : ''
  };
}

function defaultBookExtras(book = {}) {
  return {
    notesHtml: typeof book.notesHtml === 'string' ? book.notesHtml : '',
    outlineHtml: typeof book.outlineHtml === 'string' ? book.outlineHtml : '',
    placeholders: Array.isArray(book.placeholders) ? book.placeholders : [],
    darlings: Array.isArray(book.darlings) ? book.darlings : [],
    ideaForge: book.ideaForge && typeof book.ideaForge === 'object' ? book.ideaForge : { mode: 'premise', genre: 'Any', mood: 'Any', current: null, locks: {}, saved: [], pinned: null },
    dailyGoal: Number(book.dailyGoal) || 500,
    goal: Number(book.goal) || 80000,
    stats: book.stats && typeof book.stats === 'object' ? book.stats : { days: {} },
    sprint: book.sprint && typeof book.sprint === 'object' ? book.sprint : null,
    cover: defaultCover(book),
    viewSettings: {
      fontSize: Number(book.viewSettings?.fontSize) || 20,
      fontFamily: book.viewSettings?.fontFamily || 'Georgia',
      dropCap: book.viewSettings?.dropCap !== false,
      focusMode: !!book.viewSettings?.focusMode,
      typewriter: !!book.viewSettings?.typewriter,
      spellcheck: !!book.viewSettings?.spellcheck
    }
  };
}

function migrate(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.books || !Array.isArray(raw.shelves)) return null;

  const out = structuredClone(raw);
  const previousVersion = Number(out.version) || 0;
  out.version = SCHEMA_VERSION;
  const baseAuthor = out.settings?.authorName || out.settings?.activeAuthor || '';
  out.settings = {
    authorName: baseAuthor,
    activeAuthor: out.settings?.activeAuthor ?? baseAuthor,
    penNames: unique([...(Array.isArray(out.settings?.penNames) ? out.settings.penNames : []), baseAuthor]),
    writerMode: out.settings?.writerMode === 'plotter' ? 'plotter' : 'pantser',
    defaultFont: out.settings?.defaultFont || 'Georgia',
    defaultDropCap: out.settings?.defaultDropCap !== false,
    onboardingComplete: out.settings?.onboardingComplete ?? (previousVersion > 0),
    theme: out.settings?.theme === 'paper' ? 'paper' : 'night'
  };

  if (!out.shelves.length) out.shelves.push({ id: uuid(), name: 'Works in Progress', author: out.settings.activeAuthor, bookIds: [] });
  for (const shelf of out.shelves) {
    shelf.id ||= uuid();
    shelf.name ||= 'Shelf';
    shelf.author = typeof shelf.author === 'string' ? shelf.author : out.settings.activeAuthor;
    shelf.bookIds = Array.isArray(shelf.bookIds) ? shelf.bookIds : [];
  }

  for (const [id, oldBook] of Object.entries(out.books)) {
    const book = oldBook || {};
    if (!Array.isArray(book.chapterOrder)) book.chapterOrder = [];
    if (!book.chapters || typeof book.chapters !== 'object') book.chapters = {};
    if (!book.chapterOrder.length) {
      const chapterId = uuid();
      book.chapterOrder = [chapterId];
      book.chapters[chapterId] = { id: chapterId, title: 'Chapter 1', html: '<p><br></p>' };
    }
    Object.assign(book, defaultBookExtras(book));
    book.id = book.id || id;
    book.author = typeof book.author === 'string' ? book.author : out.settings.activeAuthor;
    book.lastChapterId = book.lastChapterId && book.chapters[book.lastChapterId]
      ? book.lastChapterId
      : book.chapterOrder[0];
    book.stats.days ||= {};
    for (const [index, chapterId] of book.chapterOrder.entries()) {
      const chapter = book.chapters[chapterId] || { id: chapterId };
      chapter.id = chapter.id || chapterId;
      chapter.title = chapter.title || `Chapter ${index + 1}`;
      chapter.kind = ['chapter', 'prologue', 'epilogue'].includes(chapter.kind) ? chapter.kind : 'chapter';
      chapter.note = typeof chapter.note === 'string' ? chapter.note : '';
      chapter.summary = typeof chapter.summary === 'string' ? chapter.summary : '';
      chapter.outlineSections = Array.isArray(chapter.outlineSections) ? chapter.outlineSections.map(section => ({
        id: section.id || uuid(),
        note: typeof section.note === 'string' ? section.note : '',
        consumed: !!section.consumed
      })) : [];
      chapter.html = typeof chapter.html === 'string' ? chapter.html : '<p><br></p>';
      book.chapters[chapterId] = chapter;
    }
    out.books[id] = book;
  }
  return out;
}

async function getOpfsFile(create = true) {
  if (!navigator.storage?.getDirectory) return null;
  const root = await navigator.storage.getDirectory();
  return root.getFileHandle(FILE_NAME, { create });
}

async function readOpfs() {
  try {
    const handle = await getOpfsFile(false);
    if (!handle) return null;
    const file = await handle.getFile();
    const text = await file.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

async function writeOpfs(data) {
  const handle = await getOpfsFile(true);
  if (!handle) return false;
  const writer = await handle.createWritable();
  await writer.write(JSON.stringify(data));
  await writer.close();
  return true;
}

function readFallback() {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY) || localStorage.getItem(FALLBACK_PREV) || localStorage.getItem(LEGACY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeFallback(data) {
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(data));
}

async function loadLibrary() {
  const stored = await readOpfs() || readFallback();
  const migrated = migrate(stored);
  if (!migrated) {
    const fresh = emptyLibrary();
    await saveLibrary(fresh);
    return fresh;
  }
  await saveLibrary(migrated);
  return migrated;
}

async function saveLibrary(library) {
  library.version = SCHEMA_VERSION;
  writeFallback(library);
  try {
    await writeOpfs(library);
    return { backend: 'OPFS + local backup' };
  } catch {
    return { backend: 'localStorage' };
  }
}

function makeBook({ title = 'Untitled', author = '', defaults = {} } = {}) {
  const now = new Date().toISOString();
  const chapterId = uuid();
  const id = uuid();
  return {
    id,
    title,
    subtitle: '',
    author,
    createdAt: now,
    updatedAt: now,
    goal: 80000,
    dailyGoal: 500,
    chapterOrder: [chapterId],
    chapters: {
      [chapterId]: {
        id: chapterId,
        title: 'Chapter 1',
        kind: 'chapter',
        note: '',
        summary: '',
        outlineSections: [],
        html: '<p><br></p>'
      }
    },
    lastChapterId: chapterId,
    notesHtml: '',
    outlineHtml: '',
    placeholders: [],
    darlings: [],
    ideaForge: { mode: 'premise', genre: 'Any', mood: 'Any', current: null, locks: {}, saved: [], pinned: null },
    stats: { days: {} },
    sprint: null,
    cover: { hue: [...id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 360, style: Math.floor(Math.random() * 6), template: Math.floor(Math.random() * 6), customImage: '' },
    viewSettings: {
      fontSize: 20,
      fontFamily: defaults.fontFamily || 'Georgia',
      dropCap: defaults.dropCap !== false,
      focusMode: false,
      typewriter: false,
      spellcheck: false
    }
  };
}

function exportLibrary(library) {
  const blob = new Blob([JSON.stringify(library, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `neo-web-backup-${stamp}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importLibrary(file) {
  const text = await file.text();
  const parsed = migrate(JSON.parse(text));
  if (!parsed) throw new Error('That file is not a compatible NEO Web backup.');
  await saveLibrary(parsed);
  return parsed;
}
