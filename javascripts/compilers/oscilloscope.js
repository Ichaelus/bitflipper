/***
 * Visualization for the current oscilloscope value
 * on a rastered grid with a glowing line
 *
 * Inspired by Wavy Jones and https://stackoverflow.com/a/14209704
***/

up.compiler('.oscilloscope', function (element) {
  let drawLineInterval, oscilloscopeLine, oscilloscope, frequencyData
  const LINE_COLOR = 'aliceblue'
  const LINE_THICKNESS = 1
  const HERTZ = 10
  const MEDIAN_FREQUENCY = 128

  function init() {
    setUpSVG()
    drawEmptyLine()
  }

  function setUpSVG() {
    const svgNamespace = 'http://www.w3.org/2000/svg'
    const paper = setupPaper(svgNamespace)
    const oscilloscopeLine = setupLine(svgNamespace)
    const grid = setupGrid(svgNamespace)
    paper.appendChild(oscilloscopeLine)
    oscilloscopeLine.insertAdjacentHTML('beforebegin', svgDefinitions())
    paper.appendChild(grid)
  }

  function setupPaper(svgNamespace) {
    const paper = document.createElementNS(svgNamespace, 'svg')
    paper.setAttribute('width', element.clientWidth)
    paper.setAttribute('height', element.clientHeight)
    paper.setAttributeNS(
      'http://www.w3.org/2000/xmlns/',
      'xmlns:xlink',
      'http://www.w3.org/1999/xlink',
    )
    element.appendChild(paper)
    return paper
  }

  function setupLine(svgNamespace) {
    oscilloscopeLine = document.createElementNS(svgNamespace, 'path')
    oscilloscopeLine.setAttribute('stroke', LINE_COLOR)
    oscilloscopeLine.setAttribute('stroke-width', LINE_THICKNESS)
    oscilloscopeLine.setAttribute('fill', 'none')
    oscilloscopeLine.setAttribute(
      'style',
      'fill-opacity: 0; filter: url(#glow);',
    )
    oscilloscopeLine.setAttribute('fill-opacity', '0')
    return oscilloscopeLine
  }

  function svgDefinitions() {
    return `
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

        <pattern id="smallGrid" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M 8 0 L 0 0 0 8" fill="none" stroke="gray" stroke-width="0.5"/>
        </pattern>
      </defs>
    `
  }

  function setupGrid(svgNamespace){
    const grid = document.createElementNS(svgNamespace, 'rect')
    grid.setAttribute('width', '100%')
    grid.setAttribute('height', '100%')
    grid.setAttribute('fill', 'url(#smallGrid)')
    grid.classList.add('oscilloscope--grid')
    return grid
  }

  function drawEmptyLine(){
    frequencyData = new Uint8Array(element.clientWidth)
    frequencyData.fill(MEDIAN_FREQUENCY)
    drawLine()
  }

  function drawOscillatingLine(){
    oscilloscope.getByteTimeDomainData(frequencyData)
    drawLine()
  }

  function drawLine() {
    const graphPoints = []
    graphPoints.push('M0, ' + element.offsetHeight / 2)

    const visualizedDataPoints = Math.floor(
      // The line is only <clientWidth> wide, so we can only render every n-th dot
      frequencyData.length / element.clientWidth,
    )

    for (let i = 0; i < frequencyData.length; i += visualizedDataPoints) {
      const pointFrequency = frequencyData[i] / MEDIAN_FREQUENCY
      const centeredPointPosition = pointFrequency * element.offsetHeight / 2
      graphPoints.push(`L${i / visualizedDataPoints}, ${centeredPointPosition}`)
    }

    const graphPointsString = graphPoints.reduce((point, previous) => point + previous)
    oscilloscopeLine.setAttribute('d', graphPointsString)
  }

  function startDrawingLines() {
    if (!oscilloscope) {
      return // The machine has not been initialized yet
    }
    frequencyData = new Uint8Array(oscilloscope.frequencyBinCount)
    drawOscillatingLine()
    drawLineInterval = setInterval(drawOscillatingLine, 1000 / HERTZ)
  }

  function stopDrawingLines() {
    clearInterval(drawLineInterval)
    drawEmptyLine()
  }

  function connectOscilloscope(evt) {
    oscilloscope = evt.oscilloscope
  }

  up.on('oscilloscope:connected', connectOscilloscope)
  up.on('reset:on', startDrawingLines)
  up.on('reset:off', stopDrawingLines)
  init()
})
