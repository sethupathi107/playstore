---
last_synced_commit: 2e76847771c6408974dc012a5ac5d7876d5fbe8e
last_synced_at: 2026-09-09 (uncommitted — HEAD hasn't moved, working tree is ahead of it)
---

# Backend context — read this before scanning the repo

Playstore-clone backend: auth, apps, categories, images, download counts, plus a
role-based admin view over all of it. Node ESM ("type": "module"), Express 5,
express-validator, jsonwebtoken + bcrypt. Storage is flat JSON files in
`src/jsonfiles/` — no database.
Run: `npm run dev` (node --watch server.js) → port 8000.

**Naming note:** `src/routes/*.js` and `src/controller/*.js` were renamed to short,
identical basenames on both sides (`auth.js`, `category.js`, `download.js`, `file.js`,
`image.js`) — e.g. `src/routes/file.js` imports `src/controller/file.js`. Same
basename, different directory; don't confuse the two when navigating.

## Request flow (server.js)
1. `express.json()`
2. `/v1/sign/*` (src/routes/auth.js) mounted **before** the `auth` middleware → signup/signin/etc. are public.
3. `auth` middleware (src/middlewares/auth.js) applied to everything mounted after it — verifies `Authorization: Bearer <token>` against `JWT_SECRET` and sets `req.user = { id, email, role }` (decoded JWT payload).
4. `/v1/app`, `/v1/images`, `/v1/category`, `/v1/download` — all behind step 3, open to any authenticated user regardless of role.
5. `/v1/admin` — behind step 3 **and** `requireAdmin` (src/middlewares/requireAdmin.js), which 403s unless `req.user.role === "admin"`.

## Roles
- Every user has a `role` on their `users.json` record: `"user"` (default, set at signup) or `"admin"`.
- `role` is baked into the access token at signin/signup (`generateAccessToken` in `src/controller/auth.js`), so `requireAdmin` never touches disk.
- **No signup path creates an admin.** To promote someone, hand-edit their `role` to `"admin"` in `src/jsonfiles/users.json` — there's no secret-key flow or admin-invite endpoint (a deliberate simplification, not an oversight).
- Apps record who made them: `createApp` stamps `uploaderId: req.user.id` (ignores anything the client sends). `updateApp`/`deleteApp` are **not** restricted to the uploader or admin — any authenticated user can still edit/delete any app (only the admin activity view and the `uploaderId` field itself are new; ownership enforcement was intentionally left out of this pass).
- Downloads are logged, not just counted: every `PUT /v1/download` appends `{id, appId, userId, timestamp}` to `src/jsonfiles/downloadLogs.json` (new file) in addition to bumping `apps.json`'s `downloads` counter.

## Route map
| Mount | Route file | Method + path | Controller fn | id source | auth |
|---|---|---|---|---|---|
| /v1/sign | routes/auth.js | POST /signup | controller/auth.signup | body | public |
| /v1/sign | routes/auth.js | POST /signin | controller/auth.signin | body | public |
| /v1/sign | routes/auth.js | POST /refresh-token | controller/auth.refreshToken | body | public |
| /v1/sign | routes/auth.js | POST /logout | controller/auth.logout | body | public |
| /v1/sign | routes/auth.js | POST /logout-all | controller/auth.logoutAll | body | public |
| /v1/sign | routes/auth.js | POST /forgot-password | controller/auth.forgotPassword | body | public |
| /v1/sign | routes/auth.js | POST /reset-password | controller/auth.resetPassword | body | public |
| /v1/app | routes/file.js | GET / | controller/file.getAllApps | - | any user |
| /v1/app | routes/file.js | GET /:id | controller/file.getAppById | param | any user |
| /v1/app | routes/file.js | POST / | controller/file.createApp | body | any user (sets uploaderId) |
| /v1/app | routes/file.js | PUT / | controller/file.updateApp | **body** | any user |
| /v1/app | routes/file.js | DELETE /:id | controller/file.deleteApp | param | any user |
| /v1/images | routes/image.js | GET /:id | controller/image.getAppImages | param (appId) | any user |
| /v1/images | routes/image.js | POST /:id | controller/image.addAppImage | param (appId) | any user |
| /v1/images | routes/image.js | DELETE /:id | controller/image.deleteAppImage | param (appId) + body (imageId) | any user |
| /v1/category | routes/category.js | GET / | controller/category.getAllCategories | - | any user |
| /v1/category | routes/category.js | POST / | controller/category.createCategory | body | any user |
| /v1/category | routes/category.js | DELETE / | controller/category.deleteCategory | **body** | any user |
| /v1/download | routes/download.js | PUT / | controller/download.incrementDownload | body | any user (logs userId) |
| /v1/download | routes/download.js | GET / | controller/download.getDownloadCount | query | any user |
| /v1/admin | routes/admin.js | GET /activity | controller/admin.getActivity | - | **admin only** |

Every mutating route goes through `<xValidator>` (express-validator chain from `src/utils/validators/`, also renamed to short basenames — `auth.js`, `app.js`, `category.js`, `download.js`, `image.js`) then `validateRequest` (src/utils/validateRequest.js, formats `validationResult` errors as 400 `{message, errors:[{field,message}]}`). `/v1/admin/activity` has no validator (no input).

## Data files (src/jsonfiles/*.json — read/written whole-file on every op)
- `users.json`: `{id, name, email, password (bcrypt hash), role: "user"|"admin", refreshTokens: string[], resetToken?}`
- `apps.json`: `{id, name, category, description, downloads, uploaderId}`
- `categories.json`: `{id, name}`
- `images.json`: `{id, appId, url}`
- `downloadLogs.json` (new): `{id, appId, userId, timestamp}` — append-only, one row per download

## File map (one line each — read the file itself for details)
- `server.js` — app entry: mounts routes + `auth`/`requireAdmin` middleware, listens on 8000.
- `src/middlewares/auth.js` — JWT bearer check, hardcoded `JWT_SECRET`, sets `req.user` from the decoded token.
- `src/middlewares/requireAdmin.js` — 403s unless `req.user.role === "admin"`; must run after `auth`.
- `src/utils/validateRequest.js` — shared express-validator error formatter.
- `src/utils/validators/*.js` — per-route express-validator chains. Not itemized field-by-field here — open on demand.
- `src/controller/auth.js` — signup/signin/refreshToken/logout/logoutAll/forgotPassword/resetPassword. Signup sets `role: "user"`; access token payload includes `role`. Access token 7d, refresh token 30d, reset token 7m. Hardcoded `JWT_SECRET`/`REFRESH_SECRET`/`RESET_SECRET`.
- `src/controller/category.js` — category CRUD.
- `src/controller/file.js` — app CRUD (getAllApps/getAppById/createApp/updateApp/deleteApp) against apps.json; createApp stamps `uploaderId`.
- `src/controller/image.js` — per-app image list/add/delete against images.json.
- `src/controller/download.js` — increment/get download count on an app record in apps.json, plus appends a row to downloadLogs.json on increment.
- `src/controller/admin.js` — `getActivity`: joins apps+uploader, download logs+user/app names, and a password-stripped user list into one response. Admin-only.

## Facts worth remembering (not obvious from a quick grep)
- Auth secrets (`JWT_SECRET`, `REFRESH_SECRET`, `RESET_SECRET`) are hardcoded string literals in `middlewares/auth.js` and `controller/auth.js` — not env vars, not shared from one place (duplicated).
- `controller/file.updateApp`/`deleteApp` and `controller/category.deleteCategory` take `id` from `req.body`/`req.params` inconsistently within the same resource (updateApp: body; deleteApp: param) — pre-existing quirk, unrelated to the role work.
- No `.env` or config module exists — everything is inline constants.
- `package.json` still lists `nodemon` as a dependency but `npm run dev` uses node's built-in `--watch`.
- Refresh tokens do **not** carry `role` (only `id`/`email`) — `/refresh-token` re-reads the user from disk and re-derives role via `generateAccessToken(user)`, so a role change takes effect on next refresh even without a fresh signin.

## How this file stays useful
See `CLAUDE.md` in this directory for the sync procedure — it tells future sessions to diff against `last_synced_commit` above instead of rescanning everything.
