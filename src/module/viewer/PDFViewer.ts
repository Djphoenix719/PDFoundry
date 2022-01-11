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

/**
 * Constructor arguments for the PDF viewer.
 */
export interface PDFViewerOptions {
    classList: string[];
    polling: {
        wait: number;
        tries: number;
    };
    theme: string;
    renderInteractiveForms: boolean;
    enableScripting: boolean;
}

/**
 * Arguments that may be passed when opening a PDF file.
 */
export interface PDFViewerOpenArgs {
    /**
     * What page should the PDF open to?
     * Default: 1
     */
    page: number | string;
    /**
     * Should interactive forms (e.g. fillable forms) be enabled?
     * Default: False
     */
    renderInteractiveForms: boolean;
    /**
     * Should scripting in PDFs be enabled? Requires renderInteractiveForms.
     * Default: False
     */
    enableScripting: boolean;
}

/**
 * A PDF viewer which can position and manage itself in an arbitrary HTML element.
 */
export class PDFViewer {
    protected _iframe: HTMLIFrameElement | undefined;
    protected _application: PDFJS.PDFApplication | undefined;
    protected _eventBus: PDFJS.EventBus | undefined;
    protected _options: Required<PDFViewerOptions>;

    public constructor(options?: Partial<PDFViewerOptions>) {
        if (options === undefined) {
            options = {};
        }

        if (!options.classList) {
            options.classList = ['pdfViewer'];
        }

        if (!options.polling) {
            options.polling = {
                wait: 5,
                tries: 1000,
            };
        }

        if (!options.theme) {
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
        }

        this._options = options as Required<PDFViewerOptions>;
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

    // </editor-fold>

    /**
     * Bind the viewer to an HTML element. This method will create an iframe inside the target element, you do not need to create this frame yourself.
     * @param element The element to bind to.
     * @return boolean True if the binding & initialization completed successfully.
     */
    public async bind(element: JQuery | HTMLElement): Promise<boolean> {
        element = $(element);

        this._iframe = this._createFrame();
        element.html(this._iframe);

        // Await the application to finish initializing
        this._application = await PollingWrapper(
            async () => {
                if (this._iframe && this._iframe.contentWindow && (this._iframe.contentWindow as any)['PDFViewerApplication']) {
                    return (this._iframe.contentWindow as any)['PDFViewerApplication'] as PDFJS.PDFApplication;
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
     * Open a PDF by URL or byte array.
     * @param file The file to open, either a URL or a byte array of the PDF.
     * @param args PDF open args.
     */
    public async open(file: PDFJS.File, args?: Partial<PDFViewerOpenArgs>): Promise<void> {
        if (!this._application) {
            throw new PDFViewerError(`Viewer is not yet initialized.`, null);
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
     * Create an iframe used to render the actual viewer.
     * @private
     */
    private _createFrame(): HTMLIFrameElement {
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
    private _applyTheme(): void {
        const frameDocument = this._iframe?.contentDocument;
        if (!frameDocument) {
            throw new PDFViewerError('Something went wrong while applying the theme, the viewer does not appear to be initialized.', this);
        }

        const theme = PDFThemeManager.instance.active;
        const head = $(frameDocument).find('head');
        head.append($(`<link href="${getAbsoluteURL(theme.path)}" rel="stylesheet" type="text/css" media="all">`));
    }
}

class PDFViewerError extends Error {
    protected readonly viewer: PDFViewer | null;

    constructor(message: string, viewer: PDFViewer | null) {
        super(message);

        this.viewer = viewer;
    }
}
