import { openDB, type DBSchema } from 'idb';

export interface JournalEntry {
	text: string;
	mood?: string;
	images?: Blob[];
}
interface SerializedJournalEntry {
	text: string;
	mood?: string;
	images?: string[];
}

interface JournalDB extends DBSchema {
	entries: {
		key: string;
		value: JournalEntry;
	};
}

function blobToBase64(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

async function base64ToBlob(base64: string): Promise<Blob> {
	const res = await fetch(base64);
	return res.blob();
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

	async exportBackup(): Promise<string> {
		const entries = await this.getAllEntries();

		const exportData: Record<string, SerializedJournalEntry> = {};

		for (const [dateId, entry] of Object.entries(entries)) {
			const currentImages = entry.images || [];
			const imagesBase64 = await Promise.all(currentImages.map(blobToBase64));

			exportData[dateId] = {
				text: entry.text,
				mood: entry.mood,
				images: imagesBase64
			};
		}

		return JSON.stringify(exportData, null, 2);
	},

	async importBackup(jsonString: string): Promise<void> {
		try {
			const data = JSON.parse(jsonString) as Record<string, SerializedJournalEntry>;

			for (const [dateId, entry] of Object.entries(data)) {
				const rawImages = entry.images || [];
				const imagesBlobs = await Promise.all(rawImages.map(base64ToBlob));

				const newEntry: JournalEntry = {
					text: entry.text || '',
					mood: entry.mood,
					images: imagesBlobs
				};

				await this.saveEntry(dateId, newEntry);
			}
		} catch (e) {
			console.error('Import failed', e);
			throw new Error('Invalid backup file');
		}
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

				localStorage.removeItem('journal_entries');
			} catch (e) {
				console.error('Migration failed', e);
			}
		}
	}
};
