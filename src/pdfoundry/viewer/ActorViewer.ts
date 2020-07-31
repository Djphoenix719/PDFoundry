import Settings from '../settings/Settings';
import BaseViewer from './BaseViewer';
import ActorSheetSelect from '../app/ActorSheetSelect';
import { PDFjsViewer } from '../common/types/PDFjsViewer';
import { fileExists, getAbsoluteURL } from '../Util';
import PDFActorSheetAdapter from '../app/PDFActorSheetAdapter';

export interface PDFActorData extends Record<string, string> {
    name: string;
}

/**
 * The FillableViewer class provides an interface for displaying, serializing, and observing form-fillable PDFs.
 */
export default class ActorViewer extends BaseViewer {
    // <editor-fold desc="Static Properties">

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = `systems/${Settings.EXTERNAL_SYSTEM_NAME}/pdfoundry-dist/templates/app/pdf-viewer-fillable.html`;
        return options;
    }

    // </editor-fold>

    // <editor-fold desc="Static Methods">

    /**
     * Validate the data path of the key.
     * @param path
     */
    public static isKeyAllowed(path: string): boolean {
        if (path === 'name') return true;
        if (path.includes('_id')) return false;
        return path.startsWith('data.');
    }

    // </editor-fold>

    // <editor-fold desc="Properties">
    protected actor: Actor;
    protected actorSheet: PDFActorSheetAdapter;
    // </editor-fold>

    // <editor-fold desc="Constructor & Initialization">
    constructor(actor: Actor, sheet: PDFActorSheetAdapter, options?: ApplicationOptions) {
        super(options);

        this.actor = actor;
        this.actorSheet = sheet;

        this.on('viewerReady', this.onViewerReady.bind(this));
    }
    // </editor-fold>

    // <editor-fold desc="Getters & Setters">

    get title(): string {
        return this.actor.name;
    }

    /**
     * Get the URL for the current sheet from the actor flags.
     */
    public getCurrentSheet(): string | undefined {
        return this.actor.getFlag(Settings.EXTERNAL_SYSTEM_NAME, Settings.ACTOR_SHEET_KEY);
    }

    /**
     * Save the URL for the current sheet to the actor flags.
     * @param value
     */
    public async setCurrentSheet(value: string | undefined) {
        if (typeof value === 'string') {
            return this.actor.setFlag(Settings.EXTERNAL_SYSTEM_NAME, Settings.ACTOR_SHEET_KEY, value);
        } else {
            return this.actor.unsetFlag(Settings.EXTERNAL_SYSTEM_NAME, Settings.ACTOR_SHEET_KEY);
        }
    }

    protected _getHeaderButtons(): any[] {
        const buttons: any[] = [];

        buttons.unshift({
            label: 'Close',
            class: 'close',
            icon: 'fas fa-times',
            onclick: (ev) => this.actorSheet.close(),
        });

        const canConfigure = game.user.isGM || (this.actor.owner && game.user.can('TOKEN_CONFIGURE'));
        if (this.options.editable && canConfigure) {
            buttons.unshift({
                class: 'configure-token',
                icon: 'fas fa-user-circle',
                label: this.actor.token ? 'Token' : 'Prototype Token',
                onclick: async () => {
                    const token = this.actor.token || new Token(this.actor.data.token);
                    new TokenConfig(token, {
                        configureDefault: !this.actor.token,
                    }).render(true);
                },
            });

            buttons.unshift({
                class: 'configure-sheet',
                icon: 'fas fa-cog',
                label: 'Settings',
                onclick: async () => {
                    new EntitySheetConfig(this.actor).render(true);
                },
            });

            buttons.unshift({
                class: 'pdf-fillable-select',
                icon: 'fas fa-user-cog',
                label: 'Sheet Select',
                onclick: () => {
                    new ActorSheetSelect(this.getCurrentSheet(), this.onUpdateBaseSheet.bind(this)).render(true);
                },
            });
        }

        return buttons;
    }

    protected flattenActor(): PDFActorData {
        const data = flattenObject({
            name: this.actor.name,
            data: this.actor.data.data,
        }) as PDFActorData;

        // Do not allow non-data keys to make it into the flat object
        for (const key of Object.keys(data)) {
            if (!ActorViewer.isKeyAllowed(key)) {
                delete data[key];
            }
        }

        return data;
    }

    // </editor-fold>

    // <editor-fold desc="Instance Methods">

    protected async onUpdateBaseSheet(sheet) {
        await this.setCurrentSheet(sheet);
        await this.actorSheet.close();
        await this.open(sheet);
    }

    protected resolveActorDelta(originalData: PDFActorData, newData: Partial<PDFActorData>) {
        const delta = new Map<string, string>();
        for (const [ko, vo] of Object.entries(newData)) {
            if (originalData.hasOwnProperty(ko) && ko !== originalData[ko]) {
                delta[ko] = vo;
            }
        }

        console.warn(`Resolved actor delta`);
        console.warn(`Original data was`);
        console.warn(originalData);
        console.warn(`New data is`);
        console.warn(newData);

        return delta;
    }

    protected async updateActor(delta: object) {
        // Don't allow empty updates
        if (isObjectEmpty(delta)) {
            return;
        }
        // data must be expanded to set properly
        return this.actor.update(expandObject(delta));
    }

    protected onPageRendered(event) {
        const div = $(event.source.div);
        const inputs = div.find('input');

        const actorData = this.flattenActor();
        const changedData = duplicate(actorData);

        let hasWrite = false;
        for (const input of inputs) {
            // order is important - call || hasWrite prevents short circuit after first write
            hasWrite = this.initializeInput($(input), changedData) || hasWrite;
        }

        if (hasWrite) {
            this.updateActor(this.resolveActorDelta(actorData, changedData));
        }

        inputs.on('change', this.onInputChanged.bind(this));

        super.onPageRendered(event);
    }

    protected onUpdateActor(actor: Actor, data: Partial<ActorData>, options: { diff: boolean }, id: string) {
        if (id !== this.actor.id) return;

        // TODO: Update fields when actor update occurs
        if (options.diff) {
        } else {
        }
    }

    // <editor-fold desc="Actor Data Methods">

    // public getAttribute(key: string): string | undefined {
    //     const dataValue = this.actorData.get(key);
    //     if (dataValue !== undefined) {
    //         return dataValue;
    //     }
    //
    //     const input = $(this.element).find(`#${key}`);
    //     if (input.length !== 1) {
    //         return undefined;
    //     }
    //
    //     return input.val()?.toString().trim();
    // }

    // </editor-fold>

    /**
     * Initializes the input and returns true if a value was pulled from the input into the actor.
     * @param input
     * @param data
     */
    protected initializeInput(input: JQuery<HTMLInputElement>, data: PDFActorData): boolean {
        const key = input.attr('name');
        if (key === undefined || !ActorViewer.isKeyAllowed(key)) {
            return false;
        }

        let value = data[key];
        if (value === undefined) {
            // If value does not exist on actor yet, load from sheet
            const inputValue = input.val();
            if (inputValue) {
                data[key] = inputValue.toString();
                // Return true to signify actor changes were made
                return true;
            }
        } else {
            // Otherwise initialize input value to actor value
            input.val(value);
            return false;
        }
        return false;
    }

    protected onInputChanged(event) {
        const input = event.currentTarget as HTMLInputElement;
        input.value = input.value.trim();

        const key = input.getAttribute('name');
        if (key === null) return;

        if (ActorViewer.isKeyAllowed(key)) {
            const originalData = this.flattenActor();
            const newData = {
                [key]: input.value,
            };
            this.updateActor(this.resolveActorDelta(originalData, newData));
        }
    }

    protected async onViewerReady(viewer: PDFjsViewer): Promise<void> {
        const sheet = this.getCurrentSheet();
        if (sheet) {
            const url = getAbsoluteURL(sheet);
            await this.open(url);
            Hooks.on('updateActor', this.onUpdateActor.bind(this));
        }
    }

    async close(): Promise<any> {
        // await this.setActorData(this.actorData);
        if (this._viewer) {
            await this._viewer.close();
        }
        Hooks.off('updateActor', this.onUpdateActor.bind(this));
        return super.close();
    }

    async open(pdfSource: string | Uint8Array, page?: number): Promise<void> {
        // Validate PDF source to prevent crashes on missing/changed files
        if (typeof pdfSource === 'string' && !(await fileExists(pdfSource))) {
            await this.setCurrentSheet(undefined);
            new PDFActorSheetAdapter(this.actor, this.options).render(true);
            return;
        }

        try {
            await super.open(pdfSource, page);
        } catch (error) {
            await this.actorSheet.close();
            new PDFActorSheetAdapter(this.actor, this.options).render(true);
        }
    }

    // </editor-fold>
}
