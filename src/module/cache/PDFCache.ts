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
import { PDFViewer } from '../viewer/PDFViewer';
import { PDFSettings } from '../settings/PDFSettings';
import { PDFLog } from '../log/PDFLog';

/**
 * Error that occurs during IDB operations
 */
export class IDBHelperError extends Error {
    constructor(index: string, store: string, message?: string) {
        super(`Error in ${index}>${store}: ${message}`);
    }
}

//TODO: Want multiple stores in 1 db
/**
 * Class that deals with getting/setting from an indexed db
 * Mostly exists to separate logic for the PDFCache from logic
 *  dealing with the database
 */
class IDBHelper {
    private _version: number;

    private _indexName: string;
    private _storeName: string;

    private _db: IDBDatabase;

    public static async createAndOpen(indexName: string, storeName: string, version: number) {
        const helper = new IDBHelper(indexName, storeName, version);
        await helper.open();
        return helper;
    }

    public get ready() {
        return this._db !== undefined;
    }

    public constructor(indexName: string, storeName: string, version: number) {
        this._indexName = `${indexName}/${storeName}`;
        this._storeName = storeName;
        this._version = version;
    }

    private newTransaction() {
        const transaction = this._db.transaction(this._storeName, 'readwrite');
        const store = transaction.objectStore(this._storeName);
        return { transaction, store };
    }

    public open(): Promise<void> {
        const that = this;
        return new Promise<void>(function (resolve, reject) {
            const request = indexedDB.open(that._indexName, that._version);
            request.onsuccess = function (event) {
                that._db = this.result;
                resolve();
            };
            request.onupgradeneeded = function (event) {
                that._db = this.result;
                try {
                    // Create object store if it doesn't exist
                    that._db.createObjectStore(that._storeName, {});
                } catch (error) {
                    // Otherwise pass
                }
                resolve();
            };
            request.onerror = function (event) {
                // @ts-ignore
                reject(event.target.error);
            };
        });
    }

    public set(key: IDBValidKey, value: any, force: boolean = false): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!this._db) {
                throw new IDBHelperError(this._indexName, this._storeName, 'Database is not initialized.');
            } else {
                const that = this;
                let { transaction, store } = this.newTransaction();

                // Propagate errors upwards, otherwise they fail silently
                transaction.onerror = function (event) {
                    // @ts-ignore
                    reject(event.target.error);
                };

                const keyRequest = store.getKey(key);
                keyRequest.onsuccess = function (event) {
                    // key already exists in the store
                    if (keyRequest.result) {
                        // should we force the new value by deleting the old?
                        if (force) {
                            that.del(key).then(() => {
                                ({ transaction, store } = that.newTransaction());
                                store.add(value, key);
                                resolve();
                            });
                        } else {
                            throw new IDBHelperError(that._indexName, that._storeName, `Key ${key} already exists.`);
                        }
                    } else {
                        store.add(value, key);
                        resolve();
                    }
                };
            }
        });
    }

    public get(key: IDBValidKey): Promise<any> {
        return new Promise<void>((resolve, reject) => {
            if (!this._db) {
                throw new IDBHelperError(this._indexName, this._storeName, 'Database is not initialized.');
            } else {
                let { transaction, store } = this.newTransaction();

                // Propagate errors upwards, otherwise they fail silently
                transaction.onerror = function (event) {
                    // @ts-ignore
                    reject(event.target.error);
                };

                const getRequest = store.get(key);
                getRequest.onsuccess = function (event) {
                    resolve(this.result);
                };

                getRequest.onerror = function (event) {
                    // @ts-ignore
                    reject(event.target.error);
                };
            }
        });
    }

    public del(key: IDBValidKey): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const { transaction, store } = this.newTransaction();

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

    public clr(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const { store } = this.newTransaction();
                const keys = store.getAllKeys();
                keys.onsuccess = (result) => {
                    const promises: Promise<void>[] = [];
                    for (const key of keys.result) {
                        promises.push(this.del(key));
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
}

/**
 * Meta information about a cache entry
 */
type CacheMeta = {
    size: number;
    dateAccessed: string;
};

/**
 * Handles caching for PDFs
 */
export class PDFCache {
    // <editor-fold desc="Static Properties">
    /**
     * Max size of the cache, defaults to 256 MB.
     */
    public static get MAX_BYTES() {
        return game.settings.get(PDFSettings.EXTERNAL_SYSTEM_NAME, 'CacheSize');
    }

    private static readonly IDB_NAME: string = 'PDFoundry';
    private static readonly IDB_VERSION: number = 1;
    private static readonly IDBSTORE_CACHE_NAME: string = `Cache`;
    private static readonly IDBSTORE_META_NAME: string = `Meta`;

    private static _cacheHelper: IDBHelper;
    private static _metaHelper: IDBHelper;
    // </editor-fold>

    public static async initialize() {
        PDFCache._metaHelper = await IDBHelper.createAndOpen(PDFCache.IDB_NAME, PDFCache.IDBSTORE_META_NAME, PDFCache.IDB_VERSION);
        PDFCache._cacheHelper = await IDBHelper.createAndOpen(PDFCache.IDB_NAME, PDFCache.IDBSTORE_CACHE_NAME, PDFCache.IDB_VERSION);
    }

    public static async getMeta(key: string): Promise<CacheMeta | null> {
        try {
            return await PDFCache._metaHelper.get(key);
        } catch (error) {
            return null;
        }
    }

    public static async setMeta(key: string, meta: CacheMeta): Promise<void> {
        await PDFCache._metaHelper.set(key, meta, true);
    }

    public static async getCache(key: string): Promise<Uint8Array | null> {
        try {
            const bytes = await PDFCache._cacheHelper.get(key);
            const meta: CacheMeta = {
                dateAccessed: new Date().toISOString(),
                size: bytes.length,
            };
            await PDFCache.setMeta(key, meta);
            return bytes;
        } catch (error) {
            return null;
        }
    }

    public static async setCache(key: string, bytes: Uint8Array) {
        PDFLog.warn(`Cached data for ${key}`);
        await PDFCache._cacheHelper.set(key, bytes, true);
        //TODO: Check for + handle 'cache full'
    }

    public static getOrFetch(key: string): Promise<Uint8Array | null> {
        return new Promise<Uint8Array>(async (resolve, reject) => {
            const cachedBytes = await PDFCache.getCache(key);
            if (cachedBytes !== null && cachedBytes.byteLength > 0) {
                resolve(cachedBytes);
                return;
            }

            const response = await fetch(key);
            if (response.ok) {
                const fetchedBytes = new Uint8Array(await response.arrayBuffer());
                if (fetchedBytes.byteLength > 0) {
                    await PDFCache.setCache(key, fetchedBytes);
                    resolve(fetchedBytes);
                    return;
                } else {
                    reject('Cache & fetch both failed.');
                }
            } else {
                reject('Cache & fetch both failed.');
            }
        });
    }

    public static registerSettings() {
        game.settings.register(PDFSettings.EXTERNAL_SYSTEM_NAME, 'CacheSize', {
            name: game.i18n.localize('PDFOUNDRY.SETTINGS.CacheSizeName'),
            scope: 'user',
            type: Number,
            hint: game.i18n.localize('PDFOUNDRY.SETTINGS.CacheSizeHint'),
            default: 256 * 2 ** 20, // 256 MB
            config: true,
        });
    }
}
