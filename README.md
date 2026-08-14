# AI Chat Tracker — Proof of Concept

Tracks Claude, ChatGPT, Gemini, and Grok chat lists across as many labeled
Chrome profiles as you install the extension in, grouped into one section
per platform on the dashboard.

## Starting the server automatically on login (Windows)

Instead of manually running `node server.js` every time, you can have
Windows start it silently in the background when you log in:

1. Confirm `server/start-server.vbs` exists (it's already in this repo).
2. Press **Win + R**, type `shell:startup`, press Enter. This opens your
   personal Startup folder.
3. Right-click inside that folder → **New → Shortcut**.
4. Browse to and select `start-server.vbs` inside your `server` folder,
   then finish creating the shortcut.
5. That's it — log out and back in (or restart), and the server will
   already be running at `http://localhost:4795` with no console window
   ever appearing.

**To stop it:** double-click `server/stop-server.bat` — it finds whatever
process is listening on port 4795 and kills it. (Or just restart your
laptop, since nothing here persists beyond the current boot session.)

**To check it's running:** open `http://localhost:4795` in a browser tab
any time — if the dashboard loads, the server's up.

> This only works if `node` is on your system PATH (i.e. `node -v` works
> from a regular Command Prompt). If you installed Node.js normally, it
> already is.

## Renaming a profile

Two ways:
- **On the dashboard**, hover a card and click the ✎ icon next to its name, type a label, press Enter (or click away to save).
- **In the extension popup**, type a label and click Save.

Either way writes straight to the server and is now the permanent label —
the background scraper will never overwrite it again.

## Security notes

This was audited before being made public. Fixed:
- Server now binds to `127.0.0.1` only (was previously reachable from
  anyone on the same WiFi/LAN).
- Removed the wildcard CORS header — it wasn't actually needed (the
  extension talks to the server via `host_permissions`, which bypasses CORS
  entirely; the dashboard's own requests are same-origin) and it would have
  let any website you visit read or write your tracked chat data while the
  server was running.
- `profileId` and `platform` are now validated server-side (UUID format,
  fixed platform whitelist) before being stored or rendered — closes both
  an HTML-injection path in the dashboard and a prototype-pollution path
  via object keys like `__proto__`.
- Request bodies are capped at 200KB and chat lists at 500 entries, so a
  malformed or malicious POST can't exhaust memory/disk.
- `server/data.json` — your actual chat titles — is git-ignored by default.

This is still a local personal tool, not hardened for multi-user or
internet-facing use. Don't port-forward this or expose port 4795 publicly.


## 1. Start the server

Requires Node.js (no npm packages needed — it only uses built-in modules).

```bash
cd server
node server.js
```

You should see: `AI Chat Tracker server running at http://localhost:4795`

Leave this running in a terminal.

## 2. Install the extension

1. Open `chrome://extensions` in the Chrome profile you want to track.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the `extension/` folder.
4. Click the extension's icon in the toolbar, type a label for this profile
   (e.g. "Work", "Personal"), and click **Save**.

## 3. Generate some activity

Open or reload **claude.ai** in that profile. Within a couple seconds the
extension should scrape your sidebar chat list and send it to the server.

## 4. View the dashboard

Open **http://localhost:4795** in any tab. You should see a card for your
labeled profile showing your Claude chat titles, updating automatically as
you create or delete chats (it re-scrapes on every sidebar change).

## What to check while testing

- Does the chat list in the dashboard match what you see in Claude's sidebar?
- Does starting a new chat show up within a few seconds?
- Does deleting a chat get reflected? (Currently the dashboard doesn't
  visually flag *what* was removed — that data is captured server-side in
  `lastRemoved` in `server/data.json` but not yet shown in the UI. Easy to
  surface once we're happy with the scraping accuracy.)
- Any console errors? Right-click the page → Inspect → Console, and also
  check the extension's service worker console at `chrome://extensions`
  (click "service worker" under the extension's details).

## Known limitations of this PoC (by design, for now)

- Only Claude is wired up. ChatGPT, Gemini, and Grok would each need their
  own small content script (same pattern, different selector logic).
- Only tracks one profile until you repeat step 2 in your other profiles.
- No "removed chat" indicator in the UI yet.
- Data is stored in `server/data.json` — delete it anytime to reset.
- Scraping depends on claude.ai's current DOM structure. If Anthropic
  changes the sidebar markup, the selector in `content-claude.js` may need
  a tweak.
