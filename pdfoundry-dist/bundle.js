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
const PDFViewerWeb_1 = require("../viewer/PDFViewerWeb");
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
        return data;
    }
    /**
     * Open a PDF by code to the specified page.
     * @param code
     * @param page
     */
    static open(code, page = 1) {
        const pdf = this.getPDFData(code);
        if (pdf === null) {
            throw new PDFoundryAPIError(`Unable to find a PDF with the code "${code}. Did the user declare it?`);
        }
        const { url, offset } = pdf;
        // coerce to number; safety first
        page = offset + parseInt(page.toString());
        this.openURL(`${window.origin}/${url}`, page);
    }
    /**
     * Open a PDF by URL to the specified page.
     * @param url
     * @param page
     */
    static openURL(url, page = 1) {
        if (url === undefined) {
            throw new PDFoundryAPIError('Unable to open PDF; "url" must be defined');
        }
        // coerce to number; safety first
        page = parseInt(page.toString());
        if (isNaN(page) || page <= 0) {
            throw new PDFoundryAPIError(`Page must be > 0 but ${page} was given.`);
        }
        new PDFViewerWeb_1.PDFViewerWeb(url, page).render(true);
    }
}
exports.PDFoundryAPI = PDFoundryAPI;
},{"../settings/PDFSettings":6,"../viewer/PDFViewerWeb":8}],2:[function(require,module,exports){
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
        return `systems/${PDFSettings_1.PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings_1.PDFSettings.DIST_FOLDER}/templates/pdf-sheet.html`;
    }
    /**
     * Helper method to get a id in the html form
     * html ids are prepended with the id of the item to preserve uniqueness
     *  which is mandatory to allow multiple forms to be open
     * @param html
     * @param id
     */
    getByID(html, id) {
        return html.parent().parent().find(`#${this.item._id}-${id}`);
    }
    activateListeners(html) {
        super.activateListeners(html);
        this.addGithubLink(html);
        const urlInput = this.getByID(html, 'data\\.url');
        const offsetInput = this.getByID(html, 'data\\.offset');
        // Block enter from displaying the PDF
        html.find('input').on('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
            }
        });
        console.log(this.getByID(html, 'pdf-test'));
        // Test button
        this.getByID(html, 'pdf-test').on('click', function (event) {
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
            PDFoundryAPI_1.PDFoundryAPI.openURL(urlValue, 5 + offsetValue);
        });
        // Browse button
        this.getByID(html, 'pdf-browse').on('click', function (event) {
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
    addGithubLink(html) {
        const h4 = html.parent().parent().find('header.window-header h4.window-title');
        const next = h4.next()[0].childNodes[1].textContent;
        if (next && next.trim() === 'PDFoundry') {
            return;
        }
        const url = 'https://github.com/Djphoenix719/PDFoundry';
        const style = 'text-decoration: none';
        const icon = '<i class="fas fa-external-link-alt"></i>';
        const link = $(`<a style="${style}" href="${url}">${icon} PDFoundry</a>`);
        h4.after(link);
    }
}
exports.PDFSourceSheet = PDFSourceSheet;
},{"../api/PDFoundryAPI":1,"../settings/PDFSettings":6}],3:[function(require,module,exports){
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
exports.PDFCache = exports.PDFCacheError = void 0;
const PDFSettings_1 = require("../settings/PDFSettings");
/**
 * An error thrown when a caching operation fails.
 */
class PDFCacheError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.PDFCacheError = PDFCacheError;
/**
 * Handles caching for PDFs
 */
class PDFCache {
    // </editor-fold>
    // <editor-fold desc="'Shims'">
    /**
     * Helper to standardize IndexDB...
     * https://xkcd.com/927/
     */
    static get IDBFactory() {
        // @ts-ignore
        return window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
    }
    /**
     * Helper to standardize idbTransaction...
     * https://xkcd.com/927/
     */
    static get IDBTransaction() {
        // @ts-ignore
        return window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;
    }
    // </editor-fold>
    /**
     * Helper to get a new transaction
     */
    static getTransaction() {
        return this._idb.transaction(PDFCache.IDB_STORE_NAME, 'readwrite');
    }
    /**
     * Helper to get the store for a transaction, reduces boilerplate.
     * @param transaction The transaction to fetch the store for
     */
    static getStore(transaction) {
        return transaction.objectStore(PDFCache.IDB_STORE_NAME);
    }
    /**
     * Commit the value to a specified key in the indexed db
     * @param key The key to use as an index
     * @param data The data to insert
     * @param force If true, will delete an existing object at the specified key,
     *  if one exists. Defaults to false.
     */
    static commit(key, data, force = false) {
        return __awaiter(this, void 0, void 0, function* () {
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
                        }
                        else {
                            throw new PDFCacheError(`Error in commit, ${key} already exists`);
                        }
                    }
                    else {
                        store.add(data, key);
                    }
                };
            }
            else {
                throw new PDFCacheError('Error in commit, IDB not initialized');
            }
        });
    }
    /**
     * Delete an object stored in the indexed db at the specified location
     * @param key
     */
    static delete(key) {
        // This *should* be an async method because I use async everywhere else
        // But I find this type of logic easier to interpret with a promise pattern
        //   since the resolve/rejects happen inside callbacks
        return new Promise((resolve, reject) => {
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
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Clear all cached files.
     */
    static clear() {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.getTransaction();
                const store = this.getStore(transaction);
                const keys = store.getAllKeys();
                keys.onsuccess = (result) => {
                    const promises = [];
                    for (const key of keys.result) {
                        promises.push(PDFCache.delete(key));
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
    static initialize() {
        return __awaiter(this, void 0, void 0, function* () {
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
                }
                catch (error) {
                    // Otherwise pass
                }
            };
        });
    }
    static cache(source) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof source === 'string') {
                return this._cacheURI(source);
            }
            else {
                return this._cacheViewer(source);
            }
        });
    }
    static _cacheURI(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(uri);
            const data = new Uint8Array(yield response.arrayBuffer());
            yield PDFCache.commit(uri, data, true);
            return true;
        });
    }
    static _cacheViewer(viewer) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.reject();
        });
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
PDFCache.IDB_STORE_NAME = `Cache`;
},{"../settings/PDFSettings":6}],4:[function(require,module,exports){
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
Hooks.once('init', function () {
    // @ts-ignore
    ui.PDFoundry = PDFoundryAPI_1.PDFoundryAPI;
});
Hooks.once('init', PDFSettings_1.PDFSettings.registerSettings);
Hooks.once('ready', function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield PDFLocalization_1.PDFLocalization.init();
    });
});
Hooks.once('ready', PDFSettings_1.PDFSettings.registerPDFSheet);
Hooks.once('ready', PDFSettings_1.PDFSettings.injectCSS);
Hooks.once('ready', () => {
    let viewed = false;
    try {
        const help = game.settings.get(PDFSettings_1.PDFSettings.INTERNAL_MODULE_NAME, 'help');
        viewed = help.viewed;
    }
    catch (error) { }
    if (!viewed) {
        PDFSettings_1.PDFSettings.showHelp();
    }
});
Hooks.on('preCreateItem', PDFSettings_1.PDFSettings.preCreateItem);
Hooks.on('getItemDirectoryEntryContext', PDFSettings_1.PDFSettings.getItemContextOptions);
Hooks.on('renderSettings', PDFSettings_1.PDFSettings.onRenderSettings);
// Initialize PDF cache
Hooks.once('setup', PDFCache_1.PDFCache.initialize);
},{"./api/PDFoundryAPI":1,"./cache/PDFCache":3,"./settings/PDFLocalization":5,"./settings/PDFSettings":6}],5:[function(require,module,exports){
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
},{"./PDFSettings":6}],6:[function(require,module,exports){
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
const PDFItemSheet_1 = require("../app/PDFItemSheet");
const PDFoundryAPI_1 = require("../api/PDFoundryAPI");
/**
 * Internal settings and helper methods for PDFoundry.
 */
class PDFSettings {
    /**
     * Register the PDF sheet and unregister invalid sheet types from it.
     */
    static registerPDFSheet() {
        //  static unregisterSheet(scope, sheetClass, {types=[]}={}) {
        Items.unregisterSheet(PDFSettings.INTERNAL_MODULE_NAME, 'SR5ItemSheet', {
            types: [PDFSettings.PDF_ENTITY_TYPE],
        });
        Items.registerSheet(PDFSettings.INTERNAL_MODULE_NAME, PDFItemSheet_1.PDFSourceSheet, {
            types: [PDFSettings.PDF_ENTITY_TYPE],
            makeDefault: true,
        });
        // Unregister all other item sheets for the PDF entity
        const pdfoundryKey = `${PDFSettings.INTERNAL_MODULE_NAME}.${PDFItemSheet_1.PDFSourceSheet.name}`;
        const sheets = CONFIG.Item.sheetClasses[PDFSettings.PDF_ENTITY_TYPE];
        for (const key of Object.keys(sheets)) {
            const sheet = sheets[key];
            // keep the PDFoundry sheet
            if (sheet.id === pdfoundryKey) {
                continue;
            }
            // id is MODULE.CLASS_NAME
            const [module] = sheet.id.split('.');
            Items.unregisterSheet(module, sheet.cls, {
                types: [PDFSettings.PDF_ENTITY_TYPE],
            });
        }
    }
    /**
     * Setup default values for pdf entities
     * @param entity
     * @param args ignored args
     */
    static preCreateItem(entity, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
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
        options.splice(0, 0, {
            name: game.i18n.localize('PDFOUNDRY.CONTEXT.OpenPDF'),
            icon: '<i class="far fa-file-pdf"></i>',
            condition: (entityHtml) => {
                const item = PDFSettings.getItemFromContext(entityHtml);
                if (item.type !== PDFSettings.PDF_ENTITY_TYPE) {
                    return false;
                }
                const { code, url } = item.data.data;
                return code !== '' && url !== '';
            },
            callback: (entityHtml) => {
                const item = PDFSettings.getItemFromContext(entityHtml);
                const { code } = item.data.data;
                PDFoundryAPI_1.PDFoundryAPI.open(code);
            },
        });
    }
    static injectCSS() {
        $('head').append($(`<link href="systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/bundle.css" rel="stylesheet" type="text/css" media="all">`));
    }
    static registerSettings() {
        // Has an individual user viewed the manual yet?
        game.settings.register(PDFSettings.INTERNAL_MODULE_NAME, 'help', {
            viewed: false,
            scope: 'user',
        });
    }
    static onRenderSettings(settings, html, data) {
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
            PDFoundryAPI_1.PDFoundryAPI.openURL(`${window.origin}/systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/assets/PDFoundry Manual.pdf`);
        });
    }
}
exports.PDFSettings = PDFSettings;
PDFSettings.DIST_FOLDER = 'pdfoundry-dist';
PDFSettings.EXTERNAL_SYSTEM_NAME = '../modules/pdfoundry';
PDFSettings.INTERNAL_MODULE_NAME = 'PDFoundry';
PDFSettings.PDF_ENTITY_TYPE = 'PDFoundry_PDF';
},{"../api/PDFoundryAPI":1,"../app/PDFItemSheet":2}],7:[function(require,module,exports){
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
exports.PDFViewerBase = void 0;
class PDFViewerBase extends Application {
    get app() {
        // @ts-ignore
        return this._frame.contentWindow.PDFViewerApplication;
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'pdf-viewer';
        options.classes = ['app', 'window-app'];
        options.title = 'View PDF';
        options.width = 8.5 * 100 + 64;
        options.height = 11 * 100 + 64;
        options.resizable = true;
        return options;
    }
    activateListeners(html) {
        const _super = Object.create(null, {
            activateListeners: { get: () => super.activateListeners }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.activateListeners.call(this, html);
            this._frame = html.parents().find('iframe.pdfViewer').first().get(0);
            // @ts-ignore
            window.viewer = this;
        });
    }
    /**
     * Attempt to safely cleanup PDFjs to avoid memory leaks.
     */
    cleanup() {
        if (this._frame && this._frame.contentWindow) {
            const window = this._frame.contentWindow;
            // @ts-ignore
            window.PDFViewerApplication.cleanup();
        }
    }
    close() {
        this.cleanup();
        return super.close();
    }
}
exports.PDFViewerBase = PDFViewerBase;
},{}],8:[function(require,module,exports){
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
exports.PDFViewerWeb = void 0;
const PDFViewerBase_1 = require("./PDFViewerBase");
const PDFSettings_1 = require("../settings/PDFSettings");
class PDFViewerWeb extends PDFViewerBase_1.PDFViewerBase {
    constructor(file, page) {
        super();
        this.m_FilePath = encodeURIComponent(file);
        this.m_Page = page;
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = `systems/${PDFSettings_1.PDFSettings.EXTERNAL_SYSTEM_NAME}/pdfoundry-dist/templates/web-viewer-app.html`;
        return options;
    }
    getData(options) {
        const data = super.getData(options);
        data.page = this.m_Page;
        data.filePath = this.m_FilePath;
        data.systemName = PDFSettings_1.PDFSettings.EXTERNAL_SYSTEM_NAME;
        return data;
    }
}
exports.PDFViewerWeb = PDFViewerWeb;
},{"../settings/PDFSettings":6,"./PDFViewerBase":7}]},{},[4])

//# sourceMappingURL=bundle.js.map
