import React from 'react'

type Props = {
  appVersion: string
  displayCount: number
  outputCount: number
}

const bibleSources = [
  ['KJV', 'Direct download in the app'],
  ['WEB', 'Direct download in the app'],
  ['ASV', 'Direct download in the app'],
  ['NLT', 'Use the Tyndale NLT API or import an authorized OSIS file'],
  ['NIV', 'Use Biblica/Zondervan permissions or import an authorized OSIS file'],
  ['NKJV', 'Use HarperCollins permissions or import an authorized OSIS file'],
  ['The Passion Translation', 'Use publisher permission or import an authorized OSIS file'],
  ['The Message', 'Use NavPress permission or import an authorized OSIS file'],
  ['ESV', 'Use the Crossway ESV API or import an authorized OSIS file'],
  ['Good News Translation', 'Use API.Bible/DBL licensing or import an authorized OSIS file'],
]

export const HelpWorkspace: React.FC<Props> = ({ appVersion, displayCount, outputCount }) => (
  <div className="workspace-grid workspace-help">
    <section className="panel help-panel">
      <div className="panel-header">
        <h3>How To</h3>
        <small>Operator guide</small>
      </div>
      <div className="help-content">
        <div className="help-section">
          <h2>Use A Projector Or External Display</h2>
          <ol>
            <li>Connect the projector, monitor, or TV to the computer.</li>
            <li>Open Settings and check Detected Displays.</li>
            <li>Choose Go Live Here for one screen, or Go Live on All Secondary for every external screen.</li>
            <li>Use Show if an output was hidden, Fullscreen for presentation mode, or Resize for a windowed preview.</li>
          </ol>
        </div>

        <div className="help-section">
          <h2>Download Or Import Bibles</h2>
          <ol>
            <li>Open Scripture, then Download Bible Online.</li>
            <li>Use Download for direct public-domain/public-use sources.</li>
            <li>For restricted translations, use Source as a reminder that a publisher/API license is required.</li>
            <li>Use Import OSIS Bible when you already have an authorized OSIS XML file.</li>
            <li>Use Import EasyWorship EWB for readable EasyWorship Bible files. Protected or encrypted publisher files may still need an OSIS export or licensed API.</li>
          </ol>
        </div>

        <div className="help-section">
          <h2>Position And Resize Words</h2>
          <ol>
            <li>Open Song Editor, then Background &amp; Style.</li>
            <li>Set Vertical Position to Top Half, Center, or Bottom Half.</li>
            <li>Use Content Width and Content Height to resize the lyric or scripture text area.</li>
            <li>Send Live to push the same positioning to projectors and output windows.</li>
          </ol>
        </div>

        <div className="help-section">
          <h2>Build An Installer</h2>
          <ol>
            <li>Set the release number in package.json.</li>
            <li>Run npm run build to compile the app.</li>
            <li>Run npm run dist:win to create the Windows installer in release.</li>
          </ol>
        </div>
      </div>
    </section>

    <aside className="panel help-side-panel">
      <div className="panel-header">
        <h3>About</h3>
        <small>Version</small>
      </div>
      <div className="about-info-grid help-about-grid">
        <div className="about-info-item">
          <span className="about-label">Application</span>
          <span className="about-value">WorshipPresenter</span>
        </div>
        <div className="about-info-item">
          <span className="about-label">Version</span>
          <span className="about-value">{appVersion || '1.1.0'}</span>
        </div>
        <div className="about-info-item">
          <span className="about-label">Displays</span>
          <span className="about-value">{displayCount}</span>
        </div>
        <div className="about-info-item">
          <span className="about-label">Outputs</span>
          <span className="about-value">{outputCount}</span>
        </div>
      </div>

      <div className="help-source-list">
        <h3>Bible Sources</h3>
        {bibleSources.map(([name, detail]) => (
          <div key={name} className="help-source-row">
            <strong>{name}</strong>
            <span>{detail}</span>
          </div>
        ))}
      </div>
    </aside>
  </div>
)
