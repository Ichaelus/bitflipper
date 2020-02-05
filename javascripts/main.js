const processAudio = async () => {
  const audioContext = new AudioContext();
  // Initialize the audio context and its processor
  await audioContext.audioWorklet.addModule('javascripts/bit-crusher-processor.js');
  const inputGain = audioContext.createGain();
  const bitCrusher = new AudioWorkletNode(audioContext, 'bit-crusher-processor');
  const paramBitDepth = bitCrusher.parameters.get('bitDepth');
  const paramReduction = bitCrusher.parameters.get('frequencyReduction');

  const filter = audioContext.createBiquadFilter();
  const volumeLimiter = setupVolumeLimiter(audioContext);

  const analyser = setupAnalyser(audioContext);
  volumeLimiter.connect(analyser);

  const oscilloscope = audioContext.createAnalyser();
  
  inputGain
    .connect(bitCrusher)
    .connect(filter)
    .connect(volumeLimiter)
    .connect(oscilloscope)
    .connect(audioContext.destination);

  up.emit('audioContext:connected', { audioContext: audioContext });
  up.emit('inputgain:connected', { inputGain: inputGain });
  up.emit('oscilloscope:connected', { oscilloscope: oscilloscope });
  up.emit('bitcrusher:connected', { bitCrusher: bitCrusher });
  up.emit('filter:connected', { filter: filter });

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

  function onFloatRangeChanged(evt){
    const maxFloatRange =   1024;
    const newFloatRange = parseInt(evt.target.getValue() * maxFloatRange);
    bitCrusher.port.postMessage(['float-range', newFloatRange]);
    up.emit('status-text-changed', {text: `Float Range: ${ newFloatRange }`, instant: true});
  }

  up.on('reset:off', () => audioContext.suspend() );
  up.on('reset:on', () => audioContext.resume() );
  
  up.on('button-value-changed', '.knob.-sample-reduction', onFrequencyReductionChange);
  up.on('button-value-changed', '.knob.-float-range', onFloatRangeChanged);
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

function setupVolumeLimiter(audioContext){
  let limiter = audioContext.createDynamicsCompressor();
  limiter.threshold.setValueAtTime(-30.0, audioContext.currentTime); // this is the pitfall, leave some headroom
  limiter.knee.setValueAtTime(6.0, audioContext.currentTime); // brute force
  limiter.ratio.setValueAtTime(20.0, audioContext.currentTime); // max compression
  limiter.attack.setValueAtTime(0.002, audioContext.currentTime); // 5ms attack
  limiter.release.setValueAtTime(0.100, audioContext.currentTime); // 50ms release
  return limiter;
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/service_worker.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}