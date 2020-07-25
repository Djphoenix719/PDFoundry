import FillableViewer from '../viewer/FillableViewer';

/**
 * Adapts a FillableViewer to function as a ActorSheet
 * @private
 */
export default class ActorSheetAdapter extends ActorSheet {
    private _viewer: FillableViewer;

    constructor(...args) {
        super(...args);

        this._viewer = new FillableViewer(args[0]);
    }

    get template(): string {
        return this._viewer.template;
    }

    render(force?: boolean, options?: RenderOptions): Application {
        return this._viewer.render(force, options);
    }

    async close(): Promise<void> {
        await this._viewer.close();
        return super.close();
    }
}
