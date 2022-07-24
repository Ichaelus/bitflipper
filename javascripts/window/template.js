/***
 * Read a template from the DOM and append the result to the target
***/
window.Template = new (class {
  clone(templateId, targetElement) {
    const template = document.getElementById(templateId)
    const templateContent = template.content
    const deepClonedNode = templateContent.cloneNode(true)
    const elementToClone = deepClonedNode.querySelector('.template-root')
    elementToClone.classList.remove('template-root')
    targetElement.appendChild(elementToClone)
    return elementToClone
  }
})()
