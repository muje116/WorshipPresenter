# WorshipOS UI Revamp Implementation Plan (Screen-by-Screen)

## Objective
Revamp the operator UI to match the attached wireframes in `_wireframes_zip/stitch_worship_media_presenter`, while preserving WorshipOS feature scope and Electron architecture.

## Source Wireframes
- `main_presentation_console_1..3`
- `resource_library_1..2`
- `song_slide_editor_1..2`
- `song_slide_editor_with_background_manager`
- `bible_search_1..2`
- `media_gallery`
- `media_gallery_with_folders_1..3`
- `display_settings_1..2`
- `display_settings_with_canvas_scaling`
- Design system reference: `sanctuary_pro/DESIGN.md`

## Canonical Screen Set (for implementation)
Use these as base targets:
1. Main Presentation Console: `main_presentation_console_3`
2. Resource Library: `resource_library_2`
3. Song/Slide Editor: merge `song_slide_editor_2` + `song_slide_editor_with_background_manager`
4. Scripture Management: `bible_search_2`
5. Media Gallery: merge `media_gallery_with_folders_3` + `media_gallery`
6. Display Settings: merge `display_settings_2` + `display_settings_with_canvas_scaling`

## Shared UI Foundation
Implement first, then screen work:
1. Theme tokens from `DESIGN.md` as CSS vars:
- surfaces: `surface`, `surface-container-low`, `surface-container`, `surface-container-high`, `surface-container-highest`
- text: `on-surface`, `on-surface-variant`
- accent: `primary`, `primary-container`, `tertiary`, `tertiary-container`
2. Typography:
- Headline: `Manrope`
- Body/UI: `Inter`
3. Layout shell:
- Left nav rail (fixed)
- Top command bar (contextual tabs + quick actions)
- 3-column content composition where applicable
4. Component primitives:
- `Panel`, `SectionHeader`, `Pill`, `Chip`, `IconButton`, `GradientButton`, `MediaCard`, `InspectorCard`
5. Motion:
- subtle hover elevation
- live pulse indicator
- stage transitions (fade/slide)

## Screen-by-Screen Plan

### 1) Main Presentation Console
Wireframe: `main_presentation_console_3`

Build:
1. Left sidebar with app sections + `Go Live`.
2. Top bar tabs: `Preview`, `Live`, `Stage Display`.
3. Column A: Order of Service list:
- active item state, next item state, timing labels
- drag-reorder integration with current schedule store
4. Column B: Preview monitor card:
- non-live editable preview
- quick `Edit` action
5. Column C: Live monitor card:
- on-air pill, running timer, media transport overlay
6. Lower stage/utility strip:
- output routing quick actions
- live status summaries

Data mapping:
- `schedule`, `currentSlide`, `liveSlide`, output state snapshot

Acceptance:
- Black/Logo/Clear always visible and functional
- current/next schedule transitions visible with no layout jump

### 2) Resource Library
Wireframe: `resource_library_2`

Build:
1. Left library filters:
- categories with counts (`Songs`, `Bibles`, `Media`, `Videos`, `Backgrounds`)
- tag chips
2. Main grid:
- bento media cards with hover overlays
- 'Live' highlighted card style
3. Toolbar:
- search
- sort
- grid/list toggle
4. Import CTA block:
- media import
- batch metadata application entry point

Data mapping:
- songs, bible assets, media assets, tags

Acceptance:
- category switching updates results and counts
- live card state mirrors current live source

### 3) Song/Slide Editor
Wireframes: `song_slide_editor_2` + `song_slide_editor_with_background_manager`

Build:
1. Slide sequence lane:
- verse/chorus/bridge blocks
- reorder and active selection
2. Center stage canvas:
- lyric render with typography controls
- live tag and undo/redo actions
3. Right inspector:
- typography controls (typeface, size, weight, alignment)
- background manager tabs (`Media`, `Gradient`, `Color`)
- opacity/blur controls
- quick background picker
4. Save actions:
- save template
- apply to current service item

Data mapping:
- song sections, theme overrides, background asset assignment

Acceptance:
- preview reflects inspector changes immediately
- go-live action sends selected slide + style to outputs

### 4) Scripture Management
Wireframe: `bible_search_2`

Build:
1. Explorer pane:
- OT/NT tree
- book selection
2. Main pane:
- reference search input (`Genesis 1:1` style)
- translation selector
- chapter grid
- verse content reader with selectable verses
3. Inspector pane:
- selected verse card
- copy/share/edit theme
- send-to-projector action
4. Dual translation mode:
- side-by-side verse render in inspector and projection preview

Data mapping:
- `bibles`, `verses`, translation state, verse selections

Acceptance:
- search, chapter select, and verse select are keyboard-friendly
- selected verse can be sent live in one action

### 5) Media Gallery (with folders)
Wireframes: `media_gallery_with_folders_3` + `media_gallery`

Build:
1. Left pane:
- media type filters (`Images`, `Videos`, `Backgrounds`, `Loops`)
- folder tree and quick create/import actions
- trash/archive access
2. Main content:
- asset search
- grid/list toggle
- sort selector
- folder cards + media cards mixed view
3. Right inspector:
- asset metadata
- preview
- actions (`Set as Background`, `Add to Schedule`, `Delete`)
4. Selection model:
- single select now
- extensible multi-select command bar

Data mapping:
- media assets + folder relationships

Acceptance:
- import flow works with no direct renderer Electron access
- folder navigation updates grid and inspector consistently

### 6) Display Settings
Wireframes: `display_settings_2` + `display_settings_with_canvas_scaling`

Build:
1. Output list/cards:
- Primary/Extended/Stage cards with resolution and role
- active output indicator
2. Canvas layout visualizer:
- ratio presets (`16:9`, `4:3`, `21:9`, `FREE`)
- draggable handles (MVP can be simulated controls first)
3. Output details panel:
- resolution edit
- aspect ratio select
- overscan slider
- output hardware selector
4. Action bar:
- `Reset to Default`
- `Apply Changes`

Data mapping:
- output look config, geometry settings, logical routing

Acceptance:
- applying settings updates operator previews and output windows
- output role changes persist in settings store

## Delivery Phases
1. Phase 1: Design token + shell refactor (global)
2. Phase 2: Main console + instant transition controls polish
3. Phase 3: Song/Slide editor + background manager
4. Phase 4: Scripture management UI upgrade
5. Phase 5: Media gallery with folders
6. Phase 6: Display settings + canvas controls
7. Phase 7: QA pass (responsive behavior, keyboard shortcuts, visual parity)

## Technical Notes for Implementation
1. Keep one React app shell with routed workspaces (`songs`, `bibles`, `media`, `settings`, `live`).
2. Use shared reusable components for consistency and speed.
3. Ensure output windows remain stateless render targets receiving serialized state.
4. Preserve `BLACK`, `LOGO`, `CLEAR` as always-present high-priority actions.
5. Match wireframe visual language:
- no heavy divider lines
- tonal layering and glass panels
- compact uppercase labels for status/meta
- premium dark navy palette
