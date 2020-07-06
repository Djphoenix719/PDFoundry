(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFoundryAPI = exports.PDFoundryAPIError = void 0;
const PDFSettings_1 = require("../settings/PDFSettings");
const PDFViewer_1 = require("../viewer/PDFViewer");
const PDFLog_1 = require("../log/PDFLog");
const PDFCache_1 = require("../cache/PDFCache");
class PDFoundryAPIError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.PDFoundryAPIError = PDFoundryAPIError;
class PDFoundryAPI {
    /**
     * Register your system with the API.
     * @param system The module YOU are calling this from.
     */
    static registerSystem(system) {
        return __awaiter(this, void 0, void 0, function* () {
            PDFSettings_1.PDFSettings.EXTERNAL_SYSTEM_NAME = system;
        });
    }
    /**
     * Get an object containing the user specified PDF data for a specific PDF code.
     * @param code
     */
    static getPDFData(code) {
        const entity = game.items.find((item) => {
            return item.data.type === PDFSettings_1.PDFSettings.PDF_ENTITY_TYPE && item.data.data.code === code;
        });
        if (entity === undefined || entity === null) {
            return null;
        }
        const data = entity.data.data;
        if (data.offset === '') {
            data.offset = 0;
        }
        data.offset = parseInt(data.offset);
        data.name = entity.name;
        return data;
    }
    /**
     * Helper method. Convert a relative URL to a absolute URL
     *  by prepending the window origin to the relative URL.
     * @param url
     */
    static getAbsoluteURL(url) {
        return `${window.origin}/${url}`;
    }
    /**
     * Open a PDF by code to the specified page.
     * @param code
     * @param page
     */
    static open(code, page = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            PDFLog_1.PDFLog.warn(`Opening ${code} at page ${page}.`);
            const pdf = this.getPDFData(code);
            if (pdf === null) {
                throw new PDFoundryAPIError(`Unable to find a PDF with the code "${code}. Did the user declare it?`);
            }
            const { url, offset, cache } = pdf;
            // coerce to number; safety first
            page = offset + parseInt(page.toString());
            return this.openURL(this.getAbsoluteURL(url), page, cache);
        });
    }
    /**
     * Open a PDF by URL to the specified page.
     * @param url The url to open
     * @param page The page to open to
     * @param useCache If caching should be used
     */
    static openURL(url, page = 1, useCache = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (url === undefined) {
                throw new PDFoundryAPIError('Unable to open PDF; "url" must be defined');
            }
            // coerce to number; safety first
            page = parseInt(page.toString());
            if (isNaN(page) || page <= 0) {
                throw new PDFoundryAPIError(`Page must be > 0, but ${page} was given.`);
            }
            // Open the viewer
            const viewer = new PDFViewer_1.PDFViewer();
            viewer.render(true);
            if (useCache) {
                const cache = yield PDFCache_1.PDFCache.getCache(url);
                // If we have a cache hit open the cached data
                if (cache) {
                    yield viewer.open(cache, page);
                }
                else {
                    // Otherwise we should open it by url
                    yield viewer.open(url, page);
                    // And when the download is complete set the cache
                    viewer.download().then((bytes) => {
                        PDFCache_1.PDFCache.setCache(url, bytes);
                    });
                }
            }
            else {
                yield viewer.open(url, page);
            }
            return viewer;
        });
    }
}
exports.PDFoundryAPI = PDFoundryAPI;
},{"../cache/PDFCache":3,"../log/PDFLog":4,"../settings/PDFSettings":7,"../viewer/PDFViewer":9}],2:[function(require,module,exports){
"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFSourceSheet = void 0;
const PDFSettings_1 = require("../settings/PDFSettings");
const PDFoundryAPI_1 = require("../api/PDFoundryAPI");
/**
 * Extends the base ItemSheet for linked PDF viewing.
 */
class PDFSourceSheet extends ItemSheet {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['sheet', 'item'];
        options.width = 650;
        options.height = 'auto';
        return options;
    }
    get template() {
        return `systems/${PDFSettings_1.PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings_1.PDFSettings.DIST_FOLDER}/templates/sheet/pdf-sheet.html`;
    }
    /**
     * Helper method to get a id in the html form
     * html ids are prepended with the id of the item to preserve uniqueness
     *  which is mandatory to allow multiple forms to be open
     * @param html
     * @param id
     */
    _getByID(html, id) {
        return html.parent().parent().find(`#${this.item._id}-${id}`);
    }
    _getHeaderButtons() {
        const buttons = super._getHeaderButtons();
        buttons.unshift({
            class: 'pdf-sheet-manual',
            icon: 'fas fa-question-circle',
            label: 'Help',
            onclick: () => PDFSettings_1.PDFSettings.showHelp(),
        });
        //TODO: Standardize this to function w/ the Viewer one
        buttons.unshift({
            class: 'pdf-sheet-github',
            icon: 'fas fa-external-link-alt',
            label: 'PDFoundry',
            onclick: () => window.open('https://github.com/Djphoenix719/PDFoundry', '_blank'),
        });
        return buttons;
    }
    activateListeners(html) {
        super.activateListeners(html);
        const urlInput = this._getByID(html, 'data\\.url');
        const offsetInput = this._getByID(html, 'data\\.offset');
        // Block enter from displaying the PDF
        html.find('input').on('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
            }
        });
        // Test button
        this._getByID(html, 'pdf-test').on('click', function (event) {
            event.preventDefault();
            let urlValue = urlInput.val();
            let offsetValue = offsetInput.val();
            if (urlValue === null || urlValue === undefined)
                return;
            if (offsetValue === null || offsetValue === undefined)
                return;
            urlValue = `${window.location.origin}/${urlValue}`;
            if (offsetValue.toString().trim() === '') {
                offsetValue = 0;
            }
            offsetValue = parseInt(offsetValue);
            PDFoundryAPI_1.PDFoundryAPI.openURL(urlValue, 5 + offsetValue, false);
        });
        // Browse button
        this._getByID(html, 'pdf-browse').on('click', function (event) {
            return __awaiter(this, void 0, void 0, function* () {
                event.preventDefault();
                const fp = new FilePicker({});
                // @ts-ignore TODO: foundry-pc-types
                fp.extensions = ['.pdf'];
                fp.field = urlInput[0];
                let urlValue = urlInput.val();
                if (urlValue !== undefined) {
                    yield fp.browse(urlValue.toString().trim());
                }
                fp.render(true);
            });
        });
    }
}
exports.PDFSourceSheet = PDFSourceSheet;
},{"../api/PDFoundryAPI":1,"../settings/PDFSettings":7}],3:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFCache = exports.IDBHelperError = void 0;
const PDFSettings_1 = require("../settings/PDFSettings");
const PDFLog_1 = require("../log/PDFLog");
/**
 * Error that occurs during IDB operations
 */
class IDBHelperError extends Error {
    constructor(index, store, message) {
        super(`Error in ${index}>${store}: ${message}`);
    }
}
exports.IDBHelperError = IDBHelperError;
/**
 * Class that deals with getting/setting from an indexed db
 * Mostly exists to separate logic for the PDFCache from logic
 *  dealing with the database
 */
class IDBHelper {
    constructor(indexName, storeName, version) {
        this._indexName = `${indexName}/${storeName}`;
        this._storeName = storeName;
        this._version = version;
    }
    static createAndOpen(indexName, storeName, version) {
        return __awaiter(this, void 0, void 0, function* () {
            const helper = new IDBHelper(indexName, storeName, version);
            yield helper.open();
            return helper;
        });
    }
    get ready() {
        return this._db !== undefined;
    }
    newTransaction() {
        const transaction = this._db.transaction(this._storeName, 'readwrite');
        const store = transaction.objectStore(this._storeName);
        return { transaction, store };
    }
    open() {
        const that = this;
        return new Promise(function (resolve, reject) {
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
                }
                catch (error) {
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
    set(key, value, force = false) {
        return new Promise((resolve, reject) => {
            if (!this._db) {
                throw new IDBHelperError(this._indexName, this._storeName, 'Database is not initialized.');
            }
            else {
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
                        }
                        else {
                            throw new IDBHelperError(that._indexName, that._storeName, `Key ${key} already exists.`);
                        }
                    }
                    else {
                        store.add(value, key);
                        resolve();
                    }
                };
            }
        });
    }
    get(key) {
        return new Promise((resolve, reject) => {
            if (!this._db) {
                throw new IDBHelperError(this._indexName, this._storeName, 'Database is not initialized.');
            }
            else {
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
    del(key) {
        return new Promise((resolve, reject) => {
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
            }
            catch (error) {
                reject(error);
            }
        });
    }
    clr() {
        return new Promise((resolve, reject) => {
            try {
                const { store } = this.newTransaction();
                const keys = store.getAllKeys();
                keys.onsuccess = (result) => {
                    const promises = [];
                    for (const key of keys.result) {
                        promises.push(this.del(key));
                    }
                    Promise.all(promises).then(() => {
                        resolve();
                    });
                };
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
/**
 * Handles caching for PDFs
 */
class PDFCache {
    // </editor-fold>
    static initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            PDFLog_1.PDFLog.verbose('Initializing.');
            PDFCache._metaHelper = yield IDBHelper.createAndOpen(PDFCache.IDB_NAME, PDFCache.IDBSTORE_META_NAME, PDFCache.IDB_VERSION);
            PDFCache._cacheHelper = yield IDBHelper.createAndOpen(PDFCache.IDB_NAME, PDFCache.IDBSTORE_CACHE_NAME, PDFCache.IDB_VERSION);
        });
    }
    static getMeta(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield PDFCache._metaHelper.get(key);
            }
            catch (error) {
                return null;
            }
        });
    }
    static setMeta(key, meta) {
        return __awaiter(this, void 0, void 0, function* () {
            yield PDFCache._metaHelper.set(key, meta, true);
        });
    }
    static getCache(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bytes = yield PDFCache._cacheHelper.get(key);
                const meta = {
                    dateAccessed: new Date().toISOString(),
                    size: bytes.length,
                };
                yield PDFCache.setMeta(key, meta);
                return bytes;
            }
            catch (error) {
                return null;
            }
        });
    }
    static setCache(key, bytes) {
        return __awaiter(this, void 0, void 0, function* () {
            PDFLog_1.PDFLog.warn(`Cached data for ${key}`);
            yield PDFCache._cacheHelper.set(key, bytes, true);
            //TODO: Check for + handle 'cache full'
        });
    }
    static getOrFetch(key) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const cachedBytes = yield PDFCache.getCache(key);
            if (cachedBytes !== null && cachedBytes.byteLength > 0) {
                resolve(cachedBytes);
                return;
            }
            const response = yield fetch(key);
            if (response.ok) {
                const fetchedBytes = new Uint8Array(yield response.arrayBuffer());
                if (fetchedBytes.byteLength > 0) {
                    yield PDFCache.setCache(key, fetchedBytes);
                    resolve(fetchedBytes);
                    return;
                }
                else {
                    reject('Cache & fetch both failed.');
                }
            }
            else {
                reject('Cache & fetch both failed.');
            }
        }));
    }
}
exports.PDFCache = PDFCache;
// <editor-fold desc="Static Properties">
/**
 * Max size of the cache, defaults to 256 MB.
 */
PDFCache.MAX_BYTES = 256 * Math.pow(2, 20);
PDFCache.IDB_NAME = PDFSettings_1.PDFSettings.INTERNAL_MODULE_NAME;
PDFCache.IDB_VERSION = 1;
PDFCache.IDBSTORE_CACHE_NAME = `Cache`;
PDFCache.IDBSTORE_META_NAME = `Meta`;
},{"../log/PDFLog":4,"../settings/PDFSettings":7}],4:[function(require,module,exports){
"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFLog = void 0;
/**
 * A console logging wrapper that includes some additional information
 *  with output to help filter messages easier.
 */
class PDFLog {
    static format(message) {
        const time = new Date();
        const pad = (n) => {
            return n >= 10 ? n : `0${n}`;
        };
        const pad_ms = (n) => {
            const s = n.toString();
            return '0000'.substring(0, 4 - s.length) + s;
        };
        const hh = pad(time.getHours());
        const mm = pad(time.getMinutes());
        const ss = pad(time.getSeconds());
        const ms = pad_ms(time.getMilliseconds());
        return `[${PDFLog.PREFIX}@${hh}:${mm}:${ss}.${ms}] ${message}`;
    }
    /**
     * Snapshot an object to preserve it's CURRENT state in console
     * Otherwise consoles 'lazy load' objects, and it is very hard
     *  to inspect their values when they were printed (sans breakpoints)
     * @param value The object to snapshot
     * @param level What logging level should be used
     */
    static snapshot(value, level = 'log') {
        const snap = JSON.parse(JSON.stringify(value));
        let fn;
        switch (level) {
            case 'log':
                fn = console.log;
                break;
            case 'warn':
                fn = console.warn;
                break;
            case 'error':
                fn = console.error;
                break;
            case 'verbose':
                fn = console.debug;
                break;
        }
        fn(PDFLog.format(':: Frozen Object ::'));
        fn(snap);
    }
    /**
     * Print a log level message to console.
     * @param message The message to print.
     */
    static log(message) {
        if (typeof message === 'string' || typeof message === 'number') {
            console.log(PDFLog.format(message));
        }
        else {
            console.log(PDFLog.format(':: Live Object ::'));
            console.log(message);
        }
    }
    /**
     * Print an info level message to console.
     * @param message The message to print.
     */
    static info(message) {
        if (typeof message === 'string' || typeof message === 'number') {
            console.info(PDFLog.format(message));
        }
        else {
            console.info(PDFLog.format(':: Live Object ::'));
            console.info(message);
        }
    }
    /**
     * Print a verbose level message to console.
     * @param message The message to print.
     */
    static verbose(message) {
        if (typeof message === 'string' || typeof message === 'number') {
            console.debug(PDFLog.format(message));
        }
        else {
            console.debug(PDFLog.format(':: Live Object ::'));
            console.debug(message);
        }
    }
    /**
     * Print a warning level message to console.
     * @param message The message to print.
     */
    static warn(message) {
        if (typeof message === 'string' || typeof message === 'number') {
            console.warn(PDFLog.format(message));
        }
        else {
            console.warn(PDFLog.format(':: Live Object ::'));
            console.warn(message);
        }
    }
    /**
     * Print a error level message to console.
     * @param message The message to print.
     */
    static error(message) {
        if (typeof message === 'string' || typeof message === 'number') {
            console.error(PDFLog.format(message));
        }
        else {
            console.error(PDFLog.format(':: Live Object ::'));
            console.error(message);
        }
    }
}
exports.PDFLog = PDFLog;
PDFLog.PREFIX = 'PDFoundry';
},{}],5:[function(require,module,exports){
"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const PDFoundryAPI_1 = require("./api/PDFoundryAPI");
const PDFSettings_1 = require("./settings/PDFSettings");
const PDFLocalization_1 = require("./settings/PDFLocalization");
const PDFCache_1 = require("./cache/PDFCache");
const PDFLog_1 = require("./log/PDFLog");
const PDFSetup_1 = require("./setup/PDFSetup");
// <editor-fold desc="Init Hooks">
// Register the API on the ui object
Hooks.once('init', PDFSetup_1.PDFSetup.registerAPI);
// Initialize the settings
Hooks.once('init', PDFSettings_1.PDFSettings.registerSettings);
// Inject the css into the page
Hooks.once('init', PDFSetup_1.PDFSetup.injectCSS);
// </editor-fold>
// <editor-fold desc="Setup Hooks">
// Initialize the cache system, creating the DB
Hooks.once('setup', PDFCache_1.PDFCache.initialize);
// </editor-fold>
// <editor-fold desc="Ready Hooks">
// Register the PDF sheet with the class picker, unregister others
Hooks.once('ready', PDFSetup_1.PDFSetup.registerPDFSheet);
// Load the relevant localization file. Can't auto load with module setup
Hooks.once('ready', PDFLocalization_1.PDFLocalization.init);
// </editor-fold>
// <editor-fold desc="Persistent Hooks">
// preCreateItem - Setup default values for a new PDFoundry_PDF
Hooks.on('preCreateItem', PDFSettings_1.PDFSettings.preCreateItem);
// getItemDirectoryEntryContext - Setup context menu for 'Open PDF' links
Hooks.on('getItemDirectoryEntryContext', PDFSettings_1.PDFSettings.getItemContextOptions);
// renderSettings - Inject a 'Open Manual' button into help section
Hooks.on('renderSettings', PDFSettings_1.PDFSettings.onRenderSettings);
// </editor-fold>
Hooks.once('ready', () => __awaiter(void 0, void 0, void 0, function* () {
    PDFLog_1.PDFLog.verbose('Loading PDF.');
    const pdf = PDFoundryAPI_1.PDFoundryAPI.getPDFData('SR5');
    if (pdf === null)
        return;
    const { code, name } = pdf;
    const viewer = yield PDFoundryAPI_1.PDFoundryAPI.open(code, 69);
}));
},{"./api/PDFoundryAPI":1,"./cache/PDFCache":3,"./log/PDFLog":4,"./settings/PDFLocalization":6,"./settings/PDFSettings":7,"./setup/PDFSetup":8}],6:[function(require,module,exports){
"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFLocalization = void 0;
const PDFSettings_1 = require("./PDFSettings");
/**
 * Localization helper
 */
class PDFLocalization {
    /**
     * Load the localization file for the user's language.
     */
    static init() {
        return __awaiter(this, void 0, void 0, function* () {
            const lang = game.i18n.lang;
            // user's language path
            const u_path = `systems/${PDFSettings_1.PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings_1.PDFSettings.DIST_FOLDER}/locale/${lang}/config.json`;
            // english fallback path
            const f_path = `systems/${PDFSettings_1.PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings_1.PDFSettings.DIST_FOLDER}/locale/en/config.json`;
            let json;
            try {
                json = yield $.getJSON(u_path);
            }
            catch (error) {
                // if no translation exits for the users locale the fallback
                json = yield $.getJSON(f_path);
            }
            for (const key of Object.keys(json)) {
                game.i18n.translations[key] = json[key];
            }
            // setup the fallback as english so partial translations do not display keys
            let fb_json = yield $.getJSON(f_path);
            for (const key of Object.keys(fb_json)) {
                // @ts-ignore
                game.i18n._fallback[key] = json[key];
            }
        });
    }
}
exports.PDFLocalization = PDFLocalization;
},{"./PDFSettings":7}],7:[function(require,module,exports){
"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFSettings = void 0;
const PDFoundryAPI_1 = require("../api/PDFoundryAPI");
const PDFLog_1 = require("../log/PDFLog");
/**
 * Internal settings and helper methods for PDFoundry.
 */
class PDFSettings {
    /**
     * Setup default values for pdf entities
     * @param entity
     * @param args ignored args
     */
    static preCreateItem(entity, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            PDFLog_1.PDFLog.verbose('Pre-create item.');
            if (entity.type !== PDFSettings.PDF_ENTITY_TYPE) {
                return;
            }
            entity.img = `systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/assets/pdf_icon.svg`;
        });
    }
    /**
     * Helper method to grab the id from the html object and return an item
     * @param html
     */
    static getItemFromContext(html) {
        const id = html.data('entity-id');
        return game.items.get(id);
    }
    /**
     * Get additional context menu icons for PDF items
     * @param html
     * @param options
     */
    static getItemContextOptions(html, options) {
        PDFLog_1.PDFLog.verbose('Getting context options.');
        options.splice(0, 0, {
            name: game.i18n.localize('PDFOUNDRY.CONTEXT.OpenPDF'),
            icon: '<i class="far fa-file-pdf"></i>',
            condition: (entityHtml) => {
                const item = PDFSettings.getItemFromContext(entityHtml);
                if (item.type !== PDFSettings.PDF_ENTITY_TYPE) {
                    return false;
                }
                const { url } = item.data.data;
                return url !== '';
            },
            callback: (entityHtml) => {
                const item = PDFSettings.getItemFromContext(entityHtml);
                const { url, cache } = item.data.data;
                PDFoundryAPI_1.PDFoundryAPI.openURL(PDFoundryAPI_1.PDFoundryAPI.getAbsoluteURL(url), 1, cache);
            },
        });
    }
    static registerSettings() {
        // Has an individual user viewed the manual yet?
        game.settings.register(PDFSettings.INTERNAL_MODULE_NAME, 'help', {
            viewed: false,
            scope: 'user',
        });
    }
    static onRenderSettings(settings, html, data) {
        PDFLog_1.PDFLog.verbose('Rendering settings.');
        const icon = '<i class="far fa-file-pdf"></i>';
        const button = $(`<button>${icon} ${game.i18n.localize('PDFOUNDRY.SETTINGS.OpenHelp')}</button>`);
        button.on('click', PDFSettings.showHelp);
        html.find('h2').last().before(button);
    }
    static showHelp() {
        return __awaiter(this, void 0, void 0, function* () {
            yield game.settings.set(PDFSettings.INTERNAL_MODULE_NAME, 'help', {
                viewed: true,
            });
            return PDFoundryAPI_1.PDFoundryAPI.openURL(`${window.origin}/systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/assets/PDFoundry Manual.pdf`);
        });
    }
}
exports.PDFSettings = PDFSettings;
PDFSettings.DIST_FOLDER = 'pdfoundry-dist';
PDFSettings.EXTERNAL_SYSTEM_NAME = '../modules/pdfoundry';
PDFSettings.INTERNAL_MODULE_NAME = 'PDFoundry';
PDFSettings.PDF_ENTITY_TYPE = 'PDFoundry_PDF';
},{"../api/PDFoundryAPI":1,"../log/PDFLog":4}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFSetup = void 0;
const PDFSettings_1 = require("../settings/PDFSettings");
const PDFItemSheet_1 = require("../app/PDFItemSheet");
const PDFoundryAPI_1 = require("../api/PDFoundryAPI");
/**
 * A collection of methods used for setting up the API & system state.
 */
class PDFSetup {
    /**
     * Register the PDFoundry APi on the UI
     */
    static registerAPI() {
        ui['PDFoundry'] = PDFoundryAPI_1.PDFoundryAPI;
    }
    /**
     * Inject the CSS file into the header, so it doesn't have to be referenced in the system.json
     */
    static injectCSS() {
        $('head').append($(`<link href="systems/${PDFSettings_1.PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings_1.PDFSettings.DIST_FOLDER}/bundle.css" rel="stylesheet" type="text/css" media="all">`));
    }
    /**
     * Register the PDF sheet and unregister invalid sheet types from it.
     */
    static registerPDFSheet() {
        Items.registerSheet(PDFSettings_1.PDFSettings.INTERNAL_MODULE_NAME, PDFItemSheet_1.PDFSourceSheet, {
            types: [PDFSettings_1.PDFSettings.PDF_ENTITY_TYPE],
            makeDefault: true,
        });
        // Unregister all other item sheets for the PDF entity
        const pdfoundryKey = `${PDFSettings_1.PDFSettings.INTERNAL_MODULE_NAME}.${PDFItemSheet_1.PDFSourceSheet.name}`;
        const sheets = CONFIG.Item.sheetClasses[PDFSettings_1.PDFSettings.PDF_ENTITY_TYPE];
        for (const key of Object.keys(sheets)) {
            const sheet = sheets[key];
            // keep the PDFoundry sheet
            if (sheet.id === pdfoundryKey) {
                continue;
            }
            // id is MODULE.CLASS_NAME
            const [module] = sheet.id.split('.');
            Items.unregisterSheet(module, sheet.cls, {
                types: [PDFSettings_1.PDFSettings.PDF_ENTITY_TYPE],
            });
        }
    }
}
exports.PDFSetup = PDFSetup;
},{"../api/PDFoundryAPI":1,"../app/PDFItemSheet":2,"../settings/PDFSettings":7}],9:[function(require,module,exports){
"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFViewer = void 0;
const PDFSettings_1 = require("../settings/PDFSettings");
class PDFViewer extends Application {
    constructor(pdfData, options) {
        super(options);
        this._pdfData = pdfData;
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['app', 'window-app'];
        options.template = `systems/${PDFSettings_1.PDFSettings.EXTERNAL_SYSTEM_NAME}/pdfoundry-dist/templates/app/pdf-viewer.html`;
        options.title = game.i18n.localize('PDFOUNDRY.VIEWER.ViewPDF');
        options.width = 8.5 * 100 + 64;
        options.height = 11 * 100 + 64;
        options.resizable = true;
        return options;
    }
    get ready() {
        return this._viewer !== undefined;
    }
    //TODO: How should this be structured? Is it easier to throw if state is not good?
    //TODO: I lean towards yes for now - having to await *every* method call will be annoying.
    getPage() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error();
        });
    }
    setPage(value) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error();
        });
    }
    setTitle() {
        const header = $(this.element).find('header > h4.window-title');
        if (this._pdfData) {
            header.text(this._pdfData.name);
        }
    }
    /**
     * Get the internal PDFjs viewer. Will resolve with the viewer
     *  object once PDFjs is done loading and is usable.
     */
    getViewer() {
        if (this._viewer) {
            return Promise.resolve(this._viewer);
        }
        return new Promise((resolve, reject) => {
            let timeout;
            const returnOrWait = () => {
                // If our window has finished initializing...
                if (this._frame) {
                    // If PDFjs has finished initializing...
                    if (this._frame.contentWindow && this._frame.contentWindow['PDFViewerApplication']) {
                        const viewer = this._frame.contentWindow['PDFViewerApplication'];
                        resolve(viewer);
                        return;
                    }
                }
                // If any ifs fall through, try again in a few ms
                timeout = setTimeout(returnOrWait, 5);
            };
            returnOrWait();
        });
    }
    _getHeaderButtons() {
        const buttons = super._getHeaderButtons();
        //TODO: Standardize this to function w/ the Item sheet one
        buttons.unshift({
            class: 'pdf-sheet-github',
            icon: 'fas fa-external-link-alt',
            label: 'PDFoundry',
            onclick: () => window.open('https://github.com/Djphoenix719/PDFoundry', '_blank'),
        });
        return buttons;
    }
    activateListeners(html) {
        const _super = Object.create(null, {
            activateListeners: { get: () => super.activateListeners }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.activateListeners.call(this, html);
            this.setTitle();
            this._frame = html.parent().find('iframe.pdfViewer').get(0);
            this.getViewer().then((viewer) => {
                this._viewer = viewer;
            });
        });
    }
    /**
     * Finish the download and return the byte array for the file.
     */
    download() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const viewer = yield this.getViewer();
            let timeout;
            const returnOrWait = () => {
                if (viewer.downloadComplete) {
                    resolve(viewer.pdfDocument.getData());
                    return;
                }
                timeout = setTimeout(returnOrWait, 50);
            };
            returnOrWait();
        }));
    }
    getData(options) {
        const data = super.getData(options);
        data.systemName = PDFSettings_1.PDFSettings.EXTERNAL_SYSTEM_NAME;
        return data;
    }
    open(pdfSource, page) {
        return __awaiter(this, void 0, void 0, function* () {
            const viewer = yield this.getViewer();
            if (page) {
                viewer.initialBookmark = `page=${page}`;
            }
            if (typeof pdfSource === 'string') {
                yield viewer.open(pdfSource);
            }
            else {
                yield viewer.open(pdfSource);
            }
        });
    }
    /**
     * Attempt to safely cleanup PDFjs to avoid memory leaks.
     * PDFjs is pretty good with memory already.
     */
    cleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._frame && this._frame.contentWindow) {
                this._viewer.cleanup();
            }
        });
    }
    close() {
        const _super = Object.create(null, {
            close: { get: () => super.close }
        });
        return __awaiter(this, void 0, void 0, function* () {
            //TODO: Wait for render before cleanup
            yield this.cleanup();
            return _super.close.call(this);
        });
    }
}
exports.PDFViewer = PDFViewer;
},{"../settings/PDFSettings":7}]},{},[5])

//# sourceMappingURL=bundle.js.map
