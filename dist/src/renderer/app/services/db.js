"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbService = void 0;
exports.dbService = {
    songs: {
        async getAll() {
            if (typeof window === 'undefined' || !window.worship?.songs?.getAll)
                return [];
            return window.worship.songs.getAll();
        },
        async create(title, artist, tempo, key) {
            if (typeof window === 'undefined' || !window.worship?.songs?.create) {
                return { id: Date.now(), title, artist, sections: [{ id: 1, type: 'Verse', text: '[C]Verse text' }] };
            }
            return window.worship.songs.create({ title, artist, tempo, key });
        },
        async updateTitle(id, title) {
            if (typeof window === 'undefined' || !window.worship?.songs?.updateTitle)
                return;
            return window.worship.songs.updateTitle({ id, title });
        },
        async delete(id) {
            if (typeof window === 'undefined' || !window.worship?.songs?.delete)
                return;
            return window.worship.songs.delete({ id });
        },
        async addSection(songId, type, text) {
            if (typeof window === 'undefined' || !window.worship?.songs?.addSection) {
                return { id: Date.now(), type, text };
            }
            return window.worship.songs.addSection({ songId, type, text });
        },
        async updateSection(songId, sectionId, patch) {
            if (typeof window === 'undefined' || !window.worship?.songs?.updateSection)
                return;
            return window.worship.songs.updateSection({ songId, sectionId, ...patch });
        },
        async deleteSection(songId, sectionId) {
            if (typeof window === 'undefined' || !window.worship?.songs?.deleteSection)
                return;
            return window.worship.songs.deleteSection({ songId, sectionId });
        },
        async moveSections(songId, sectionIds) {
            if (typeof window === 'undefined' || !window.worship?.songs?.moveSections)
                return;
            return window.worship.songs.moveSections({ songId, sectionIds });
        }
    },
    schedule: {
        async getItems() {
            if (typeof window === 'undefined' || !window.worship?.schedule?.getItems)
                return [];
            const items = await window.worship.schedule.getItems();
            return items.map((item) => ({
                id: item.id,
                type: item.item_type,
                content: item.content
            }));
        },
        async addItem(type, content) {
            if (typeof window === 'undefined' || !window.worship?.schedule?.addItem) {
                return { id: Date.now(), type, content };
            }
            const item = await window.worship.schedule.addItem({ scheduleId: 1, type, content });
            return {
                id: item.id,
                type: item.item_type,
                content: item.content
            };
        },
        async updateItem(id, patch) {
            if (typeof window === 'undefined' || !window.worship?.schedule?.updateItem)
                return;
            return window.worship.schedule.updateItem({ id, ...patch });
        },
        async deleteItem(id) {
            if (typeof window === 'undefined' || !window.worship?.schedule?.deleteItem)
                return;
            return window.worship.schedule.deleteItem({ id });
        },
        async moveItems(itemIds) {
            if (typeof window === 'undefined' || !window.worship?.schedule?.moveItems)
                return;
            return window.worship.schedule.moveItems({ scheduleId: 1, itemIds });
        }
    },
    themes: {
        async getAll() {
            if (typeof window === 'undefined' || !window.worship?.themes?.getAll)
                return [];
            const rows = await window.worship.themes.getAll();
            return rows.map((r) => ({
                name: r.name,
                bg: r.background,
                color: r.text_color || '#ffffff',
                backgroundImage: r.backgroundImage || '',
                fontSize: r.font_size || 42
            }));
        },
        async create(name, theme) {
            if (typeof window === 'undefined' || !window.worship?.themes?.create)
                return;
            return window.worship.themes.create({
                name,
                bg: theme.bg,
                textStyle: 'bold',
                backgroundImage: theme.backgroundImage,
                textColor: theme.color,
                fontSize: theme.fontSize
            });
        }
    },
    media: {
        async getFolders() {
            if (typeof window === 'undefined' || !window.worship?.media?.getFolders)
                return [];
            return window.worship.media.getFolders();
        },
        async createFolder(name, parentId) {
            if (typeof window === 'undefined' || !window.worship?.media?.createFolder)
                return;
            return window.worship.media.createFolder({ name, parentId });
        },
        async getAssets(folderId, type) {
            if (typeof window === 'undefined' || !window.worship?.media?.getAssets)
                return [];
            return window.worship.media.getAssets({ folderId, type });
        },
        async createAsset(path, type, name, duration, folderId, thumbnail) {
            if (typeof window === 'undefined' || !window.worship?.media?.createAsset)
                return;
            return window.worship.media.createAsset({ path, type, name, duration, folderId, thumbnail });
        },
        async deleteAsset(id) {
            if (typeof window === 'undefined' || !window.worship?.media?.deleteAsset)
                return;
            return window.worship.media.deleteAsset({ id });
        }
    }
};
