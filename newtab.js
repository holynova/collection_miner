// Polyfill/Mock for non-extension environments (like file:// during development)
if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) {
  console.log("Running in non-extension context. Initializing mock chrome APIs.");
  
  const mockStorage = {
    get: function(keys, callback) {
      return new Promise((resolve) => {
        const result = {};
        const getSingle = (key) => {
          try {
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val) : null;
          } catch(e) {
            return null;
          }
        };
        if (typeof keys === "string") {
          result[keys] = getSingle(keys);
        } else if (Array.isArray(keys)) {
          keys.forEach(k => {
            result[k] = getSingle(k);
          });
        } else if (typeof keys === "object" && keys !== null) {
          Object.keys(keys).forEach(k => {
            const val = getSingle(k);
            result[k] = val !== null ? val : keys[k];
          });
        }
        if (callback) callback(result);
        resolve(result);
      });
    },
    set: function(items, callback) {
      return new Promise((resolve) => {
        Object.keys(items).forEach(k => {
          localStorage.setItem(k, JSON.stringify(items[k]));
        });
        if (callback) callback();
        resolve();
      });
    },
    clear: function(callback) {
      return new Promise((resolve) => {
        localStorage.clear();
        if (callback) callback();
        resolve();
      });
    }
  };

  const MOCK_BOOKMARKS = [
    { id: "mock-1", title: "Google Search", url: "https://www.google.com", dateAdded: Date.now() - 5 * 24 * 3600 * 1000, parentId: "1" },
    { id: "mock-2", title: "GitHub Repository", url: "https://github.com/holynova/collection_miner", dateAdded: Date.now() - 400 * 24 * 3600 * 1000, parentId: "1" },
    { id: "mock-3", title: "Douban Movie", url: "https://movie.douban.com", dateAdded: Date.now() - 800 * 24 * 3600 * 1000, parentId: "2" },
    { id: "mock-4", title: "V2EX Community", url: "https://www.v2ex.com", dateAdded: Date.now() - 1200 * 24 * 3600 * 1000, parentId: "2" },
    { id: "mock-5", title: "Hacker News", url: "https://news.ycombinator.com", dateAdded: Date.now() - 2000 * 24 * 3600 * 1000, parentId: "3" },
    { id: "mock-6", title: "Bilibili Video", url: "https://www.bilibili.com", dateAdded: Date.now() - 100 * 24 * 3600 * 1000, parentId: "3" }
  ];

  const MOCK_INDEX = {
    "1": { id: "1", title: "Favorites", parentId: "0" },
    "2": { id: "2", title: "Tech & Dev", parentId: "0" },
    "3": { id: "3", title: "Read Later", parentId: "0" },
    "mock-1": { id: "mock-1", title: "Google Search", url: "https://www.google.com", dateAdded: Date.now() - 5 * 24 * 3600 * 1000, parentId: "1" },
    "mock-2": { id: "mock-2", title: "GitHub Repository", url: "https://github.com/holynova/collection_miner", dateAdded: Date.now() - 400 * 24 * 3600 * 1000, parentId: "1" },
    "mock-3": { id: "mock-3", title: "Douban Movie", url: "https://movie.douban.com", dateAdded: Date.now() - 800 * 24 * 3600 * 1000, parentId: "2" },
    "mock-4": { id: "mock-4", title: "V2EX Community", url: "https://www.v2ex.com", dateAdded: Date.now() - 1200 * 24 * 3600 * 1000, parentId: "2" },
    "mock-5": { id: "mock-5", title: "Hacker News", url: "https://news.ycombinator.com", dateAdded: Date.now() - 2000 * 24 * 3600 * 1000, parentId: "3" },
    "mock-6": { id: "mock-6", title: "Bilibili Video", url: "https://www.bilibili.com", dateAdded: Date.now() - 100 * 24 * 3600 * 1000, parentId: "3" }
  };

  const mockBookmarks = {
    getTree: function() {
      return Promise.resolve([
        {
          id: "0",
          title: "Root",
          children: [
            { id: "1", title: "Favorites", children: MOCK_BOOKMARKS.filter(b => b.parentId === "1") },
            { id: "2", title: "Tech & Dev", children: MOCK_BOOKMARKS.filter(b => b.parentId === "2") },
            { id: "3", title: "Read Later", children: MOCK_BOOKMARKS.filter(b => b.parentId === "3") }
          ]
        }
      ]);
    },
    get: function(id) {
      const item = MOCK_INDEX[id];
      return Promise.resolve(item ? [item] : []);
    },
    remove: function(id) {
      console.log(`Mock bookmarks.remove called for id: ${id}`);
      return Promise.resolve();
    },
    create: function(bookmark) {
      console.log("Mock bookmarks.create called with:", bookmark);
      return Promise.resolve({ id: "mock-new", ...bookmark });
    }
  };

  const mockTabs = {
    query: function() { return Promise.resolve([]); },
    getCurrent: function() { return Promise.resolve(null); },
    remove: function() { return Promise.resolve(); },
    onCreated: { addListener: () => {} },
    onRemoved: { addListener: () => {} },
    onUpdated: { addListener: () => {} }
  };

  const mockRuntime = {
    getURL: function(path) { return path; },
    getManifest: function() {
      return {
        version: "0.3.8"
      };
    }
  };

  if (!window.chrome) {
    window.chrome = {};
  }
  window.chrome.storage = { local: mockStorage };
  window.chrome.bookmarks = mockBookmarks;
  window.chrome.tabs = mockTabs;
  window.chrome.runtime = mockRuntime;
}

const STORAGE_KEYS = {
  BOOKMARKS: "bookmarks_flat",
  INDEX: "bookmarks_index",
  LAST_SYNC: "bookmarks_last_sync",
  STATS: "bookmark_stats",
  RECENT: "bookmark_recent_shown",
  DOUBAN_READ: "douban_reads",
  DOUBAN_WISH: "douban_wish",
  MOVIE_SEEN: "douban_movie_seen",
  MOVIE_WISH: "douban_movie_wish",
  LANG: "app_lang"
};

const I18N = {
  zh: {
    appTitle: "收藏夹淘金",
    tabBookmarks: "收藏夹",
    tabDoubanRead: "已读",
    tabDoubanWish: "想读",
    tabMovieSeen: "看过",
    tabMovieWish: "想看",
    refreshBtn: "再翻三张 ⏎",
    refreshLoading: "翻牌中…",
    importDoubanRead: "导入已读",
    importDoubanWish: "导入想读",
    importMovieSeen: "导入看过",
    importMovieWish: "导入想看",
    uncategorized: "未分类",
    addedOn: "添加于 {0}（{1}）",
    readOn: "读于 {0}（{1}）",
    daysAgo0: "距今 0天",
    daysAgo: "距今 {0}天",
    monthsAgo: "距今 {0}月",
    yearsAgo: "距今 {0}年",
    deleteConfirm: "确定要从收藏夹里删除这条吗？",
    deleted1: "已删除 1 条书签",
    undo: "撤销",
    noImportYet: "还没有导入{0}数据。",
    totalItems: "共 {0} 项",
    totalBookmarks: "收藏夹共 {0} 条",
    noBookmarks: "没有检测到书签。",
    invalidJson: "JSON 格式不正确，请检查后再试。",
    jsonNotArray: "JSON 顶层必须是数组。",
    langCode: "EN",
    closeOthers: "关闭其他标签页",
    exportData: "导出数据",
    importBackup: "导入备份",
    layoutLabel: "卡面排版",
    layoutDefault: "默认风格",
    layoutA: "现代杂志风",
    layoutB: "优雅书封风",
    layoutC: "档案索引卡",
    backStyleLabel: "卡背样式",
    backClassic: "皇家金雀 (经典金)",
    backCyber: "赛博霓虹 (科幻蓝)",
    backCosmic: "星宿物语 (极简蓝)",
    emptyStateIcon: "📂",
    emptyStateText: "还没有导入{0}数据。\n点击上方按钮导入 JSON 文件开始探索！",
    tipsBtn: "导入教程"
  },
  en: {
    appTitle: "Bookmark Miner",
    tabBookmarks: "Bookmarks",
    tabDoubanRead: "Read",
    tabDoubanWish: "Wishlist",
    tabMovieSeen: "Watched",
    tabMovieWish: "To Watch",
    refreshBtn: "Show 3 more ⏎",
    refreshLoading: "Loading…",
    importDoubanRead: "Import Read",
    importDoubanWish: "Import Wishlist",
    importMovieSeen: "Import Watched",
    importMovieWish: "Import To Watch",
    uncategorized: "Uncategorized",
    addedOn: "Added {0} ({1})",
    readOn: "Read {0} ({1})",
    daysAgo0: "0 days ago",
    daysAgo: "{0} days ago",
    monthsAgo: "{0} months ago",
    yearsAgo: "{0} years ago",
    deleteConfirm: "Are you sure you want to delete this bookmark?",
    deleted1: "Deleted 1 bookmark",
    undo: "Undo",
    noImportYet: "No {0} data imported yet.",
    totalItems: "Total: {0}",
    totalBookmarks: "Bookmarks: {0}",
    noBookmarks: "No bookmarks detected.",
    invalidJson: "Invalid JSON format.",
    jsonNotArray: "JSON must be an array.",
    langCode: "中",
    closeOthers: "Close Others",
    exportData: "Export Data",
    importBackup: "Import Backup",
    layoutLabel: "Layout Style",
    layoutDefault: "Default",
    layoutA: "Modern Magazine",
    layoutB: "Editorial Cover",
    layoutC: "Data Index",
    backStyleLabel: "Card Back",
    backClassic: "Royal Gold (Classic)",
    backCyber: "Cyber Neon (Sci-Fi)",
    backCosmic: "Celestial (Minimalist)",
    emptyStateIcon: "📂",
    emptyStateText: "No {0} data imported yet.\nClick the import button above to get started!",
    tipsBtn: "Import Guide"
  }
};

let currentLang = navigator.language.startsWith("zh") ? "zh" : "en";

function t(key, ...args) {
  let str = I18N[currentLang] ? (I18N[currentLang][key] || key) : key;
  args.forEach((arg, i) => {
    str = str.replace(`{${i}}`, arg);
  });
  return str;
}

function updateUILang() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const k = el.getAttribute("data-i18n");
    if (I18N[currentLang][k]) {
      el.textContent = I18N[currentLang][k];
    }
  });
  const switchBtn = document.getElementById("lang-switch");
  if (switchBtn) {
    switchBtn.textContent = I18N[currentLang].langCode;
  }
}

async function initLang() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.LANG);
  if (stored[STORAGE_KEYS.LANG]) {
    currentLang = stored[STORAGE_KEYS.LANG];
  }
  updateUILang();

  const switchBtn = document.getElementById("lang-switch");
  if (switchBtn) {
    switchBtn.addEventListener("click", async () => {
      currentLang = currentLang === "zh" ? "en" : "zh";
      await chrome.storage.local.set({ [STORAGE_KEYS.LANG]: currentLang });
      updateUILang();
      setBuildBadge();
      showRandomBookmarks().catch(() => {});
      loadSeries().catch(() => {});
    });
  }
}


const RECENT_LIMIT = 60;
const MIN_BOOKMARKS_FOR_FILTER = 12;
const UNDO_TIMEOUT = 8000;
const MAX_TILT = 18;
const MAX_FLOAT = -16;
const BUILD_ID = "2026-05-28-card-backs";

let currentSelection = [];
let doubanRead = [];
let doubanWish = [];
let movieSeen = [];
let movieWish = [];

function formatDate(ms) {
  if (!ms) return "";
  const date = new Date(ms);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatElapsed(ms) {
  if (!ms) return "";
  const start = new Date(ms);
  const end = new Date();

  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (endDate < startDate) return t("daysAgo0");

  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.max(0, Math.floor((endDate - startDate) / msPerDay));

  if (days >= 365) {
    const years = Math.round((days / 365) * 10) / 10;
    return t("yearsAgo", years);
  }
  if (days >= 30) {
    const months = Math.round((days / 30) * 10) / 10;
    return t("monthsAgo", months);
  }
  return t("daysAgo", days);
}

function faviconUrl(url) {
  return `chrome://favicon2/?size=32&url=${encodeURIComponent(url)}`;
}

function getInitial(title, url) {
  const source = (title || "").trim() || (url || "").trim();
  if (!source) return "?";
  const firstChar = Array.from(source)[0];
  if (firstChar) return firstChar.toUpperCase();
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return (host && host[0] ? host[0].toUpperCase() : "?");
  } catch (error) {
    return "?";
  }
}

function getPath(id, index) {
  const names = [];
  let current = index[id];
  while (current && current.parentId && index[current.parentId]) {
    const parent = index[current.parentId];
    if (parent.title) names.push(parent.title);
    current = parent;
  }
  return names.reverse().join(" / ") || t("uncategorized");
}

function pickRandomUnique(items, count) {
  const pool = [...items];
  const chosen = [];
  while (pool.length && chosen.length < count) {
    const idx = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }
  return chosen;
}

function weightFor(item, stats) {
  const record = stats[item.id] || { likes: 0, dislikes: 0 };
  const raw = 1 + record.likes - record.dislikes;
  return Math.max(0.2, raw);
}

function weightedPick(items, count, stats) {
  const pool = [...items];
  const chosen = [];

  while (pool.length && chosen.length < count) {
    const weights = pool.map((item) => weightFor(item, stats));
    const total = weights.reduce((sum, w) => sum + w, 0);
    let roll = Math.random() * total;
    let index = 0;

    for (let i = 0; i < pool.length; i += 1) {
      roll -= weights[i];
      if (roll <= 0) {
        index = i;
        break;
      }
    }

    chosen.push(pool.splice(index, 1)[0]);
  }

  return chosen;
}

async function ensureBookmarks() {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.BOOKMARKS,
    STORAGE_KEYS.INDEX,
    STORAGE_KEYS.LAST_SYNC
  ]);

  if (!stored[STORAGE_KEYS.BOOKMARKS] || !stored[STORAGE_KEYS.INDEX]) {
    await syncBookmarks();
  }
}

async function syncBookmarks() {
  const tree = await chrome.bookmarks.getTree();
  const flat = [];
  const index = {};

  function walk(node, parentId = null) {
    const id = node.id;
    const title = node.title || "";
    const url = node.url || null;
    const dateAdded = node.dateAdded || null;
    const parent = parentId || node.parentId || null;

    index[id] = { id, title, url, parentId: parent, dateAdded };
    if (url) {
      flat.push({ id, title, url, parentId: parent, dateAdded });
    }

    if (node.children && node.children.length) {
      for (const child of node.children) {
        walk(child, id);
      }
    }
  }

  for (const root of tree) {
    walk(root, null);
  }

  await chrome.storage.local.set({
    [STORAGE_KEYS.BOOKMARKS]: flat,
    [STORAGE_KEYS.INDEX]: index,
    [STORAGE_KEYS.LAST_SYNC]: Date.now()
  });
}

async function loadData() {
  await ensureBookmarks();
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.BOOKMARKS,
    STORAGE_KEYS.INDEX,
    STORAGE_KEYS.STATS,
    STORAGE_KEYS.RECENT,
    STORAGE_KEYS.DOUBAN_READ,
    STORAGE_KEYS.DOUBAN_WISH,
    STORAGE_KEYS.MOVIE_SEEN,
    STORAGE_KEYS.MOVIE_WISH
  ]);

  return {
    bookmarks: stored[STORAGE_KEYS.BOOKMARKS] || [],
    index: stored[STORAGE_KEYS.INDEX] || {},
    stats: stored[STORAGE_KEYS.STATS] || {},
    recent: stored[STORAGE_KEYS.RECENT] || [],
    doubanRead: stored[STORAGE_KEYS.DOUBAN_READ] || [],
    doubanWish: stored[STORAGE_KEYS.DOUBAN_WISH] || [],
    movieSeen: stored[STORAGE_KEYS.MOVIE_SEEN] || [],
    movieWish: stored[STORAGE_KEYS.MOVIE_WISH] || []
  };
}

async function saveStats(stats) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.STATS]: stats
  });
}

async function saveRecent(recent) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.RECENT]: recent
  });
}

async function saveSeries(key, data) {
  await chrome.storage.local.set({
    [key]: data
  });
}

function createToast() {
  const toast = document.getElementById("toast");
  let timer = null;

  return {
    show({ message, actionLabel, onAction }) {
      toast.querySelector(".toast-message").textContent = message;
      const actionBtn = toast.querySelector(".toast-action");
      actionBtn.textContent = actionLabel || t("undo");
      actionBtn.onclick = () => {
        clearTimeout(timer);
        toast.classList.remove("visible");
        if (onAction) onAction();
      };
      toast.classList.add("visible");
      clearTimeout(timer);
      timer = setTimeout(() => {
        toast.classList.remove("visible");
      }, UNDO_TIMEOUT);
    }
  };
}

const toast = createToast();

function showConfetti(x, y) {
  const colors = ["#ff6b6b", "#f2c86b", "#3bc0c8", "#aa78ff", "#5ac878", "#d6a24a"];
  const container = document.body;
  
  for (let i = 0; i < 20; i++) {
    const el = document.createElement("div");
    el.className = "confetti-particle";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Random direction and rotation
    const dx = (Math.random() - 0.5) * 250;
    const dy = (Math.random() - 0.5) * 250 - 50; // Slight upward bias
    const dr = (Math.random() - 0.5) * 720;
    
    el.style.setProperty("--dx", `${dx}px`);
    el.style.setProperty("--dy", `${dy}px`);
    el.style.setProperty("--dr", `${dr}deg`);
    
    el.style.animation = `confetti-pop ${0.6 + Math.random() * 0.5}s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`;
    
    container.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }
}

function attachTilt(card) {
  let rafId = null;

  function onMove(event) {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const tiltY = (x - 0.5) * MAX_TILT;
    const tiltX = (0.5 - y) * MAX_TILT;
    const floatY = MAX_FLOAT;

    // Parallax shifts for the 4 distinct layers:
    // 1. Card background: 0px (no translation)
    // 2. Other layer (header, tags, toolbar): 20px translateZ, 4px shift
    // 3. Link layer (url, subtitle): 38px translateZ, 7px shift
    // 4. Title layer (title): 60px translateZ, 11px shift
    const titleShiftX = (x - 0.5) * 11;
    const titleShiftY = (y - 0.5) * 11;
    const linkShiftX = (x - 0.5) * 7;
    const linkShiftY = (y - 0.5) * 7;
    const textShiftX = (x - 0.5) * 4;
    const textShiftY = (y - 0.5) * 4;

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      card.style.setProperty("--tilt-x", `${tiltX}deg`);
      card.style.setProperty("--tilt-y", `${tiltY}deg`);
      card.style.setProperty("--float-y", `${floatY}px`);
      card.style.setProperty("--mx", x.toFixed(3));
      card.style.setProperty("--my", y.toFixed(3));
      card.style.setProperty("--mx-pct", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--my-pct", `${(y * 100).toFixed(1)}%`);
      card.style.setProperty("--parallax-title-x", `${titleShiftX.toFixed(1)}px`);
      card.style.setProperty("--parallax-title-y", `${titleShiftY.toFixed(1)}px`);
      card.style.setProperty("--parallax-link-x", `${linkShiftX.toFixed(1)}px`);
      card.style.setProperty("--parallax-link-y", `${linkShiftY.toFixed(1)}px`);
      card.style.setProperty("--parallax-text-x", `${textShiftX.toFixed(1)}px`);
      card.style.setProperty("--parallax-text-y", `${textShiftY.toFixed(1)}px`);
    });
  }

  function onLeave() {
    if (rafId) cancelAnimationFrame(rafId);
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.setProperty("--float-y", "0px");
    card.style.setProperty("--mx", "0.5");
    card.style.setProperty("--my", "0.5");
    card.style.setProperty("--mx-pct", "50%");
    card.style.setProperty("--my-pct", "50%");
    card.style.setProperty("--parallax-title-x", "0px");
    card.style.setProperty("--parallax-title-y", "0px");
    card.style.setProperty("--parallax-link-x", "0px");
    card.style.setProperty("--parallax-link-y", "0px");
    card.style.setProperty("--parallax-text-x", "0px");
    card.style.setProperty("--parallax-text-y", "0px");
  }

  card.addEventListener("mousemove", onMove);
  card.addEventListener("mouseleave", onLeave);
}

function ageTier(ms) {
  if (!ms) return "age-white";
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.max(0, Math.floor((Date.now() - ms) / msPerDay));
  if (days < 365) return "age-white";
  if (days < 365 * 2) return "age-green";
  if (days < 365 * 3) return "age-blue";
  if (days < 365 * 5) return "age-purple";
  return "age-gold";
}

function detectRatingScale(items) {
  if (!items || !items.length) return 5;
  for (const item of items) {
    if (!item.rating) continue;
    const ratingStr = String(item.rating).trim();
    if (ratingStr.includes("allstar")) continue;
    if (ratingStr.includes("星")) continue;
    const numMatch = ratingStr.match(/^(\d+)$/);
    if (numMatch) {
      const val = Number(numMatch[1]);
      if (val === 6 || val === 8 || val === 10) {
        return 10;
      }
    }
  }
  return 5;
}

function ratingValue(rating, scale = 5) {
  if (!rating) return 0;
  const ratingStr = String(rating).trim();
  
  // 1. Star characters (e.g. "★★★★★")
  const starCount = (ratingStr.match(/★/g) || []).length;
  if (starCount > 0) {
    return Math.min(5, starCount);
  }
  
  // 2. Chinese recommendation keywords
  if (ratingStr.includes("力荐")) return 5;
  if (ratingStr.includes("推荐")) return 4;
  if (ratingStr.includes("还行")) return 3;
  if (ratingStr.includes("较差")) return 2;
  if (ratingStr.includes("很差")) return 1;

  // 3. "allstar" CSS class format (e.g. "allstar40", "allstar50", etc.)
  const allstarMatch = ratingStr.match(/allstar(\d+)/i);
  if (allstarMatch) {
    const val = Number(allstarMatch[1]);
    if (val >= 10) {
      return Math.max(0, Math.min(5, Math.round(val / 10)));
    }
    return Math.max(0, Math.min(5, val));
  }

  // 4. Star text like "4星", "5星", etc.
  const starTextMatch = ratingStr.match(/(\d)\s*星/);
  if (starTextMatch) {
    return Math.max(0, Math.min(5, Number(starTextMatch[1])));
  }
  
  // 5. Any raw numbers (e.g. "10", "8", "6", "5", "4", "3", "2", "1")
  const numMatch = ratingStr.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    const val = Number(numMatch[1]);
    if (scale === 10 || val > 5) {
      return Math.max(0, Math.min(5, Math.round(val / 2)));
    }
    return Math.max(0, Math.min(5, Math.round(val)));
  }
  
  return 0;
}

function ratingTier(rating, scale = 5) {
  const value = ratingValue(rating, scale);
  if (value === 0) return "";
  if (value === 1) return "rating-1";
  if (value === 2) return "rating-2";
  if (value === 3) return "rating-3";
  if (value === 4) return "rating-4";
  return "rating-5";
}

function renderStars(container, value) {
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < 5; i += 1) {
    const span = document.createElement("span");
    span.className = `star${i < value ? " filled" : ""}`;
    span.textContent = "★";
    container.appendChild(span);
  }
}

function createCardElement(item, nodeIndex, stats) {
  const template = document.getElementById("card-template");
  const clone = template.content.cloneNode(true);
  const card = clone.querySelector(".card");
  const titleEl = clone.querySelector(".title");
  const urlEl = clone.querySelector(".url");
  const pathEl = clone.querySelector(".path");
  const dateEl = clone.querySelector(".meta-date");
  const favicon = clone.querySelector(".favicon");
  const faviconText = clone.querySelector(".favicon-text");
  const likeBtn = clone.querySelector(".btn-like");
  const deleteBtn = clone.querySelector(".btn-delete");
  const ratingEl = clone.querySelector(".rating-stars");

  const title = item.title || item.url;
  const path = getPath(item.id, nodeIndex);
  const record = stats[item.id] || { shows: 0, clicks: 0, likes: 0, dislikes: 0, liked: false };
  const score = record.likes - record.dislikes;
  let rarity = "rarity-common";
  if (score >= 5) {
    rarity = "rarity-legendary";
  } else if (score >= 2) {
    rarity = "rarity-rare";
  } else if (score < 0) {
    rarity = "rarity-cursed";
  }
  card.classList.add(rarity);
  card.classList.add(ageTier(item.dateAdded));
  if (record.liked) {
    likeBtn.classList.add("is-liked");
  }

  titleEl.textContent = title;
  urlEl.textContent = item.url;
  pathEl.textContent = path;
  dateEl.textContent = item.dateAdded
    ? t("addedOn", formatDate(item.dateAdded), formatElapsed(item.dateAdded))
    : "";
  favicon.style.backgroundImage = `url('${faviconUrl(item.url)}')`;
  faviconText.textContent = getInitial(title, item.url);
  if (ratingEl) ratingEl.remove();

  async function handleVisit() {
    const updated = { ...(stats[item.id] || { shows: 0, clicks: 0, likes: 0, dislikes: 0, liked: false }) };
    updated.clicks += 1;
    stats[item.id] = updated;
    await saveStats(stats);
  }

  card.addEventListener("click", async (event) => {
    const target = event.target;
    if (target.closest("button")) return;
    await handleVisit();
    window.open(item.url, "_blank", "noopener,noreferrer");
  });

  likeBtn.addEventListener("click", async (event) => {
    event.stopPropagation();
    const updated = { ...(stats[item.id] || { shows: 0, clicks: 0, likes: 0, dislikes: 0, liked: false }) };
    if (updated.liked) {
      updated.liked = false;
      updated.likes = Math.max(0, updated.likes - 1);
      likeBtn.classList.remove("is-liked");
    } else {
      updated.liked = true;
      updated.likes += 1;
      likeBtn.classList.add("is-liked");
      showConfetti(event.clientX, event.clientY);
    }
    stats[item.id] = updated;
    await saveStats(stats);
  });

  deleteBtn.addEventListener("click", async (event) => {
    event.stopPropagation();
    const ok = confirm(t("deleteConfirm"));
    if (!ok) return;
    let node = null;
    try {
      const result = await chrome.bookmarks.get(item.id);
      node = result && result[0] ? result[0] : null;
    } catch (error) {
      node = null;
    }

    try {
      await chrome.bookmarks.remove(item.id);
    } catch (error) {
      return;
    }

    await replaceDeletedCard(item.id);

    if (node) {
      toast.show({
        message: t("deleted1"),
        actionLabel: t("undo"),
        onAction: async () => {
          try {
            await chrome.bookmarks.create({
              parentId: node.parentId,
              index: node.index,
              title: node.title,
              url: node.url
            });
          } catch (error) {
            // ignore
          }
        }
      });
    }
  });

  attachTilt(card);
  return card;
}

function renderEmptyState(container, labelKey) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">${t("emptyStateIcon")}</div>
      <div class="empty-state-text">${t("emptyStateText", t(labelKey)).replace(/\n/g, "<br>")}</div>
    </div>
  `;
}

function buildCards(bookmarks, nodeIndex, stats) {
  const container = document.getElementById("cards");
  const isRefresh = container.childElementCount > 0 && !container.querySelector(".empty-state");
  container.innerHTML = "";

  if (!bookmarks || !bookmarks.length) {
    renderEmptyState(container, "tabBookmarks");
    return;
  }

  for (const item of bookmarks) {
    const card = createCardElement(item, nodeIndex, stats);
    if (isRefresh) {
      card.classList.add("is-refresh-entering");
    }
    container.appendChild(card);
  }

  const cards = Array.from(container.querySelectorAll(".card"));
  cards.forEach((card, index) => {
    setTimeout(() => {
      if (isRefresh) {
        card.classList.remove("is-refresh-entering");
        card.classList.add("is-refresh-revealed");
      } else {
        card.classList.add("is-revealed");
      }
    }, isRefresh ? (index * 40) : (250 + index * 180));
  });
}

function buildMediaCards(items, containerId, footerId, label, totalCount = 0, scale = 5) {
  const container = document.getElementById(containerId);
  const isRefresh = container.childElementCount > 0 && !container.querySelector(".empty-state");
  const template = document.getElementById("card-template");
  container.innerHTML = "";

  if (!items || !items.length) {
    const footer = document.getElementById(footerId);
    if (footer) footer.textContent = t("noImportYet", t(label));
    renderEmptyState(container, label);
    return;
  }

  items.forEach((item, index) => {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector(".card");
    const titleEl = clone.querySelector(".title");
    const subtitleEl = clone.querySelector(".subtitle");
    const urlEl = clone.querySelector(".url");
    const pathEl = clone.querySelector(".path");
    const dateEl = clone.querySelector(".meta-date");
    const favicon = clone.querySelector(".favicon");
    const faviconText = clone.querySelector(".favicon-text");
    const ratingEl = clone.querySelector(".rating-stars");
    const toolbarEl = clone.querySelector(".card-toolbar");

    const isWish = label === "tabDoubanWish" || label === "tabMovieWish";
    if (!isWish) {
      const tier = ratingTier(item.rating, scale);
      if (tier) {
        card.classList.add(tier);
      }
    }
    if (isRefresh) {
      card.classList.add("is-refresh-entering");
    }

    const readMs = item.readDate ? Date.parse(item.readDate) : null;
    
    const isMovie = label === "tabMovieSeen" || label === "tabMovieWish";
    let mainTitle = item.title || "";
    let subTitle = "";
    if (isMovie && mainTitle.includes("/")) {
      const parts = mainTitle.split("/");
      mainTitle = parts[0].trim();
      subTitle = parts.slice(1).map(p => p.trim()).join(" / ");
    }

    titleEl.textContent = mainTitle;
    if (subTitle) {
      subtitleEl.textContent = subTitle;
      subtitleEl.style.display = "block";
    } else {
      subtitleEl.style.display = "none";
    }
    
    urlEl.textContent = item.comment || "";
    if (isWish) {
      pathEl.style.display = "none";
    } else {
      pathEl.textContent = item.rating || "";
      if (!item.rating) {
        pathEl.style.display = "none";
      } else {
        pathEl.style.display = "inline-flex";
      }
    }
    dateEl.textContent = readMs
      ? t("readOn", formatDate(readMs), formatElapsed(readMs))
      : "";
    favicon.style.backgroundImage = item.link ? `url('${faviconUrl(item.link)}')` : "";
    faviconText.textContent = getInitial(item.title, item.link);

    if (isWish) {
      if (ratingEl) ratingEl.remove();
    } else {
      const val = ratingValue(item.rating, scale);
      if (val > 0) {
        renderStars(ratingEl, val);
      } else {
        if (ratingEl) ratingEl.remove();
      }
    }

    if (toolbarEl) toolbarEl.style.display = "none";

    card.addEventListener("click", () => {
      if (item.link) {
        window.open(item.link, "_blank", "noopener,noreferrer");
      }
    });

    attachTilt(card);
    container.appendChild(card);

    setTimeout(() => {
      if (isRefresh) {
        card.classList.remove("is-refresh-entering");
        card.classList.add("is-refresh-revealed");
      } else {
        card.classList.add("is-revealed");
      }
    }, isRefresh ? (index * 40) : (250 + index * 180));
  });

  const footer = document.getElementById(footerId);
  if (footer) footer.textContent = t("totalItems", totalCount || items.length);
}

function renderFooter(total) {
  const footer = document.getElementById("footer");
  footer.textContent = total
    ? t("totalBookmarks", total)
    : t("noBookmarks");
}

async function fillSelection() {
  const data = await loadData();
  const total = data.bookmarks.length;
  if (!total) {
    currentSelection = [];
    buildCards([], data.index, data.stats);
    renderFooter(0);
    return;
  }

  const pickedIds = new Set(currentSelection.map((item) => item.id));
  const available = data.bookmarks.filter((item) => !pickedIds.has(item.id));
  if (!available.length) {
    buildCards(currentSelection, data.index, data.stats);
    renderFooter(total);
    return;
  }

  const need = Math.max(0, 3 - currentSelection.length);
  if (!need) {
    buildCards(currentSelection, data.index, data.stats);
    renderFooter(total);
    return;
  }

  const recentSet = new Set(data.recent);
  const hasEnough = total >= MIN_BOOKMARKS_FOR_FILTER;
  const filtered = hasEnough
    ? available.filter((item) => !recentSet.has(item.id))
    : available;

  let picked = weightedPick(filtered, need, data.stats);
  if (picked.length < need) {
    const remaining = available.filter(
      (item) => !picked.find((pickedItem) => pickedItem.id === item.id)
    );
    picked = picked.concat(weightedPick(remaining, need - picked.length, data.stats));
  }

  currentSelection = currentSelection.concat(picked);

  for (const item of picked) {
    const record = data.stats[item.id] || { shows: 0, clicks: 0, likes: 0, dislikes: 0, liked: false };
    record.shows += 1;
    data.stats[item.id] = record;
  }

  const recent = [...data.recent, ...picked.map((item) => item.id)];
  const trimmed = recent.slice(-RECENT_LIMIT);

  await Promise.all([saveStats(data.stats), saveRecent(trimmed)]);

  buildCards(currentSelection, data.index, data.stats);
  renderFooter(total);
}

async function replaceDeletedCard(deletedId) {
  const data = await loadData();
  const total = data.bookmarks.length;
  const index = currentSelection.findIndex((entry) => entry.id === deletedId);
  if (index === -1) {
    buildCards(currentSelection, data.index, data.stats);
    renderFooter(total);
    return;
  }

  const remaining = currentSelection.filter((entry) => entry.id !== deletedId);
  const pickedIds = new Set(remaining.map((item) => item.id));
  const available = data.bookmarks.filter((item) => !pickedIds.has(item.id));

  if (!available.length) {
    currentSelection = remaining;
    buildCards(currentSelection, data.index, data.stats);
    renderFooter(total);
    return;
  }

  const recentSet = new Set(data.recent);
  const hasEnough = total >= MIN_BOOKMARKS_FOR_FILTER;
  const filtered = hasEnough
    ? available.filter((item) => !recentSet.has(item.id))
    : available;

  let picked = weightedPick(filtered, 1, data.stats);
  if (!picked.length) {
    picked = weightedPick(available, 1, data.stats);
  }
  const newItem = picked[0];

  currentSelection = [...remaining];
  currentSelection.splice(index, 0, newItem);

  const record = data.stats[newItem.id] || { shows: 0, clicks: 0, likes: 0, dislikes: 0, liked: false };
  record.shows += 1;
  data.stats[newItem.id] = record;

  const recent = [...data.recent, newItem.id];
  const trimmed = recent.slice(-RECENT_LIMIT);

  await Promise.all([saveStats(data.stats), saveRecent(trimmed)]);

  const container = document.getElementById("cards");
  if (container) {
    const cards = container.querySelectorAll(".card");
    const oldCard = cards[index];
    if (oldCard) {
      const newCard = createCardElement(newItem, data.index, data.stats);
      oldCard.replaceWith(newCard);
      setTimeout(() => {
        newCard.classList.add("is-revealed");
      }, 100);
    } else {
      buildCards(currentSelection, data.index, data.stats);
    }
  } else {
    buildCards(currentSelection, data.index, data.stats);
  }

  renderFooter(total);
}

function animateFlyOut(container) {
  return new Promise((resolve) => {
    const cards = Array.from(container.querySelectorAll(".card"));
    if (cards.length === 0) {
      resolve();
      return;
    }

    // Flip to edge (90deg) sequentially
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.remove("is-revealed");
        card.classList.remove("is-refresh-revealed");
        card.classList.add("is-refresh-exiting");
      }, index * 40);
    });

    // Wait for the flip animation (150ms transition from CSS) + stagger
    const totalDelay = (cards.length - 1) * 40 + 150;
    setTimeout(resolve, totalDelay);
  });
}

async function showRandomBookmarks() {
  const container = document.getElementById("cards");
  if (container) {
    await animateFlyOut(container);
  }
  currentSelection = [];
  await fillSelection();
}

async function showRandomSeries(series, containerId, footerId, label) {
  const container = document.getElementById(containerId);
  if (container && series.length) {
    await animateFlyOut(container);
  }
  if (!series.length) {
    buildMediaCards([], containerId, footerId, label);
    return;
  }
  const scale = detectRatingScale(series);
  const picked = pickRandomUnique(series, 3);
  buildMediaCards(picked, containerId, footerId, label, series.length, scale);
}

function setBuildBadge() {
  let version = "0.3.8";
  if (typeof chrome !== "undefined" && chrome.runtime && typeof chrome.runtime.getManifest === "function") {
    try {
      const manifest = chrome.runtime.getManifest();
      if (manifest && manifest.version) {
        version = manifest.version;
      }
    } catch (e) {
      // ignore
    }
  }

  const badge = document.getElementById("corner-badge");
  if (badge) {
    badge.textContent = `v${version} / build ${BUILD_ID}`;
  }

  const versionEl = document.getElementById("version-badge");
  if (versionEl) {
    const appName = t("appTitle");
    versionEl.textContent = `${appName} v${version}`;
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  const panels = {
    bookmarks: document.getElementById("tab-bookmarks"),
    "douban-read": document.getElementById("tab-douban-read"),
    "douban-wish": document.getElementById("tab-douban-wish"),
    "movie-seen": document.getElementById("tab-movie-seen"),
    "movie-wish": document.getElementById("tab-movie-wish")
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((btn) => btn.classList.remove("active"));
      tab.classList.add("active");
      
      Object.values(panels).forEach((panel) => panel.classList.remove("active"));
      const target = panels[tab.dataset.tab];
      if (target) target.classList.add("active");

      const activeTabName = tab.dataset.tab;
      document.querySelectorAll(".tab-specific-actions").forEach((group) => {
        if (group.dataset.for === activeTabName) {
          group.style.display = "inline-flex";
        } else {
          group.style.display = "none";
        }
      });
    });
  });
}

function parseSeriesInput(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }
  return JSON.parse(`[${trimmed.replace(/,\s*$/, "")}]`);
}

async function handleSeriesImport(file, key, setter, containerId, footerId, label) {
  const text = await file.text();
  let data = [];
  try {
    data = parseSeriesInput(text);
  } catch (error) {
    alert(t("invalidJson"));
    return;
  }
  if (!Array.isArray(data)) {
    alert(t("jsonNotArray"));
    return;
  }
  setter(data);
  await saveSeries(key, data);
  showRandomSeries(data, containerId, footerId, label);
}

function bindFileInput(id, key, setter, containerId, footerId, label) {
  const fileInput = document.getElementById(id);
  if (!fileInput) return;
  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    await handleSeriesImport(file, key, setter, containerId, footerId, label);
    fileInput.value = "";
  });
}

async function loadSeries() {
  const data = await loadData();
  doubanRead = data.doubanRead;
  doubanWish = data.doubanWish;
  movieSeen = data.movieSeen;
  movieWish = data.movieWish;

  showRandomSeries(doubanRead, "douban-read-cards", "douban-read-footer", "tabDoubanRead");
  showRandomSeries(doubanWish, "douban-wish-cards", "douban-wish-footer", "tabDoubanWish");
  showRandomSeries(movieSeen, "movie-seen-cards", "movie-seen-footer", "tabMovieSeen");
  showRandomSeries(movieWish, "movie-wish-cards", "movie-wish-footer", "tabMovieWish");
}

function withLoading(btnId, asyncFn) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener("click", async () => {
    if (btn.classList.contains("is-loading")) return;
    const originalText = btn.textContent;
    btn.textContent = t("refreshLoading");
    btn.classList.add("is-loading");
    try {
      await asyncFn();
    } catch (err) {
      // ignore
    } finally {
      btn.textContent = originalText;
      btn.classList.remove("is-loading");
    }
  });
}

function setSeriesButtons() {
  withLoading("refresh-bookmarks", () => showRandomBookmarks());
  withLoading("refresh-douban-read", () => showRandomSeries(doubanRead, "douban-read-cards", "douban-read-footer", "tabDoubanRead"));
  withLoading("refresh-douban-wish", () => showRandomSeries(doubanWish, "douban-wish-cards", "douban-wish-footer", "tabDoubanWish"));
  withLoading("refresh-movie-seen", () => showRandomSeries(movieSeen, "movie-seen-cards", "movie-seen-footer", "tabMovieSeen"));
  withLoading("refresh-movie-wish", () => showRandomSeries(movieWish, "movie-wish-cards", "movie-wish-footer", "tabMovieWish"));
}

async function checkDuplicateTabs() {
  if (typeof chrome === "undefined" || !chrome.tabs) return;
  try {
    const extensionUrl = chrome.runtime.getURL("newtab.html");
    const tabs = await chrome.tabs.query({});
    
    // Filter tabs running this extension or generic chrome://newtab
    const duplicateTabs = tabs.filter(tab => {
      if (!tab.url) return false;
      return tab.url.startsWith(extensionUrl) || tab.url.startsWith("chrome://newtab");
    });
    
    console.log("[DEBUG] All tabs queried:", tabs.map(t => ({ id: t.id, url: t.url })));
    console.log("[DEBUG] Duplicate tabs detected:", duplicateTabs.map(t => ({ id: t.id, url: t.url })));
    
    const closeBtn = document.getElementById("close-others");
    if (!closeBtn) return;
    
    if (duplicateTabs.length > 1) {
      closeBtn.style.display = "inline-flex";
    } else {
      closeBtn.style.display = "none";
    }
  } catch (error) {
    console.error("Failed to check duplicate tabs", error);
  }
}

async function closeOtherTabs() {
  if (typeof chrome === "undefined" || !chrome.tabs) return;
  try {
    const extensionUrl = chrome.runtime.getURL("newtab.html");
    const tabs = await chrome.tabs.query({});
    const duplicateTabs = tabs.filter(tab => {
      if (!tab.url) return false;
      return tab.url.startsWith(extensionUrl) || tab.url.startsWith("chrome://newtab");
    });
    
    const currentTab = await chrome.tabs.getCurrent();
    const currentTabId = currentTab ? currentTab.id : null;
    
    const tabsToRemove = duplicateTabs
      .filter(tab => tab.id !== currentTabId && tab.id !== undefined)
      .map(tab => tab.id);
      
    if (tabsToRemove.length > 0) {
      await chrome.tabs.remove(tabsToRemove);
    }
    
    const closeBtn = document.getElementById("close-others");
    if (closeBtn) closeBtn.style.display = "none";
  } catch (error) {
    console.error("Failed to close other tabs", error);
  }
}

function initDuplicateTabManager() {
  const closeBtn = document.getElementById("close-others");
  if (!closeBtn) return;
  
  closeBtn.addEventListener("click", () => {
    closeOtherTabs().catch(() => {});
  });
  
  if (typeof chrome !== "undefined" && chrome.tabs) {
    chrome.tabs.onCreated.addListener(checkDuplicateTabs);
    chrome.tabs.onRemoved.addListener(checkDuplicateTabs);
    chrome.tabs.onUpdated.addListener(checkDuplicateTabs);
  }
  
  checkDuplicateTabs().catch(() => {});
}

async function exportAllData() {
  try {
    const keys = [
      STORAGE_KEYS.DOUBAN_READ,
      STORAGE_KEYS.DOUBAN_WISH,
      STORAGE_KEYS.MOVIE_SEEN,
      STORAGE_KEYS.MOVIE_WISH,
      STORAGE_KEYS.STATS,
      STORAGE_KEYS.RECENT
    ];
    const data = await chrome.storage.local.get(keys);
    
    const exportObj = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      data: {
        doubanRead: data[STORAGE_KEYS.DOUBAN_READ] || [],
        doubanWish: data[STORAGE_KEYS.DOUBAN_WISH] || [],
        movieSeen: data[STORAGE_KEYS.MOVIE_SEEN] || [],
        movieWish: data[STORAGE_KEYS.MOVIE_WISH] || [],
        bookmarkStats: data[STORAGE_KEYS.STATS] || {},
        recentShown: data[STORAGE_KEYS.RECENT] || []
      }
    };
    
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const dateStr = formatDate(Date.now());
    const filename = `collection_miner_backup_${dateStr}.json`;
    
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export data", error);
    alert(currentLang === "zh" ? "导出数据失败：" + error.message : "Failed to export data: " + error.message);
  }
}

async function handleBackupImport(file) {
  const text = await file.text();
  try {
    const backup = JSON.parse(text);
    if (!backup.data) {
      alert(t("invalidJson"));
      return;
    }
    
    const d = backup.data;
    const toSave = {};
    let count = 0;
    
    if (d.doubanRead) {
      toSave[STORAGE_KEYS.DOUBAN_READ] = d.doubanRead;
      doubanRead = d.doubanRead;
      count += d.doubanRead.length;
    }
    if (d.doubanWish) {
      toSave[STORAGE_KEYS.DOUBAN_WISH] = d.doubanWish;
      doubanWish = d.doubanWish;
      count += d.doubanWish.length;
    }
    if (d.movieSeen) {
      toSave[STORAGE_KEYS.MOVIE_SEEN] = d.movieSeen;
      movieSeen = d.movieSeen;
      count += d.movieSeen.length;
    }
    if (d.movieWish) {
      toSave[STORAGE_KEYS.MOVIE_WISH] = d.movieWish;
      movieWish = d.movieWish;
      count += d.movieWish.length;
    }
    if (d.bookmarkStats) {
      toSave[STORAGE_KEYS.STATS] = d.bookmarkStats;
    }
    if (d.recentShown) {
      toSave[STORAGE_KEYS.RECENT] = d.recentShown;
    }
    
    await chrome.storage.local.set(toSave);
    
    // Reload UI
    await loadSeries();
    
    alert(currentLang === "zh" ? `导入备份成功！共恢复了 ${count} 条已导入数据。` : `Backup imported successfully! Restored ${count} items.`);
  } catch (error) {
    console.error("Failed to import backup", error);
    alert(t("invalidJson"));
  }
}

function initMoreMenu() {
  const toggleBtn = document.getElementById("more-menu-btn");
  const menu = document.getElementById("more-menu");
  if (!toggleBtn || !menu) return;

  toggleBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    menu.style.display = menu.style.display === "none" ? "block" : "none";
  });

  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target) && event.target !== toggleBtn) {
      menu.style.display = "none";
    }
  });
}

function initBackupManager() {
  const exportBtn = document.getElementById("export-data");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      exportAllData().catch(() => {});
    });
  }
  
  const importInput = document.getElementById("import-backup-file");
  if (importInput) {
    importInput.addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      await handleBackupImport(file);
      importInput.value = "";
    });
  }
}

setBuildBadge();
setupTabs();
setSeriesButtons();
initDuplicateTabManager();
initBackupManager();
initMoreMenu();

function initLayoutSelect() {
  const selectEl = document.getElementById("layout-select");
  if (!selectEl) return;

  chrome.storage.local.get("cardLayout", (res) => {
    const layout = res.cardLayout || "layout-a";
    selectEl.value = layout;
    document.body.className = document.body.className.replace(/layout-\w+/g, "").trim();
    if (layout !== "layout-default") {
      document.body.classList.add(layout);
    }
  });

  selectEl.addEventListener("change", (e) => {
    const layout = e.target.value;
    chrome.storage.local.set({ cardLayout: layout });
    document.body.className = document.body.className.replace(/layout-\w+/g, "").trim();
    if (layout !== "layout-default") {
      document.body.classList.add(layout);
    }
  });
}

function initBackStyleSelect() {
  const selectEl = document.getElementById("back-style-select");
  if (!selectEl) return;

  chrome.storage.local.get("cardBackStyle", (res) => {
    const style = res.cardBackStyle || "back-classic";
    selectEl.value = style;
    document.body.className = document.body.className.replace(/back-\w+/g, "").trim();
    document.body.classList.add(style);
  });

  selectEl.addEventListener("change", (e) => {
    const style = e.target.value;
    chrome.storage.local.set({ cardBackStyle: style });
    document.body.className = document.body.className.replace(/back-\w+/g, "").trim();
    document.body.classList.add(style);
  });
}

bindFileInput(
  "douban-read-file",
  STORAGE_KEYS.DOUBAN_READ,
  (data) => {
    doubanRead = data;
  },
  "douban-read-cards",
  "douban-read-footer",
  "tabDoubanRead"
);

bindFileInput(
  "douban-wish-file",
  STORAGE_KEYS.DOUBAN_WISH,
  (data) => {
    doubanWish = data;
  },
  "douban-wish-cards",
  "douban-wish-footer",
  "tabDoubanWish"
);

bindFileInput(
  "movie-seen-file",
  STORAGE_KEYS.MOVIE_SEEN,
  (data) => {
    movieSeen = data;
  },
  "movie-seen-cards",
  "movie-seen-footer",
  "tabMovieSeen"
);

bindFileInput(
  "movie-wish-file",
  STORAGE_KEYS.MOVIE_WISH,
  (data) => {
    movieWish = data;
  },
  "movie-wish-cards",
  "movie-wish-footer",
  "tabMovieWish"
);

showRandomBookmarks().catch(() => {});
loadSeries().catch(() => {});
initLang().catch(() => {});
initLayoutSelect();
initBackStyleSelect();

function triggerVisibleRefresh() {
  const visibleRefreshBtn = Array.from(document.querySelectorAll("button[id^='refresh-']"))
    .find(btn => btn.offsetWidth > 0 || btn.offsetHeight > 0);
  if (visibleRefreshBtn) {
    visibleRefreshBtn.click();
  }
}

// Enter or Space to refresh
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    // Don't intercept Space inside inputs, selects, buttons, or textareas
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "BUTTON" || tag === "A") return;
    event.preventDefault();
    triggerVisibleRefresh();
  }
});

// Click on page blank area to refresh
document.addEventListener("click", (event) => {
  const interactive = event.target.closest(
    "button, a, input, select, label, .card, .more-menu, .more-menu-wrapper, .toolbar, .toast"
  );
  if (!interactive) {
    triggerVisibleRefresh();
  }
});
