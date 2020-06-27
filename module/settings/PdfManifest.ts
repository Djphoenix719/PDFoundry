import { PDFSettings } from '../settings';
import { PdfSettingsApp } from '../app/pdf-settings-app';

/**
 * A definition for a PDF from a manifest.
 */
export type PDFDef = {
    name: string;
    code: string;
    url?: string;
    offset?: number;
};
/**
 * A comparison function taking a PDFDef, to be used in find.
 */
export type PDFComparer = (value: PDFDef) => boolean;

/**
 * An error that occurs in a PDF Manifest.
 */
export class PDFManifestError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class PdfManifest {
    private static readonly ROOT_KEY: string = 'PDFoundry';
    private static readonly SETTINGS_SCOPE: string = 'world';

    private readonly _URL: string;

    private _id: string;
    private _name: string;
    private _module: string;
    private _pdfs: PDFDef[];

    constructor(module: string, url: string) {
        this._module = module;
        this._URL = url;
    }

    /**
     * The ID of the manifest.
     * Assumed to be unique.
     */
    public get id() {
        if (!this.isInitialized) {
            throw new PDFManifestError('Tried to get the id of a manifest before it was initialized. Did you forget to call init()?');
        }

        return this._id;
    }

    /**
     * The user-friendly name of the manifest.
     */
    public get name() {
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
    public get pdfs(): PDFDef[] {
        return JSON.parse(JSON.stringify(this._pdfs));
    }

    /**
     * Has the manifest been loaded from the web yet?
     */
    public get isInitialized() {
        return this._pdfs !== undefined;
    }

    /**
     * The key used for game settings.
     */
    private get settingsKey() {
        return `${PdfManifest.ROOT_KEY}/${this._id}`;
    }

    public updatePDF(code: string, data: Partial<PDFDef>) {
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
    public find(cmp: PDFComparer) {
        return this._pdfs.find(cmp);
    }

    /**
     * Helper function to find a PDF by name.
     */
    public findByName(name: string) {
        return this.find((pdf) => pdf.name === name);
    }

    /**
     * Helper function to find a PDF by code.
     */
    public findByCode(code: string) {
        return this.find((pdf) => pdf.code === code);
    }

    /**
     * Fetch and optionally load the manifest.
     */
    public async fetch() {
        const data = await $.getJSON(this._URL);
        this._id = data.id;
        this._name = data.name;
        this._pdfs = data.pdfs;

        this.registerSettings();
        this.loadGameSettings();
    }

    private loadGameSettings() {
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

    private fetchSettings() {
        return game.settings.get(this._module, this.settingsKey);
    }

    private async registerSettings() {
        game.settings.register(this._module, this.settingsKey, {
            _id: this._id,
            _name: this._name,
            _module: this._module,
            _pdfs: this._pdfs,

            scope: PdfManifest.SETTINGS_SCOPE,
        });
    }

    public registerMenu() {
        // @ts-ignore
        game.settings.registerMenu(module, this.settingsKey, {
            name: this.name,
            label: this.name,
            hint: `Edit the PDF locations for ${this.name}.`,
            icon: 'fas fa-file-pdf',
            type: PdfSettingsApp,
            restricted: true,
            onChange: (value) => {
                console.warn('Settings changed');
                console.log(value);
            },
        });
    }

    public async updateSettings() {
        await game.settings.set(this._module, this.settingsKey, {
            _id: this._id,
            _name: this._name,
            _module: this._module,
            _pdfs: this._pdfs,

            scope: PdfManifest.SETTINGS_SCOPE,
        });
    }
}
