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

import Settings from '../Settings';
import EventStore from '../common/helpers/events';
import { PDFViewerEvent } from '../common/types/PDFHooks';
import { PDFjsViewer } from '../common/types/PDFjsViewer';
import { PDFjsEventBus } from '../common/types/PDFjsEventBus';
import { BUTTON_GITHUB, BUTTON_KOFI } from '../common/helpers/header';
import Api from '../Api';
import { getAbsoluteURL } from '../Util';

/**
 * The base viewer class from which all other types of viewers inherit.
 * @see {@link StaticViewer}
 * @see {@link FillableViewer}
 * @see {@link ActorViewer}
 * @module API
 */
export default abstract class BaseViewer extends Application {
    // <editor-fold desc="Static Properties">

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['app', 'window-app', 'pdfoundry-viewer'];
        options.template = `${Settings.PATH_TEMPLATES}/app/viewer/static.html`;
        options.title = game.i18n.localize('PDFOUNDRY.VIEWER.ViewPDF');
        options.width = 8.5 * 100 + 64;
        options.height = 11 * 100 + 64;
        options.resizable = true;
        return options;
    }

    // </editor-fold>

    // <editor-fold desc="Properties">

    protected _frame: HTMLIFrameElement;
    protected _viewer: PDFjsViewer;
    protected _eventBus: PDFjsEventBus;
    protected _eventStore: EventStore<PDFViewerEvent>;

    // </editor-fold>

    // <editor-fold desc="Constructor & Initialization">

    protected constructor(options?: Application.Options) {
        super(options);
        this._eventStore = new EventStore<PDFViewerEvent>();
    }

    // </editor-fold>

    // <editor-fold desc="Instance Methods">

    /**
     * Finish the download and return the byte array for the file.
     * @returns A promise that resolves to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array|Uint8Array}
     *  of file bytes once that download is finished. You can pass this to a viewer to open it, or do something else with it.
     */
    public download(): Promise<Uint8Array> {
        return new Promise<Uint8Array>(async (resolve) => {
            const viewer = await this.getViewer();
            let timeout;
            const returnOrWait = () => {
                if (viewer.downloadComplete) {
                    resolve(viewer.pdfDocument.getData());
                    return;
                }

                timeout = setTimeout(returnOrWait, 50);
            };
            returnOrWait();
        });
    }

    /**
     * Open a PDF
     * @param pdfSource A URL or byte array to open.
     * @param page The initial page to open to
     */
    public async open(pdfSource: string | Uint8Array, page?: number | string) {
        const pdfjsViewer = await this.getViewer();

        if (typeof page === 'string') {
            page = parseInt(page);
        }

        if (page) {
            pdfjsViewer.initialBookmark = `page=${page}`;
        }

        await pdfjsViewer.initializedPromise;
        await pdfjsViewer.open(pdfSource);
        await pdfjsViewer.pdfViewer.pagesPromise;

        // See #19 - fixes other scroll modes not loading with initial bookmark
        if (page && pdfjsViewer.page !== page) {
            pdfjsViewer.page = page;
        }
    }

    // </editor-fold>

    // <editor-fold desc="Getters & Setters">

    /**
     * Get the currently viewed page.
     */
    public get page() {
        return this._viewer.page;
    }

    /**
     * Set the currently viewed page.
     * @param value
     */
    public set page(value: number) {
        this._viewer.page = value;
    }

    /**
     * Returns the localized name of the window title.
     * @override
     */
    public get title(): string {
        return game.i18n.localize('PDFOUNDRY.VIEWER.ViewPDF');
    }

    /**
     * Wait for the internal PDFjs viewer to be ready and usable.
     */
    protected getViewer(): Promise<PDFjsViewer> {
        if (this._viewer) {
            return Promise.resolve(this._viewer);
        }

        return new Promise<any>((resolve) => {
            let timeout;
            const returnOrWait = () => {
                // If our window has finished initializing...
                if (this._frame) {
                    // If PDFjs has finished initializing...
                    if (this._frame.contentWindow && this._frame.contentWindow['PDFViewerApplication']) {
                        const viewer = this._frame.contentWindow['PDFViewerApplication'];

                        resolve(viewer);
                        return;
                    }
                }

                // If any ifs fall through, try again in a few ms
                timeout = setTimeout(returnOrWait, 5);
            };
            returnOrWait();
        });
    }

    /**
     * Wait for the internal PDFjs eventBus to be ready and usable.
     */
    protected getEventBus(): Promise<PDFjsEventBus> {
        if (this._eventBus) {
            return Promise.resolve(this._eventBus);
        }

        return new Promise<any>((resolve) => {
            this.getViewer().then((viewer) => {
                let timeout;
                const returnOrWait = () => {
                    if (viewer.eventBus) {
                        resolve(viewer.eventBus);
                        return;
                    }
                    timeout = setTimeout(returnOrWait, 5);
                };
                returnOrWait();
            });
        });
    }

    // </editor-fold>

    // <editor-fold desc="Foundry Overrides">

    protected _getHeaderButtons(): any[] {
        const buttons = super._getHeaderButtons();
        buttons.unshift(BUTTON_GITHUB);
        buttons.unshift(BUTTON_KOFI);
        return buttons;
    }

    /**
     * @internal
     */
    public getData(options?: any): any | Promise<any> {
        const data = super.getData(options);
        data.viewerFramePath = `${Settings.PATH_PDFJS}/web/viewer.html`;
        return data;
    }

    protected async activateListeners(html: JQuery): Promise<void> {
        this.onViewerOpening();
        super.activateListeners(html);

        this._frame = html.parent().find('iframe.pdfViewer').get(0) as HTMLIFrameElement;
        this.getViewer().then(async (viewer) => {
            this._viewer = viewer;

            const theme = Api.activeTheme;
            const frameDocument = $(this._frame.contentDocument as Document);
            const head = frameDocument.find('head');
            head.append($(`<link href="${getAbsoluteURL(theme.filePath)}" rel="stylesheet" type="text/css" media="all">`));

            this.onViewerOpened();

            this.getEventBus().then((eventBus) => {
                this._eventBus = eventBus;
                this._eventBus.on('pagerendered', this.onPageRendered.bind(this));
                this._eventBus.on('pagechanging', this.onPageChanging.bind(this));
                this._eventBus.on('updateviewarea', this.onViewAreaUpdated.bind(this));
                this._eventBus.on('scalechanging', this.onScaleChanging.bind(this));

                this.onViewerReady();
            });
        });

        // _getHeaderButtons does not permit title attributes used for tooltips...
        $(html).parents().parents().find('.pdf-sheet-show-players').prop('title', game.i18n.localize('PDFOUNDRY.VIEWER.ShowToPlayersTitle'));
    }

    /**
     * Close the application and un-register references to it within UI mappings
     * This function returns a Promise which resolves once the window closing animation concludes
     */
    public async close(): Promise<void> {
        this.onViewerClosing();

        await super.close();

        this.onViewerClosed();
    }

    // </editor-fold>

    // <editor-fold desc="Events">

    /**
     * Fires when the viewer window first starts opening
     * @protected
     */
    protected onViewerOpening() {
        this._eventStore.fire('viewerOpening', this);
    }

    /**
     * Fires when the viewer window is fully opened, but not yet ready
     * @protected
     */
    protected onViewerOpened() {
        this._eventStore.fire('viewerOpened', this);
    }

    /**
     * Fires when the viewer window is fully opened and is ready for use
     * @protected
     */
    protected onViewerReady() {
        this._eventStore.fire('viewerReady', this);
    }

    /**
     * Fires when the viewer window first starts closing
     * @protected
     */
    protected onViewerClosing() {
        this._eventStore.fire('viewerClosing', this);
    }

    /**
     * Fires when the viewer window is fully closed
     * @protected
     */
    protected onViewerClosed() {
        this._eventStore.fire('viewerClosed', this);
    }

    /**
     * Occurs during scrolling when a page passes the breakpoint
     * @param event
     * @protected
     */
    protected onPageChanging(event) {
        this._eventStore.fire('pageChanging', this, {
            pageLabel: event.pageLabel,
            pageNumber: event.pageNumber,
        });
    }

    /**
     * Occurs when a new page is loaded and rendered
     * @param event
     * @protected
     */
    protected onPageRendered(event) {
        this._eventStore.fire('pageRendered', this, {
            pageNumber: event.pageNumber,
            pageLabel: event.source.pageLabel,
            width: event.source.width,
            height: event.source.height,
            rotation: event.source.rotation,
            scale: event.source.scale,
            canvas: event.source.canvas,
            div: event.source.div,
            error: event.source.error,
        });
    }

    /**
     * Occurs when the zoom is changed or window scrolled
     * @param event
     * @protected
     */
    protected onViewAreaUpdated(event) {
        this._eventStore.fire('viewAreaUpdated', this, {
            top: event.location.top,
            left: event.location.left,
            pageNumber: event.location.pageNumber,
            rotation: event.location.rotation,
            scale: event.location.scale,
        });
    }

    /**
     * Occurs when the zoom is changed
     * @param event
     * @protected
     */
    protected onScaleChanging(event) {
        this._eventStore.fire('scaleChanging', this, {
            presetValue: event.presetValue,
            scale: event.scale,
        });
    }

    /**
     * Register a callback to occur when an event fires. See individual events for descriptions and use {@link Api.DEBUG.EVENTS} to log and analyze events.
     * @param eventName
     * @param callback
     * @category Events
     */
    public on(eventName: PDFViewerEvent, callback: Function): void {
        this._eventStore.on(eventName, callback);
    }

    /**
     * Deregister an event that has been registered with {@link on} or {@link once}.
     * @param eventName
     * @param callback
     * @category Events
     */
    public off(eventName: PDFViewerEvent, callback: Function): void {
        this._eventStore.off(eventName, callback);
    }

    /**
     * Like {@link on} but only fires on the next occurrence.
     * @param eventName
     * @param callback
     * @category Events
     */
    public once(eventName: PDFViewerEvent, callback: Function): void {
        this._eventStore.once(eventName, callback);
    }

    // </editor-fold>
}
