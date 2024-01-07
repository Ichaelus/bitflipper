/***
 * The main display
 * It keeps track of texts that should be displayed and shows them
 * one by one.
***/
up.compiler('.display', element => {
  const textElement = element.querySelector('.display--text')
  const defaultText = textElement.dataset.defaultText
  const RESET_TIMEOUT_MS = 1500
  const ANIMATION_TIME_MS = 400 // max 999
  const IDLE_TIMEOUT_MS = 100
  const TRANSITION_MS = 10
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
    textElement.style.transition = `right linear 0.${ANIMATION_TIME_MS}s`
    textElement.style.right = `${DISPLAY_WIDTH}px`
    forceRepaint(textElement)

    await sleep(ANIMATION_TIME_MS + TRANSITION_MS)
    textElement.style.transition = 'none'
    lastUpdate = Date.now()
  }

  async function setNewText(text) {
    textElement.style.right = `-${DISPLAY_WIDTH}px`
    forceRepaint(textElement)

    textElement.style.transition = `right linear 0.${ANIMATION_TIME_MS}s`
    textElement.innerText = text
    textElement.style.right = 0
    forceRepaint(textElement)

    await sleep(ANIMATION_TIME_MS + TRANSITION_MS)
    textElement.style.transition = 'none'
    lastUpdate = Date.now()
  }

  function forceRepaint(el) {
    // Sadly, this is *very* much necessary.
    // https://gist.github.com/paulirish/5d52fb081b3570c81e3a
    el.getBoundingClientRect()
  }

  function readyForNextText() {
    return lastUpdate + RESET_TIMEOUT_MS <= Date.now()
  }

  async function drainQueue() {
    if (element.active || !readyForNextText()) {
      setTimeout(drainQueue, TRANSITION_MS)
    } else {
      element.active = true
      await moveExistingTextOutside()
      await setNewText(textQueue.shift())
      element.active = false
    }
  }

  up.on('status-text-changed', async function (evt) {
    if (evt.flushPreviousMessages) {
      textQueue = []
    }

    if (evt.instant) {
      textElement.innerText = evt.text
      lastUpdate = Date.now()
    } else {
      textQueue.push(evt.text)
      await drainQueue()
    }
    clearInterval(resetTextIfIdle)
    resetInterval = setInterval(resetTextIfIdle, IDLE_TIMEOUT_MS)
  })

  init()
})
