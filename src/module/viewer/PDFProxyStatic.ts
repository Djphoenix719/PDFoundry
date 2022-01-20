/*
 * Copyright 2022 Andrew Cuccinello
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
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

import { MODULE_NAME } from '../Constants';
import { PollingWrapper } from '../util/PollingWrapper';
import { PDFThemeManager } from '../Themes';
import { getAbsoluteURL } from '../util/Utilities';
import { AbstractDataStore } from '../store/AbstractDataStore';
import PDFEvent = PDFJS.PDFEvent;

/**
 * Arguments for opening a PDF file.
 */
export interface PDFProxyOpenArgs {
    /**
     * Page to open to when the viewer opens. Pass undefined to open to the last page the user was viewing.
     */
    page?: number | string;
    //TODO: Viewable-range?
    renderInteractiveForms?: boolean;
    enableScripting?: boolean;
}

/**
 * Constructor arguments for the PDF viewer.
 */
export interface PDFProxyConstructorArgs extends PDFProxyOpenArgs {
    classList: string[];
    polling: {
        wait: number;
        tries: number;
    };
    theme: string;
    dataStore?: AbstractDataStore;
}

class PDFProxyError extends Error {
    protected readonly viewer: PDFProxyStatic | null;

    constructor(message: string, viewer: PDFProxyStatic | null) {
        super(message);

        this.viewer = viewer;
    }
}

/**
 * A proxy responsible for binding PDFJS to an arbitrary HTML element.
 */
export class PDFProxyStatic {
    protected _options: PDFProxyConstructorArgs;
    protected _iframe: HTMLIFrameElement | undefined;
    protected _application: PDFJS.PDFApplication | undefined;
    protected _eventBus: PDFJS.EventBus | undefined;

    public constructor(options?: Partial<PDFProxyConstructorArgs>) {
        console.warn('PDFProxyStatic');

        if (options === undefined) {
            options = {};
        }

        if (options.classList === undefined) {
            options.classList = ['pdfViewer'];
        }

        if (options.polling === undefined) {
            options.polling = {
                wait: 5,
                tries: 1000,
            };
        }

        if (options.theme === undefined) {
            options.theme = PDFThemeManager.instance.active.id;
        }

        if (options.renderInteractiveForms === undefined) {
            options.renderInteractiveForms = false;
        }

        if (options.enableScripting === undefined) {
            options.enableScripting = false;
        }

        // Interactive forms MUST be enabled for Scripting to work.
        if (options.enableScripting && !options.renderInteractiveForms) {
            options.enableScripting = false;
            console.warn('You have specified scripting be enabled, but interactive forms be disabled. This is not supported, and scripting has been disabled.');
        }

        this._options = options as Required<PDFProxyConstructorArgs>;
    }

    // <editor-fold desc="Viewer Property Accessors">

    /**
     * Is the current PDF completely done downloading?
     */
    public get downloadComplete(): boolean {
        return !!this._application && this._application.downloadComplete;
    }

    /**
     * Is the viewer initialized (e.g. ready to receive requests)?
     */
    public get initialized(): boolean {
        return !!this._application && this._application.initialized;
    }

    /**
     * Return the primary page currently in view.
     */
    public get page(): number | undefined {
        return this._application?.page;
    }

    /**
     * Set the page of the PDF currently in view.
     * @param value The page number. Undefined is treated as 0.
     */
    public set page(value: number | undefined) {
        if (value === undefined) {
            value = 0;
        }

        if (this._application) {
            this._application.page = value;
        }
    }

    /**
     * Get the number of pages in open PDF. Returns NaN if the value is unknown (e.g. when a PDF is not open).
     */
    public get pagesCount(): number {
        return this._application ? this._application.pagesCount : NaN;
    }

    /**
     * Get the status of the scripting system.
     */
    public get scriptingReady(): boolean {
        return !!this._application && this._application.scriptingReady;
    }

    /**
     * Get the div containing all rendered page elements.
     */
    public get container(): HTMLDivElement | undefined {
        return this._application?.pdfViewer.container;
    }

    // </editor-fold>

    /**
     * Bind the rendering of the proxy to the specified HTML element.
     * @param element
     */
    public async bind(element: JQuery | HTMLElement): Promise<boolean> {
        element = $(element);

        this._iframe = this._createFrame();
        element.html(this._iframe);

        // Await the application to finish initializing
        this._application = await PollingWrapper(
            async () => {
                if (this._iframe && this._iframe.contentWindow && this._iframe.contentWindow['PDFViewerApplication']) {
                    return this._iframe.contentWindow['PDFViewerApplication'] as PDFJS.PDFApplication;
                }
            },
            this._options.polling.wait,
            this._options.polling.tries,
        );

        if (!this._application) {
            return false;
        }

        // Await the event bus to finish initializing.
        this._eventBus = await PollingWrapper(
            async () => {
                if (this._application && this._application.eventBus) {
                    return this._application.eventBus;
                }
            },
            this._options.polling.wait,
            this._options.polling.tries,
        );

        if (!this._eventBus) {
            return false;
        }

        return true;
    }

    /**
     * Open a PDF file in this proxy. Requires the viewer to be bound.
     * @param file
     * @param args
     */
    public async open(file: PDFJS.File, args?: Partial<PDFProxyOpenArgs>): Promise<void> {
        if (!this._application) {
            throw new PDFProxyError(`Viewer is not yet initialized.`, null);
        }

        if (args === undefined) {
            args = {};
        }

        if (typeof args.page === 'string') {
            args.page = parseInt(args.page);
        }

        if (args.page) {
            this._application.initialBookmark = `page=${args.page}`;
        }

        // TODO: Can feed more options in here like 'zoom'

        this._applyTheme();
        await this._application.initializedPromise;
        await this._application.open(file);
        await this._application.pdfViewer.pagesPromise;

        // See #19 - fixes other scroll modes not loading with initial bookmark
        if (args.page && this._application.page !== args.page) {
            this._application.page = args.page;
        }
    }

    /**
     * Register an event callback with the proxy.
     * @param eventName
     * @param callback
     * @param args
     */
    public on(eventName: PDFEvent, callback: Function, args?: PDFJS.EventBusRegisterArguments) {
        if (this._eventBus === undefined) {
            throw new PDFProxyError('Event system has yet to be initialized.', this);
        }

        if (args === undefined) {
            args = { once: false };
        }

        this._eventBus.on(eventName, callback, args);
    }

    /**
     * Remove an event callback from the proxy.
     * @param eventName
     * @param callback
     */
    public off(eventName: PDFEvent, callback: Function) {
        if (this._eventBus === undefined) {
            throw new PDFProxyError('Event system has yet to be initialized.', this);
        }

        this._eventBus.off(eventName, callback);
    }

    /**
     * Create an iframe used to render the actual viewer.
     * @private
     */
    protected _createFrame(): HTMLIFrameElement {
        const iframe = document.createElement('iframe');
        iframe.classList.add(...this._options.classList);
        iframe.src = `modules/${MODULE_NAME}/pdfjs/web/viewer.html`;
        iframe.src += `?renderInteractiveForms=${this._options.renderInteractiveForms}`;
        iframe.src += `&enableScripting=${this._options.enableScripting}`;
        return iframe;
    }

    /**
     * Apply the active theme to the viewer.
     * @private
     */
    protected _applyTheme(): void {
        const frameDocument = this._iframe?.contentDocument;
        if (!frameDocument) {
            throw new PDFProxyError('Something went wrong while applying the theme, the viewer does not appear to be initialized.', this);
        }

        const theme = PDFThemeManager.instance.active;
        const head = $(frameDocument).find('head');
        head.append($(`<link href="${getAbsoluteURL(theme.path)}" rel="stylesheet" type="text/css" media="all">`));
    }
}
