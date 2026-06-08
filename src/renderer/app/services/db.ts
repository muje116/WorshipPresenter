import { Song, Section, ScheduleItem, Theme } from '../store'

declare const window: any

export const dbService = {
  songs: {
    async getAll(): Promise<Song[]> {
      if (typeof window === 'undefined' || !window.worship?.songs?.getAll) return []
      return window.worship.songs.getAll()
    },

    async create(title: string, artist?: string, tempo?: number, key?: string): Promise<Song> {
      if (typeof window === 'undefined' || !window.worship?.songs?.create) {
        return { id: Date.now(), title, artist, sections: [{ id: 1, type: 'Verse', text: '[C]Verse text' }] }
      }
      return window.worship.songs.create({ title, artist, tempo, key })
    },

    async updateTitle(id: number, title: string): Promise<void> {
      if (typeof window === 'undefined' || !window.worship?.songs?.updateTitle) return
      return window.worship.songs.updateTitle({ id, title })
    },

    async delete(id: number): Promise<void> {
      if (typeof window === 'undefined' || !window.worship?.songs?.delete) return
      return window.worship.songs.delete({ id })
    },

    async addSection(songId: number, type: string, text: string): Promise<Section> {
      if (typeof window === 'undefined' || !window.worship?.songs?.addSection) {
        return { id: Date.now(), type, text }
      }
      return window.worship.songs.addSection({ songId, type, text })
    },

    async updateSection(songId: number, sectionId: number, patch: { type?: string; text?: string }): Promise<void> {
      if (typeof window === 'undefined' || !window.worship?.songs?.updateSection) return
      return window.worship.songs.updateSection({ songId, sectionId, ...patch })
    },

    async deleteSection(songId: number, sectionId: number): Promise<void> {
      if (typeof window === 'undefined' || !window.worship?.songs?.deleteSection) return
      return window.worship.songs.deleteSection({ songId, sectionId })
    },

    async moveSections(songId: number, sectionIds: number[]): Promise<void> {
      if (typeof window === 'undefined' || !window.worship?.songs?.moveSections) return
      return window.worship.songs.moveSections({ songId, sectionIds })
    }
  },

  schedule: {
    async getItems(): Promise<ScheduleItem[]> {
      if (typeof window === 'undefined' || !window.worship?.schedule?.getItems) return []
      const items = await window.worship.schedule.getItems()
      return items.map((item: any) => ({
        id: item.id,
        type: item.item_type,
        content: item.content
      }))
    },

    async addItem(type: string, content: string): Promise<ScheduleItem> {
      if (typeof window === 'undefined' || !window.worship?.schedule?.addItem) {
        return { id: Date.now(), type, content }
      }
      const item = await window.worship.schedule.addItem({ scheduleId: 1, type, content })
      return {
        id: item.id,
        type: item.item_type,
        content: item.content
      }
    },

    async updateItem(id: number, patch: { type?: string; content?: string }): Promise<void> {
      if (typeof window === 'undefined' || !window.worship?.schedule?.updateItem) return
      return window.worship.schedule.updateItem({ id, ...patch })
    },

    async deleteItem(id: number): Promise<void> {
      if (typeof window === 'undefined' || !window.worship?.schedule?.deleteItem) return
      return window.worship.schedule.deleteItem({ id })
    },

    async moveItems(itemIds: number[]): Promise<void> {
      if (typeof window === 'undefined' || !window.worship?.schedule?.moveItems) return
      return window.worship.schedule.moveItems({ scheduleId: 1, itemIds })
    }
  },

  themes: {
    async getAll(): Promise<Theme[]> {
      if (typeof window === 'undefined' || !window.worship?.themes?.getAll) return []
      const rows = await window.worship.themes.getAll()
      return rows.map((r: any) => ({
        name: r.name,
        bg: r.background,
        color: r.text_color || '#ffffff',
        backgroundImage: r.backgroundImage || '',
        fontSize: r.font_size || 42
      }))
    },

    async create(name: string, theme: Theme): Promise<any> {
      if (typeof window === 'undefined' || !window.worship?.themes?.create) return
      return window.worship.themes.create({
        name,
        bg: theme.bg,
        textStyle: 'bold',
        backgroundImage: theme.backgroundImage,
        textColor: theme.color,
        fontSize: theme.fontSize
      })
    }
  },

  media: {
    async getFolders(): Promise<any[]> {
      if (typeof window === 'undefined' || !window.worship?.media?.getFolders) return []
      return window.worship.media.getFolders()
    },

    async createFolder(name: string, parentId?: number | null): Promise<any> {
      if (typeof window === 'undefined' || !window.worship?.media?.createFolder) return
      return window.worship.media.createFolder({ name, parentId })
    },

    async getAssets(folderId?: number | null, type?: string): Promise<any[]> {
      if (typeof window === 'undefined' || !window.worship?.media?.getAssets) return []
      return window.worship.media.getAssets({ folderId, type })
    },

    async createAsset(path: string, type: string, name: string, duration?: number | null, folderId?: number | null, thumbnail?: string): Promise<any> {
      if (typeof window === 'undefined' || !window.worship?.media?.createAsset) return
      return window.worship.media.createAsset({ path, type, name, duration, folderId, thumbnail })
    },

    async deleteAsset(id: number): Promise<void> {
      if (typeof window === 'undefined' || !window.worship?.media?.deleteAsset) return
      return window.worship.media.deleteAsset({ id })
    }
  }
}
