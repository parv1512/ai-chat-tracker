const SERVER_URL = 'http://localhost:4795/update';

function getOrCreateProfileId(callback) {
  chrome.storage.local.get(['profileId'], (res) => {
    if (res.profileId) return callback(res.profileId);
    const id = crypto.randomUUID();
    chrome.storage.local.set({ profileId: id }, () => callback(id));
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== 'CHAT_UPDATE') return;

  // profileId is generated once per extension install (i.e. once per Chrome
  // profile) and never changes. This is what the server uses to tell
  // profiles apart, so two profiles can never collide or overwrite each
  // other even if they share a label or have no label set yet.
  getOrCreateProfileId((profileId) => {
    chrome.storage.local.get(['profileLabel'], (res) => {
      fetch(SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          profileLabel: res.profileLabel || '',
          platform: message.platform,
          chats: message.chats
        })
      }).catch(() => {
        // Local server isn't running — fail silently for the PoC.
      });
    });
  });
});
