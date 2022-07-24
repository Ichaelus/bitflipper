up.compiler('.midi', async element => {
  const midiLink = document.querySelector('.footer--link.-midi')

  let midiAccess = null
  let midiLearn = false

  async function init() {
    if (localStorage.getItem(`autoload-midi`) === 'yes') {
      // Already used midi before
      await requestAccess()
      MidiMap.processLiveSignals(midiAccess)
    }
  }

  async function requestAccess() {
    if (midiAccess) {
      return
    }
    midiAccess = await navigator.requestMIDIAccess({ sysex: false })
  }

  async function setupMidi() {
    if (midiLearn) {
      MidiMap.stopWizard()
      MidiMap.processLiveSignals(midiAccess)
      midiLink.textContent = 'Setup midi'
    } else {
      await requestAccess()
      midiLink.textContent = 'Exit midi learn'
      await MidiMap.setupWizard(midiAccess)
    }
    midiLearn = !midiLearn
  }

  await init()

  return [up.on(midiLink, 'click', setupMidi)]
})
