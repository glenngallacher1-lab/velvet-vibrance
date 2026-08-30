/**
 * VELVET VIBRANCE — Site Backend
 *
 * Deploy this inside a Google Sheet's Apps Script editor.
 * See SETUP-EMAILS.md in this repo for step-by-step instructions.
 *
 * Endpoints (all live on the same deployed web app URL):
 *
 *   POST { form: 'subscribe', email, source? }
 *       → append to Subscribers sheet, dedupes on email
 *
 *   POST { form: 'booking', name, email, venue, city, date, type, budget, message }
 *       → append to Bookings sheet, emails owner
 *
 *   POST { form: 'contact', name, email, subject, message }
 *       → append to Contact sheet, emails owner
 *
 *   Legacy POST { email, source? }  (no `form` field)
 *       → treated as { form: 'subscribe' } for backward compatibility
 *
 *   GET  ?secret=YOUR_SECRET
 *       → returns { subscribers, bookings, contacts } JSON
 */

// ─── CONFIG ─────────────────────────────────────────────────────────
// The shared secret lives in Script Properties (Project Settings →
// Script Properties → add key "VV_SECRET"). Keeping it out of source
// means the repo can stay public without leaking the secret.
//
// OWNER_EMAIL is where booking + contact alerts are sent. If unset in
// Script Properties, defaults to velvetvibrance@gmail.com.
// ────────────────────────────────────────────────────────────────────

const SUBS_SHEET     = 'Subscribers';
const BOOKINGS_SHEET = 'Bookings';
const CONTACT_SHEET  = 'Contact';

/* Only origins in this list may POST. Add a preview/staging origin
   here if you ever deploy one. */
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

function getOwnerEmail() {
  return PropertiesService.getScriptProperties().getProperty('OWNER_EMAIL')
      || 'velvetvibrance@gmail.com';
}

/* ─── POST dispatcher ────────────────────────────────────────────── */

function doPost(e) {
  try {
    /* Origin check — reject cross-site submissions. */
    const origin = (e && e.parameter && e.parameter.origin) || '';
    if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
      return json({ ok: false, error: 'origin_denied' });
    }

    const raw = (e && e.postData && e.postData.contents) || '{}';
    const data = JSON.parse(raw);
    /* Backwards compatible: an { email, source } payload with no
       `form` field is treated as the original subscribe endpoint. */
    const form = String(data.form || (data.email ? 'subscribe' : '')).toLowerCase();

    if (form === 'subscribe') return handleSubscribe(data);
    if (form === 'booking')   return handleBooking(data);
    if (form === 'contact')   return handleContact(data);

    return json({ ok: false, error: 'unknown_form' });
  } catch (err) {
    return json({ ok: false, error: 'server_error', detail: String(err) });
  }
}

/* ─── Handlers ───────────────────────────────────────────────────── */

function handleSubscribe(data) {
  const email = String(data.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'invalid_email' });
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const sheet = getOrCreateSubs_();
    const existing = readEmailColumn_(sheet);
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
}

function handleBooking(data) {
  const name    = clip_(data.name,    120);
  const email   = String(data.email || '').trim().toLowerCase();
  const venue   = clip_(data.venue,   200);
  const city    = clip_(data.city,    120);
  const date    = clip_(data.date,     40);
  const type    = clip_(data.type,     60);
  const budget  = clip_(data.budget,   60);
  const message = clip_(data.message, 4000);

  if (!name || !email || !venue || !message) {
    return json({ ok: false, error: 'missing_fields' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'invalid_email' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const sheet = getOrCreateBookings_();
    sheet.appendRow([
      new Date().toISOString(),
      name, email, venue, city, date, type, budget, message,
      'new'
    ]);
  } finally {
    lock.releaseLock();
  }

  sendOwnerEmail_(
    'New booking enquiry — ' + name + ' (' + venue + ')',
    [
      'NEW BOOKING ENQUIRY',
      '',
      'Name:    ' + name,
      'Email:   ' + email,
      'Venue:   ' + venue,
      'City:    ' + city,
      'Date:    ' + date,
      'Type:    ' + type,
      'Budget:  ' + budget,
      '',
      'Message:',
      message,
      '',
      '— sent from velvet-vibrance.com bookings form'
    ].join('\n')
  );

  return json({ ok: true });
}

function handleContact(data) {
  const name    = clip_(data.name,    120);
  const email   = String(data.email || '').trim().toLowerCase();
  const subject = clip_(data.subject,  60);
  const message = clip_(data.message, 4000);

  if (!name || !email || !message) {
    return json({ ok: false, error: 'missing_fields' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'invalid_email' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const sheet = getOrCreateContact_();
    sheet.appendRow([
      new Date().toISOString(),
      name, email, subject, message,
      'new'
    ]);
  } finally {
    lock.releaseLock();
  }

  sendOwnerEmail_(
    'New contact message — ' + name + ' (' + (subject || 'general') + ')',
    [
      'NEW CONTACT MESSAGE',
      '',
      'Name:     ' + name,
      'Email:    ' + email,
      'Subject:  ' + subject,
      '',
      'Message:',
      message,
      '',
      '— sent from velvet-vibrance.com contact form'
    ].join('\n')
  );

  return json({ ok: true });
}

/* ─── GET — admin dashboard fetch ────────────────────────────────── */

function doGet(e) {
  const provided = (e && e.parameter && e.parameter.secret) || '';
  let expected;
  try { expected = getSecret(); }
  catch (err) { return json({ ok: false, error: 'server_misconfigured' }); }
  if (provided !== expected) {
    return json({ ok: false, error: 'unauthorized' });
  }

  return json({
    ok: true,
    subscribers: readSubscribers_(),
    bookings:    readBookings_(),
    contacts:    readContacts_()
  });
}

/* ─── Sheet helpers ─────────────────────────────────────────────── */

function getOrCreateSubs_() {
  return getOrCreateSheet_(SUBS_SHEET,
    ['timestamp', 'email', 'source']);
}
function getOrCreateBookings_() {
  return getOrCreateSheet_(BOOKINGS_SHEET,
    ['timestamp', 'name', 'email', 'venue', 'city', 'date', 'type', 'budget', 'message', 'status']);
}
function getOrCreateContact_() {
  return getOrCreateSheet_(CONTACT_SHEET,
    ['timestamp', 'name', 'email', 'subject', 'message', 'status']);
}

function getOrCreateSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readEmailColumn_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 2, lastRow - 1, 1)
    .getValues()
    .map(r => String(r[0] || '').toLowerCase())
    .filter(Boolean);
}

function readSubscribers_() {
  const sheet = getOrCreateSubs_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, 3).getValues()
    .map(r => ({
      timestamp: cellToIso_(r[0]),
      email: String(r[1]),
      source: String(r[2] || '')
    }))
    .filter(s => s.email);
}

function readBookings_() {
  const sheet = getOrCreateBookings_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, 10).getValues()
    .map(r => ({
      timestamp: cellToIso_(r[0]),
      name:    String(r[1] || ''),
      email:   String(r[2] || ''),
      venue:   String(r[3] || ''),
      city:    String(r[4] || ''),
      date:    String(r[5] || ''),
      type:    String(r[6] || ''),
      budget:  String(r[7] || ''),
      message: String(r[8] || ''),
      status:  String(r[9] || 'new')
    }))
    .filter(b => b.email);
}

function readContacts_() {
  const sheet = getOrCreateContact_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, 6).getValues()
    .map(r => ({
      timestamp: cellToIso_(r[0]),
      name:    String(r[1] || ''),
      email:   String(r[2] || ''),
      subject: String(r[3] || ''),
      message: String(r[4] || ''),
      status:  String(r[5] || 'new')
    }))
    .filter(c => c.email);
}

/* ─── Utilities ─────────────────────────────────────────────────── */

function cellToIso_(v) {
  return v instanceof Date ? v.toISOString() : String(v);
}
function clip_(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max);
}
function sendOwnerEmail_(subject, body) {
  /* Wrapped in try — an email quota exhaustion should not fail the
     form submission. The row already landed in the Sheet. */
  try {
    MailApp.sendEmail(getOwnerEmail(), subject, body);
  } catch (err) {
    /* Log to Apps Script execution log; visitor sees success anyway. */
    console.error('[owner-email] failed:', err);
  }
}
function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
