(function () {
  const PLATFORM = 'chatgpt';

  function scrapeChats() {
    // ChatGPT renders history as <a href="/c/<id>">Title</a>, same
    // link-based pattern as Claude, so this should be reliable.
    const links = Array.from(document.querySelectorAll('a[href^="/c/"]'));
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

  setTimeout(debouncedScrapeAndSend, 1500);

  const observer = new MutationObserver(debouncedScrapeAndSend);
  observer.observe(document.body, { childList: true, subtree: true });
})();
