up.compiler('.local-audio-source', (fileInput) => {
  fileInput.onchange = (evt) => {
    up.emit('audio-input:use-file', { file: fileInput.files[0] })
    
  }
})
