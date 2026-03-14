const STORAGE_KEYS = {
  BOOKMARKS: "bookmarks_flat",
  INDEX: "bookmarks_index",
  LAST_SYNC: "bookmarks_last_sync"
};

function flattenBookmarks(tree) {
  const flat = [];
  const index = new Map();

  function walk(node, parentId = null) {
    const id = node.id;
    const title = node.title || "";
    const url = node.url || null;
    const dateAdded = node.dateAdded || null;
    const parent = parentId || node.parentId || null;

    index.set(id, { id, title, url, parentId: parent, dateAdded });

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

  const indexObj = {};
  for (const [id, value] of index.entries()) {
    indexObj[id] = value;
  }

  return { flat, index: indexObj };
}

async function syncBookmarks() {
  const tree = await chrome.bookmarks.getTree();
  const { flat, index } = flattenBookmarks(tree);
  const now = Date.now();
  await chrome.storage.local.set({
    [STORAGE_KEYS.BOOKMARKS]: flat,
    [STORAGE_KEYS.INDEX]: index,
    [STORAGE_KEYS.LAST_SYNC]: now
  });
}

chrome.runtime.onInstalled.addListener(() => {
  syncBookmarks().catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  syncBookmarks().catch(() => {});
});

chrome.bookmarks.onCreated.addListener(() => {
  syncBookmarks().catch(() => {});
});

chrome.bookmarks.onRemoved.addListener(() => {
  syncBookmarks().catch(() => {});
});

chrome.bookmarks.onChanged.addListener(() => {
  syncBookmarks().catch(() => {});
});

chrome.bookmarks.onMoved.addListener(() => {
  syncBookmarks().catch(() => {});
});

chrome.bookmarks.onChildrenReordered.addListener(() => {
  syncBookmarks().catch(() => {});
});

chrome.bookmarks.onImportEnded.addListener(() => {
  syncBookmarks().catch(() => {});
});
