import ActorViewer from '../viewer/ActorViewer';

/**
 * Adapts a FillableViewer to function as a ActorSheet
 * @private
 */
export default class PDFActorSheetAdapter extends ActorSheet {
    private _viewer: ActorViewer;
    private readonly _options?: ApplicationOptions;

    constructor(actor: Actor, options?: ApplicationOptions) {
        super(actor, options);

        this._options = options;
    }

    protected activateListeners(html: JQuery | HTMLElement) {
        $(this.element).css('display', 'none');
        super.activateListeners(html);
    }

    protected async _onSubmit(...args): Promise<any> {
        // PDFoundry handles data in the FillableViewer
        return;
    }

    getData(): ActorSheetData {
        return mergeObject(super.getData(), this._viewer.getData());
    }

    protected _updateObject(event: Event | JQuery.Event, formData: any): Promise<any> {
        return super._updateObject(event, formData);
    }

    render(force?: boolean, options?: RenderOptions): Application {
        if (!this._viewer) {
            this._viewer = new ActorViewer(this.actor, this, this._options);
        }

        // If this window is already open, don't re-render
        if (this._state === Application.RENDER_STATES.RENDERED) {
            return this;
        }

        this._viewer.render(force, options);
        return super.render(force, options);
    }

    async close(): Promise<void> {
        if (this._viewer) {
            await this._viewer.close();
            delete this._viewer;
        }
        return super.close();
    }
}
