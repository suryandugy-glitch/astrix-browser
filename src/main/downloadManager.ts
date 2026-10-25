import { session, shell, BrowserWindow, DownloadItem } from 'electron'

export interface DownloadRecord {
  id: string
  filename: string
  savePath: string
  totalBytes: number
  receivedBytes: number
  percent: number
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted'
  url: string
  startTime: number
  isPaused: boolean
}

export class DownloadManager {
  private mainWindow: BrowserWindow | null = null
  private downloads: Map<string, { record: DownloadRecord; item?: DownloadItem }> = new Map()

  constructor() {
    this.setupDownloadHandler()
  }

  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  private setupDownloadHandler(): void {
    session.defaultSession.on('will-download', (_event, item) => {
      const id = `dl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      const filename = item.getFilename()
      const totalBytes = item.getTotalBytes()

      const record: DownloadRecord = {
        id,
        filename,
        savePath: item.getSavePath(),
        totalBytes,
        receivedBytes: 0,
        percent: 0,
        state: 'progressing',
        url: item.getURL(),
        startTime: Date.now(),
        isPaused: false
      }

      this.downloads.set(id, { record, item })
      this.notifyDownloadUpdate()

      item.on('updated', (_event, state) => {
        const entry = this.downloads.get(id)
        if (!entry) return

        entry.record.receivedBytes = item.getReceivedBytes()
        entry.record.totalBytes = item.getTotalBytes()
        entry.record.percent =
          entry.record.totalBytes > 0
            ? Math.round((entry.record.receivedBytes / entry.record.totalBytes) * 100)
            : 0
        entry.record.isPaused = item.isPaused()

        if (state === 'interrupted') {
          entry.record.state = 'interrupted'
        } else if (state === 'progressing') {
          entry.record.state = 'progressing'
        }

        this.notifyDownloadUpdate()
      })

      item.once('done', (_event, state) => {
        const entry = this.downloads.get(id)
        if (!entry) return

        entry.record.savePath = item.getSavePath()
        if (state === 'completed') {
          entry.record.state = 'completed'
          entry.record.percent = 100
        } else if (state === 'cancelled') {
          entry.record.state = 'cancelled'
        } else {
          entry.record.state = 'interrupted'
        }

        this.notifyDownloadUpdate()
      })
    })
  }

  private notifyDownloadUpdate(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return
    this.mainWindow.webContents.send('download:updated', this.getDownloads())
  }

  public getDownloads(): DownloadRecord[] {
    return Array.from(this.downloads.values()).map((e) => ({ ...e.record }))
  }

  public cancel(id: string): void {
    const entry = this.downloads.get(id)
    if (entry && entry.item && entry.record.state === 'progressing') {
      entry.item.cancel()
    }
  }

  public pause(id: string): void {
    const entry = this.downloads.get(id)
    if (entry && entry.item && entry.record.state === 'progressing') {
      entry.item.pause()
    }
  }

  public resume(id: string): void {
    const entry = this.downloads.get(id)
    if (entry && entry.item && entry.record.state === 'progressing') {
      entry.item.resume()
    }
  }

  public openInFolder(id: string): void {
    const entry = this.downloads.get(id)
    if (entry && entry.record.savePath) {
      shell.showItemInFolder(entry.record.savePath)
    }
  }
}
