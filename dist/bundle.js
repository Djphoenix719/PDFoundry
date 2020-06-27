(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFoundry = void 0;
class PDFoundry {
}
exports.PDFoundry = PDFoundry;

},{}],2:[function(require,module,exports){
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
exports.PdfSettingsApp = void 0;
const settings_1 = require("../settings");
const pdf_viewer_web_1 = require("../viewer/pdf-viewer-web");
/**
 * Acts as a controller for a PDFManifest
 */
class PdfSettingsApp extends FormApplication {
    static set manifest(value) {
        if (this._open) {
            throw new settings_1.PDFSettingsError('Cannot set manifest while editor is open.');
        }
        PdfSettingsApp._manifest = value;
    }
    static set module(value) {
        if (this._open) {
            throw new settings_1.PDFSettingsError('Cannot set module while editor is open.');
        }
        PdfSettingsApp._module = value;
    }
    /**
     * Get a settings key
     * @param book
     * @param name
     */
    static getSettingKey(book, name) {
        return `${settings_1.PDFSettings.ROOT_MODULE_NAME}/${book}/${name}`;
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'pdf-settings-app';
        options.classes = [];
        options.title = 'Edit PDF Locations';
        options.template = 'modules/pdfoundry/templates/settings/pdf-settings.html';
        options.width = 800;
        options.height = 'auto';
        return options;
    }
    getData(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const manifest = PdfSettingsApp._manifest;
            console.info('Trying to get data from manifest...');
            console.info(manifest);
            if (!manifest.isInitialized) {
                yield manifest.fetch();
            }
            let { pdfs, name } = manifest;
            pdfs.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
            return {
                name,
                pdfs,
            };
        });
    }
    activateListeners(html) {
        super.activateListeners(html);
        //TODO: Settings is loading localhost urls for some reason...
        const buttons = html.parents().find('div.pdf-settings-flexrow button');
        buttons.on('click', function (event) {
            event.preventDefault();
            const row = $(this).parent().parent();
            const urlInput = row.find('span.pdf-url input');
            const offsetInput = row.find('span.pdf-offset input');
            let urlValue = urlInput.val();
            let offsetValue = offsetInput.val();
            if (urlValue === null || urlValue === undefined)
                return;
            if (offsetValue === null || offsetValue === undefined)
                return;
            urlValue = encodeURIComponent(urlValue.toString());
            urlValue = `${window.location.origin}/${urlValue}`;
            offsetValue = parseInt(offsetValue);
            new pdf_viewer_web_1.PdfViewerWeb(urlValue, 5 + offsetValue).render(true);
        });
    }
    close() {
        const _super = Object.create(null, {
            close: { get: () => super.close }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const rows = $(this.element).find('.pdf-settings-flexwrap div.pdf-settings-flexrow');
            const manifest = PdfSettingsApp._manifest;
            for (let i = 0; i < rows.length; i++) {
                const row = $(rows[i]);
                const bookCode = row.find('span.pdf-code').html();
                const urlInput = row.find('span.pdf-url input');
                const offsetInput = row.find('span.pdf-offset input');
                const book = manifest.findByCode(bookCode);
                if (book === undefined) {
                    //TODO: Standardize error handling.
                    console.error(`PDFoundry Error: Unable to find book ${bookCode}`);
                    continue;
                }
                let urlValue = urlInput.val();
                if (urlValue === null || urlValue === undefined) {
                    urlValue = '';
                }
                urlValue = urlValue.toString().trim();
                let offsetValue = offsetInput.val();
                if (offsetValue === null || offsetValue === undefined || offsetValue === '') {
                    offsetValue = '0';
                }
                offsetValue = parseInt(offsetValue);
                manifest.updatePDF(bookCode, {
                    url: urlValue,
                    offset: offsetValue,
                });
            }
            yield manifest.updateSettings();
            console.log('%cClosing settings app...', 'color: red');
            console.log(manifest);
            PdfSettingsApp._open = false;
            return _super.close.call(this);
        });
    }
}
exports.PdfSettingsApp = PdfSettingsApp;
PdfSettingsApp.URL = 'url';
PdfSettingsApp.OFFSET = 'offset';

},{"../settings":4,"../viewer/pdf-viewer-web":7}],3:[function(require,module,exports){
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
const settings_1 = require("./settings");
const api_1 = require("./api");
// Register UI accessor
Hooks.on('init', function () {
    // @ts-ignore
    ui.PDFoundry = api_1.PDFoundry;
});
Hooks.once('ready', function () {
    return __awaiter(this, void 0, void 0, function* () {
        // const view = new WebViewerApp('..\\..\\..\\books\\Shadowrun - Hard Targets.pdf', 45).render(true);
        // PDFOptions.init();
        try {
            console.log(game.settings.get('shadowrun5e', 'shadowrun-5th-edition'));
        }
        catch (e) {
            console.warn('Unable to get settings.');
        }
        yield settings_1.PDFSettings.RegisterFromURL('shadowrun5e', 'modules/pdfoundry/dist/sr5_pdfs.json');
        // new PdfSettingsApp(null).render(true);
    });
});

},{"./api":1,"./settings":4}],4:[function(require,module,exports){
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
exports.PDFSettings = exports.PDFSettingsError = void 0;
const pdf_settings_app_1 = require("./app/pdf-settings-app");
const PdfManifest_1 = require("./settings/PdfManifest");
class PDFSettingsError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.PDFSettingsError = PDFSettingsError;
class PDFSettings {
    /**
     * Helper function to load a manifest from a URL and immediately register it.
     * @see PDFSettings.Register
     */
    static RegisterFromURL(module, url) {
        return __awaiter(this, void 0, void 0, function* () {
            const manifest = new PdfManifest_1.PdfManifest(module, url);
            yield manifest.fetch();
            PDFSettings.Register(module, manifest);
        });
    }
    /**
     * Register a module with the game settings menu.
     * @param module The module you are calling from.
     * @param manifest A manifest that should be loaded.
     */
    static Register(module, manifest) {
        if (!manifest.isInitialized) {
            throw new PDFSettingsError('Tried to register a manifest an uninitialized manifest. Did you forget to call load?');
        }
        // TODO: Look into if this can be passed again.
        pdf_settings_app_1.PdfSettingsApp.manifest = manifest;
        pdf_settings_app_1.PdfSettingsApp.module = module;
        manifest.registerMenu();
    }
}
exports.PDFSettings = PDFSettings;
PDFSettings.ROOT_MODULE_NAME = 'PDFoundry';

},{"./app/pdf-settings-app":2,"./settings/PdfManifest":5}],5:[function(require,module,exports){
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
exports.PdfManifest = exports.PDFManifestError = void 0;
const pdf_settings_app_1 = require("../app/pdf-settings-app");
/**
 * An error that occurs in a PDF Manifest.
 */
class PDFManifestError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.PDFManifestError = PDFManifestError;
class PdfManifest {
    constructor(module, url) {
        this._module = module;
        this._URL = url;
    }
    /**
     * The ID of the manifest.
     * Assumed to be unique.
     */
    get id() {
        if (!this.isInitialized) {
            throw new PDFManifestError('Tried to get the id of a manifest before it was initialized. Did you forget to call init()?');
        }
        return this._id;
    }
    /**
     * The user-friendly name of the manifest.
     */
    get name() {
        if (!this.isInitialized) {
            //TODO: Standardize error handling.
            throw new PDFManifestError('Tried to get the name of a manifest before it was initialized. Did you forget to call init()?');
        }
        return this._name;
    }
    /**
     * Creates a deep copy of the array of PDFs for use.
     * Changes to the array will not be reflected in the original.
     */
    get pdfs() {
        return JSON.parse(JSON.stringify(this._pdfs));
    }
    /**
     * Has the manifest been loaded from the web yet?
     */
    get isInitialized() {
        return this._pdfs !== undefined;
    }
    /**
     * The key used for game settings.
     */
    get settingsKey() {
        return `${PdfManifest.ROOT_KEY}/${this._id}`;
    }
    updatePDF(code, data) {
        const pdf = this.findByCode(code);
        if (pdf === undefined) {
            // TODO: Standardize error handling.
            throw new PDFManifestError(`Unable to find PDF with code "${code}".`);
        }
        mergeObject(pdf, data, { inplace: true });
    }
    /**
     * Find the first PDF in the manifest matching an arbitrary comparison.
     */
    find(cmp) {
        return this._pdfs.find(cmp);
    }
    /**
     * Helper function to find a PDF by name.
     */
    findByName(name) {
        return this.find((pdf) => pdf.name === name);
    }
    /**
     * Helper function to find a PDF by code.
     */
    findByCode(code) {
        return this.find((pdf) => pdf.code === code);
    }
    /**
     * Fetch and optionally load the manifest.
     */
    fetch() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield $.getJSON(this._URL);
            this._id = data.id;
            this._name = data.name;
            this._pdfs = data.pdfs;
            this.registerSettings();
            this.loadGameSettings();
        });
    }
    loadGameSettings() {
        const loadedValues = this.fetchSettings();
        console.log(`%cFetched settings...`, 'color: green');
        console.log(loadedValues);
        // First time running...
        if (loadedValues === undefined) {
            return;
        }
        // Just encase we are somehow not loading from the right place...
        if (this._id !== loadedValues._id) {
            throw new PDFManifestError(`Settings id mismatch: ${this._id} !== ${loadedValues._id}`);
        }
        if (this._module !== loadedValues._module) {
            throw new PDFManifestError(`Settings module mismatch: ${this._module} !== ${loadedValues._module}`);
        }
        this._name = loadedValues._name;
        this._pdfs = mergeObject(this._pdfs, loadedValues._pdfs, { enforceTypes: false });
    }
    fetchSettings() {
        return game.settings.get(this._module, this.settingsKey);
    }
    registerSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            game.settings.register(this._module, this.settingsKey, {
                _id: this._id,
                _name: this._name,
                _module: this._module,
                _pdfs: this._pdfs,
                scope: PdfManifest.SETTINGS_SCOPE,
            });
        });
    }
    registerMenu() {
        // @ts-ignore
        game.settings.registerMenu(module, this.settingsKey, {
            name: this.name,
            label: this.name,
            hint: `Edit the PDF locations for ${this.name}.`,
            icon: 'fas fa-file-pdf',
            type: pdf_settings_app_1.PdfSettingsApp,
            restricted: true,
            onChange: (value) => {
                console.warn('Settings changed');
                console.log(value);
            },
        });
    }
    updateSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield game.settings.set(this._module, this.settingsKey, {
                _id: this._id,
                _name: this._name,
                _module: this._module,
                _pdfs: this._pdfs,
                scope: PdfManifest.SETTINGS_SCOPE,
            });
        });
    }
}
exports.PdfManifest = PdfManifest;
PdfManifest.ROOT_KEY = 'PDFoundry';
PdfManifest.SETTINGS_SCOPE = 'world';

},{"../app/pdf-settings-app":2}],6:[function(require,module,exports){
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
exports.PdfViewerBase = void 0;
class PdfViewerBase extends Application {
    get pdfJS() {
        if (this.m_Frame && this.m_Frame.contentWindow) {
            // @ts-ignore
            return this.m_Frame.contentWindow.PDFViewerApplication;
        }
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
            this.m_Frame = html.parents().find('iframe.pdfViewer').first().get(0);
        });
    }
    close() {
        return super.close();
    }
}
exports.PdfViewerBase = PdfViewerBase;

},{}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfViewerWeb = void 0;
const pdf_viewer_base_1 = require("./pdf-viewer-base");
class PdfViewerWeb extends pdf_viewer_base_1.PdfViewerBase {
    constructor(file, page) {
        super();
        this.m_FilePath = file;
        this.m_Page = page;
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = 'modules/pdfoundry/templates/web-viewer-app.html';
        return options;
    }
    getData(options) {
        const data = super.getData(options);
        data.page = this.m_Page;
        data.filePath = this.m_FilePath;
        return data;
    }
}
exports.PdfViewerWeb = PdfViewerWeb;

},{"./pdf-viewer-base":6}]},{},[3]);
