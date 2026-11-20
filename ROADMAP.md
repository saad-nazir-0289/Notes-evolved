# Notes Evolved Roadmap

Product direction: evolve the MERN notes app into a privacy-conscious AI Second Brain while keeping the application runnable after every increment.

**Current phase:** Phase 1 - Solid CRUD

**Security gate:** The current notes API has no authentication or per-user ownership. Treat deployments as single-user and trusted-only; do not store sensitive notes or expose it to untrusted users until JWT authentication and ownership enforcement are complete.

## Phase 0 - Foundation

- [x] Audit the existing repository, entry points, and current project structure.
- [x] Fix the development port mismatch and make rate limiting work without mandatory Upstash credentials.
- [x] Keep the existing `frontend/` and `backend/` separation; avoid a disruptive rename to `client/` and `server/`.
- [x] Document environment configuration and add a placeholder-only `.env.example`.
- [x] Add centralized error handling.
- [x] Add request input validation for note bodies and Mongo ObjectId route parameters.
- [x] Standardize API response shapes across all note endpoints.
- [x] Document setup, development, and production run instructions in the README.

## Phase 1 - Solid CRUD

- [x] Verify backend CRUD controller contracts: list, read, create, update, delete, empty lists, missing records, and storage-error forwarding.
- [ ] Verify browser-to-API CRUD flows against a running MongoDB instance.
  - [x] Exercise registered note-route middleware/controller stacks with a deterministic in-memory Note adapter across create, read, update, list, delete, validation, and response-envelope behavior.
  - [x] Prevent direct note-detail URLs from redirecting before the initial notes fetch finishes.
- [x] Add note search.
  - [x] Search note titles and descriptions case-insensitively through `GET /api/notes?q=...`.
  - [x] Bound search input length and escape regular-expression metacharacters.
  - [x] Connect the home-page search field to the API with debouncing and stale-response protection.
- [x] Add sorting.
  - [x] Sort by creation date, update date, or title in ascending or descending order.
  - [x] Validate sort fields and directions against server-side allowlists.
  - [x] Add a stable `_id` tie-breaker and connect the home-page sort control to both list and search requests.
- [x] Add pagination.
  - [x] Add accessible client-side page navigation for note lists and search results (12 notes per page).
  - [x] Add bounded server-side pagination and total-count metadata for larger collections, including search and sorting.
- [ ] Add user authentication with JWT and hashed passwords.
- [ ] Enforce per-user note ownership.
- [ ] Add pin and archive behavior.
- [ ] Improve responsive and accessible UI behavior.
- [ ] Verify loading and empty states across all CRUD flows.

## Phase 2 - Organization

- [ ] Add manual tags.
- [ ] Add folders or notebooks.
- [ ] Add a Markdown editor and preview.
- [ ] Add organization filters.
- [ ] Display useful created and updated timestamps.
- [ ] Add soft delete and a trash view.

## Phase 3 - Quality net

- [ ] Add server tests for API routes.
- [ ] Add client tests for key components.
- [ ] Add linting and formatting coverage for the full project.
- [ ] Add GitHub Actions CI for lint, test, and build.
- [ ] Add production-ready rate limiting.
- [ ] Add security headers.

## Phase 4 - AI core

- [ ] Add a provider-agnostic AI service layer configured through environment variables.
- [ ] Keep AI features disabled and the app fully usable when no provider key is configured.
- [ ] Generate note summaries asynchronously after saving.
- [ ] Suggest tags automatically.
- [ ] Let users accept or reject AI-generated output.
- [ ] Ensure note content is never sent to a provider unless the operator explicitly configures one.

## Phase 5 - Connected knowledge

- [ ] Generate and store embeddings per note.
- [ ] Add semantic search.
- [ ] Surface related notes.
- [ ] Add backlinks and `[[wiki-style]]` links.
- [ ] Add a graph view of connected notes.

## Phase 6 - Insights

- [ ] Generate a weekly digest.
- [ ] Identify topic clusters.
- [ ] Surface recurring themes.
- [ ] Detect stale notes and orphan notes.
- [ ] Add an activity and knowledge dashboard.

## Phase 7 - Assistant

- [ ] Add retrieval-augmented chat over the user's notes.
- [ ] Cite source notes in assistant answers.
- [ ] Add a daily briefing.
- [ ] Extract action items.
- [ ] Support questions such as "What did I write about X?"

## Phase 8 - Polish

- [ ] Improve performance and caching.
- [ ] Add Markdown and JSON import/export.
- [ ] Add PWA and offline support.
- [ ] Add demo seed data.
- [ ] Add current screenshots or GIFs.
- [ ] Publish a strong README and architecture documentation.

## Changelog

- 2026-11-20: Fixed production frontend asset resolution to derive from `server.js` instead of `process.cwd()`, so root-level startup and backend-directory startup both serve `frontend/dist`. Added path-resolution regression tests. Security audit found the notes API is still unauthenticated; JWT authentication and per-user ownership are prioritized before pin/archive.
- 2026-11-19: Added bounded server-side pagination (12 default, 50 maximum, 1,000,000 maximum skip), matching filtered counts, page clamping after deletions, frontend page navigation for lists and search, and direct-note fetching for deep links outside the current page.
- 2026-11-18: Added accessible client-side page navigation for sorted notes and search results, with page resets on search/sort changes and safe page adjustment after deleting the final item on a page.
- 2026-11-17: Added allowlisted server-side sorting by creation date, update date, or title; wired five sort choices into the home-page list and search requests; added validation and regression tests. Live MongoDB-backed browser CRUD verification remains pending.
- 2026-11-17: Kept the selected sort mode consistent across navigation, cancelled stale list/search requests when switching modes, and reloads the active sorted list when search is cleared.
- 2026-11-17: Refreshes the active sorted list when returning to the home page after a search session, keeping the sort selector aligned with displayed notes.
- 2026-11-15: Added bounded, case-insensitive title/description search with literal regex escaping, API validation, debounced frontend search, stale-response protection, tests, and API documentation; live MongoDB-backed browser CRUD verification remains pending.
- 2026-11-12: Extracted note-route registration and added deterministic route-stack tests for CRUD, validation, response envelopes, and missing records; live MongoDB-backed HTTP/browser verification remains pending.
- 2026-11-11: Fixed direct note-detail routes redirecting during the initial notes fetch and added frontend state-resolution tests; live MongoDB-backed browser-to-API CRUD verification remains pending.
- 2026-11-10: Expanded backend CRUD controller coverage for empty lists, missing records across read/update/delete, and database error forwarding; browser-to-API verification remains pending.
- 2026-11-09: Standardized successful and error envelopes across note endpoints, updated the frontend API adapter, and documented the contract.
- 2026-11-08: Added note request validation, strict writable-field allowlisting, ObjectId checks, shared field length limits, and Mongoose update validators.
- 2026-11-07: Added centralized Express error handling, async controller forwarding, safe client error responses, and built-in Node tests.
- 2026-11-06: Established the roadmap; aligned the backend default port with the Vite client; added optional Upstash configuration with a bounded local rate-limit fallback; documented environment setup.
