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
    this.numericControls = []
    this.toggleControls = []
    this.currentWizardControl = null
    this.recording = false
    this.clearMidiActiveTimeouts = new Map()

    this.MIDI_DATA_MAX = 127
    this.MIDI_CHANNELS = 16
    this.CURRENT_LEARN_CLASS = '-current-midi-learn'
    this.CAN_LEARN_CLASS = '-can-midi-learn'
    this.STORAGE_STATUS_KEY = 'midi-status-code'
    this.STORAGE_CATEGORY_KEY = 'midi-category-code'
    this.STORAGE_AUTOLOAD_KEY = 'autoload-midi'
    this.MIDI_ACTIVE_CLASS = '-midi-active'
    this.MIDI_ACTIVE_FADE_OUT_MS = 210

    this.onMidiLearn = this.midiLearnSignalReceived.bind(this)
    this.onMidiLive = this.midiLiveSignalReceived.bind(this)
    this.onControlClick = this.setCurrentControl.bind(this)
  }

  get allControls() {
    return [...this.numericControls, ...this.toggleControls]
  }

  /* Register a callback that can be called with a value from 0.0 - 1 */
  registerNumeric(domNode, identifier, callback) {
    this.numericControls.push({...this._controlParams(domNode, identifier, callback), numeric: true })
  }
  
  /* Register a callback that does not care about it's arguments */
  registerToggle(domNode, identifier, callback) {
    this.toggleControls.push({...this._controlParams(domNode, identifier, callback), toggle: true })
  }

  _controlParams(domNode, identifier, callback) {
    return {
      domNode,
      identifier,
      callback,
      statusCode: parseInt(
        localStorage.getItem(`${this.STORAGE_STATUS_KEY}:${identifier}`),
      ),
      categoryCode: parseInt(
        localStorage.getItem(`${this.STORAGE_CATEGORY_KEY}:${identifier}`),
      ),
    }
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
    this.allControls.forEach(control => {
      control.domNode.classList.remove(this.CURRENT_LEARN_CLASS)
      control.domNode.classList.remove(this.CAN_LEARN_CLASS)
      up.off(control.domNode, 'click', this.onControlClick)
    })
  }

  setDomListeners() {
    this.allControls.forEach(control => {
      control.domNode.classList.add(this.CAN_LEARN_CLASS)
      up.on(control.domNode, 'click', this.onControlClick)
    })
  }

  setCurrentControl(evt) {
    this.currentWizardControl?.domNode.classList.remove(this.CURRENT_LEARN_CLASS)
    this.currentWizardControl = this.allControls.find(
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
    this.allControls
      .filter(
        control =>
          control.statusCode === statusCode && control.categoryCode === data1,
      )
      .forEach(control => {
        const element = control.domNode
        if (control.toggle && data2 === 0) {
          console.info('Ignoring 0 velocity for toggle buttons - most MIDI buttons would otherwise only be usable while pressing the button down')
          return
        }
        this.setMidiActive(element)
        clearTimeout(this.clearMidiActiveTimeouts.get(element))
        this.clearMidiActiveTimeouts.set(element, setTimeout(() => this.clearMidiActive(element), this.MIDI_ACTIVE_FADE_OUT_MS))
        let normalizedCallbackValue = data2
        if (control.numeric) {
          normalizedCallbackValue /= this.MIDI_DATA_MAX // scale to 0.0 - 1.0
        }
        control.callback.call(null, normalizedCallbackValue)
      })
  }

  setMidiActive(element) {
    element.classList.add(this.MIDI_ACTIVE_CLASS)
  }

  clearMidiActive(element) {
    element.classList.remove(this.MIDI_ACTIVE_CLASS)
  }

  mapData(midiData) {
    const [originalStatusCode, data1, data2] = midiData
    let statusCode = originalStatusCode
    let signalType = 'unknown'
    let data1Name = 'unknown'
    let data2Name = 'unknown'

    if (originalStatusCode >= 128 && originalStatusCode < 144) {
      signalType = 'Note Off'
      data1Name = 'key'
      data2Name = 'velocity'
    } else if (originalStatusCode >= 144 && originalStatusCode < 160) {
      signalType = 'Note On'
      data1Name = 'key'
      data2Name = 'velocity'
      // ON and OFF note signals are likewise to us
      statusCode -= this.MIDI_CHANNELS
    } else if (originalStatusCode >= 160 && originalStatusCode < 176) {
      signalType = 'Poly Key Pressure'
      data1Name = 'key'
      data2Name = 'pressure'
    } else if (originalStatusCode >= 176 && originalStatusCode < 192) {
      signalType = 'Control Change'
      data1Name = 'control'
      data2Name = 'value'
    } else if (originalStatusCode >= 192 && originalStatusCode < 208) {
      signalType = 'Program Change'
      data1Name = 'program'
    } else if (originalStatusCode >= 208 && originalStatusCode < 224) {
      signalType = 'Mono Key Pressure'
      data1Name = 'pressure'
    } else if (originalStatusCode >= 224 && originalStatusCode < 240) {
      signalType = 'Pitch Bend'
      data1Name = 'Range LSB'
      data2Name = 'Range MSB'
    } else if (originalStatusCode >= 240 && originalStatusCode < 256) {
      signalType = 'System'
      data1Name = 'Manufacturer ID'
      data2Name = 'Model ID'
    }
    Logger.majorUserEvent({type: `[MIDI ${signalType} received]`}, `status: ${statusCode} (original: ${originalStatusCode}), ${data1Name}: ${data1}, ${data2Name}: ${data2}`)

    return [statusCode, data1, data2]
  }

  processLiveSignals(midiAccess) {
    for (const entry of midiAccess.inputs) {
      const input = entry[1] // instanceof MIDIInput
      input.onmidimessage = this.onMidiLive
    }
  }
})()
