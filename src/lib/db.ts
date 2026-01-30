import { openDB, type DBSchema } from 'idb';

export interface JournalEntry {
	text: string;
	mood?: string;
	images?: Blob[];
}

interface JournalDB extends DBSchema {
	entries: {
		key: string;
		value: JournalEntry;
	};
}

const DB_NAME = 'journal_db';
const STORE_NAME = 'entries';

export const db = {
	async getDB() {
		return openDB<JournalDB>(DB_NAME, 1, {
			upgrade(db) {
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME);
				}
			}
		});
	},

	async getAllEntries() {
		const db = await this.getDB();
		const keys = await db.getAllKeys(STORE_NAME);
		const values = await db.getAll(STORE_NAME);

		const entries: Record<string, JournalEntry> = {};
		keys.forEach((key, index) => {
			entries[key as string] = values[index];
		});

		return entries;
	},

	async saveEntry(dateId: string, entry: JournalEntry) {
		const db = await this.getDB();
		return db.put(STORE_NAME, entry, dateId);
	},

	async deleteEntry(dateId: string) {
		const db = await this.getDB();
		return db.delete(STORE_NAME, dateId);
	},

	async migrateFromLocalStorage() {
		if (typeof window === 'undefined') return;

		const stored = localStorage.getItem('journal_entries');
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				const db = await this.getDB();
				const tx = db.transaction(STORE_NAME, 'readwrite');

				for (const [key, val] of Object.entries(parsed)) {
					const oldVal = val as { text: string; mood?: string };

					const newEntry: JournalEntry = {
						text: oldVal.text,
						mood: oldVal.mood,
						images: []
					};

					await tx.store.put(newEntry, key);
				}
				await tx.done;

				console.log('Migration to IndexedDB successful');
				localStorage.removeItem('journal_entries');
			} catch (e) {
				console.error('Migration failed', e);
			}
		}
	}
};
