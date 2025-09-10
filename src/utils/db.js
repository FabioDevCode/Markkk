import { openDB } from "idb";

const DB_NAME = "markkk-db";
const STORE_NAME = "documents";
const VERSION = 1;

export const initDB = async () => {
	return openDB(DB_NAME, VERSION, {
		upgrade(db) {
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: "id" });
			}
		},
	});
};

export const saveDocument = async (content, named = null) => {
	const db = await initDB();
	const id = crypto.randomUUID(); // identifiant unique
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
	return db.getAll(STORE_NAME);
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
