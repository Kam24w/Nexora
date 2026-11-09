/**
 * Imprime un documento HTML independiente en un iframe oculto: el diálogo del navegador
 * permite guardarlo como PDF con el diseño del documento, no el de la pantalla.
 */
export const printDocument = (html: string): Promise<void> =>
  new Promise((resolve) => {
    const frame = document.createElement('iframe')
    frame.setAttribute('aria-hidden', 'true')
    frame.tabIndex = -1
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'

    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      frame.remove()
      resolve()
    }

    frame.onload = () => {
      const view = frame.contentWindow
      if (!view) return finish()
      view.addEventListener('afterprint', () => window.setTimeout(finish, 0), { once: true })
      view.focus()
      view.print()
      // Algunos navegadores no emiten `afterprint` si se cancela el diálogo.
      window.setTimeout(finish, 60_000)
    }

    frame.srcdoc = html
    document.body.appendChild(frame)
  })
