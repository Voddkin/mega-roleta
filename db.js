// --- INDEXEDDB STORAGE (High capacity for images) ---
const DB_NAME = 'MegaRouletteDB';
const DB_VERSION = 1;
const STORE_NAME = 'appState';

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error('Erro ao abrir IndexedDB:', event.target.error);
            reject(event.target.error);
        };
    });
}

async function saveToDB(state) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(state, 'mainState');

            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error('Falha ao salvar no IndexedDB', err);
        // Fallback to localStorage se der ruim
        localStorage.setItem('megaRouletteData', JSON.stringify(state));
    }
}

async function loadFromDB() {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get('mainState');

            request.onsuccess = () => {
                let data = request.result;
                if (!data) {
                    // Tenta migrar do localStorage
                    const saved = localStorage.getItem('megaRouletteData');
                    if (saved) {
                        try {
                            data = JSON.parse(saved);
                            // Salva no IndexedDB para as proximas vezes
                            saveToDB(data);
                        } catch(e) {}
                    }
                }
                resolve(data);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error('Falha ao carregar do IndexedDB', err);
        const saved = localStorage.getItem('megaRouletteData');
        return saved ? JSON.parse(saved) : null;
    }
}
