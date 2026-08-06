(function () {
  const PLATFORM = 'grok';
  const DEBUG = false; // flip to true if this ever needs debugging again

  function scrapeChats() {
    // Confirmed from actual grok.com markup: chat links are
    // <a href="/c/<uuid>">...<span>Title</span></a> inside the sidebar
    // menu — same link-based pattern as ChatGPT, just with the title text
    // in a child <span> rather than directly on the <a>.
    const strategies = [
      ['a[href^="/c/"]', () => document.querySelectorAll('a[href^="/c/"]')],
      ['a[href^="/chat/"]', () => document.querySelectorAll('a[href^="/chat/"]')],
      ['[role="link"][aria-label]', () => document.querySelectorAll('[role="link"][aria-label]')],
      ['a[title]', () => document.querySelectorAll('a[title]')]
    ];

    let nodes = [];
    let usedStrategy = 'none';
    for (const [name, fn] of strategies) {
      const found = Array.from(fn());
      if (found.length > 0) {
        nodes = found;
        usedStrategy = name;
        break;
      }
    }

    if (DEBUG) {
      console.log(`[AI Chat Tracker/grok] strategy used: ${usedStrategy}, nodes found: ${nodes.length}`);
    }

    const seen = new Set();
    const chats = [];

    nodes.forEach((node, i) => {
      // "See all" and similar sidebar buttons aren't <a href="/c/...">
      // elements, so the href-based strategies naturally exclude them.
      const title = (node.textContent || node.getAttribute('aria-label') || node.getAttribute('title') || '').trim();
      if (!title) return;
      const id = node.getAttribute('href') || `${PLATFORM}-${i}-${title}`;
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

  setTimeout(debouncedScrapeAndSend, 1500);

  const observer = new MutationObserver(debouncedScrapeAndSend);
  observer.observe(document.body, { childList: true, subtree: true });
})();


