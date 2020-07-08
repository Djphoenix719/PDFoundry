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

/**
 * Class that deals with getting/setting from an indexed db
 * Mostly exists to separate logic for the PDFCache from logic
 *  dealing with the database
 */
class IDBHelper {
    private _version: number;

    private readonly _indexName: string;
    private readonly _storeNames: string[];

    private _db: IDBDatabase;

    public static async createAndOpen(indexName: string, storeNames: string[], version: number) {
        const helper = new IDBHelper(indexName, storeNames, version);
        await helper.open();
        return helper;
    }

    public get ready() {
        return this._db !== undefined;
    }

    public constructor(indexName: string, storeNames: string[], version: number) {
        this._indexName = `${indexName}`;
        this._storeNames = storeNames;
        this._version = version;
    }

    private newTransaction(storeName: string) {
        const transaction = this._db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
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
                for (let i = 0; i < that._storeNames.length; i++) {
                    try {
                        // Create object store if it doesn't exist
                        that._db.createObjectStore(that._storeNames[i], {});
                    } catch (error) {
                        // Otherwise pass
                    }
                }
                resolve();
            };
            request.onerror = function (event) {
                // @ts-ignore
                reject(event.target.error);
            };
        });
    }

    public set(key: IDBValidKey, value: any, storeName: string, force: boolean = false): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!this._db) {
                throw new IDBHelperError(this._indexName, storeName, 'Database is not initialized.');
            } else {
                const that = this;
                let { transaction, store } = this.newTransaction(storeName);

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
                            that.del(key, storeName).then(() => {
                                ({ transaction, store } = that.newTransaction(storeName));
                                store.add(value, key);
                                resolve();
                            });
                        } else {
                            throw new IDBHelperError(that._indexName, storeName, `Key ${key} already exists.`);
                        }
                    } else {
                        store.add(value, key);
                        resolve();
                    }
                };
            }
        });
    }

    public get(key: IDBValidKey, storeName: string): Promise<any> {
        return new Promise<void>((resolve, reject) => {
            if (!this._db) {
                throw new IDBHelperError(this._indexName, storeName, 'Database is not initialized.');
            } else {
                let { transaction, store } = this.newTransaction(storeName);

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

    public del(key: IDBValidKey, storeName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const { transaction, store } = this.newTransaction(storeName);

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

    public keys(storeName: string): Promise<IDBValidKey[]> {
        return new Promise<IDBValidKey[]>((resolve, reject) => {
            try {
                const { transaction, store } = this.newTransaction(storeName);
                const keysRequest = store.getAllKeys();

                keysRequest.onsuccess = function () {
                    resolve(keysRequest.result);
                };
                keysRequest.onerror = function (event) {
                    // @ts-ignore
                    reject(event.target.error);
                };

                return;
            } catch (error) {
                reject(error);
            }
        });
    }

    public clr(storeName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const { store } = this.newTransaction(storeName);
                const keys = store.getAllKeys();
                keys.onsuccess = (result) => {
                    const promises: Promise<void>[] = [];
                    for (const key of keys.result) {
                        promises.push(this.del(key, storeName));
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
        return game.settings.get(PDFSettings.EXTERNAL_SYSTEM_NAME, 'CacheSize') * 2 ** 20;
    }

    private static readonly IDB_NAME: string = 'PDFoundry';
    private static readonly IDB_VERSION: number = 1;

    private static readonly CACHE: string = `Cache`;
    private static readonly META: string = `Meta`;

    private static _cacheHelper: IDBHelper;
    // </editor-fold>

    public static async initialize() {
        PDFCache._cacheHelper = await IDBHelper.createAndOpen(PDFCache.IDB_NAME, [PDFCache.CACHE, PDFCache.META], PDFCache.IDB_VERSION);
    }

    public static async getMeta(key: string): Promise<CacheMeta | null> {
        try {
            return await PDFCache._cacheHelper.get(key, PDFCache.META);
        } catch (error) {
            return null;
        }
    }

    public static async setMeta(key: string, meta: CacheMeta): Promise<void> {
        await PDFCache._cacheHelper.set(key, meta, PDFCache.META, true);
    }

    public static async getCache(key: string): Promise<Uint8Array | null> {
        try {
            const bytes = await PDFCache._cacheHelper.get(key, PDFCache.CACHE);
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
        const meta: CacheMeta = {
            dateAccessed: new Date().toISOString(),
            size: bytes.length,
        };

        await PDFCache._cacheHelper.set(key, bytes, PDFCache.CACHE, true);
        await PDFCache.setMeta(key, meta);
        await this.prune();
    }

    public static preload(key: string): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            const cachedBytes = await PDFCache.getCache(key);
            if (cachedBytes !== null && cachedBytes.byteLength > 0) {
                resolve();
                return;
            }

            const response = await fetch(key);
            if (response.ok) {
                const fetchedBytes = new Uint8Array(await response.arrayBuffer());
                if (fetchedBytes.byteLength > 0) {
                    await PDFCache.setCache(key, fetchedBytes);
                    resolve();
                    return;
                } else {
                    reject('Fetch failed.');
                }
            } else {
                reject('Fetch failed.');
            }
        });
    }

    private static async prune() {
        const keys = await this._cacheHelper.keys(PDFCache.META);

        let totalBytes = 0;
        let metas: any[] = [];
        for (const key of keys) {
            const meta = await this._cacheHelper.get(key, PDFCache.META);
            meta.dateAccessed = Date.parse(meta.dateAccessed);
            meta.size = parseInt(meta.size);

            totalBytes += meta.size;

            metas.push({
                key,
                meta,
            });
        }

        metas = metas.sort((a, b) => {
            return a.meta.dateAccessed - b.meta.dateAccessed;
        });

        for (let i = 0; i < metas.length; i++) {
            if (totalBytes < PDFCache.MAX_BYTES) {
                break;
            }

            const next = metas[i];

            await this._cacheHelper.del(next.key, PDFCache.META);
            await this._cacheHelper.del(next.key, PDFCache.CACHE);

            totalBytes -= next.meta.size;

            PDFLog.warn(`Pruned ${next.meta.size} bytes by deleting ${next.key}`);
        }
    }

    public static registerSettings() {
        game.settings.register(PDFSettings.EXTERNAL_SYSTEM_NAME, 'CacheSize', {
            name: game.i18n.localize('PDFOUNDRY.SETTINGS.CacheSizeName'),
            scope: 'user',
            type: Number,
            hint: game.i18n.localize('PDFOUNDRY.SETTINGS.CacheSizeHint'),
            default: 256,
            config: true,
            onChange: async (mb) => {
                mb = Math.round(mb);
                mb = Math.max(mb, 64);
                mb = Math.min(mb, 1024);
                await game.settings.set(PDFSettings.EXTERNAL_SYSTEM_NAME, 'CacheSize', mb);
            },
        });
    }
}
