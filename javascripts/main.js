const buttonStates = ["0", "-1", "1"]
const processAudio = async () => {
  const audioContext = new AudioContext();
  // Initialize the audio context and its processor
  await audioContext.audioWorklet.addModule('javascripts/bit-crusher-processor.js');
  const inputStreamSignal = await setupInputStream(audioContext);
  const inputGain = setupGain(audioContext); // Formerly: microphoneGain, now indifferent about microphone and drumloop

  const bitCrusher = new AudioWorkletNode(audioContext, 'bit-crusher-processor');
  const paramBitDepth = bitCrusher.parameters.get('bitDepth');
  const paramReduction = bitCrusher.parameters.get('frequencyReduction');

  const filter = setupFilter(audioContext);
  const volumeLimiter = setupVolumeLimiter(audioContext);

  const analyser = setupAnalyser(audioContext);
  volumeLimiter.connect(analyser);

  const myOscilloscope = new WavyJones(audioContext, document.querySelector('.oscilloscope'));
  
  inputStreamSignal
    .connect(inputGain)
    .connect(bitCrusher)
    .connect(filter)
    .connect(volumeLimiter)
    .connect(audioContext.destination);

  //Connect Oscilloscope
  volumeLimiter.connect(myOscilloscope);


  function onVolumeChange(evt){
    const newVolume = evt.target.getValue();
    inputGain.gain.setValueAtTime(newVolume, audioContext.currentTime);
    up.emit('status-text-changed', {text: `Volume: ${ parseInt(newVolume * 100) }%`, instant: true});
  };
  
  function mute(){
    inputGain.gain.setValueAtTime(0, audioContext.currentTime);
  }

  function unmute(){
    inputGain.gain.setValueAtTime(1, audioContext.currentTime);
  }

  function onFrequencyReductionChange(evt){
    // |frequencyReduction| parameters will be automated and changing over
    // time. Thus its parameter array will have 128 values.
    //paramReduction.setValueAtTime(0.01, 0);
    //paramReduction.linearRampToValueAtTime(0.1, 4);
    //paramReduction.exponentialRampToValueAtTime(0.01, 8);
    const newFrequencyReduction = evt.target.getValue();
    paramReduction.setValueAtTime(newFrequencyReduction, audioContext.currentTime);
    up.emit('status-text-changed', {text: `Frequency Reduction: ${ parseInt(newFrequencyReduction * 100) }%`, instant: true});
  };
      
  function onCutOffChanged(evt){
    const maxCutoff = 16000;
    const newCutOff = evt.target.getValue() * maxCutoff;
    filter.frequency.setValueAtTime(newCutOff, audioContext.currentTime);
    up.emit('status-text-changed', {text: `Cutoff: ${ parseInt(newCutOff) } Hz`, instant: true});
  }

  function onResonanceChanged(evt){
    const maxResonance = 30;
    const newResonance = evt.target.getValue() * maxResonance;
    filter.Q.setValueAtTime(newResonance, audioContext.currentTime);
    up.emit('status-text-changed', {text: `Resonance: ${ parseInt(newResonance) }`, instant: true});
  }

  function onFilterTypeChanged(evt){
    filter.type = evt.value;
  }

  function onFloatRangeChanged(evt){
    const maxFloatRange =   1024;
    const newFloatRange = parseInt(evt.target.getValue() * maxFloatRange);
    bitCrusher.port.postMessage(['float-range', newFloatRange]);
    up.emit('status-text-changed', {text: `Float Range: ${ newFloatRange }`, instant: true});
  }

  function changeChannelState(evt) {
    let element = evt.target;
    let channelNumber = parseInt(element.id);
    let statusChangeName;
    switch (true) {
      case element.classList.contains('-active'):
        element.classList.remove('-active');
        element.classList.add('-inverted');
        bitCrusher.port.postMessage(['channel-state', channelNumber, -1]);
        statusChangeName = 'inverted';
        break;
      case element.classList.contains('-inverted'):
        element.classList.remove('-inverted');
        element.classList.add('-inactive');
        bitCrusher.port.postMessage(['channel-state', channelNumber, 0]);
        statusChangeName = 'disabled';
        break;
      case element.classList.contains('-inactive'):
        element.classList.remove('-inactive');
        element.classList.add('-active');
        bitCrusher.port.postMessage(['channel-state', channelNumber, 1]);
        statusChangeName = 'enabled';
        break;
    };
    up.emit('status-text-changed', {text: `Channel ${ channelNumber + 1 } ${statusChangeName}`, instant: true});
  };

  up.on('reset:off', function(){
    audioContext.suspend();
    mute();
  });
  up.on('reset:on', function(){
    audioContext.resume();
    unmute();
  });
  up.on('button-value-changed', '.knob.-volume', onVolumeChange);
  up.on('button-value-changed', '.knob.-sample-reduction', onFrequencyReductionChange);
  up.on('button-value-changed', '.knob.-filter-cutoff', onCutOffChanged);
  up.on('button-value-changed', '.knob.-filter-resonance', onResonanceChanged);
  up.on('button-value-changed', '.knob.-float-range', onFloatRangeChanged);
  up.on('filter-type-changed', onFilterTypeChanged)
  up.on('click', '.channel--button', changeChannelState);
  up.emit('reset:on');
};

up.on('power:on', processAudio);

function setupAnalyser(audioContext){
  let analyser = audioContext.createAnalyser();
  analyser.fftSize = 32;
  analyser.minDecibels = -90;
  
  // Visualize the current noise level (updated 5 times per second)
  setInterval(function () {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    analyser.smoothingTimeConstant = 0.3;
    const sum = dataArray.reduce((a, b) => a + b, 0);
    const avg = (sum / dataArray.length) || 0;
    const hueValue = (1 - avg / 255) * 90; // Translate [0,255] -> [90, 0]
    document.querySelector(".input-visualizer--glow").style.backgroundColor = "hsla(" + hueValue + ", 100%, 50%, 0.95)";
  }, 200);
  return analyser;
}

function setupGain(audioContext){
  let inputGain = audioContext.createGain();
  up.on('reset:on', function(){
    // Initial volume: 100%
    inputGain.gain.setValueAtTime(1, audioContext.currentTime);
  })
  return inputGain;
}

async function setupInputStream(audioContext){
  try {
    return await setupMicrophoneStream(audioContext);
  } catch  (err) {
    return setupDrumLoopStream(audioContext);
  }
}

async function setupMicrophoneStream(audioContext){
  let microphoneAudioInput = await getMicrophoneAudioInput();
  let microphoneInAudioContext = audioContext.createMediaStreamSource(microphoneAudioInput);

  up.on('reset:on', function(){
    up.emit('plug-in', { target: document.querySelector('.cable-connector.-microphone') });
  });
  return microphoneInAudioContext;
}

// Ask for user permission to the microphone audio stream
async function getMicrophoneAudioInput() {
  return await navigator.mediaDevices.getUserMedia({ audio: true });
}

function setupDrumLoopStream(audioContext){
  let drumLoop = audioContext.createBufferSource();
  let request = new XMLHttpRequest();
  let musicfile = 'assets/drumloop';
  let url = musicfile + ".wav"
  const playbackRate = 1.0;
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';
  request.onload = function () {
    var audioData = request.response;
    audioContext.decodeAudioData(audioData, function (buffer) {
      let myBuffer = buffer;
      let songLength = buffer.duration;
      drumLoop.buffer = myBuffer;
      drumLoop.playbackRate.value = playbackRate;
      drumLoop.loop = true;
      drumLoop.start(0);
    });
  };
  request.send();
//        oscillator.frequency.exponentialRampToValueAtTime(baseFrequency + offset, audioContext.currentTime + 0.75);
  
  up.on('reset:on', function(){
    up.emit('plug-in', { target: document.querySelector('.cable-connector.-drumloop') });
  });

  return drumLoop;
}

function setupFilter(audioContext){
  let filter = audioContext.createBiquadFilter();
  filter.type ="lowpass";
  filter.frequency.value = 10000;
  filter.Q.value = 0;
  return filter;
}

function setupVolumeLimiter(audioContext){
  let limiter = audioContext.createDynamicsCompressor();
  limiter.threshold.setValueAtTime(-30.0, audioContext.currentTime); // this is the pitfall, leave some headroom
  limiter.knee.setValueAtTime(6.0, audioContext.currentTime); // brute force
  limiter.ratio.setValueAtTime(20.0, audioContext.currentTime); // max compression
  limiter.attack.setValueAtTime(0.002, audioContext.currentTime); // 5ms attack
  limiter.release.setValueAtTime(0.100, audioContext.currentTime); // 50ms release
  return limiter;
}