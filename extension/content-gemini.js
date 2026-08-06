(function () {
  const PLATFORM = 'gemini';

  function scrapeChats() {
    // Gemini's history sidebar isn't built from simple <a href> links the
    // way Claude/ChatGPT are, so this is best-effort. We try a couple of
    // selector strategies and fall back gracefully. If this comes up empty
    // in your dashboard, open devtools on gemini.google.com, inspect a
    // sidebar chat entry, and we can tighten this selector.
    let nodes = Array.from(
      document.querySelectorAll('[data-test-id="conversation"], [data-test-id*="conversation-title"]')
    );
    if (nodes.length === 0) {
      nodes = Array.from(document.querySelectorAll('a[href*="/app/"]'));
    }

    const seen = new Set();
    const chats = [];

    nodes.forEach((node, i) => {
      const title = (node.textContent || node.getAttribute('aria-label') || '').trim();
      if (!title) return;
      const id = node.getAttribute('href') || node.getAttribute('data-id') || `${PLATFORM}-${i}-${title}`;
      if (seen.has(id)) return;
      seen.add(id);
      chats.push({ id, title });
    });

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

  setTimeout(debouncedScrapeAndSend, 2000);

  const observer = new MutationObserver(debouncedScrapeAndSend);
  observer.observe(document.body, { childList: true, subtree: true });
})();
