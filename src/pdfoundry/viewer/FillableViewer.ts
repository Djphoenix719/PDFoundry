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
    // <editor-fold desc="Properties">
    protected _actor: Actor;
    protected _actorData: Map<string, string>;
    protected _actorSheet: PDFActorSheetAdapter;
    protected _baseSheet: string;
    // </editor-fold>

    // <editor-fold desc="Constructor & Initialization">
    constructor(actor: Actor, sheet: PDFActorSheetAdapter, options?: ApplicationOptions) {
        super(options);

        this._actor = actor;
        this._actorSheet = sheet;
        this._actorData = this._actor.getFlag(Settings.EXTERNAL_SYSTEM_NAME, Settings.ACTOR_DATA_KEY);
        if (this._actorData === undefined) {
            this._actorData = new Map<string, string>();
        } else {
            this._actorData = new Map<string, string>(Object.entries(this._actorData));
        }

        this._baseSheet = this._actor.getFlag(Settings.EXTERNAL_SYSTEM_NAME, Settings.ACTOR_SHEET_KEY);

        this.on('viewerReady', this.onViewerReady.bind(this));
    }
    // </editor-fold>

    // <editor-fold desc="Getters & Setters">

    protected _getHeaderButtons(): any[] {
        const buttons: any[] = [];

        buttons.unshift({
            label: 'Close',
            class: 'close',
            icon: 'fas fa-times',
            onclick: (ev) => this._actorSheet.close(),
        });

        const canConfigure = game.user.isGM || (this._actor.owner && game.user.can('TOKEN_CONFIGURE'));
        if (this.options.editable && canConfigure) {
            buttons.unshift({
                class: 'configure-token',
                icon: 'fas fa-user-circle',
                label: this._actor.token ? 'Token' : 'Prototype Token',
                onclick: async () => {
                    const token = this._actor.token || new Token(this._actor.data.token);
                    new TokenConfig(token, {
                        configureDefault: !this._actor.token,
                    }).render(true);
                },
            });
            buttons.unshift({
                class: 'configure-sheet',
                icon: 'fas fa-cog',
                label: 'Settings',
                onclick: async () => {
                    new EntitySheetConfig(this._actor).render(true);
                },
            });
        }

        buttons.unshift({
            class: 'pdf-fillable-select',
            icon: 'fas fa-user-cog',
            label: 'Sheet Select',
            onclick: () => {
                new ActorSheetSelect(this._baseSheet, async (sheet) => {
                    this._baseSheet = sheet;
                    const entity = await this._actor.setFlag(Settings.EXTERNAL_SYSTEM_NAME, Settings.ACTOR_SHEET_KEY, sheet);
                    await this.close();
                }).render(true);
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

    protected async activateListeners(html: JQuery): Promise<void> {
        return super.activateListeners(html);
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

        let value = this._actorData.get(key);
        if (value === undefined) {
            const inputValue = input.val();
            if (inputValue) {
                this._actorData.set(key, inputValue.toString());
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

    public onActorDataUpdated(key: string, newValue: string) {}

    protected async onViewerReady(viewer: PDFjsViewer): Promise<void> {
        if (this._baseSheet) {
            const url = getAbsoluteURL(this._baseSheet);
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

    // </editor-fold>
}
