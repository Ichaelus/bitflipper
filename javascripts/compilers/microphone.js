up.compiler('.microphone', function(microphone){
  let audioContext, inputGain;
  let alreadyConnected = false;

  async function setupMicrophoneStream(){
    if(!alreadyConnected){
      let microphoneAudioInput = await getMicrophoneAudioInput();
      let microphoneInAudioContext = audioContext.createMediaStreamSource(microphoneAudioInput);
      microphoneInAudioContext.connect(inputGain);
      alreadyConnected = true;
    }
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

  up.on('audioContext:connected', connectAudioContext);
  up.on('inputgain:connected', connectInputGain);
  up.on(microphone, 'plug-in', activateMicrophone);
});