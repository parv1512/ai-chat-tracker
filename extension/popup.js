const input = document.getElementById('label');
const status = document.getElementById('status');
const idRow = document.getElementById('idRow');
const SERVER_URL = 'http://localhost:4795/label';

function getOrCreateProfileId(callback) {
  chrome.storage.local.get(['profileId'], (res) => {
    if (res.profileId) return callback(res.profileId);
    const id = crypto.randomUUID();
    chrome.storage.local.set({ profileId: id }, () => callback(id));
  });
}

getOrCreateProfileId((profileId) => {
  idRow.textContent = 'Profile ID: ' + profileId.slice(0, 8);
  chrome.storage.local.get(['profileLabel'], (res) => {
    if (res.profileLabel) input.value = res.profileLabel;
  });
});

document.getElementById('save').addEventListener('click', () => {
  const val = input.value.trim();
  status.textContent = 'Saving...';

  getOrCreateProfileId((profileId) => {
    chrome.storage.local.set({ profileLabel: val }, () => {
      fetch(SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, label: val })
      })
        .then(() => { status.textContent = 'Saved.'; })
        .catch(() => { status.textContent = 'Saved locally (start the server to sync).'; });
    });
  });
});
