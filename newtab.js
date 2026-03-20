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
    tabBookmarks: "浏览器收藏夹",
    tabDoubanRead: "豆瓣已读",
    tabDoubanWish: "豆瓣想读",
    tabMovieSeen: "豆瓣看过电影",
    tabMovieWish: "豆瓣想看电影",
    refreshBtn: "再翻三张",
    importDoubanRead: "导入豆瓣已读",
    importDoubanWish: "导入豆瓣想读",
    importMovieSeen: "导入豆瓣看过",
    importMovieWish: "导入豆瓣想看",
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
    noImportYet: "还没有导入{0}。",
    totalItems: "共 {0} 项",
    totalBookmarks: "当前收藏夹条目数：{0}",
    noBookmarks: "没有检测到书签。",
    invalidJson: "JSON 格式不正确，请检查后再试。",
    jsonNotArray: "JSON 顶层必须是数组。",
    githubFork: "在 GitHub 上关注我",
    langCode: "EN"
  },
  en: {
    appTitle: "Bookmark Miner",
    tabBookmarks: "Bookmarks",
    tabDoubanRead: "Books Read",
    tabDoubanWish: "Books Wishlist",
    tabMovieSeen: "Movies Seen",
    tabMovieWish: "Movies Wishlist",
    refreshBtn: "Show 3 more",
    importDoubanRead: "Import Books Read",
    importDoubanWish: "Import Books Wishlist",
    importMovieSeen: "Import Movies Seen",
    importMovieWish: "Import Movies Wishlist",
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
    noImportYet: "No {0} imported yet.",
    totalItems: "Total: {0}",
    totalBookmarks: "Total bookmarks: {0}",
    noBookmarks: "No bookmarks detected.",
    invalidJson: "Invalid JSON format.",
    jsonNotArray: "JSON must be an array.",
    githubFork: "Fork me on GitHub",
    langCode: "中"
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
const BUILD_ID = "2026-03-16-multi-tabs";

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

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      card.style.setProperty("--tilt-x", `${tiltX}deg`);
      card.style.setProperty("--tilt-y", `${tiltY}deg`);
      card.style.setProperty("--float-y", `${floatY}px`);
    });
  }

  function onLeave() {
    if (rafId) cancelAnimationFrame(rafId);
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.setProperty("--float-y", "0px");
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

function ratingTier(rating) {
  if (!rating) return "rating-1";
  const match = String(rating).match(/(\d)/);
  const value = match ? Number(match[1]) : 1;
  if (value <= 1) return "rating-1";
  if (value === 2) return "rating-2";
  if (value === 3) return "rating-3";
  if (value === 4) return "rating-4";
  return "rating-5";
}

function ratingValue(rating) {
  if (!rating) return 0;
  const match = String(rating).match(/(\d)/);
  const value = match ? Number(match[1]) : 0;
  return Math.max(0, Math.min(5, value));
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
  const bookmarkBtn = clone.querySelector(".bookmark-btn");
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
    bookmarkBtn.classList.add("is-liked");
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
      bookmarkBtn.classList.remove("is-liked");
    } else {
      updated.liked = true;
      updated.likes += 1;
      bookmarkBtn.classList.add("is-liked");
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

  bookmarkBtn.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  attachTilt(card);
  return card;
}

function buildCards(bookmarks, nodeIndex, stats) {
  const container = document.getElementById("cards");
  container.innerHTML = "";

  for (const item of bookmarks) {
    const card = createCardElement(item, nodeIndex, stats);
    container.appendChild(card);
  }

  const cards = Array.from(container.querySelectorAll(".card"));
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add("is-revealed");
    }, 250 + index * 180);
  });
}

function buildMediaCards(items, containerId, footerId, label) {
  const container = document.getElementById(containerId);
  const template = document.getElementById("card-template");
  container.innerHTML = "";

  if (!items.length) {
    const footer = document.getElementById(footerId);
    if (footer) footer.textContent = t("noImportYet", t(label));
    return;
  }

  items.forEach((item, index) => {
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
    const bookmarkBtn = clone.querySelector(".bookmark-btn");
    const ratingEl = clone.querySelector(".rating-stars");

    card.classList.add(ratingTier(item.rating));

    const readMs = item.readDate ? Date.parse(item.readDate) : null;
    titleEl.textContent = item.title || "";
    urlEl.textContent = item.comment || "";
    pathEl.textContent = item.rating || "";
    if (!item.rating) {
      pathEl.style.display = "none";
    } else {
      pathEl.style.display = "inline-flex";
    }
    dateEl.textContent = readMs
      ? t("readOn", formatDate(readMs), formatElapsed(readMs))
      : "";
    favicon.style.backgroundImage = item.link ? `url('${faviconUrl(item.link)}')` : "";
    faviconText.textContent = getInitial(item.title, item.link);
    renderStars(ratingEl, ratingValue(item.rating));

    likeBtn.style.display = "none";
    deleteBtn.style.display = "none";

    card.addEventListener("click", () => {
      if (item.link) {
        window.open(item.link, "_blank", "noopener,noreferrer");
      }
    });

    bookmarkBtn.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    attachTilt(card);
    container.appendChild(card);

    setTimeout(() => {
      card.classList.add("is-revealed");
    }, 250 + index * 180);
  });

  const footer = document.getElementById(footerId);
  if (footer) footer.textContent = t("totalItems", items.length);
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

async function showRandomBookmarks() {
  currentSelection = [];
  await fillSelection();
}

function showRandomSeries(series, containerId, footerId, label) {
  if (!series.length) {
    buildMediaCards([], containerId, footerId, label);
    return;
  }
  const selection = pickRandomUnique(series, 3);
  buildMediaCards(selection, containerId, footerId, label);
}

function setBuildBadge() {
  const badge = document.getElementById("corner-badge");
  if (badge) {
    badge.textContent = `build ${BUILD_ID}`;
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

function setSeriesButtons() {
  const refreshBookmarks = document.getElementById("refresh-bookmarks");
  refreshBookmarks.addEventListener("click", () => {
    showRandomBookmarks().catch(() => {});
  });

  document.getElementById("refresh-douban-read").addEventListener("click", () => {
    showRandomSeries(doubanRead, "douban-read-cards", "douban-read-footer", "tabDoubanRead");
  });

  document.getElementById("refresh-douban-wish").addEventListener("click", () => {
    showRandomSeries(doubanWish, "douban-wish-cards", "douban-wish-footer", "tabDoubanWish");
  });

  document.getElementById("refresh-movie-seen").addEventListener("click", () => {
    showRandomSeries(movieSeen, "movie-seen-cards", "movie-seen-footer", "tabMovieSeen");
  });

  document.getElementById("refresh-movie-wish").addEventListener("click", () => {
    showRandomSeries(movieWish, "movie-wish-cards", "movie-wish-footer", "tabMovieWish");
  });
}

setBuildBadge();
setupTabs();
setSeriesButtons();

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

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const activePanel = document.querySelector(".tab-panel.active");
    if (activePanel) {
      const refreshBtn = activePanel.querySelector("button[id^='refresh-']");
      if (refreshBtn) {
        refreshBtn.click();
      }
    }
  }
});
