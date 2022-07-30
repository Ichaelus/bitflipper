/***
 * Access control for the midi input signal and setup wizard
***/
up.compiler('.midi', async element => {
  const midiSetupLink = document.querySelector('.footer--link.-midi')
  const SETUP_LABEL = 'Setup midi'
  const EXIT_LABEL = 'Exit midi learn'

  let midiAccess = null
  let isMidiLearning = false

  async function init() {
    if (localStorage.getItem(MidiMap.STORAGE_AUTOLOAD_KEY) === 'yes') {
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
    if (isMidiLearning) {
      MidiMap.stopWizard()
      MidiMap.processLiveSignals(midiAccess)
      midiSetupLink.textContent = SETUP_LABEL
    } else {
      await requestAccess()
      midiSetupLink.textContent = EXIT_LABEL
      await MidiMap.setupWizard(midiAccess)
    }
    isMidiLearning = !isMidiLearning
  }

  await init()

  return [up.on(midiSetupLink, 'click', setupMidi)]
})
