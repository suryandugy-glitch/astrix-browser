import { Menu, MenuItem, WebContents, clipboard } from 'electron'

export function setupWebContextMenu(
  webContents: WebContents,
  onOpenNewTab: (url: string) => void
): void {
  webContents.on('context-menu', (_event, params) => {
    const menu = new Menu()

    // If right clicked on a link
    if (params.linkURL) {
      menu.append(
        new MenuItem({
          label: 'Open Link in New Tab',
          click: () => onOpenNewTab(params.linkURL)
        })
      )
      menu.append(
        new MenuItem({
          label: 'Copy Link Address',
          click: () => clipboard.writeText(params.linkURL)
        })
      )
      menu.append(new MenuItem({ type: 'separator' }))
    }

    // If right clicked on an image
    if (params.hasImageContents && params.srcURL) {
      menu.append(
        new MenuItem({
          label: 'Open Image in New Tab',
          click: () => onOpenNewTab(params.srcURL)
        })
      )
      menu.append(
        new MenuItem({
          label: 'Copy Image Address',
          click: () => clipboard.writeText(params.srcURL)
        })
      )
      menu.append(new MenuItem({ type: 'separator' }))
    }

    // Text selection actions
    if (params.selectionText) {
      menu.append(new MenuItem({ role: 'copy' }))
      menu.append(
        new MenuItem({
          label: `Search Google for "${params.selectionText.substring(0, 24)}..."`,
          click: () =>
            onOpenNewTab(
              `https://www.google.com/search?q=${encodeURIComponent(params.selectionText)}`
            )
        })
      )
      menu.append(new MenuItem({ type: 'separator' }))
    } else if (params.isEditable) {
      menu.append(new MenuItem({ role: 'undo' }))
      menu.append(new MenuItem({ role: 'redo' }))
      menu.append(new MenuItem({ type: 'separator' }))
      menu.append(new MenuItem({ role: 'cut' }))
      menu.append(new MenuItem({ role: 'copy' }))
      menu.append(new MenuItem({ role: 'paste' }))
      menu.append(new MenuItem({ role: 'selectAll' }))
      menu.append(new MenuItem({ type: 'separator' }))
    }

    // Standard Navigation
    if (webContents.canGoBack()) {
      menu.append(
        new MenuItem({
          label: 'Back',
          click: () => webContents.goBack()
        })
      )
    }
    if (webContents.canGoForward()) {
      menu.append(
        new MenuItem({
          label: 'Forward',
          click: () => webContents.goForward()
        })
      )
    }
    menu.append(
      new MenuItem({
        label: 'Reload',
        click: () => webContents.reload()
      })
    )
    menu.append(new MenuItem({ type: 'separator' }))

    // Print
    menu.append(
      new MenuItem({
        label: 'Print...',
        accelerator: 'CmdOrCtrl+P',
        click: () => webContents.print()
      })
    )

    // Inspect Element
    menu.append(new MenuItem({ type: 'separator' }))
    menu.append(
      new MenuItem({
        label: 'Inspect Element',
        click: () => {
          webContents.inspectElement(params.x, params.y)
          if (!webContents.isDevToolsOpened()) {
            webContents.openDevTools({ mode: 'right' })
          }
        }
      })
    )

    menu.popup()
  })
}
