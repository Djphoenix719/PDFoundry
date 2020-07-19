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

import { CacheError } from './CacheError';

/**
 * Class that deals with getting/setting from an indexed db
 * Mostly exists to separate logic for the PDFCache from logic
 * dealing with the database
 * @private
 */
export default class CacheHelper {
    private _version: number;

    private readonly _indexName: string;
    private readonly _storeNames: string[];

    private _db: IDBDatabase;

    public static async createAndOpen(indexName: string, storeNames: string[], version: number) {
        const helper = new CacheHelper(indexName, storeNames, version);
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
                throw new CacheError(this._indexName, storeName, 'Database is not initialized.');
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
                            throw new CacheError(that._indexName, storeName, `Key ${key} already exists.`);
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
                throw new CacheError(this._indexName, storeName, 'Database is not initialized.');
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
