# GameBreak 3.0 — Connected worlds

This release connects the existing ten-game library through five primary destinations: Home, Games, Guides, Tools and My. The Figma mobile prototype's existing “Your next move” link opens `/explore/`, now the world-selection workspace.

## Player experience

- Ten game palettes and artwork within one navigation and spacing system.
- A world-selection page with game, platform, Minecraft edition and optional personal build context. Java is never offered as a mobile session.
- Contextual guide, encyclopedia, tool and personal-plan links. Supported encyclopedia entries preselect their corresponding tool inputs.
- Resume the first unread guide step, favourite a game tool, and find saved plans and followed-guide updates from My.
- Original Pip helper with a dismiss / restore preference.
- Reference pages link to existing reviewed handbook relationships and practical tools. Coverage remains explicitly selected, not a claim of a complete wiki.

## Useful 3D

- Ten original GLB models retain drag, keyboard rotation, zoom and fullscreen.
- Exploded view and three-stage geometry assembly.
- Low-power, high-quality and static artwork modes; static mode skips the 3D engine/model request when selected before entry.
- Three-panel prepare / try / check summaries, a step reader, source link and saved checklist connect each model to its related guide.
- Mobile controls put the model before expanded reference details. The mobile homepage retains its single-phone-screen layout.

## Evidence and data

- Twenty priority playtests, two per game, with a private notebook, date/build/platform/result validation and JSON export. Explicit submission passes a draft to the moderated contribution form.
- Version-specific player questions and chosen public nicknames. Pending submissions remain private. Editor responses and approval are separate from a guide's gameplay status.
- Source desk shows dataset scope, count, last-success time, snapshot/live/fallback state and browser-local semantic differences.
- Shared editor API monitor accepts only configured public endpoints. It records a baseline, detects subsequent semantic changes, retains successful data metadata on provider failure, and requires a review note against the current fingerprint. Checks are on demand, not scheduled.
- New D1 migration adds provider checks and a public nickname column. No user data is deleted or made public by the migration.

## Verification

57 automated tests cover existing data/tools, privacy, moderation, conflicts, context filtering, resume state, evidence validation, source-change detection and failure retention. UI checks cover desktop and 390 × 844 mobile, guide → checkpoint → exact step, tool favourites, API refresh, 3D assembly/explosion/static/fullscreen and version separation. Local asset audit: 3,521 references, no missing local files.

Gameplay has not been performed by this software test. All 150 bundled guides remain Unverified; source retrieval or a personal draft does not change this status. Six starter reference collections remain selected coverage. Device-only notes, favourites and settings are labelled as such; existing Playbook cloud sync remains optional.
