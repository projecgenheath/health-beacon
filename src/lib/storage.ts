export const storePendingFile = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Wrap in a try-catch for immediate failures
        try {
            const request = indexedDB.open('HealthBeaconUploads', 2);

            request.onupgradeneeded = (event) => {
                console.log('[Storage] Upgrading IndexedDB...');
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('pendingFiles')) {
                    db.createObjectStore('pendingFiles', { keyPath: 'id' });
                    console.log('[Storage] Store created.');
                }
            };

            request.onblocked = () => {
                console.warn('[Storage] IndexedDB open blocked');
                resolve(); // Don't hang the app, just resolve
            };

            request.onsuccess = (event) => {
                console.log('[Storage] IndexedDB opened successfully for store.');
                const db = (event.target as IDBOpenDBRequest).result;
                try {
                    const transaction = db.transaction('pendingFiles', 'readwrite');
                    const store = transaction.objectStore('pendingFiles');

                    const fileData = {
                        id: 'pending-exam',
                        file: file,
                        name: file.name,
                        type: file.type,
                        timestamp: Date.now()
                    };

                    console.log('[Storage] Storing file...');
                    const putRequest = store.put(fileData);
                    putRequest.onsuccess = () => {
                        console.log('[Storage] File stored successfully.');
                        resolve();
                    };
                    putRequest.onerror = (error) => {
                        console.error('[Storage] Failed to store file:', error);
                        reject(new Error('Failed to store file'));
                    };
                } catch (e) {
                    console.error('[Storage] Error during store transaction:', e);
                    reject(e);
                }
            };

            request.onerror = (e) => {
                console.error('[Storage] IndexedDB error during store:', e);
                reject(new Error('Failed to open IndexedDB'));
            };
        } catch (e) {
            console.error('[Storage] Unexpected error during store:', e);
            reject(e);
        }
    });
};

export const getPendingFile = async (): Promise<File | null> => {
    return new Promise((resolve) => {
        try {
            const request = indexedDB.open('HealthBeaconUploads', 2);

            request.onupgradeneeded = (event) => {
                console.log('[Storage] Upgrading IndexedDB (read)...');
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('pendingFiles')) {
                    db.createObjectStore('pendingFiles', { keyPath: 'id' });
                    console.log('[Storage] Store created (read).');
                }
            };

            request.onblocked = () => {
                console.warn('[Storage] Read blocked');
                resolve(null);
            };

            request.onsuccess = (event) => {
                console.log('[Storage] IndexedDB opened for read.');
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('pendingFiles')) {
                    console.warn('[Storage] Store not found during read.');
                    resolve(null);
                    return;
                }

                try {
                    const transaction = db.transaction('pendingFiles', 'readonly');
                    const store = transaction.objectStore('pendingFiles');
                    console.log('[Storage] Attempting to retrieve file...');
                    const getRequest = store.get('pending-exam');

                    getRequest.onsuccess = () => {
                        const result = getRequest.result;
                        if (result && result.file) {
                            console.log('[Storage] Retrieved data:', result);
                            // Reconstruct File to ensure name and type are correct
                            // IndexedDB stores Files, but sometimes metadata can be tricky if it degrades to Blob
                            try {
                                const reconstructedFile = new File([result.file], result.name, {
                                    type: result.type,
                                    lastModified: result.timestamp
                                });
                                console.log('[Storage] Reconstructed file:', reconstructedFile.name, reconstructedFile.type);
                                resolve(reconstructedFile);
                            } catch (e) {
                                console.error('[Storage] Error reconstructing file:', e);
                                // Fallback to the stored object if it's already a File
                                resolve(result.file instanceof File ? result.file : null);
                            }
                        } else {
                            console.log('[Storage] No file in result');
                            resolve(null);
                        }
                    };
                    getRequest.onerror = () => resolve(null);
                } catch (e) {
                    console.error('Get file error:', e);
                    resolve(null);
                }
            };

            request.onerror = () => resolve(null);
        } catch (e) {
            resolve(null);
        }
    });
};

export const clearPendingFile = async (): Promise<void> => {
    return new Promise((resolve) => {
        try {
            const request = indexedDB.open('HealthBeaconUploads', 2);

            request.onupgradeneeded = (event) => {
                console.log('[Storage] Upgrading IndexedDB (clear)...');
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('pendingFiles')) {
                    db.createObjectStore('pendingFiles', { keyPath: 'id' });
                    console.log('[Storage] Store created (clear).');
                }
            };

            request.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('pendingFiles')) {
                    resolve();
                    return;
                }

                try {
                    const transaction = db.transaction('pendingFiles', 'readwrite');
                    const store = transaction.objectStore('pendingFiles');
                    const deleteRequest = store.delete('pending-exam');

                    deleteRequest.onsuccess = () => resolve();
                    deleteRequest.onerror = () => resolve();
                } catch (e) {
                    resolve();
                }
            };

            request.onerror = () => resolve();
            request.onblocked = () => resolve();
        } catch (e) {
            resolve();
        }
    });
};
