# Dashboard setup on cPanel

Project changes are written by `dashboard/api/projects.php` to `projects/data/projects.json`. The public homepage and `/projects/` read that same JSON file. The dashboard is deliberately denied by `dashboard/.htaccess` until you set up cPanel authentication.

1. Upload the site with the `dashboard` and `projects/data` folders kept in their current locations. Use a hosting account with PHP 8.1+ and HTTPS enabled.
2. In cPanel, open **Directory Privacy**, select the `dashboard` folder, enable password protection, and create a strong, unique admin username and password. Create only the accounts you intend to use. Do not put credentials or password hashes in the site files.
3. Let cPanel write its authentication directives into `dashboard/.htaccess`. Confirm that it contains the cPanel `AuthType`, `AuthUserFile`, and `Require valid-user` rules. Then remove the single fail-closed `Require all denied` line from this file, preserving cPanel's generated rules and `Options -Indexes`.
4. Keep the API underneath the protected `dashboard` folder. In a private browser window, confirm that `/dashboard/` and `/dashboard/api/projects.php` challenge for credentials, and that a signed-in dashboard receives project data. The PHP API also fails closed if no authenticated-user identity reaches PHP.
5. Confirm the PHP process can write `projects/data/projects.json` (commonly the site's cPanel account owns the file and folder). Keep the JSON readable by the website, but writable only by the hosting account/PHP process.
6. Sign in, edit a project, save it, then check both `/` and `/projects/`. If cPanel's PHP handler does not populate `REMOTE_USER`, do not weaken the PHP check; ask the host to pass the authenticated user to PHP or use an equivalent server-side authenticated handler.

The `projects/data/projects.json` file is intentionally public because the public site needs to read it. Do not put passwords, private notes, or unpublished secrets in project descriptions or this file.
