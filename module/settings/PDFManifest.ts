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

export class PDFManifest {
    // <editor-fold desc="Static Fields">
    private static readonly ROOT_KEY: string = 'PDFoundry';
    private static readonly SETTINGS_SCOPE: string = 'world';
    // </editor-fold>

    // <editor-fold desc="Instance Fields">
    private readonly _URL: string;

    private _id: string;
    private _name: string;
    private _module: string;
    private _pdfs: PDFDef[];
    // </editor-fold>

    constructor(module: string, id: string, name: string, pdfs: PDFDef[]) {
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
    public get id() {
        if (!this.isInitialized) {
            throw new PDFManifestError('Tried to get the id of a manifest before it was initialized. Did you forget to call init?');
        }

        return this._id;
    }

    /**
     * The user-friendly name of the manifest.
     */
    public get name() {
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
    public get pdfs(): PDFDef[] {
        // TODO: Less hacky way to deep copy this array?
        return JSON.parse(JSON.stringify(this._pdfs));
    }

    /**
     * Has the manifest been loaded from the web yet?
     */
    public get isInitialized() {
        return this._pdfs !== undefined;
    }

    /**
     * Can the active user edit this manifest?
     */
    public get userCanEdit() {
        return game.user.isGM;
    }

    /**
     * The key used for game settings.
     */
    private get settingsKey() {
        return `${PDFManifest.ROOT_KEY}/${this._id}`;
    }

    // </editor-fold>

    // <editor-fold desc="Helpers">

    /**
     * Helper function to find a PDF by name.
     */
    public findByName(name: string) {
        return this._pdfs.find((pdf) => pdf.name === name);
    }

    /**
     * Helper function to find a PDF by code.
     */
    public findByCode(code: string) {
        return this._pdfs.find((pdf) => pdf.code === code);
    }

    // </editor-fold>

    /**
     * Update the manifest by PDF code and partial data.
     * @param code The code of the PDF that should be updated.
     * @param data Partial changes to the PDF that should be made.
     */
    public update(code: string, data: Partial<PDFDef>) {
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
    public async register() {
        await game.settings.register(this._module, this.settingsKey, {
            _id: this._id,
            _name: this._name,
            _module: this._module,
            _pdfs: this._pdfs,

            scope: PDFManifest.SETTINGS_SCOPE,
        });
    }

    /**
     * Pull the manifest, loading it's data from the world.
     */
    public pull() {
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
    public async push() {
        if (!this.userCanEdit) {
            ui.notifications.error(`User ${game.user.name} does not have permission to edit PDF locations.`);
            return;
        }

        await game.settings.set(this._module, this.settingsKey, {
            _id: this._id,
            _name: this._name,
            _module: this._module,
            _pdfs: this._pdfs,

            scope: PDFManifest.SETTINGS_SCOPE,
        });
    }
}
