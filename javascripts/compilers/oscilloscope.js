// Inspired by Wavy Jones

up.compiler('.oscilloscope', function (element) {
  let interval, oscilloscopeLine, oscilloscope, freqData;
  const noDataPoints = 10;
  const lineColor = 'white';
  const lineThickness = 1;

  function init() {
    setUpSVG();
    drawLine('zero');
  }

  function setUpSVG() {
    const svgNamespace = "http://www.w3.org/2000/svg";
    const paper = document.createElementNS(svgNamespace, "svg");
    paper.setAttribute('width', element.offsetWidth);
    paper.setAttribute('height', element.offsetHeight);
    paper.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
    element.appendChild(paper);

    oscilloscopeLine = document.createElementNS(svgNamespace, "path");
    oscilloscopeLine.setAttribute("stroke", lineColor);
    oscilloscopeLine.setAttribute("stroke-width", lineThickness);
    oscilloscopeLine.setAttribute("fill", "none");
    paper.appendChild(oscilloscopeLine);
  }

  function drawLine(type) {
    const graphPoints = [];
    let graphStr = '';

    if(type === 'zero'){
      freqData = new Uint8Array(1024);
      freqData.fill(128);
    }else{
      oscilloscope.getByteTimeDomainData(freqData);
    }

    graphPoints.push('M0, ' + (element.offsetHeight / 2));

    for (let i = 0; i < freqData.length; i++) {
      if (i % noDataPoints) {
        let point = (freqData[i] / 128) * (element.offsetHeight / 2);
        graphPoints.push('L' + i + ', ' + point);
      }
    }

    for (i = 0; i < graphPoints.length; i++) {
      graphStr += graphPoints[i];
    }

    oscilloscopeLine.setAttribute("d", graphStr);
  }

  function drawLines() {
    drawLine();
    interval = setInterval(drawLine, 100);
  }

  function stopDrawingLines() {
    clearInterval(interval);
    drawLine('zero');
  }

  function connectOscilloscope(evt){
    oscilloscope = evt.oscilloscope;
    freqData = new Uint8Array(oscilloscope.frequencyBinCount);
  }

  up.on('reset:on', drawLines);
  up.on('reset:off', stopDrawingLines);
  up.on('oscilloscope:connected', connectOscilloscope);
  init();
});