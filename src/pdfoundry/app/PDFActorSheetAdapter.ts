/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import ActorViewer from '../viewer/ActorViewer';
import Settings from '../Settings';

/**
 * Adapts a FillableViewer to function as a ActorSheet
 * @internal
 */
export default class PDFActorSheetAdapter extends ActorSheet {
    // <editor-fold desc="Static Properties"></editor-fold>
    // <editor-fold desc="Static Methods"></editor-fold>
    // <editor-fold desc="Properties">

    private _viewer: ActorViewer;
    private readonly _options?: Application.Options;

    // </editor-fold>

    // <editor-fold desc="Constructor & Initialization">

    constructor(actor: Actor, options?: Application.Options) {
        super(actor, options);

        this._options = options;
    }

    // </editor-fold>
    // <editor-fold desc="Getters & Setters">

    public get viewer(): ActorViewer {
        return this._viewer;
    }

    // </editor-fold>
    // <editor-fold desc="Instance Methods">

    protected activateListeners(html: JQuery | HTMLElement) {
        $(this.element).css('display', 'none');
        this.form = $(html).first().get(0);
        super.activateListeners(html);
    }

    protected async _onSubmit(...args): Promise<any> {
        // PDFoundry handles data in the FillableViewer
        return;
    }

    getData(): ActorSheet.Data {
        return mergeObject(super.getData(), this._viewer.getData());
    }

    protected _updateObject(event: Event | JQuery.Event, formData: any): Promise<any> {
        return super._updateObject(event, formData);
    }

    render(force?: boolean, options?: Application.RenderOptions): Application {
        if (!this._viewer) {
            const sheetId = this.actor.getFlag(Settings.MODULE_NAME, Settings.FLAGS_KEY.SHEET_ID);
            this._viewer = new ActorViewer(this.actor, sheetId, this, this._options);
        }

        // If this window is already open, don't re-render
        if (this._state === Application.RENDER_STATES.RENDERED) {
            return this;
        }

        this._viewer.render(force, options);
        return super.render(force, options);
    }

    // TODO: Sandbox compatibility - should force this class to extend CONFIG class instead.
    async scrollbarSet() {
        return;
    }

    async close(): Promise<void> {
        if (this._viewer) {
            await this._viewer.close();
            // @ts-ignore
            delete this._viewer;
        }
        return super.close();
    }

    // </editor-fold>
}
