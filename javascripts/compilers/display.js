up.compiler('.display', element => {
  textElement = element.querySelector('.display--text')
  const defaultText = textElement.dataset.defaultText
  const RESET_TIMEOUT = 1500 // Milliseconds
  const ANIMATION_TIME = 400 // Milliseconds, max 999
  const DISPLAY_WIDTH = element.getBoundingClientRect().width

  let textQueue = [] // First in, first out
  let resetInterval
  let lastUpdate = Date.now()
  element.active = false

  function init() {
    setNewText(defaultText)
  }

  function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

  async function resetTextIfIdle() {
    let isNonDefaultText = textElement.textContent !== defaultText
    let nothingQueued = textQueue.length === 0

    if (nothingQueued && isNonDefaultText && readyForNextText()) {
      textQueue.push(defaultText)
      await drainQueue()
      clearInterval(resetInterval)
    }
  }

  async function moveExistingTextOutside() {
    textElement.style.transition = `right linear 0.${ANIMATION_TIME}s`
    textElement.style.right = `${DISPLAY_WIDTH}px`
    forceRepaint(textElement)

    await sleep(ANIMATION_TIME + 10)
    textElement.style.transition = 'none'
    lastUpdate = Date.now()
  }

  async function setNewText(text) {
    textElement.style.right = `-${DISPLAY_WIDTH}px`
    forceRepaint(textElement)

    textElement.style.transition = `right linear 0.${ANIMATION_TIME}s`
    textElement.innerText = text
    textElement.style.right = 0
    forceRepaint(textElement)

    await sleep(ANIMATION_TIME + 10)
    textElement.style.transition = 'none'
    lastUpdate = Date.now()
  }

  function forceRepaint(el) {
    // Force a repaint! Sadly, this is *very* much necessary.
    // https://gist.github.com/paulirish/5d52fb081b3570c81e3a
    el.getBoundingClientRect()
  }

  function readyForNextText() {
    return lastUpdate + RESET_TIMEOUT <= Date.now()
  }

  async function drainQueue() {
    if (element.active || !readyForNextText()) {
      setTimeout(drainQueue, 20)
    } else {
      element.active = true
      await moveExistingTextOutside()
      await setNewText(textQueue.shift())
      element.active = false
    }
  }

  up.on('status-text-changed', async function (evt) {
    if (evt.instant) {
      textElement.innerText = evt.text
      lastUpdate = Date.now()
    } else {
      textQueue.push(evt.text)
      drainQueue()
    }
    clearInterval(resetTextIfIdle)
    resetInterval = setInterval(resetTextIfIdle, 100)
  })

  init()
})
