// import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from 'pdfjs-dist';
import {PDFDocumentProxy} from 'pdfjs-dist';

// const pdfjsLib = require("../../node_modules/pdfjs-dist/build/pdf.js");

export class PdfViewerApp extends Application {

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'pdf-viewer';
        options.classes = ["app", "window-app", "sr5"];
        options.title = 'View PDF';
        options.template = 'modules/pdfoundry/templates/pdf-viewer-app.html';
        options.width = 8.5*100 + 64;
        options.height = 11*100 + 64;
        options.resizable = true;
        return options;
    }

    constructor(book: string, page: number) {
        super();
    }

    render(force?: boolean, options?: RenderOptions): Application {
        return super.render(force, options);
    }

    protected async activateListeners(html: JQuery<HTMLElement>): Promise<void> {
        const iframe: any = html.parents().find("iframe.pdfViewer").first().get(0);

        console.warn("HELLO");
        console.log(iframe.contentWindow);
    }

    close(): Promise<any> {
        return super.close();
    }
}