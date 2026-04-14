(function() {
  const React = window.React; // from CDN
  const ReactDOM = window.ReactDOM;
  if (!React || !ReactDOM) {
    console.error('React not loaded for operator app');
    return;
  }

  const App = () => {
    const [songs, setSongs] = React.useState([
      { id: 1, title: 'Amazing Grace', sections: [ { id: 1, type: 'Verse', text: 'Verse 1' }, { id: 2, type: 'Chorus', text: 'Chorus' } ] }
    ])
    const [schedule, setSchedule] = React.useState([
      { id: 1, type: 'Song', content: 'Amazing Grace' },
      { id: 2, type: 'Scripture', content: 'Psalm 23' }
    ])
    const [theme, setTheme] = React.useState({ bg: '#111111', color: '#ffffff' })
    const [currentSlide, setCurrentSlide] = React.useState('Idle')

    // IPC wiring for output state updates (mocked in this MVP)
    React.useEffect(() => {
      if (window.worship && window.worship.outputs && window.worship.outputs.onOutputState) {
        window.worship.outputs.onOutputState((payload) => {
          if (payload?.state?.slideTitle) {
            setCurrentSlide(payload.state.slideTitle)
          }
        })
      }
      // initialize outputs with the current slide
      if (window.worship && window.worship.outputs && window.worship.outputs.setState) {
        window.worship.outputs.setState(1, { slideTitle: currentSlide })
        window.worship.outputs.setState(2, { slideTitle: currentSlide })
      }
    }, [])

    React.useEffect(() => {
      if (window.worship && window.worship.outputs && window.worship.outputs.setState) {
        window.worship.outputs.setState(1, { slideTitle: currentSlide })
        window.worship.outputs.setState(2, { slideTitle: currentSlide })
      }
    }, [currentSlide])

    const addSong = () => {
      const nextId = songs.length ? songs[songs.length - 1].id + 1 : 1
      const newSong = { id: nextId, title: 'New Song ' + nextId, sections: [ { id: 1, type: 'Verse', text: 'Verse 1' } ] }
      setSongs([...songs, newSong])
      setCurrentSlide(newSong.title)
    }

    const onBlack = () => {
      if (window.worship?.outputs?.actions?.black) window.worship.outputs.actions.black()
      setCurrentSlide('Black')
    }
    const onLogo = () => {
      if (window.worship?.outputs?.actions?.logo) window.worship.outputs.actions.logo()
      setCurrentSlide('Logo')
    }
    const onClear = () => {
      if (window.worship?.outputs?.actions?.clear) window.worship.outputs.actions.clear()
      setCurrentSlide('Current')
    }

    // Sourced styles inline for simplicity in this milestone
    const panelStyle = { padding: 12, overflow: 'auto' }
    return React.createElement('div', { style: { height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' } }, [
      // Left: Song Editor
      React.createElement('section', { key: 'left', style: { ...panelStyle, borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' } }, [
        React.createElement('div', { key: 'toolbar', style: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 } }, [
          React.createElement('button', { key: 'black', onClick: onBlack, style: { padding: '6px 10px', background: '#000', color: '#fff' } }, 'BLACK'),
          React.createElement('button', { key: 'logo', onClick: onLogo, style: { padding: '6px 10px' } }, 'LOGO'),
          React.createElement('button', { key: 'clear', onClick: onClear, style: { padding: '6px 10px' } }, 'CLEAR')
        ]),
        React.createElement('h3', { key: 'title' }, 'Song Editor'),
        React.createElement('ul', { key: 'list', style: { listStyle: 'none', padding: 0, margin: 0, maxHeight: '60vh', overflow: 'auto' } },
          songs.map((s) =>
            React.createElement('li', { key: s.id, style: { padding: '6px 0' } }, s.title)
          )
        ),
        React.createElement('button', { onClick: addSong, style: { marginTop: 8 } }, 'Add Song')
      ]),

      // Middle: Schedule Builder
      React.createElement('section', { key: 'middle', style: { ...panelStyle, borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' } }, [
        React.createElement('h3', { key: 'title' }, 'Schedule Builder'),
        React.createElement('ul', { key: 'list', style: { listStyle: 'none', padding: 0, margin: 0 } },
          schedule.map((it, idx) =>
            React.createElement('li', { key: it.id, style: { padding: 6, borderBottom: '1px solid #444' } },
              React.createElement('span', null, `${idx + 1}. ${it.type} - ${it.content}`),
              React.createElement('span', { style: { marginLeft: 8 } },
                React.createElement('button', { onClick: () => {
                  if (idx > 0) {
                    const arr = schedule.slice()
                    const t = arr[idx - 1]
                    arr[idx - 1] = arr[idx]
                    arr[idx] = t
                    setSchedule(arr)
                  }
                } }, 'Up'),
                React.createElement('button', { onClick: () => {
                  if (idx < schedule.length - 1) {
                    const arr = schedule.slice()
                    const t = arr[idx + 1]
                    arr[idx + 1] = arr[idx]
                    arr[idx] = t
                    setSchedule(arr)
                  }
                } }, 'Down')
              )
            )
          )
        ),
        React.createElement('button', { onClick: () => setSchedule([...schedule, { id: schedule.length + 1, type: 'Song', content: 'New Item' }]), style: { marginTop: 8 } }, 'Add Item')
      ]),

      // Right: Theme Editor
      React.createElement('section', { key: 'right', style: { ...panelStyle, display: 'flex', flexDirection: 'column' } }, [
        React.createElement('h3', { key: 'title' }, 'Theme Editor'),
        React.createElement('div', { key: 'bg' }, 'Background: ',
          React.createElement('input', { type: 'color', value: theme.bg, onChange: (e) => setTheme({ ...theme, bg: e.target.value }) })
        ),
        React.createElement('div', { key: 'fg', style: { marginTop: 6 } }, 'Text color: ',
          React.createElement('input', { type: 'color', value: theme.color, onChange: (e) => setTheme({ ...theme, color: e.target.value }) })
        ),
        React.createElement('div', { key: 'preview', style: { marginTop: 12, padding: 8, background: theme.bg, color: theme.color } }, 'Live Theme Preview')
      ])
    ])
  }

  const AppWrapper = () => React.createElement(App)

  const rootEl = document.getElementById('root-app')
  if (rootEl) {
    ReactDOM.createRoot(rootEl).render(React.createElement(AppWrapper))
  }
})()
