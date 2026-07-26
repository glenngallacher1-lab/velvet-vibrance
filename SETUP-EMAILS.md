# Subscribers Setup — Velvet Vibrance

The join form on the home page and the Subscribers view in admin.html both talk to a **Google Apps Script backend** that stores every email in a Google Sheet. Setup is free, permanent, no cap, no risk of lost emails.

Total time: about 5 minutes.

---

## 1. Create the Google Sheet

1. Go to https://sheets.google.com and click **Blank spreadsheet**.
2. Rename it **Velvet Vibrance Subscribers** (top-left).

## 2. Open the Apps Script editor

1. In the Sheet, click **Extensions → Apps Script**. A new tab opens.
2. Delete everything in the code editor (the default `myFunction` stub).

## 3. Paste the backend code

1. Open `WEBAPP.gs` from this repo.
2. Copy the entire file (no edits needed — the secret is read from a Script Property, not baked into source).
3. Paste it into the Apps Script editor (replacing anything that was there).
4. Click the **floppy disk icon** to save. Name the project **Velvet Vibrance Backend**.

## 3b. Set the shared secret in Script Properties

The Apps Script reads the secret from a project property so it never lives in source or in git.

1. In the Apps Script editor, click the **gear icon** (Project Settings) in the left sidebar.
2. Scroll to **Script Properties** and click **Add script property**.
3. Property: `VV_SECRET`
4. Value: a long random string. Generate one with `python3 -c "import secrets,string;print(''.join(secrets.choice(string.ascii_letters+string.digits) for _ in range(48)))"` or a password manager.
5. Click **Save script properties**.
6. Copy that same value — you'll paste it into `admin.html` locally in step 5 (never commit it).

## 4. Deploy as a Web App

1. Top-right of the Apps Script editor: **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and pick **Web app**.
3. Fill in:
   - **Description:** Velvet Vibrance Subscribers v1
   - **Execute as:** Me (your Google account)
   - **Who has access:** Anyone
4. Click **Deploy**.
5. Google will ask you to authorize. Click **Authorize access**, pick your Google account, click **Advanced → Go to Velvet Vibrance Backend (unsafe)**, then **Allow**. This is Google warning you that the script is unverified, which is expected because it is your own script.
6. Copy the **Web app URL** that appears. It looks like `https://script.google.com/macros/s/AKfy.../exec`.

## 5. Paste the URL and secret into the site

Two files need the URL, one file needs the secret.

### `index.html` (public form)

Find this block near the bottom:

```html
<script>
  window.VV_ENDPOINT = 'PASTE_YOUR_APPS_SCRIPT_URL_HERE';
</script>
```

Replace `PASTE_YOUR_APPS_SCRIPT_URL_HERE` with your Web app URL.

### `admin.html` (admin view — DO NOT COMMIT)

Search for this block:

```js
window.VV_ADMIN_ENDPOINT = 'PASTE_YOUR_APPS_SCRIPT_URL_HERE';
window.VV_ADMIN_SECRET   = 'PASTE_YOUR_ADMIN_SECRET_LOCALLY_DO_NOT_COMMIT';
```

Replace both placeholders with the real values. `VV_ADMIN_ENDPOINT` is the Web app URL. `VV_ADMIN_SECRET` is the `VV_SECRET` value you set in step 3b.

**Only commit the endpoint change, never the secret.** Easiest workflow:
- Edit both fields locally, test that the Subscribers view works.
- Before `git add admin.html`, revert `VV_ADMIN_SECRET` back to the placeholder string.
- Only push the endpoint change. Keep the secret pasted-only on your machine (a private note or password manager entry).

For `index.html`, the endpoint is public-safe and can be committed.

---

## How it works

- Visitors type their email into **Join the Frequency**, form POSTs to your Apps Script, the script appends a row to the Sheet with timestamp, email, and source. Duplicates are silently ignored.
- Admin opens the **Subscribers** tile and sees two lists:
  - **Recent** — everyone from the last 7 days.
  - **Archive** — everyone older than 7 days.
- Emails move from Recent to Archive automatically based on their timestamp. Nothing is ever deleted from the Sheet.
- Copy All button on each list drops the emails into your clipboard, one per line, ready to paste into BCC of Gmail or into any newsletter tool.

## Security note

The Apps Script secret lives in Script Properties (server-side) and in `admin.html` on your local machine (never committed). Anyone who obtains your local `admin.html` copy — or who watches you open the admin console — can read the list. That's an acceptable posture for one owner; if you add collaborators or expand what the sheet holds, upgrade to Cloudflare Access or a real backend.

The Apps Script `doPost` also rejects submissions that don't come from the site's own origin (via a `?origin=` param) so a random attacker page can't stuff junk into the sheet.

## Troubleshooting

- **Form says SETUP PENDING:** `VV_ENDPOINT` in `index.html` still holds the placeholder text.
- **Admin says "Backend not configured":** one of the two placeholders in `admin.html` was not replaced.
- **Admin says "Fetch failed: HTTP 401 / unauthorized":** the secret in `admin.html` does not match the SECRET constant in the Apps Script.
- **Admin says "Fetch failed: HTTP 403":** the web app was deployed with restricted access. Redeploy with **Who has access: Anyone**.
- **Form works but nothing appears in the Sheet:** open the Apps Script editor, click **Executions** in the left sidebar, find the failed run, read the error. Usually a syntax typo in the pasted code.
- **You edited `WEBAPP.gs` after deploying:** Apps Script changes do not go live until you **Deploy → Manage deployments → pencil (edit) → Version: New version → Deploy**. This is a Google quirk.
