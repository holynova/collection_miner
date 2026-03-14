const STORAGE_KEYS = {
  BOOKMARKS: "bookmarks_flat",
  INDEX: "bookmarks_index",
  LAST_SYNC: "bookmarks_last_sync",
  STATS: "bookmark_stats",
  RECENT: "bookmark_recent_shown"
};

const RECENT_LIMIT = 60;
const MIN_BOOKMARKS_FOR_FILTER = 12;

function formatDate(ms) {
  if (!ms) return "";
  const date = new Date(ms);
  return date.toLocaleDateString();
}

function faviconUrl(url) {
  return `chrome://favicon2/?size=32&url=${encodeURIComponent(url)}`;
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
    STORAGE_KEYS.RECENT
  ]);

  return {
    bookmarks: stored[STORAGE_KEYS.BOOKMARKS] || [],
    index: stored[STORAGE_KEYS.INDEX] || {},
    stats: stored[STORAGE_KEYS.STATS] || {},
    recent: stored[STORAGE_KEYS.RECENT] || []
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

function buildCards(bookmarks, index, stats) {
  const container = document.getElementById("cards");
  const template = document.getElementById("card-template");
  container.innerHTML = "";

  for (const item of bookmarks) {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector(".card");
    const link = clone.querySelector(".title");
    const urlEl = clone.querySelector(".url");
    const pathEl = clone.querySelector(".path");
    const dateEl = clone.querySelector(".meta-date");
    const statsEl = clone.querySelector(".meta-stats");
    const favicon = clone.querySelector(".favicon");

    const title = item.title || item.url;
    const path = getPath(item.id, index);
    const record = stats[item.id] || { shows: 0, clicks: 0 };

    link.textContent = title;
    link.href = item.url;
    urlEl.textContent = item.url;
    pathEl.textContent = `文件夹: ${path}`;
    dateEl.textContent = item.dateAdded ? `添加于 ${formatDate(item.dateAdded)}` : "";
    statsEl.textContent = `展示 ${record.shows} 次 · 访问 ${record.clicks} 次`;
    favicon.style.backgroundImage = `url('${faviconUrl(item.url)}')`;

    link.addEventListener("click", async () => {
      const updated = { ...(stats[item.id] || { shows: 0, clicks: 0 }) };
      updated.clicks += 1;
      stats[item.id] = updated;
      await saveStats(stats);
    });

    container.appendChild(card);
  }
}

function renderFooter(total) {
  const footer = document.getElementById("footer");
  footer.textContent = total
    ? `当前收藏夹条目数：${total}`
    : "没有检测到书签。";
}

async function showRandomBookmarks() {
  const data = await loadData();
  const total = data.bookmarks.length;
  if (!total) {
    buildCards([], data.index, data.stats);
    renderFooter(0);
    return;
  }

  const recentSet = new Set(data.recent);
  const hasEnough = total >= MIN_BOOKMARKS_FOR_FILTER;
  const filtered = hasEnough
    ? data.bookmarks.filter((item) => !recentSet.has(item.id))
    : data.bookmarks;

  let selection = pickRandomUnique(filtered, 3);
  if (selection.length < 3) {
    const remaining = data.bookmarks.filter(
      (item) => !selection.find((picked) => picked.id === item.id)
    );
    selection = selection.concat(pickRandomUnique(remaining, 3 - selection.length));
  }

  for (const item of selection) {
    const record = data.stats[item.id] || { shows: 0, clicks: 0 };
    record.shows += 1;
    data.stats[item.id] = record;
  }

  const recent = [...data.recent, ...selection.map((item) => item.id)];
  const trimmed = recent.slice(-RECENT_LIMIT);

  await Promise.all([saveStats(data.stats), saveRecent(trimmed)]);

  buildCards(selection, data.index, data.stats);
  renderFooter(total);
}

document.getElementById("refresh-btn").addEventListener("click", () => {
  showRandomBookmarks().catch(() => {});
});

showRandomBookmarks().catch(() => {});
