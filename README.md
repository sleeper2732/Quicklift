# QuickLift Log (PWA)

A tiny, offline-first workout logger you can install on your phone. AM (strength) + PM (explosive) plan preloaded, plus simple progress charts (estimated 1RM).

## Deploy to GitHub Pages (no code required)

1. **Create a new repository** on GitHub (e.g., `quicklift-log`). Keep it **Public**.
2. Click **Add file → Upload files** and upload *all files from this folder* (or upload the ZIP and then “Extract” locally and drag-drop the contents).
   - Ensure the files live at the **root** of the repo (so `index.html` is in the root).
3. **Commit** to the `main` branch.
4. Go to **Settings → Pages → Build and deployment**.
   - **Source:** *Deploy from a branch*
   - **Branch:** `main` / **root**
   - Click **Save**.
5. Wait ~1 minute. Your site will appear at: `https://<your-username>.github.io/<your-repo>/`

## Install on iPhone (Home Screen)

1. Open your Pages URL in **Safari**.
2. Tap the **Share** icon → **Add to Home Screen**.
3. Launch from the icon; it’ll work offline after the first load.

## How to use

- **Plan tab:** Edit your Mon–Fri AM/PM plan. Rest timer reads e.g. `rest 120` from targets.
- **Today tab:** Pick date + session, select exercise, log sets (weight, reps, RPE, notes).
- **History tab:** See recent entries (filter by exercise).
- **Charts tab:** Choose an exercise to see estimated 1RM trend (Epley: weight × (1 + reps/30)).
- **Export/Import:** Back up to JSON and restore on any device.

## Updating the app

- Just commit new files to `main`; Pages redeploys automatically.
- If you change core files and don’t see updates, bump the cache name in `service-worker.js` (e.g., change `quicklift-v1` to `quicklift-v2`) to force a fresh download.

## Troubleshooting

- **Install button doesn’t show:** Make sure you’re on the GitHub Pages URL (HTTPS) and not opening `index.html` from local files.
- **Blank/old version after update:** iOS may cache aggressively—pull-to-refresh or bump the `CACHE` version in `service-worker.js`.
- **No charts:** Log sets for that exercise first; the chart uses your best estimated 1RM per day.

---

_All data is stored locally in your browser via `localStorage`._
