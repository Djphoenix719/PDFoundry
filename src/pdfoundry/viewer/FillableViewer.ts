import Settings from '../settings/Settings';
import BaseViewer from './BaseViewer';
import ActorSheetSelect from '../app/ActorSheetSelect';

/**
 * The FillableViewer class provides an interface for displaying, serializing, and observing form-fillable PDFs.
 */
export default class FillableViewer extends BaseViewer {
    protected _actor: Actor;
    protected _actorData: Record<string, string>;
    protected _baseSheet: string;

    constructor(actor: Actor, options?: ApplicationOptions) {
        super(options);

        this._actor = actor;
        this._actorData = this._actor.getFlag(Settings.EXTERNAL_SYSTEM_NAME, Settings.ACTOR_DATA_KEY);
        if (this._actorData === undefined) {
            this._actorData = {};
        }

        this._baseSheet = this._actor.getFlag(Settings.EXTERNAL_SYSTEM_NAME, Settings.ACTOR_SHEET_KEY);
    }

    public getData(options?: any): any | Promise<any> {
        const data = super.getData(options);
        data.interactive = true;
        return data;
    }

    protected _getHeaderButtons(): any[] {
        const buttons = super._getHeaderButtons();

        buttons.unshift({
            class: 'configure-sheet',
            icon: 'fas fa-file-pdf',
            label: game.i18n.localize('PDFOUNDRY.VIEWER.DisableSheet'),
            onclick: async () => {
                new EntitySheetConfig(this._actor).render(true);
            },
        });

        const temp = buttons[0];
        buttons[0] = buttons[1];
        buttons[1] = temp;

        buttons.unshift({
            class: 'pdf-fillable-select',
            icon: 'fas fa-user-cog',
            label: 'Sheet Select',
            onclick: () => {
                new ActorSheetSelect(this._baseSheet, (sheet) => {
                    this._baseSheet = sheet;
                    this._actor.setFlag(Settings.EXTERNAL_SYSTEM_NAME, Settings.ACTOR_SHEET_KEY, sheet);
                }).render(true);
            },
        });

        return buttons;
    }

    onPageRendered(event) {
        super.onPageRendered(event);

        // console.warn(`Page ${event.pageNumber} Rendered`);
        // console.warn(event);
        //
        // const annotationLayer = $(event.source.annotationLayer.div);
        // const inputs = annotationLayer.find('section input');
        // inputs.each((index, element) => {
        //     this.initializeInput($(element as HTMLInputElement));
        // });
        //
        // inputs.on('input', (event) => this.handleInput(event));
        // inputs.on('change', (event) => this.handleInput(event));
        //
        // const textAreas = annotationLayer.find('section textarea');
        // textAreas.each((index, element) => {
        //     this.initializeInput($(element as HTMLTextAreaElement));
        // });
        //
        // textAreas.on('input', (event) => this.handleInput(event));
        // textAreas.on('change', (event) => this.handleInput(event));
    }

    protected getActorValue(key: string): string | null {
        return this._actorData[key] ?? null;
    }

    protected setActorValue(key: string, value: any): void {
        this._actorData[key] = value;
    }

    protected getDataKey(input: JQuery<HTMLInputElement | HTMLTextAreaElement>): string {
        let key = input.prop('name');
        key = key.replace(/\s/g, '-');
        return key;
    }

    protected getInputValue(input: JQuery<HTMLInputElement | HTMLTextAreaElement>): string {
        const value = input.val();

        if (typeof value === 'string') {
            return value;
        } else {
            throw new Error('Value type !== "string');
        }
    }

    protected setInputValue(input: JQuery<HTMLInputElement | HTMLTextAreaElement>, value: string | number): void {
        input.val(value);
    }

    protected handleInput(event: JQuery.TriggeredEvent): void {
        const target: HTMLInputElement | HTMLTextAreaElement = event.currentTarget;
        const input = $(target);
        const key = this.getDataKey(input);
        const value = this.getInputValue(input);
        this.setActorValue(key, value);

        console.warn(`Updated _actorData[${key}] = ${value}`);
    }

    protected initializeInput(input: JQuery<HTMLInputElement | HTMLTextAreaElement>) {
        // Over-write the PDFjs disabled inputs; once PDFjs
        //  supports derived fields we can remove this
        input.removeAttr('disabled');

        const key = this.getDataKey(input);

        let value = this.getActorValue(key);
        if (value !== null) {
            this.setInputValue(input, value);

            console.warn(`Loaded existing _actorData[${key}] = ${value}`);
        } else {
            value = this.getInputValue(input);
            this.setActorValue(key, value);

            console.warn(`Initialized: _actorData[${key}] = ${value}`);
        }
    }
}
