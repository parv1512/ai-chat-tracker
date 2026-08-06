(function () {
  const PLATFORM = 'claude';

  function scrapeChats() {
    // Claude's sidebar renders chat links as <a href="/chat/<id>">Title</a>.
    // We key off the href pattern rather than CSS classes since classes
    // are far more likely to change between UI updates.
    const links = Array.from(document.querySelectorAll('a[href^="/chat/"]'));
    const seen = new Set();
    const chats = [];

    for (const link of links) {
      const href = link.getAttribute('href');
      if (!href || seen.has(href)) continue;
      const title = (link.textContent || '').trim();
      if (!title) continue;
      seen.add(href);
      chats.push({ id: href, title });
    }
    return chats;
  }

  function send(chats) {
    chrome.runtime.sendMessage({ type: 'CHAT_UPDATE', platform: PLATFORM, chats });
  }

  let debounceTimer = null;
  function debouncedScrapeAndSend() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const chats = scrapeChats();
      if (chats.length > 0) send(chats);
    }, 800);
  }

  // Initial scrape after the single-page app has had time to render.
  setTimeout(debouncedScrapeAndSend, 1500);

  // Re-scrape whenever the sidebar DOM changes (new chat, deleted chat, etc.)
  const observer = new MutationObserver(debouncedScrapeAndSend);
  observer.observe(document.body, { childList: true, subtree: true });
})();
