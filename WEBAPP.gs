/**
 * VELVET VIBRANCE — Subscribers Backend
 *
 * Deploy this inside a Google Sheet's Apps Script editor.
 * See SETUP-EMAILS.md in this repo for step-by-step instructions.
 *
 * Endpoints (both live on the same deployed web app URL):
 *   POST { email, source? }                    → append to sheet, dedupes
 *   GET  ?secret=YOUR_SECRET                   → returns full subscriber list JSON
 */

// ─── CONFIG ─────────────────────────────────────────────────────────
// The shared secret lives in Script Properties (Project Settings → Script
// Properties → add key "VV_SECRET" with the value you want). Keeping it out
// of source means the repo can stay public without leaking the secret.
// See SETUP-EMAILS.md for the one-time setup.
// ────────────────────────────────────────────────────────────────────

const SHEET_NAME = 'Subscribers';

/* Only origins in this list may POST to the subscribe endpoint. Add a
   preview / staging origin here if you ever deploy one. */
const ALLOWED_ORIGINS = [
  'https://glenngallacher1-lab.github.io',
  'http://localhost:8765',
  'http://127.0.0.1:8765'
];

function getSecret() {
  const s = PropertiesService.getScriptProperties().getProperty('VV_SECRET');
  if (!s) throw new Error('VV_SECRET script property not set');
  return s;
}

function doPost(e) {
  try {
    /* Origin check — reject cross-site submissions. `e.parameter.origin`
       is set by the join-form client; missing/mismatched origin means the
       call is coming from somewhere that isn't our site. */
    const origin = (e && e.parameter && e.parameter.origin) || '';
    if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
      return json({ ok: false, error: 'origin_denied' });
    }

    const raw = (e && e.postData && e.postData.contents) || '{}';
    const data = JSON.parse(raw);
    const email = String(data.email || '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ ok: false, error: 'invalid_email' });
    }

    /* Serialize the read-then-append so two concurrent POSTs cannot both
       bypass the dedupe check and write the same email twice. */
    const lock = LockService.getScriptLock();
    lock.waitLock(5000);
    try {
      const sheet = getOrCreateSheet();
      const existing = readEmailColumn(sheet);
      if (existing.indexOf(email) !== -1) {
        return json({ ok: true, duplicate: true });
      }
      sheet.appendRow([
        new Date().toISOString(),
        email,
        String(data.source || 'join-form').slice(0, 64)
      ]);
    } finally {
      lock.releaseLock();
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'server_error', detail: String(err) });
  }
}

function doGet(e) {
  const provided = (e && e.parameter && e.parameter.secret) || '';
  let expected;
  try { expected = getSecret(); }
  catch (err) { return json({ ok: false, error: 'server_misconfigured' }); }
  if (provided !== expected) {
    return json({ ok: false, error: 'unauthorized' });
  }
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return json({ ok: true, subscribers: [], total: 0 });
  }
  const rows = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  const subscribers = rows.map(r => ({
    timestamp: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
    email: String(r[1]),
    source: String(r[2] || '')
  })).filter(s => s.email);
  return json({ ok: true, subscribers, total: subscribers.length });
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['timestamp', 'email', 'source']);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(['timestamp', 'email', 'source']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readEmailColumn(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 2, lastRow - 1, 1)
    .getValues()
    .map(r => String(r[0] || '').toLowerCase())
    .filter(Boolean);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
