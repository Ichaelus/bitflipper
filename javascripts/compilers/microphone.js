up.compiler('.microphone', function(microphone){
  let audioContext, inputGain, microphoneInAudioContext;

  async function setupMicrophoneStream(){
    if(!microphoneInAudioContext){
      let microphoneAudioInput = await getMicrophoneAudioInput();
      microphoneInAudioContext = audioContext.createMediaStreamSource(microphoneAudioInput);
    }
    microphoneInAudioContext.connect(inputGain);
  }

  // Ask for user permission to the microphone audio stream
  async function getMicrophoneAudioInput() {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  }
  
  function connectAudioContext(evt){
    audioContext = evt.audioContext;
  }

  function connectInputGain(evt){
    inputGain = evt.inputGain;
  }

  async function activateMicrophone(evt){
    try{
      await setupMicrophoneStream();
      up.emit('input-changed', { newInput: microphone });
    }catch(err){
      up.emit(microphone, 'plug-out');
      throw(err);
    }
  }

  function disconnectMicrophone(){
    microphoneInAudioContext.disconnect();
  }

  up.on('audioContext:connected', connectAudioContext);
  up.on('inputgain:connected', connectInputGain);
  up.on(microphone, 'plug-in', activateMicrophone);
  up.on(microphone, 'plug-out', disconnectMicrophone);
});