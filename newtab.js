const STORAGE_KEYS = {
  BOOKMARKS: "bookmarks_flat",
  INDEX: "bookmarks_index",
  LAST_SYNC: "bookmarks_last_sync",
  STATS: "bookmark_stats",
  RECENT: "bookmark_recent_shown",
  DOUBAN_READ: "douban_reads",
  DOUBAN_WISH: "douban_wish",
  MOVIE_SEEN: "douban_movie_seen",
  MOVIE_WISH: "douban_movie_wish"
};

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

  if (endDate < startDate) return "距今 0天";

  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.max(0, Math.floor((endDate - startDate) / msPerDay));

  if (days >= 365) {
    const years = Math.round((days / 365) * 10) / 10;
    return `距今 ${years}年`;
  }
  if (days >= 30) {
    const months = Math.round((days / 30) * 10) / 10;
    return `距今 ${months}月`;
  }
  return `距今 ${days}天`;
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
  return names.reverse().join(" / ") || "未分类";
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
      actionBtn.textContent = actionLabel || "撤销";
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
  const match = rating.match(/(\d)/);
  const value = match ? Number(match[1]) : 1;
  if (value <= 1) return "rating-1";
  if (value === 2) return "rating-2";
  if (value === 3) return "rating-3";
  if (value === 4) return "rating-4";
  return "rating-5";
}

function ratingValue(rating) {
  if (!rating) return 0;
  const match = rating.match(/(\d)/);
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

function buildCards(bookmarks, index, stats) {
  const container = document.getElementById("cards");
  const template = document.getElementById("card-template");
  container.innerHTML = "";

  for (const item of bookmarks) {
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
    const path = getPath(item.id, index);
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
      ? `添加于 ${formatDate(item.dateAdded)}（${formatElapsed(item.dateAdded)}）`
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
      }
      stats[item.id] = updated;
      await saveStats(stats);
    });

    deleteBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      const ok = confirm("确定要从收藏夹里删除这条吗？");
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
          message: "已删除 1 条书签",
          actionLabel: "撤销",
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
    if (footer) footer.textContent = `还没有导入${label}。`;
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
    dateEl.textContent = readMs
      ? `读于 ${formatDate(readMs)}（${formatElapsed(readMs)}）`
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
  if (footer) footer.textContent = `共 ${items.length} 项`;
}

function renderFooter(total) {
  const footer = document.getElementById("footer");
  footer.textContent = total
    ? `当前收藏夹条目数：${total}`
    : "没有检测到书签。";
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

  buildCards(currentSelection, data.index, data.stats);
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
    alert("JSON 格式不正确，请检查后再试。");
    return;
  }
  if (!Array.isArray(data)) {
    alert("JSON 顶层必须是数组。");
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

  showRandomSeries(doubanRead, "douban-read-cards", "douban-read-footer", "豆瓣已读");
  showRandomSeries(doubanWish, "douban-wish-cards", "douban-wish-footer", "豆瓣想读");
  showRandomSeries(movieSeen, "movie-seen-cards", "movie-seen-footer", "豆瓣看过");
  showRandomSeries(movieWish, "movie-wish-cards", "movie-wish-footer", "豆瓣想看");
}

function setSeriesButtons() {
  const refreshBookmarks = document.getElementById("refresh-bookmarks");
  refreshBookmarks.addEventListener("click", () => {
    showRandomBookmarks().catch(() => {});
  });

  document.getElementById("refresh-douban-read").addEventListener("click", () => {
    showRandomSeries(doubanRead, "douban-read-cards", "douban-read-footer", "豆瓣已读");
  });

  document.getElementById("refresh-douban-wish").addEventListener("click", () => {
    showRandomSeries(doubanWish, "douban-wish-cards", "douban-wish-footer", "豆瓣想读");
  });

  document.getElementById("refresh-movie-seen").addEventListener("click", () => {
    showRandomSeries(movieSeen, "movie-seen-cards", "movie-seen-footer", "豆瓣看过");
  });

  document.getElementById("refresh-movie-wish").addEventListener("click", () => {
    showRandomSeries(movieWish, "movie-wish-cards", "movie-wish-footer", "豆瓣想看");
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
  "豆瓣已读"
);

bindFileInput(
  "douban-wish-file",
  STORAGE_KEYS.DOUBAN_WISH,
  (data) => {
    doubanWish = data;
  },
  "douban-wish-cards",
  "douban-wish-footer",
  "豆瓣想读"
);

bindFileInput(
  "movie-seen-file",
  STORAGE_KEYS.MOVIE_SEEN,
  (data) => {
    movieSeen = data;
  },
  "movie-seen-cards",
  "movie-seen-footer",
  "豆瓣看过"
);

bindFileInput(
  "movie-wish-file",
  STORAGE_KEYS.MOVIE_WISH,
  (data) => {
    movieWish = data;
  },
  "movie-wish-cards",
  "movie-wish-footer",
  "豆瓣想看"
);

showRandomBookmarks().catch(() => {});
loadSeries().catch(() => {});
