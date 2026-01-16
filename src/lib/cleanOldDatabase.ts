/**
 * Utility to clean old/corrupted IndexedDB database
 * This runs once to fix the schema issue
 */

export const cleanOldDatabase = async (): Promise<void> => {
    try {
        console.log('[DB_CLEANUP] Checking for old database...');

        // Delete the old database to force upgrade
        const deleteRequest = indexedDB.deleteDatabase('HealthBeaconUploads');

        return new Promise((resolve, reject) => {
            deleteRequest.onsuccess = () => {
                console.log('[DB_CLEANUP] ✓ Old database deleted successfully');
                console.log('[DB_CLEANUP] New database will be created with correct schema');
                resolve();
            };

            deleteRequest.onerror = (event) => {
                console.error('[DB_CLEANUP] Failed to delete old database:', event);
                reject(new Error('Failed to delete database'));
            };

            deleteRequest.onblocked = () => {
                console.warn('[DB_CLEANUP] Delete blocked - close all other tabs with this app');
                // Still resolve to not block the app
                resolve();
            };
        });
    } catch (error) {
        console.error('[DB_CLEANUP] Error during cleanup:', error);
        // Don't throw - we want the app to continue even if cleanup fails
    }
};

/**
 * Check if cleanup is needed and run it
 * This checks if we've already run the cleanup in this browser
 */
export const checkAndCleanDatabase = async (): Promise<void> => {
    const CLEANUP_FLAG = 'db_cleanup_v2_done';

    // Check if we've already cleaned up
    const alreadyCleaned = localStorage.getItem(CLEANUP_FLAG);

    if (alreadyCleaned === 'true') {
        console.log('[DB_CLEANUP] Database already cleaned (v2)');
        return;
    }

    console.log('[DB_CLEANUP] Running one-time database cleanup...');
    await cleanOldDatabase();

    // Mark as cleaned
    localStorage.setItem(CLEANUP_FLAG, 'true');
    console.log('[DB_CLEANUP] Cleanup complete and marked');
};
