up.compiler('.manual', element => {
  const helpLink = document.querySelector('.footer--link.-manual')

  let manualVisible = false

  function toggleManual() {
    if (manualVisible) {
      up.element.hide(element)
      document.querySelector('.machine').classList.toggle('-flipped')
      helpLink.textContent = 'Show manual'
    } else {
      document.querySelector('.machine').classList.toggle('-flipped')
      up.element.show(element)
      helpLink.textContent = 'Hide manual'
    }
    manualVisible = !manualVisible
  }

  if (helpLink) {
    return [up.on(helpLink, 'click', toggleManual)]
  }
})
