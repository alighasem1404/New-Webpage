# Automatic Kickstarter campaign figures

The homepage and Projects page now read public campaign snapshots from
`projects/data/campaign-stats.json`. The background updater reads Kickstarter's
official embeddable cards for each live project's existing campaign link. It
extracts the public funding percentage, backer count, closing date, and campaign
state. No account, API key, browser cookies, or paid service is required.

## Enable on cPanel hosting

1. Upload the modified public pages, both project scripts, the statistics JSON,
   and `dashboard/tasks/` including its `.htaccess`. Keep the existing dashboard
   authentication intact. The task runs from the command line and needs no web
   access to the dashboard.
2. Confirm Python **3.9 or newer** is available on the hosting account. The
   updater uses only Python's standard library. The hosting account must be able
   to make HTTPS requests to `www.kickstarter.com` and write to `projects/data/`.
3. In cPanel **Cron Jobs**, choose **Once Per 15 Minutes** and use this command,
   replacing `ACCOUNT` and, if needed, the Python path with the values supplied
   by your host:

   ```sh
   /usr/bin/python3 /home/ACCOUNT/public_html/dashboard/tasks/sync_campaigns.py
   ```

   This is an example hosting path; it has not been verified against your account.
   Run the command once in cPanel Terminal first. It should report the number of
   refreshed campaigns and zero errors. Keep cron email enabled initially so
   source/layout changes or blocked requests are visible to the site owner.
4. Open `https://verseluft.com/projects/data/campaign-stats.json` and verify each
   campaign's `updatedAt` changes after the next scheduled run. Then check the
   public cards. Hover over a card's figures to see their last successful check.

Uploading the files alone provides the included snapshot. It does **not** create
the hosting cron job. No production schedule or deployment has been configured
from this local workspace.

## Local preview

Run once from the project folder:

```sh
python dashboard/tasks/sync_campaigns.py
```

For ongoing local updates while the preview is running:

```sh
python dashboard/tasks/sync_campaigns.py --watch
```

Watch mode refreshes every 15 minutes until the process is stopped. It is not a
Windows startup task and does not continue after the computer or process stops.

## Display and failure behavior

- The page checks the local snapshot on load, every five minutes while visible,
  and when returning to the tab after five minutes. It never requests Kickstarter
  directly from a visitor's browser.
- Days remaining are calculated from the actual closing timestamp, rounding down
  to match Kickstarter, and updated every minute while the page is open. The final
  day shows remaining hours, then minutes. Closed/canceled campaigns display
  **Ended** rather than an old “days to go” value.
- Percentage funding follows the widget's whole-number display, rounding down.
- If one campaign fails to refresh, its last successful snapshot and timestamp
  are retained. Other campaigns can still refresh. If all fail, the cache is
  left unchanged. Failures are reported to cron/local logs with a nonzero exit.
- Writes are atomic, and an OS file lock prevents overlapping updater runs.
- The updater validates campaign URLs, values, dates, response size, and redirects.
  It only requests public card URLs on Kickstarter. It stops normally on blocked
  or unsupported responses; it does not bypass access challenges.
- Snapshots match the complete campaign URL, excluding tracking parameters.
  Changing a project's link cannot reuse the previous campaign's figures.
- The project dashboard's manually entered numbers remain a fallback when no
  valid snapshot is available. The sync never rewrites project descriptions,
  images, links, or other dashboard data.

The widget is an HTML source, not a guaranteed data API. Its markup or access
policy can change. The fallback behavior avoids blanking the cards, but someone
must investigate cron errors to restore fresh funding/backer figures.

## Verification

```sh
python -m unittest discover -s tests -p "test_campaign_sync.py"
node --test tests/campaign-stats.test.cjs
```

These checks cover cache preservation, partially failed updates, URL restrictions,
invalid widget data, atomic-write failure, overlapping runs, deadline transitions,
and matching campaign snapshots to the correct card.
