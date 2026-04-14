WorshipOS MVP - Testing Plan (Milestone 2)

- Objective
  Validate two outputs reflect operator state, IPC channels function, and basic editor state persistence.

- Scope
  - Two independent outputs mirror slide state and respond to BLACK/LOGO/CLEAR actions.
  - SQLite integration is wired (basic API surface) and accessible via IPC (db.run).
  - Schedule Builder supports drag-and-drop reordering.
  - Basic editor state (songs, schedule, theme) persists in the in-memory store (MVP). Will be migrated to SQLite in later patch.

- Test Plan
  1) Smoke test: Start app, two output windows appear and render idle slides.
  2) Output control: Click BLACK, LOGO, CLEAR on operator; verify outputs reflect BLACK and slide titles.
  3) Song editing: Add a song in the operator; verify current slide title updates and is reflected on outputs.
  4) Schedule builder: Drag & drop reorder items; ensure order updates in operator and reflected in the outputs state (e.g., upcoming slide).
  5) Theme editor: Change background/text color; verify a live preview section updates in operator and the outputs (if available).
  6) DB readiness (manual check): Use db.run via the IPC to create a simple INSERT and SELECT; verify no crashes and that SELECT returns rows.

- Requirements
  - Ensure npm install ran and dependencies installed.
  - Run npm run build-renderer before npm start to generate bundle.js.
  - Use the two outputs in Desktop to verify display fidelity.

- Exit criteria
  - All the above test steps pass consistently across a few runs.
