import Settings from '../settings/Settings';
import BaseViewer from './BaseViewer';
import ActorSheetSelect from '../app/ActorSheetSelect';
import { PDFjsViewer } from '../common/types/PDFjsViewer';
import { getAbsoluteURL } from '../Util';
import PDFActorSheetAdapter from '../app/PDFActorSheetAdapter';

/**
 * The FillableViewer class provides an interface for displaying, serializing, and observing form-fillable PDFs.
 */
export default class FillableViewer extends BaseViewer {
    // <editor-fold desc="Static Properties">

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = `systems/${Settings.EXTERNAL_SYSTEM_NAME}/pdfoundry-dist/templates/app/pdf-viewer-fillable.html`;
        return options;
    }

    // </editor-fold>
    // <editor-fold desc="Properties">
    protected actor: Actor;
    protected actorData: Map<string, string>;
    protected actorSheet: PDFActorSheetAdapter;
    // </editor-fold>

    // <editor-fold desc="Constructor & Initialization">
    constructor(actor: Actor, sheet: PDFActorSheetAdapter, options?: ApplicationOptions) {
        super(options);

        this.actor = actor;
        this.actorSheet = sheet;

        this.actorData = this.getActorData();

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
    public async setCurrentSheet(value: string) {
        return this.actor.setFlag(Settings.EXTERNAL_SYSTEM_NAME, Settings.ACTOR_SHEET_KEY, value);
    }

    /**
     * Get the actor data map from the actor flags.
     */
    public getActorData(): Map<string, string> {
        const data = this.actor.getFlag(Settings.EXTERNAL_SYSTEM_NAME, Settings.ACTOR_DATA_KEY);
        if (data) {
            return new Map<string, string>(Object.entries(data));
        } else {
            return new Map<string, string>();
        }
    }

    /**
     * Save the actor data map to the actor flags.
     * @param value
     */
    public async setActorData(value: Map<string, string>) {
        return this.actor.setFlag(Settings.EXTERNAL_SYSTEM_NAME, Settings.ACTOR_DATA_KEY, value);
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
        }

        buttons.unshift({
            class: 'pdf-fillable-select',
            icon: 'fas fa-user-cog',
            label: 'Sheet Select',
            onclick: () => {
                new ActorSheetSelect(this.getCurrentSheet(), this.onUpdateBaseSheet.bind(this)).render(true);
            },
        });

        return buttons;
    }

    public getData(options?: any): any | Promise<any> {
        const data = super.getData(options);
        data.interactive = true;
        return data;
    }

    // </editor-fold>

    // <editor-fold desc="Instance Methods">

    protected async onUpdateBaseSheet(sheet) {
        await this.setCurrentSheet(sheet);
        await this.actorSheet.close();
    }

    protected onPageRendered(event) {
        super.onPageRendered(event);

        const div = $(event.source.div);
        const inputs = div.find('input');

        for (const input of inputs) {
            this.initializeInput($(input));
        }

        inputs.on('input', this.onActorDataInputted.bind(this));
        inputs.on('change', this.onActorDataChanged.bind(this));
    }

    protected initializeInput(input: JQuery<HTMLInputElement>) {
        const key = input.attr('name');
        if (key === undefined) return;

        let value = this.actorData.get(key);
        if (value === undefined) {
            const inputValue = input.val();
            if (inputValue) {
                this.actorData.set(key, inputValue.toString());
            }
        } else {
            input.val(value);
        }
    }

    protected onActorDataInputted(event) {
        console.warn(event);
    }
    protected onActorDataChanged(event) {
        this.onActorDataInputted(event);
    }

    public getField(key: string) {}

    public onActorDataUpdated(key: string, newValue: string) {
        console.warn('onActorDataUpdated');
    }

    protected async onViewerReady(viewer: PDFjsViewer): Promise<void> {
        const sheet = this.getCurrentSheet();
        if (sheet) {
            const url = getAbsoluteURL(sheet);
            await this.open(url);
        }
    }

    async save(): Promise<void> {
        // await this._actor.setFlag(Settings.EXTERNAL_SYSTEM_NAME, Settings.ACTOR_DATA_KEY, this._actorData);
    }

    async close(): Promise<any> {
        await this.save();
        if (this._viewer) {
            await this._viewer.close();
        }
        await super.close();
    }

    async open(pdfSource: string | Uint8Array, page?: number): Promise<void> {
        try {
            await super.open(pdfSource, page);
        } catch (error) {
            await this.actorSheet.close();
            new PDFActorSheetAdapter(this.actor, this.options).render(true);
        }
    }

    // </editor-fold>
}
