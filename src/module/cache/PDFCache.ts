/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { PDFViewerBase } from '../viewer/PDFViewerBase';
import { PDFSettings } from '../settings/PDFSettings';

/**
 * An error thrown when a caching operation fails.
 */
export class PDFCacheError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

/**
 * Handles caching for PDFs
 */
export class PDFCache {
    // <editor-fold desc="Static Properties">
    /**
     * Max size of the cache, defaults to 256 MB.
     */
    public static MAX_BYTES: number = 256 * 2 ** 20;

    private static readonly IDB_NAME: string = PDFSettings.INTERNAL_MODULE_NAME;
    private static readonly IDB_VERSION: number = 1;
    private static readonly IDB_STORE_NAME: string = `Cache`;

    private static _idb: IDBDatabase;
    // </editor-fold>

    // <editor-fold desc="'Shims'">
    /**
     * Helper to standardize IndexDB...
     * https://xkcd.com/927/
     */
    private static get IDBFactory(): IDBFactory {
        // @ts-ignore
        return window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
    }

    /**
     * Helper to standardize idbTransaction...
     * https://xkcd.com/927/
     */
    private static get IDBTransaction(): IDBTransaction {
        // @ts-ignore
        return window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;
    }
    // </editor-fold>

    /**
     * Helper to get a new transaction
     */
    private static getTransaction() {
        return this._idb.transaction(PDFCache.IDB_STORE_NAME, 'readwrite');
    }

    /**
     * Helper to get the store for a transaction, reduces boilerplate.
     * @param transaction The transaction to fetch the store for
     */
    private static getStore(transaction: IDBTransaction) {
        return transaction.objectStore(PDFCache.IDB_STORE_NAME);
    }

    /**
     * Commit the value to a specified key in the indexed db
     * @param key The key to use as an index
     * @param data The data to insert
     * @param force If true, will delete an existing object at the specified key,
     *  if one exists. Defaults to false.
     */
    public static async commit(key: IDBValidKey, data: Uint8Array, force: boolean = false): Promise<void> {
        if (this._idb) {
            let transaction = this.getTransaction();

            // Propagate errors upwards, otherwise they fail silently
            transaction.onerror = function (event) {
                // @ts-ignore
                throw event.target.error;
            };

            let store = this.getStore(transaction);
            const keyRequest = store.getKey(key);
            keyRequest.onsuccess = function (event) {
                // if key exists in the store
                if (keyRequest.result) {
                    // should we force the new value by deleting the old?
                    if (force) {
                        PDFCache.delete(key).then(() => {
                            // Deleting something will end our transaction
                            // So we reacquire a new transaction
                            transaction = PDFCache.getTransaction();
                            store = PDFCache.getStore(transaction);

                            store.add(data, key);
                        });
                    } else {
                        throw new PDFCacheError(`Error in commit, ${key} already exists`);
                    }
                } else {
                    store.add(data, key);
                }
            };
        } else {
            throw new PDFCacheError('Error in commit, IDB not initialized');
        }
    }

    /**
     * Delete an object stored in the indexed db at the specified location
     * @param key
     */
    public static delete(key: IDBValidKey): Promise<void> {
        // This *should* be an async method because I use async everywhere else
        // But I find this type of logic easier to interpret with a promise pattern
        //   since the resolve/rejects happen inside callbacks
        return new Promise<void>((resolve, reject) => {
            try {
                const transaction = this.getTransaction();
                const store = this.getStore(transaction);

                transaction.onerror = function (event) {
                    // @ts-ignore
                    reject(event.target.error);
                };
                transaction.oncomplete = function (event) {
                    resolve();
                };

                store.delete(key);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Clear all cached files.
     */
    public static clear(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const transaction = this.getTransaction();
                const store = this.getStore(transaction);
                const keys = store.getAllKeys();
                keys.onsuccess = (result) => {
                    const promises: Promise<void>[] = [];
                    for (const key of keys.result) {
                        promises.push(PDFCache.delete(key));
                    }

                    Promise.all(promises).then(() => {
                        resolve();
                    });
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    public static async initialize() {
        //TODO: Handle errors
        const request = PDFCache.IDBFactory.open(PDFCache.IDB_NAME, PDFCache.IDB_VERSION);
        request.onsuccess = function (event) {
            PDFCache._idb = this.result;
            PDFCache.cache('modules/djs-data/sr5-books/Shadowrun - Assassins Primer.pdf');
            PDFCache.cache('modules/djs-data/sr5-books/Shadowrun - Core Rulebook.pdf');
            PDFCache.cache('modules/djs-data/sr5-books/Shadowrun - Run Faster.pdf');
        };
        request.onupgradeneeded = function (event) {
            PDFCache._idb = this.result;
            try {
                // Create object store if it doesn't exist
                PDFCache._idb.createObjectStore(PDFCache.IDB_STORE_NAME, {});
            } catch (error) {
                // Otherwise pass
            }
        };
    }

    public static async cache(source: PDFViewerBase | string) {
        if (typeof source === 'string') {
            return this._cacheURI(source);
        } else {
            return this._cacheViewer(source);
        }
    }

    private static async _cacheURI(uri: string): Promise<boolean> {
        const response = await fetch(uri);
        const data = new Uint8Array(await response.arrayBuffer());
        await PDFCache.commit(uri, data, true);
        return true;
    }

    private static async _cacheViewer(viewer: PDFViewerBase): Promise<boolean> {
        return Promise.reject();
    }
}
