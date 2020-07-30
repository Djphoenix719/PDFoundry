import FillableViewer from '../viewer/FillableViewer';

/**
 * Adapts a FillableViewer to function as a ActorSheet
 * @private
 */
export default class PDFActorSheetAdapter extends ActorSheet {
    private _viewer: FillableViewer;
    private readonly _options?: ApplicationOptions;

    constructor(actor: Actor, options?: ApplicationOptions) {
        super(actor, options);

        this._options = options;
    }

    protected activateListeners(html: JQuery | HTMLElement) {
        $(this.element).css('display', 'none');
        super.activateListeners(html);
    }

    getData(): ActorSheetData {
        return mergeObject(super.getData(), this._viewer.getData());
    }

    render(force?: boolean, options?: RenderOptions): Application {
        if (!this._viewer) {
            this._viewer = new FillableViewer(this.actor, this, this._options);
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
