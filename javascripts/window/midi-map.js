window.MidiMap = new (class {
  constructor() {
    this.controls = []
    this.currentWizardControl = null
    this.recording = false
    // Midi standard: https://computermusicresource.com/MIDI.Commands.html
    this.MIDI_DATA_MAX = 127
    this.MIDI_CHANNELS = 16
    this.onMidiLearn = this.midiLearnSignalReceived.bind(this)
    this.onMidiLive = this.midiLiveSignalReceived.bind(this)
    this.onControlClick = this.setCurrentControl.bind(this)
  }

  registerControl(domNode, identifier, callback) {
    this.controls.push({
      domNode,
      identifier,
      callback,
      statusCode: parseInt(
        localStorage.getItem(`midi-status-code:${identifier}`),
      ),
      categoryCode: parseInt(
        localStorage.getItem(`midi-category-code:${identifier}`),
      ),
    })
  }

  async setupWizard(midiAccess) {
    this.recording = true
    this.setDomListeners()

    for (const entry of midiAccess.inputs) {
      const input = entry[1] // instanceof MIDIInput
      input.onmidimessage = this.onMidiLearn
    }
  }

  stopWizard() {
    this.recording = false
    this.controls.forEach(control => {
      control.domNode.classList.remove('-current-midi-learn')
      control.domNode.classList.remove('-can-midi-learn')
      up.off(control.domNode, 'click', this.onControlClick)
    })
  }

  setDomListeners() {
    this.controls.forEach(control => {
      control.domNode.classList.add('-can-midi-learn')
      up.on(control.domNode, 'click', this.onControlClick)
    })
  }

  setCurrentControl(evt) {
    this.currentWizardControl?.domNode.classList.remove('-current-midi-learn')
    this.currentWizardControl = this.controls.find(
      c => c.domNode === evt.currentTarget,
    )
    this.currentWizardControl.domNode.classList.add('-current-midi-learn')
    evt.preventDefault()
    evt.stopImmediatePropagation()
  }

  midiLearnSignalReceived(message) {
    const [statusCode, data1, data2] = this.mapData(message.data)

    if (this.currentWizardControl) {
      this.currentWizardControl.statusCode = statusCode
      this.currentWizardControl.categoryCode = data1
      localStorage.setItem(
        `midi-status-code:${this.currentWizardControl.identifier}`,
        statusCode,
      )
      localStorage.setItem(
        `midi-category-code:${this.currentWizardControl.identifier}`,
        data1,
      )
      localStorage.setItem(`autoload-midi`, 'yes')
      this.currentWizardControl.callback.call(null, data2 / this.MIDI_DATA_MAX)
    }
  }

  midiLiveSignalReceived(message) {
    const [statusCode, data1, data2] = this.mapData(message.data)
    this.controls
      .filter(
        control =>
          control.statusCode === statusCode && control.categoryCode === data1,
      )
      .forEach(control => {
        control.callback.call(null, data2 / this.MIDI_DATA_MAX)
      })
  }

  mapData(midiData) {
    let [statusCode, data1, data2] = midiData
    if (statusCode >= 144 && statusCode <= 159) {
      // ON and OFF note signals are likewise to us
      statusCode -= this.MIDI_CHANNELS
    }
    return [statusCode, data1, data2]
  }

  processLiveSignals(midiAccess) {
    for (const entry of midiAccess.inputs) {
      const input = entry[1] // instanceof MIDIInput
      input.onmidimessage = this.onMidiLive
    }
  }
})()
