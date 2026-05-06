End-to-end tests for WorshipPresenter (Playwright)

Planned core flows:
1. App launch and expected windows available (operator + 2 outputs).
2. BLACK/LOGO/CLEAR actions propagate to outputs.
3. Per-output look override applies independently.

Notes:
- Electron E2E requires launching the packaged/main process and attaching to windows.
- Add `electron.launch`-based specs once the runtime entrypoint is fully consolidated.
