(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
exports.PDFoundryAPI = exports.UnlinkedPDFError = exports.PDFoundryAPIError = void 0;
/**
 * An error that is thrown by the PDFoundry API
 */
const PDFDatabase_1 = require("../settings/PDFDatabase");
const PDFManifest_1 = require("../settings/PDFManifest");
const PDFViewerWeb_1 = require("../viewer/PDFViewerWeb");
const PDFSettings_1 = require("../settings/PDFSettings");
class PDFoundryAPIError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.PDFoundryAPIError = PDFoundryAPIError;
/**
 * An error thrown when a PDF has not been linked by the user.
 */
class UnlinkedPDFError extends PDFoundryAPIError {
    constructor(message) {
        super(message);
    }
}
exports.UnlinkedPDFError = UnlinkedPDFError;
class PDFoundryAPI {
    /**
     * Register a manifest from the specified URL
     * @param module The module YOU are calling this from.
     * @param url The URL (local or absolute) to fetch from.
     */
    static register(module, url) {
        return __awaiter(this, void 0, void 0, function* () {
            PDFSettings_1.PDFSettings.SYSTEM_NAME = module;
            const data = yield $.getJSON(url);
            const { id, name, pdfs } = data;
            const manifest = new PDFManifest_1.PDFManifest(module, id, name, pdfs);
            yield manifest.register();
            manifest.pull();
            PDFDatabase_1.PDFDatabase.register(manifest);
            return manifest;
        });
    }
    /**
     * Open a PDF by code to the specified page.
     * @param code
     * @param page
     */
    static open(code, page = 1) {
        const pdf = PDFDatabase_1.PDFDatabase.getPDF(code);
        if (pdf === undefined) {
            throw new PDFDatabase_1.PDFDatabaseError(`Unable to find a PDF with code "${code}".`);
        }
        if (pdf.url === undefined) {
            throw new UnlinkedPDFError(`PDF with code "${code}" has no specified URL.`);
        }
        page = parseInt(page.toString());
        page = pdf.offset ? page + pdf.offset : page;
        this.openURL(`${window.origin}/${pdf.url}`, page);
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
        if (page <= 0) {
            throw new PDFoundryAPIError(`Invalid page: "${page}"`);
        }
        new PDFViewerWeb_1.PDFViewerWeb(url, page).render(true);
    }
}
exports.PDFoundryAPI = PDFoundryAPI;

},{"../settings/PDFDatabase":4,"../settings/PDFManifest":5,"../settings/PDFSettings":6,"../viewer/PDFViewerWeb":8}],2:[function(require,module,exports){
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
exports.PDFSettingsApp = void 0;
const PDFViewerWeb_1 = require("../viewer/PDFViewerWeb");
/**
 * Acts as a controller for a PDFManifest
 */
class PDFSettingsApp extends Application {
    constructor(manifest, options) {
        super(options);
        this._manifest = manifest;
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'pdf-settings-app';
        options.classes = [];
        options.title = 'Edit PDF Locations';
        //TODO: Dynamic link this up.
        options.template = 'modules/pdfoundry/templates/settings/pdf-settings.html';
        options.width = 800;
        options.height = 'auto';
        options.resizable = true;
        return options;
    }
    getData(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const manifest = this._manifest;
            if (!manifest.isInitialized) {
                yield manifest.register();
                manifest.pull();
            }
            let { pdfs, name } = manifest;
            pdfs.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
            return { name, pdfs };
        });
    }
    activateListeners(html) {
        super.activateListeners(html);
        const testButtons = html.parents().find('button.pdf-test');
        testButtons.on('click', function (event) {
            event.preventDefault();
            const row = $(this).parent().parent();
            const urlInput = row.find('input.pdf-url');
            const offsetInput = row.find('input.pdf-offset');
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
            new PDFViewerWeb_1.PDFViewerWeb(urlValue, 5 + offsetValue).render(true);
        });
        const browseButtons = html.parents().find('button.pdf-browse');
        browseButtons.on('click', function (event) {
            return __awaiter(this, void 0, void 0, function* () {
                event.preventDefault();
                const row = $(event.target.parentElement);
                const urlInput = row.find('input.pdf-url').first();
                const fp = new FilePicker({});
                // @ts-ignore TODO: foundry-pc-types
                fp.extensions = ['.pdf'];
                fp.field = urlInput[0];
                let urlValue = urlInput.val();
                if (urlValue !== undefined) {
                    yield fp.browse(urlValue.toString().trim());
                }
                fp.render(true);
                console.log(event);
            });
        });
    }
    close() {
        const _super = Object.create(null, {
            close: { get: () => super.close }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const rows = $(this.element).find('div.row');
            const manifest = this._manifest;
            for (let i = 0; i < rows.length; i++) {
                const row = $(rows[i]);
                const bookCode = row.find('span.pdf-code').html();
                const urlInput = row.find('input.pdf-url');
                const offsetInput = row.find('input.pdf-offset');
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
                manifest.update(bookCode, {
                    url: urlValue,
                    offset: offsetValue,
                });
            }
            yield manifest.push();
            return _super.close.call(this);
        });
    }
}
exports.PDFSettingsApp = PDFSettingsApp;

},{"../viewer/PDFViewerWeb":8}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Register UI accessor
const PDFoundryAPI_1 = require("./api/PDFoundryAPI");
const PDFSettings_1 = require("./settings/PDFSettings");
Hooks.on('init', function () {
    // @ts-ignore
    ui.PDFoundry = PDFoundryAPI_1.PDFoundryAPI;
});
Hooks.on('renderSettings', PDFSettings_1.PDFSettings.initializeContainer);

},{"./api/PDFoundryAPI":1,"./settings/PDFSettings":6}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFDatabase = exports.PDFDatabaseError = void 0;
const PDFSettings_1 = require("./PDFSettings");
/**
 * An error thrown during PDF lookup or registration.
 */
class PDFDatabaseError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.PDFDatabaseError = PDFDatabaseError;
class PDFDatabase {
    /**
     * Register a manifest with the database for later lookup
     * @param manifest
     */
    static register(manifest) {
        if (!manifest.isInitialized) {
            throw new PDFDatabaseError('Cannot register uninitialized manifest.');
        }
        const toValidate = manifest.pdfs;
        while (toValidate.length > 0) {
            const thisPdf = toValidate.pop();
            if (thisPdf === undefined) {
                throw new PDFDatabaseError(`Undefined PDF found in manifest "${manifest.id}".`);
            }
            for (const thatManifest of PDFDatabase.MANIFESTS) {
                const thatPdf = thatManifest.findByCode(thisPdf.code);
                if (thatPdf !== undefined) {
                    throw new PDFDatabaseError(`A PDF with code ${thisPdf.code} already exists in manifest "${thatManifest.id}".`);
                }
            }
        }
        PDFDatabase.MANIFESTS.push(manifest);
        PDFSettings_1.PDFSettings.addManifestButton(manifest);
    }
    /**
     * Get a PDF definition by it's code.
     * @param code
     */
    static getPDF(code) {
        let found = undefined;
        for (const manifest of PDFDatabase.MANIFESTS) {
            found = manifest.findByCode(code);
            if (found !== undefined) {
                break;
            }
        }
        return found;
    }
}
exports.PDFDatabase = PDFDatabase;
PDFDatabase.MANIFESTS = [];

},{"./PDFSettings":6}],5:[function(require,module,exports){
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
exports.PDFManifest = exports.PDFManifestError = void 0;
/**
 * An error that occurs in a PDF Manifest.
 */
class PDFManifestError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.PDFManifestError = PDFManifestError;
class PDFManifest {
    // </editor-fold>
    constructor(module, id, name, pdfs) {
        this._module = module;
        this._id = id;
        this._name = name;
        this._pdfs = pdfs;
    }
    // <editor-fold desc="Getters">
    /**
     * The ID of the manifest.
     * Assumed to be unique.
     */
    get id() {
        if (!this.isInitialized) {
            throw new PDFManifestError('Tried to get the id of a manifest before it was initialized. Did you forget to call init?');
        }
        return this._id;
    }
    /**
     * The user-friendly name of the manifest.
     */
    get name() {
        if (!this.isInitialized) {
            //TODO: Standardize error handling.
            throw new PDFManifestError('Tried to get the name of a manifest before it was initialized. Did you forget to call init?');
        }
        return this._name;
    }
    /**
     * Creates a deep copy of the array of PDFs for use.
     * Changes to the array will not be reflected in the original.
     */
    get pdfs() {
        // TODO: Less hacky way to deep copy this array?
        return JSON.parse(JSON.stringify(this._pdfs));
    }
    /**
     * Has the manifest been loaded from the web yet?
     */
    get isInitialized() {
        return this._pdfs !== undefined;
    }
    /**
     * Can the active user edit this manifest?
     */
    get userCanEdit() {
        return game.user.isGM;
    }
    /**
     * The key used for game settings.
     */
    get settingsKey() {
        return `${PDFManifest.ROOT_KEY}/${this._id}`;
    }
    // </editor-fold>
    // <editor-fold desc="Helpers">
    /**
     * Helper function to find a PDF by name.
     */
    findByName(name) {
        return this._pdfs.find((pdf) => pdf.name === name);
    }
    /**
     * Helper function to find a PDF by code.
     */
    findByCode(code) {
        return this._pdfs.find((pdf) => pdf.code === code);
    }
    // </editor-fold>
    /**
     * Update the manifest by PDF code and partial data.
     * @param code The code of the PDF that should be updated.
     * @param data Partial changes to the PDF that should be made.
     */
    update(code, data) {
        const pdf = this.findByCode(code);
        if (pdf === undefined) {
            // TODO: Standardize error handling.
            throw new PDFManifestError(`Unable to find PDF with code "${code}".`);
        }
        mergeObject(pdf, data, { inplace: true });
    }
    /**
     * Register the manifest's storage location with the game settings.
     */
    register() {
        return __awaiter(this, void 0, void 0, function* () {
            yield game.settings.register(this._module, this.settingsKey, {
                _id: this._id,
                _name: this._name,
                _module: this._module,
                _pdfs: this._pdfs,
                scope: PDFManifest.SETTINGS_SCOPE,
            });
        });
    }
    /**
     * Pull the manifest, loading it's data from the world.
     */
    pull() {
        const loadedValues = game.settings.get(this._module, this.settingsKey);
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
    /**
     * Push the manifest, saving it to the world.
     */
    push() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.userCanEdit) {
                ui.notifications.error(`User ${game.user.name} does not have permission to edit PDF locations.`);
                return;
            }
            yield game.settings.set(this._module, this.settingsKey, {
                _id: this._id,
                _name: this._name,
                _module: this._module,
                _pdfs: this._pdfs,
                scope: PDFManifest.SETTINGS_SCOPE,
            });
        });
    }
}
exports.PDFManifest = PDFManifest;
// <editor-fold desc="Static Fields">
PDFManifest.ROOT_KEY = 'PDFoundry';
PDFManifest.SETTINGS_SCOPE = 'world';

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFSettings = void 0;
const PDFSettingsApp_1 = require("../app/PDFSettingsApp");
const PDFDatabase_1 = require("./PDFDatabase");
/**
 * Internal settings and helper methods for PDFoundry.
 */
class PDFSettings {
    /**
     * Create the container for the settings buttons
     * @param app
     * @param html
     */
    static initializeContainer(app, html) {
        if (html.find(`#${PDFSettings.CONTAINER_ID}`).length > 0) {
            return;
        }
        const container = $(`<div id="${PDFSettings.CONTAINER_ID}"></div>`);
        container.append('<h4>PDFoundry</h4>');
        const help = $(html.find('h2').get(2));
        help.before(container);
        PDFSettings.cleanDestroyedContainers();
        PDFSettings.CONTAINERS.push(container);
        for (const manifest of PDFDatabase_1.PDFDatabase.MANIFESTS) {
            PDFSettings.addManifestButton(manifest);
        }
    }
    /**
     * Unreference containers whose windows have been destroyed
     */
    static cleanDestroyedContainers() {
        const containers = PDFSettings.CONTAINERS;
        for (let i = containers.length - 1; i >= 0; i--) {
            const container = containers[i][0];
            if (document.body.contains(container)) {
                continue;
            }
            containers.splice(i);
        }
    }
    /**
     * Add a button to edit the manifest to all containers
     * @param manifest
     */
    static addManifestButton(manifest) {
        //TODO: Localize names...
        for (const container of PDFSettings.CONTAINERS) {
            if (container.find(`#pdf-setting-${manifest.id}`).length > 0) {
                continue;
            }
            const button = $(`<button id="pdf-setting-${manifest.id}"><i class="fas fa-file-pdf"></i> ${manifest.name}</button>`);
            button.on('click', (event) => {
                const settingsApp = new PDFSettingsApp_1.PDFSettingsApp(manifest);
                settingsApp.render(true);
            });
            container.append(button);
        }
    }
}
exports.PDFSettings = PDFSettings;
PDFSettings.CONTAINERS = [];
PDFSettings.CONTAINER_ID = 'pdfoundry-config';
PDFSettings.SYSTEM_NAME = "shadowrun5e";

},{"../app/PDFSettingsApp":2,"./PDFDatabase":4}],7:[function(require,module,exports){
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
exports.PDFViewerBase = void 0;
class PDFViewerBase extends Application {
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
    //TODO: Cleanup PDFjs
    close() {
        return super.close();
    }
}
exports.PDFViewerBase = PDFViewerBase;

},{}],8:[function(require,module,exports){
"use strict";
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
        options.template = `systems/${PDFSettings_1.PDFSettings.SYSTEM_NAME}/pdfoundry-dist/templates/web-viewer-app.html`;
        return options;
    }
    getData(options) {
        const data = super.getData(options);
        data.page = this.m_Page;
        data.filePath = this.m_FilePath;
        data.systemName = PDFSettings_1.PDFSettings.SYSTEM_NAME;
        return data;
    }
}
exports.PDFViewerWeb = PDFViewerWeb;

},{"../settings/PDFSettings":6,"./PDFViewerBase":7}]},{},[3]);
