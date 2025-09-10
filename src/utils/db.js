import { openDB } from "idb";

const DB_NAME = "markkk-db";
const STORE_NAME = "documents";
const THEME_STORE = "theme";
const VERSION = 2;

export const initDB = async () => {
	return openDB(DB_NAME, VERSION, {
		upgrade(db) {
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: "id" });
			}
			if (!db.objectStoreNames.contains(THEME_STORE)) {
				db.createObjectStore(THEME_STORE, { keyPath: "id" });
			}
		},
	});
};

export const saveDocument = async (content, named = null) => {
	const db = await initDB();
	const id = crypto.randomUUID();
	const name = named || "doc-" + Math.random().toString(36).substring(2, 8);

	const doc = {
		id,
		name,
		content,
		createdAt: new Date().toISOString(),
	};

	await db.add(STORE_NAME, doc);
	return doc;
};

export const getDocuments = async () => {
	const db = await initDB();
	const docs = await db.getAll(STORE_NAME);
	docs.sort((a, b) => {
		const dateA = a.updatedAt || a.createdAt;
		const dateB = b.updatedAt || b.createdAt;
		return new Date(dateB) - new Date(dateA);
	});
	return docs;
};

// Peut inutile
export const getDocument = async (id) => {
	const db = await initDB();
	return db.get(STORE_NAME, id);
};

export const deleteDocument = async (id) => {
	const db = await initDB();
	return db.delete(STORE_NAME, id);
};

// Met à jour un document existant
export const updateDocument = async (doc) => {
	const db = await initDB();
	return db.put(STORE_NAME, doc);
};

// Gestion du thème
export const saveTheme = async (theme) => {
	const db = await initDB();
	await db.put(THEME_STORE, { id: "selected", value: theme });
};

export const getTheme = async () => {
	const db = await initDB();
	const themeObj = await db.get(THEME_STORE, "selected");
	if (!themeObj) {
		await db.put(THEME_STORE, { id: "selected", value: "dim" });
		return "dim";
	}
	return themeObj.value;
};
