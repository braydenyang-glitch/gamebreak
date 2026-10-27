# GameBreak — GitHub + Vercel edition

Brayden Yang’s multilingual gaming PWA: English, Traditional Chinese and Japanese; ten game hubs, guides, searchable encyclopedia, interactive tools, 3D exhibits and offline packs.

## Deployment

- GitHub source: https://github.com/braydenyang-glitch/gamebreak
- Existing cloud workspace: https://gamebreak-brayden.yenhui.chatgpt.site
- Vercel production URL: see the repository About link after deployment.
- Figma: https://www.figma.com/design/l8cULW8nKtf5J3DPZS1r02

Use Node 22.13 or newer. No install step is needed for the Vercel build because browser assets are checked in and the content pipeline uses Node built-ins.

```sh
npm run build:vercel
npm test
npm run dev:vercel
```

The local preview runs at http://127.0.0.1:4175. On Vercel, import this repository with the Other framework preset. `vercel.json` supplies the install/build commands; the build emits the documented Build Output API v3 layout. The build creates 840 direct page entries, server-rendered metadata for 6,033 encyclopedia entries in three languages, static assets and one Node function. Set `GAMEBREAK_PUBLIC_ORIGIN` if using a custom domain; otherwise the build uses Vercel’s production domain environment variable.

## What is hosted where

Vercel serves the frontend, images, downloads, PWA assets and deep wiki pages. The server function connects a fixed allowlist of public API reads and the public reference refresh to the existing GameBreak backend. It never forwards browser cookies, authorization or Sites identity headers. If the upstream provider is unavailable, the application can use its dated local reference snapshots.

Bookmarks, tool plans, notes and checklists work locally on each device. ChatGPT sign-in, cross-device cloud sync, reports and editorial writes remain in the original cloud workspace. The Playbook links there explicitly. Device storage is scoped to each domain: download a backup to transfer progress. This deployment does not copy the private D1 database or impersonate cloud accounts.

## Source and asset credits

Game titles, game art and provider datasets retain their original owners and licenses. Credits and source links are shown in the application and in the checked-in asset/license files. This student project is not an official game service. The reference dataset is selected and dated; it is not a promise of complete or current gameplay coverage. Gameplay verification labels remain unchanged.

Deployment implementation: `deployment/vercel/runtime.mjs`, `scripts/build-vercel.mjs`, `vercel.json`; hosting regression checks: `tests/vercel.test.mjs`.

---

The following notes describe the original Sites implementation and its evolution. Commands that use Vinext, Cloudflare D1 or Sites identity apply to that original deployment.

# GameBreak 3.0

Public site: https://gamebreak-brayden.yenhui.chatgpt.site

Brayden Yang’s student PWA. The mobile homepage evolves the editable Figma reference at https://www.figma.com/design/l8cULW8nKtf5J3DPZS1r02?node-id=17-203 and fits a 390 × 844 baseline. Its external prototype links open the real website. Figma is a design source, not a live backend.

## Connected Wiki upgrade (25 Oct 2026)

The homepage now starts with search and a ten-game library. Each game has its own theme within a shared navigation system. Reference articles provide a desktop collection sidebar, central article and source infobox; mobile layouts collapse the sidebar and keep entry actions visible. Materials/recipe tabs link supported entities to the matching tool, with Java recipes retaining PC scope. Comparisons support three items from one collection; references can be saved to a device-local shelf.

Paper/night reading controls, source dates, optional encounter-note hiding and related maps, guides and 3D exhibits are integrated. Opening an API-backed collection reads its shared snapshot once per session before using its dated local fallback. Six selected Delta Force Operations weapons add sourced family/ammunition references; no damage, current-meta or import-code claims are introduced. Coverage remains selected, and guide gameplay verification is unchanged.

Validation: 69 automated checks pass. Browser QA covered all ten hubs at 360 × 800 (six featured records and four quick links each, no horizontal page overflow), English/Traditional Chinese, 390 × 844 article reading, Nahida → material calculator, Java Crafting Table → selected recipe, Delta comparison/removal, reference bookmarks and 3D zoom. This is application QA, not peer feedback or gameplay testing.

## Visual and interactive expansion (21 Oct 2026)

- Homepage: ten selectable game themes, locally cached covers, layered 2D art, pointer parallax, compact 390 × 844 / 360 × 800 mobile layouts.
- `/playroom/`: three original six-face CSS 3D objects (pocket console, voxel island, field supply crate), drag/keyboard/slider rotation, reset, optional auto-rotation and detail hotspots.
- One source-linked knowledge challenge for each game, immediate retry/correct feedback and device-local website badges.
- Minecraft Java practice crafting grid: four source-backed shaped recipes, shifted/mirrored matching, click or drag materials, recipe hints, and real Playbook goal creation. It does not connect to a game inventory.
- Guide focus mode stays connected to existing progress checkboxes; original diagrams expand in a dismissible lightbox. EXP calculators gain linked range controls.
- Illustrated Explore and Playbook sections. English/Traditional Chinese, light/dark and reduced-motion settings remain supported. Automatic animation is opt-in and stops when hidden or when leaving the page.
- Existing guides retain their review dates and gameplay verification status. This release improves the UI; it does not claim fresh in-game playtesting or update official game builds.

## Included

- Ten game hubs, 160 sourced guides (16 each), 22 original explanatory diagrams, 40 handbook articles and 15 reference collections.
- Search, aliases, filters, paginated lists, exact locally cached reference artwork, CSV/Markdown/JSON downloads.
- Ten game tools: ascension materials, team planner, crafting and commands, story checklist, two-loadout budget, POI/wishlist, DOORS reference aid, measured training log, Brawler comparison and Echo COST budget.
- My Playbook: goals, checklists, collections, notes, favourites, recent guides, backups and optional account sync.
- Ten downloadable game packs with progress, size/date, update and removal. Pack replacement preserves the old copy if a download fails.
- Source/update centre, private authenticated feedback, editor-only drafts, publication and revision history.

## Run and build

Node 22.13 or newer. Run the Sites dependency helper, then `npm run dev -- --port 5174 --hostname 127.0.0.1`. This is the official Vinext portable starter with a vanilla client in `public/`. The local sign-in adapter uses a test account. Configure the ignored `.dev.vars` with `GAMEBREAK_ADMIN_EMAILS="seedy@sites.test"` only for local editor testing.

`npm run build:content` generates downloads, immutable browser assets, 209 direct page entries, sitemap and offline pack manifests. `npm run build` also builds the Worker. `npm test` checks content, API fallbacks, image integrity, tool arithmetic, authentication, private-record ownership, revision conflicts, CSRF and editor workflows against SQLite. Apply the generated SQL once to a new local D1 database. Sites applies tracked migrations during deployment.

- `public/app.js`: client router and shared guide interaction
- `public/toolkit.js`, `tool-math.js`: ten tools and tested arithmetic
- `public/playbook.js`, `cloud.js`, `player-state.js`, `state-schema.js`: device data, account namespaces and conflict-aware sync
- `public/community.js`: source centre, reports, editor desk
- `public/offline.js`, `sw.js`: optional game packs and offline app shell
- `server/api.mjs`, `app/api/[...path]/route.ts`: authenticated JSON API
- `db/schema.ts`, `drizzle/`: D1 schema and migrations
- `public/season-one-content.js`: 75 additions researched on 20 Oct 2026

## Identity and publication

Browsing is public. Account sign-in uses Sites’ ChatGPT identity headers through the provided server helper; the client cannot choose a user ID. D1 queries scope player records and reports to the authenticated user. Mutations require same-origin JSON. Sync uses optimistic revision checks; conflicts require the player to choose a version. Data does not silently merge conflicting edits. Offline/editor API requests are never service-worker cached.

Production `GAMEBREAK_ADMIN_EMAILS` is a Sites secret containing the existing site owner’s email. It is not bundled into the browser. An authenticated reader cannot publish. `/editor/` is visible only with that role. Do not use local test identity in production configuration.

## Content and data limits

The release’s guide statuses remain Unverified unless real named-build gameplay evidence is published. Source review and gameplay testing are separate. No peer results are invented. Working/Patched edits require a platform, exact build, valid date and evidence URL. Time-limited content states its region/schedule. The ten hubs are not exhaustive current-meta encyclopedias.

Free public data: genshin-db, BrawlAPI, minecraft-data, Fortnite-API and Wikipedia. Data providers can lag; references show retrieval dates and can be refreshed. Six games use explicitly source-reviewed starter collections where there is no suitable public gameplay API. Tools do not invent DPS, game market prices or character statistics. Bundle prices are not added as individual cosmetic prices. Offline packs and Markdown downloads represent the release snapshot; previously fetched public editor revisions remain available on that browser. Fresh data requires an internet connection.

Game artwork identifies the relevant game/entity, is credited to its publisher/provider and is stored locally where available. Original diagram SVGs are explicitly labelled as schematics, not gameplay screenshots. Fonts and reading surfaces preserve a clear mobile hierarchy; game-specific accents vary by tool.

## Player base upgrade (2.2)

- `/studio/` connects recent reading, goals, the followed-guide inbox, an optional original CSS 3D room, and all ten game tools.
- A/B workbench compares four-slot Star Rail teams using the included source-linked roster, and independent Minecraft crafting plans using recursive recipe costs and starting stock. These are descriptive reference tools, not damage or optimal-build scores. Drafts are device-local; saved goals use existing Playbook sync.
- Ten mission exercises order exact steps from their linked guides. They are reading exercises, not gameplay simulations or playtests.
- Ctrl/Cmd+K searches guides, tools and included reference collections. Encyclopedia cards open accessible desktop drawers/mobile sheets with source details and material tables.
- Atlas drafts support deduplication, reorder, removal, preparation notes and a combined saved goal. Dashed lines connect known coordinates only and do not claim terrain-aware routing.
- Ten world texture systems extend the existing palette; guide focus view updates an original reading-path illustration. Publisher artwork and schematic diagrams remain labelled.
- Native dialogs restore focus; async work has bounded loading/error/retry states; newly saved goals offer undo. Phone homepage remains one screen, with Player base accessible next to world selection and in its menu.

Validation: `npm run build:content` before `npm test` (release consistency tests compare generated assets). New tests cover A/B inventory independence, alternate-form rejection, route ordering, newest-revision selection, and all ten mission source mappings.
