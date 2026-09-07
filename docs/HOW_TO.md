# WorshipPresenter How To

## Projectors and External Displays

1. Connect the projector, TV, monitor, or other display to the computer.
2. Open WorshipPresenter and go to Settings.
3. Check Detected Displays.
4. Choose Go Live Here to open one fullscreen output on a selected display.
5. Choose Go Live on All Secondary to open fullscreen outputs on every non-primary display.
6. Use Show to bring a hidden output window back.
7. Use Fullscreen to toggle presentation mode.
8. Use Resize for a windowed output preview.

When an external display is detected while the app is running, WorshipPresenter automatically creates or restores a fullscreen output on that display.

## Bible Downloads and Imports

WorshipPresenter can directly download public-domain or public-use Bible JSON sources that permit redistribution. Current direct-download sources include:

- KJV: King James Version
- WEB: World English Bible
- ASV: American Standard Version
- BBE: Bible in Basic English

Some popular translations are copyrighted and require a publisher license, API key, or authorized OSIS file. The app lists them as sources, but does not download their full text directly:

- NLT: Tyndale NLT API
- NIV: Biblica/Zondervan permissions
- NKJV: HarperCollins permissions
- The Passion Translation: publisher permission
- The Message: NavPress permission
- ESV: Crossway ESV API
- Good News Translation: API.Bible / Digital Bible Library licensing

To use a licensed Bible in WorshipPresenter, get permission from the publisher or provider, then import an authorized OSIS XML file from Scripture > Import OSIS Bible.

WorshipPresenter can also try to import readable EasyWorship `.ewb` Bible files from Scripture > Import EasyWorship EWB. The importer supports the documented old EasyWorship binary Bible format and simple readable SQLite verse tables. Some purchased EasyWorship Bible plugins are protected or stored in a compressed proprietary SQLite schema; those may require an OSIS export or a licensed API instead.

## Positioning and Resizing Words

1. Open Song Editor.
2. Expand Background & Style.
3. Set Vertical Position to Top Half, Center, or Bottom Half.
4. Adjust Content Width and Content Height to resize the lyric/scripture area.
5. Set Text Alignment for left, centered, or right-aligned words.
6. Send Live to apply the layout to the projector/output windows.

Words can be shown over still images and videos. The output renderer keeps media full-screen and overlays the text area using the chosen position, width, height, font, and color.

## Building an Installer

1. Update `version` in `package.json` before each release.
2. Run `npm run build`.
3. Run `npm run dist:win` to create a Windows NSIS installer in `release`.

The About section reads the application version from Electron, which comes from `package.json`.
