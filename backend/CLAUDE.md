# playstore/backend

Before exploring this codebase, read `CONTEXT.md` in this same directory. It already has the
route map, data model, and a one-line summary of every source file — built so a new session
doesn't need to re-read the whole tree just to get oriented.

## Staying in sync (do this instead of a full rescan)

`CONTEXT.md`'s frontmatter has `last_synced_commit`. Find what's changed since then:

```
git status --porcelain .
git diff --name-only <last_synced_commit> -- .
```

Run both from this directory — the repo root is a level up, so paths in the output are
repo-root-relative (e.g. `playstore/backend/src/...`), not relative to this folder.
Union the two lists (status catches uncommitted/untracked work, diff catches anything
already committed since the recorded commit) and only read those files. Trust CONTEXT.md
for everything else — don't re-open files it already summarizes unless your task needs
their exact contents.

If your changes touch anything CONTEXT.md describes (routes, controllers, data shape,
auth flow), update the relevant section before finishing, and bump `last_synced_commit`
to the current `git rev-parse HEAD` (or leave a note if HEAD hasn't moved because the
work is uncommitted).

Skip all of this for a trivial single-file ask — just read the file the user is pointing at.
