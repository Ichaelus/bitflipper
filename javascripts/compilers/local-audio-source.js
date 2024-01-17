up.compiler('.local-audio-source', (fileInput) => {
  fileInput.onchange = (evt) => {
    up.emit('audio-input:use-file', { file: fileInput.files[0] })
  }

  input.onclick = function (evt) {
    // we wouldn't get a change event otherwise
    // that's especially bad if we previously tried to select a file before powering on
    evt.target.value = null
  }
})
