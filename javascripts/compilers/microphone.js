// The microphone is also a .cable-connector!
up.compiler('.microphone', function(microphone){
  let audioContext, inputGain, microphoneInAudioContext;

  function init(){
    InputController.registerInput(microphone);
  }
  
  function connectAudioContext(evt){
    audioContext = evt.audioContext;
  }

  function connectInputGain(evt){
    inputGain = evt.inputGain;
  }

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

  async function activateMicrophone(evt){
    try{
      await setupMicrophoneStream();
      up.emit('plug-in-success');
    }catch(err){
      up.emit('plug-in-failed');
      throw(err);
    }
  }

  function disconnectMicrophone(){
    if(microphoneInAudioContext){
      microphoneInAudioContext.disconnect();
    }
  }

  up.on('audioContext:connected', connectAudioContext);
  up.on('inputgain:connected', connectInputGain);
  up.on(microphone, 'plug-in', activateMicrophone);
  up.on(microphone, 'plug-out', disconnectMicrophone);

  init();
});
