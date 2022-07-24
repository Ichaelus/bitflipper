// Inspired by Wavy Jones

up.compiler('.oscilloscope', function (element) {
  let interval, oscilloscopeLine, oscilloscope, freqData
  const lineColor = 'aliceblue'
  const lineThickness = 1
  const hertz = 10

  function init() {
    setUpSVG()
    drawLine('zero')
  }

  function setUpSVG() {
    const svgNamespace = 'http://www.w3.org/2000/svg'
    const paper = document.createElementNS(svgNamespace, 'svg')
    paper.setAttribute('width', element.clientWidth)
    paper.setAttribute('height', element.clientHeight)
    paper.setAttributeNS(
      'http://www.w3.org/2000/xmlns/',
      'xmlns:xlink',
      'http://www.w3.org/1999/xlink',
    )
    element.appendChild(paper)

    oscilloscopeLine = document.createElementNS(svgNamespace, 'path')
    oscilloscopeLine.setAttribute('stroke', lineColor)
    oscilloscopeLine.setAttribute('stroke-width', lineThickness)
    oscilloscopeLine.setAttribute('fill', 'none')
    oscilloscopeLine.setAttribute(
      'style',
      'fill-opacity: 0; filter: url(#glow);',
    )
    oscilloscopeLine.setAttribute('fill-opacity', '0')

    paper.appendChild(oscilloscopeLine)
    oscilloscopeLine.insertAdjacentHTML(
      'beforebegin',
      `
      <defs>
        <filter id="glow">
          <fegaussianblur className="blur" result="coloredBlur" stddeviation="4"></fegaussianblur>
          <femerge>
            <femergenode in="coloredBlur"></femergenode>
            <femergenode in="coloredBlur"></femergenode>
            <femergenode in="coloredBlur"></femergenode>
            <femergenode in="SourceGraphic"></femergenode>
          </femerge>
        </filter>

        <!-- source: https://stackoverflow.com/a/14209704 -->
        <pattern id="smallGrid" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M 8 0 L 0 0 0 8" fill="none" stroke="gray" stroke-width="0.5"/>
        </pattern>
      </defs>
    `,
    )

    const grid = document.createElementNS(svgNamespace, 'rect')
    grid.setAttribute('width', '100%')
    grid.setAttribute('height', '100%')
    grid.setAttribute('fill', 'url(#smallGrid)')
    grid.classList.add('oscilloscope--grid')
    paper.appendChild(grid)
  }

  function drawLine(type) {
    const graphPoints = []

    if (type === 'zero') {
      freqData = new Uint8Array(element.clientWidth)
      freqData.fill(128)
    } else {
      oscilloscope.getByteTimeDomainData(freqData)
    }

    graphPoints.push('M0, ' + element.offsetHeight / 2)

    const visualizedDataPoints = Math.floor(
      freqData.length / element.clientWidth,
    )

    for (let i = 0; i < freqData.length; i += visualizedDataPoints) {
      let point = (freqData[i] / 128) * (element.offsetHeight / 2)
      graphPoints.push('L' + i / visualizedDataPoints + ', ' + point)
    }

    oscilloscopeLine.setAttribute(
      'd',
      graphPoints.reduce((point, previous) => point + previous),
    )
  }

  function drawLines() {
    if (!oscilloscope) {
      return // The machine has not been initialized yet
    }
    drawLine()
    interval = setInterval(drawLine, 1000 / hertz)
  }

  function stopDrawingLines() {
    clearInterval(interval)
    drawLine('zero')
  }

  function connectOscilloscope(evt) {
    oscilloscope = evt.oscilloscope
    freqData = new Uint8Array(oscilloscope.frequencyBinCount)
  }

  up.on('reset:on', drawLines)
  up.on('reset:off', stopDrawingLines)
  up.on('oscilloscope:connected', connectOscilloscope)
  init()
})
