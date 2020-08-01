import Settings from '../settings/Settings';
import BaseViewer from './BaseViewer';
import ActorSheetSelect from '../app/ActorSheetSelect';
import { PDFjsViewer } from '../common/types/PDFjsViewer';
import { fileExists, getAbsoluteURL } from '../Util';
import PDFActorSheetAdapter from '../app/PDFActorSheetAdapter';

function isInput(element: Element): element is HTMLInputElement {
    return element.tagName === 'INPUT';
}

function isTextArea(element: Element): element is HTMLTextAreaElement {
    return element.tagName === 'TEXTAREA';
}

function isCheckbox(element: Element): element is HTMLInputElement {
    return isInput(element) && element.getAttribute('type') === 'checkbox';
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
    public static dataPathValid(path: string): boolean {
        return !path.includes('_id');
    }

    /**
     * Fix keys by removing invalid characters
     * @param key
     */
    public static fixKey(key: string): string {
        if (key.startsWith(`data.`)) {
            return key;
        }

        key = key.trim();
        return key.replace(/\s/g, '_');
    }

    /**
     * Resolve a key path to the proper flattened key
     * @param key
     */
    public static resolveKeyPath(key: string): string {
        if (key === 'name') return key;
        if (key.startsWith(`data.`)) {
            return this.fixKey(key);
        }
        return `flags.${Settings.EXTERNAL_SYSTEM_NAME}.${Settings.ACTOR_DATA_KEY}.${this.fixKey(key)}`;
    }

    // </editor-fold>

    // <editor-fold desc="Properties">
    protected actor: Actor;
    protected actorSheet: PDFActorSheetAdapter;
    protected viewerContainer: JQuery;
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
                    new ActorSheetSelect(this.getCurrentSheet(), async (sheet) => {
                        await this.setCurrentSheet(sheet);
                        await this.actorSheet.close();
                        await this.open(sheet);
                    }).render(true);
                },
            });
        }

        return buttons;
    }

    // </editor-fold>

    // <editor-fold desc="Instance Methods">

    protected flattenActor(): Record<string, string> {
        const data = flattenObject({
            name: this.actor.name,
            data: this.actor.data.data,
            flags: this.actor.data.flags,
        }) as Record<string, string>;

        // Do not allow non-data keys to make it into the flat object
        for (const key of Object.keys(data)) {
            if (!ActorViewer.dataPathValid(key)) {
                delete data[key];
            }
        }

        return data;
    }

    protected resolveDelta(oldData: Record<string, any>, newData: Record<string, any>) {
        // Flags must be fully resolved
        const delta = { ...flattenObject({ flags: this.actor.data.flags }) };
        for (const [key, newValue] of Object.entries(newData)) {
            const oldValue = oldData[key];

            // Arrays dont make sense on static PDFs
            if (Array.isArray(newValue) || Array.isArray(oldValue)) {
                delete delta[key];
                continue;
            }

            // Skip matching values
            if (oldValue !== undefined && newValue === oldValue) {
                continue;
            }

            delta[key] = newValue;
        }

        return delta;
    }

    protected async update(delta: object) {
        // data must be expanded to set properly
        return this.actor.update(expandObject(delta));
    }

    protected onPageRendered(event) {
        const container = $(event.source.div);
        const elements = container.find('input, textarea') as JQuery<HTMLInputElement | HTMLTextAreaElement>;

        if (this.viewerContainer === undefined || this.viewerContainer.length === 0) {
            this.viewerContainer = $(container.parents().find('#viewerContainer'));
        }

        this.initializeInputs(elements);

        elements.on('change', this.onInputChanged.bind(this));

        super.onPageRendered(event);
    }

    protected initializeInputs(elements: JQuery<HTMLInputElement | HTMLTextAreaElement>) {
        const oldData = this.flattenActor();
        const newData = duplicate(oldData);

        // Load data from sheet as initialization data
        // Fill in existing data where it exists on the actor
        let write = false;
        for (const element of elements) {
            const input = element;

            let key = input.getAttribute('name');
            if (key === null || !ActorViewer.dataPathValid(key)) {
                continue;
            }

            key = ActorViewer.resolveKeyPath(key);

            if (isCheckbox(element)) {
                write = this.initializeCheckInput($(element), key, newData) || write;
            } else if (isInput(element) || isTextArea(element)) {
                write = this.initializeTextInput($(input), key, newData) || write;
            } else {
                console.error('Unsupported input type in PDF.');
            }
        }

        if (write) {
            this.update(this.resolveDelta(oldData, newData));
        }
    }

    protected initializeTextInput(input: JQuery<HTMLInputElement | HTMLTextAreaElement>, key: string, data: Record<string, string>): boolean {
        let value = data[key];
        if (value === undefined) {
            // If value does not exist on actor yet, load from sheet
            const inputValue = input.val();

            if (inputValue) {
                // Actor changes were made
                data[key] = inputValue.toString();
                return true;
            }
        } else {
            // Otherwise initialize input value to actor value
            this.setTextInput(input, value);
        }
        return false;
    }

    protected initializeCheckInput(input: JQuery<HTMLInputElement>, key: string, data: Record<string, string>): boolean {
        let value = data[key];
        if (value === undefined) {
            const inputValue = input.attr('checked') !== undefined;

            // Actor changes were made
            data[key] = inputValue.toString();
            return true;
        } else {
            this.setCheckInput(input, value);
        }
        return false;
    }

    protected setTextInput(input: JQuery<HTMLInputElement | HTMLTextAreaElement>, value: string) {
        input.val(value);
    }

    protected setCheckInput(input: JQuery<HTMLInputElement>, value: string) {
        if (value === 'true') {
            input.attr('checked', 'true');
        } else {
            input.removeAttr('checked');
        }
    }

    protected onUpdateActor(actor: Actor, data: Partial<ActorData> & { _id: string }, options: { diff: boolean }, id: string) {
        if (data._id !== this.actor.id) {
            return;
        }

        const args = duplicate(data);
        delete args['_id'];

        this.initializeInputs(this.viewerContainer.find('input, textarea') as JQuery<HTMLInputElement | HTMLTextAreaElement>);
        $(this.element).parent().parent().find('.window-title').text(this.actor.name);
    }

    protected onInputChanged(event) {
        const element = event.currentTarget;
        let value = '';

        if (isCheckbox(element)) {
            const input = $(element as HTMLInputElement);
            value = this.getCheckInputValue(input);
        } else if (isInput(element) || isTextArea(element)) {
            const input = $(element as HTMLInputElement | HTMLTextAreaElement);
            value = this.getTextInputValue(input);
        }

        let key = $(element).attr('name');
        if (key === undefined) {
            return;
        }

        key = ActorViewer.resolveKeyPath(key);

        if (!ActorViewer.dataPathValid(key)) {
            return;
        }

        this.update(
            this.resolveDelta(this.flattenActor(), {
                [key]: value,
            }),
        );
    }

    protected getTextInputValue(input: JQuery<HTMLInputElement | HTMLTextAreaElement>): string {
        const value = input.val();
        if (!value) {
            return '';
        }

        return value.toString().trim();
    }

    protected getCheckInputValue(input: JQuery<HTMLInputElement>): string {
        return (window.getComputedStyle(input.get(0), ':before').content !== 'none').toString();
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
