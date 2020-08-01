import BaseViewer from './BaseViewer';
import Settings from '../settings/Settings';

export default class FillableViewer extends BaseViewer {
    // <editor-fold desc="Static Properties">

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = `systems/${Settings.EXTERNAL_SYSTEM_NAME}/pdfoundry-dist/templates/app/pdf-viewer-fillable.html`;
        return options;
    }

    // </editor-fold>
    // <editor-fold desc="Static Methods"></editor-fold>
    // <editor-fold desc="Properties">

    protected entity: Entity;

    // </editor-fold>
    // <editor-fold desc="Constructor & Initialization">

    protected constructor(entity: Entity, options?: ApplicationOptions) {
        super(options);

        this.entity = entity;
    }

    // </editor-fold>
    // <editor-fold desc="Getters & Setters"></editor-fold>
    // <editor-fold desc="Instance Methods"></editor-fold>
}
