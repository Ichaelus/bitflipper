/***
 * Service class to bind specific MIDI control or note signals to various
 * Bitflipper functions.
 *
 * Each midi signal contains of three parts: status, data1 and data2
 *   status and data1 are combined into a unique key code.
 *   data2 is passed as a float value to the Bitflipper function (midi note / 127)
 *  See https://computermusicresource.com/MIDI.Commands.html for more info
 *
 * User settings are stored in localStorage and loaded on every page refresh
 *
 * THe Service has a "Wizard" and a "Live" mode. The wizard allows the user to
 * record new key bindings.
 *
 * Status codes between 144 and 159 mean "note is turned off". As we are only
 * interested in toggles/values, we map them to the same code as "note on".
***/
window.MidiMap = new (class {
  constructor() {
    this.controls = []
    this.currentWizardControl = null
    this.recording = false

    this.MIDI_DATA_MAX = 127
    this.MIDI_CHANNELS = 16
    this.CURRENT_LEARN_CLASS = '-current-midi-learn'
    this.CAN_LEARN_CLASS = '-can-midi-learn'
    this.STORAGE_STATUS_KEY = 'midi-status-code'
    this.STORAGE_CATEGORY_KEY = 'midi-category-code'
    this.STORAGE_AUTOLOAD_KEY = 'autoload-midi'

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
        localStorage.getItem(`${this.STORAGE_STATUS_KEY}:${identifier}`),
      ),
      categoryCode: parseInt(
        localStorage.getItem(`${this.STORAGE_CATEGORY_KEY}:${identifier}`),
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
      control.domNode.classList.remove(this.CURRENT_LEARN_CLASS)
      control.domNode.classList.remove(this.CAN_LEARN_CLASS)
      up.off(control.domNode, 'click', this.onControlClick)
    })
  }

  setDomListeners() {
    this.controls.forEach(control => {
      control.domNode.classList.add(this.CAN_LEARN_CLASS)
      up.on(control.domNode, 'click', this.onControlClick)
    })
  }

  setCurrentControl(evt) {
    this.currentWizardControl?.domNode.classList.remove(this.CURRENT_LEARN_CLASS)
    this.currentWizardControl = this.controls.find(
      control => control.domNode === evt.currentTarget,
    )
    this.currentWizardControl.domNode.classList.add(this.CURRENT_LEARN_CLASS)
    evt.preventDefault()
    evt.stopImmediatePropagation()
  }

  midiLearnSignalReceived(message) {
    const [statusCode, data1, data2] = this.mapData(message.data)

    if (this.currentWizardControl) {
      this.currentWizardControl.statusCode = statusCode
      this.currentWizardControl.categoryCode = data1
      localStorage.setItem(
        `${this.STORAGE_STATUS_KEY}:${this.currentWizardControl.identifier}`,
        statusCode,
      )
      localStorage.setItem(
        `${this.STORAGE_CATEGORY_KEY}:${this.currentWizardControl.identifier}`,
        data1,
      )
      localStorage.setItem(this.STORAGE_AUTOLOAD_KEY, 'yes')
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
    // MIDI debugging:
    // console.table([statusCode, data1, data2])
    return [statusCode, data1, data2]
  }

  processLiveSignals(midiAccess) {
    for (const entry of midiAccess.inputs) {
      const input = entry[1] // instanceof MIDIInput
      input.onmidimessage = this.onMidiLive
    }
  }
})()
