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
2. **Before pasting**, edit the line near the top:

   ```
   const SECRET = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';
   ```

   Replace the placeholder with a long random string you generate. Anything unguessable works — use a password generator, or mash your keyboard. Save that string somewhere; you will paste it into admin.html in a moment.

3. Copy the entire edited file.
4. Paste it into the Apps Script editor (replacing anything that was there).
5. Click the **floppy disk icon** to save. Name the project **Velvet Vibrance Backend**.

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

### `admin.html` (admin view)

Search for this block:

```js
window.VV_ADMIN_ENDPOINT = 'PASTE_YOUR_APPS_SCRIPT_URL_HERE';
window.VV_ADMIN_SECRET   = 'PASTE_SAME_SECRET_AS_IN_WEBAPP_GS';
```

Replace both placeholders. `VV_ADMIN_ENDPOINT` is the same Web app URL. `VV_ADMIN_SECRET` is the random string you set in step 3.

Save both files, commit, push. Live.

---

## How it works

- Visitors type their email into **Join the Frequency**, form POSTs to your Apps Script, the script appends a row to the Sheet with timestamp, email, and source. Duplicates are silently ignored.
- Admin opens the **Subscribers** tile and sees two lists:
  - **Recent** — everyone from the last 7 days.
  - **Archive** — everyone older than 7 days.
- Emails move from Recent to Archive automatically based on their timestamp. Nothing is ever deleted from the Sheet.
- Copy All button on each list drops the emails into your clipboard, one per line, ready to paste into BCC of Gmail or into any newsletter tool.

## Security note

The admin secret is stored in `admin.html` source. Anyone who guesses or discovers the admin URL and views source can read the emails. Realistic threat for a small collective site is low. If you ever need stronger auth on the list, tell me and I will wire a proper serverless proxy.

## Troubleshooting

- **Form says SETUP PENDING:** `VV_ENDPOINT` in `index.html` still holds the placeholder text.
- **Admin says "Backend not configured":** one of the two placeholders in `admin.html` was not replaced.
- **Admin says "Fetch failed: HTTP 401 / unauthorized":** the secret in `admin.html` does not match the SECRET constant in the Apps Script.
- **Admin says "Fetch failed: HTTP 403":** the web app was deployed with restricted access. Redeploy with **Who has access: Anyone**.
- **Form works but nothing appears in the Sheet:** open the Apps Script editor, click **Executions** in the left sidebar, find the failed run, read the error. Usually a syntax typo in the pasted code.
- **You edited `WEBAPP.gs` after deploying:** Apps Script changes do not go live until you **Deploy → Manage deployments → pencil (edit) → Version: New version → Deploy**. This is a Google quirk.
