# AI Chat Tracker — Proof of Concept

Tracks Claude, ChatGPT, Gemini, and Grok chat lists across as many labeled
Chrome profiles as you install the extension in, grouped into one section
per platform on the dashboard.

## Renaming a profile

Two ways:
- **On the dashboard**, hover a card and click the ✎ icon next to its name, type a label, press Enter (or click away to save).
- **In the extension popup**, type a label and click Save.

Either way writes straight to the server and is now the permanent label —
the background scraper will never overwrite it again.

## Platform notes

- **Claude, ChatGPT & Grok** — all render chat history as plain `<a href>`
  links, so scraping is reliable.
- **Gemini** — best-effort. Its sidebar isn't built the same simple
  link-based way, so if a profile shows 0 chats after visiting the site,
  open devtools on gemini.google.com, right-click a sidebar chat entry →
  Inspect → Copy outerHTML on the highlighted element, and send that over —
  same fix we just did for Grok.

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

## A note before you publish

Scraping web UIs (as the content scripts do) isn't something any of these
platforms officially support — it works by reading their current page
markup, which can change without notice and break the scraper. Worth a
line in your repo/post so people set expectations accordingly.

## If you're updating from a previous version

The way profiles are identified has changed (see below), so the old
`server/data.json` is no longer compatible — delete it if it still exists
before starting the server again (a fresh one will be created automatically).
You don't need to reinstall the extension in profiles that already have it,
but reload `claude.ai` once in each so it picks up the updated `background.js`.

**Why profiles weren't showing up before:** the server was identifying
profiles by the label you typed in the popup. If a profile's label was
empty or matched another profile's label, its data silently overwrote the
other one instead of appearing separately. Now each installed extension
generates a permanent random ID the first time it runs (visible in the
popup as "Profile ID"), and the server uses *that* to tell profiles apart.
The label is just a display name now — you can leave it blank, change it,
or have two profiles share one, and they'll still show up as separate
cards.

This PoC tracks your Claude.ai chat list from **one Chrome profile** and shows it
on a local dashboard. If this works well, the same pattern extends to more
profiles and platforms (ChatGPT, Gemini, Grok).

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

## Next steps once this checks out

- Add content scripts for ChatGPT, Gemini, Grok.
- Add "recently added / removed" badges to the dashboard.
- Optionally switch dashboard refresh from polling to a WebSocket push.
