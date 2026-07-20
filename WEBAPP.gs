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

// ─── EDIT THIS BEFORE DEPLOYING ─────────────────────────────────────
// Change to a long random string. This same value must be pasted into
// admin.html's window.VV_ADMIN_SECRET so the admin can read the list.
const SECRET = '[REDACTED_SECRET_ROTATED]';
// ────────────────────────────────────────────────────────────────────

const SHEET_NAME = 'Subscribers';

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) || '{}';
    const data = JSON.parse(raw);
    const email = String(data.email || '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ ok: false, error: 'invalid_email' });
    }

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
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'server_error', detail: String(err) });
  }
}

function doGet(e) {
  const provided = (e && e.parameter && e.parameter.secret) || '';
  if (provided !== SECRET) {
    return json({ ok: false, error: 'unauthorized' });
  }
  const sheet = getOrCreateSheet();
  if (sheet.getLastRow() < 2) {
    return json({ ok: true, subscribers: [] });
  }
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
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
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 2, sheet.getLastRow() - 1, 1)
    .getValues()
    .map(r => String(r[0] || '').toLowerCase())
    .filter(Boolean);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
