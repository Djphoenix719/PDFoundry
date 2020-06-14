// import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from 'pdfjs-dist';
import {PDFDocumentProxy} from 'pdfjs-dist';

const pdfjsLib = require("../../node_modules/pdfjs-dist/build/pdf.js");
const pdfjsViewer = require("../../node_modules/pdfjs-dist/web/pdf_viewer.js");


//TODO: Settings for PDF locations.
//TODO: Disable sharing of PDFs?


export class PdfViewerApp extends Application {
    private m_Page: number;

    private m_Container: HTMLElement;
    private m_PDF: PDFDocumentProxy;

    private m_Scale: number;
    private m_CurrPage: any;
    private m_LastPage: any;

    private readonly m_EventBus = new pdfjsViewer.EventBus();

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'pdf-viewer';
        options.classes = ["app", "window-app", "sr5"];
        options.title = 'View PDF';
        options.template = 'modules/pdfoundry/templates/pdf-viewer-app.html';
        options.width = 816+4+16;
        options.height = 1020+4+24+28+30;

        options.resizable = true;

        return options;
    }

    constructor(book: string, page: number) {
        super();

        this.m_Page = page;
        this.m_Scale = 1;
    }

    render(force?: boolean, options?: RenderOptions): Application {
        return super.render(force, options);
    }

    protected async activateListeners(html: JQuery<HTMLElement>): Promise<void> {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@2.4.456/es5/build/pdf.worker.js";
        const CMAP_URL = 'modules/pdfoundry/dist/cmaps/';
        const CMAP_PACKED = true;

        const DEFAULT_URL = 'modules/pdfoundry/books/Shadowrun - Core Rulebook.pdf';

        this.m_Container = html.find("div.viewerContainer").get(0);

        // Loading document.
        const loadingTask = pdfjsLib.getDocument({
            url: DEFAULT_URL,
            cMapUrl: CMAP_URL,
            cMapPacked: CMAP_PACKED
        });
        const that = this;
        loadingTask.promise.then(function (pdf: PDFDocumentProxy) {
            // Document loaded, retrieving the page.
            that.m_PDF = pdf;
            that.changePage(that.m_Page);
        });

        html.find(".viewer-control.next").first()
            .on("click", () => that.changePage(that.m_Page + 1));
        html.find(".viewer-control.prev").first()
            .on("click", () => that.changePage(that.m_Page - 1));

        const pageNumberInput = html.find("#page-number").first();
        if (!!pageNumberInput) {
            pageNumberInput.on("input", () => {
                const pageNumber = pageNumberInput.val();
                if (pageNumber !== undefined) {
                    if (typeof pageNumber === 'string') {
                        that.changePage(parseInt(pageNumber));
                    }
                }
            })
        }

        const zoomInput = html.find("#zoom").first();
        if (!!zoomInput) {
            zoomInput.on("input", () => {
                const zoomVal = zoomInput.val();
                if (zoomVal !== undefined && typeof zoomVal === 'string') {
                    that.m_Scale = parseInt(zoomVal)/100
                    that.changePage(that.m_Page);
                }
            })
        }
    }

    private changePage(page: number) {
        const that = this;
        that.m_Page = page;
        return this.m_PDF.getPage(that.m_Page).then(function (pdfPage) {
            // Creating the page view with default parameters.
            const pdfPageView = new pdfjsViewer.PDFPageView({
                container: that.m_Container,
                id: that.m_Page,
                scale: that.m_Scale,
                defaultViewport: pdfPage.getViewport({ scale: that.m_Scale }),
                eventBus: that.m_EventBus,
                // We can enable text/annotations layers, if needed
                textLayerFactory: new pdfjsViewer.DefaultTextLayerFactory(),
                annotationLayerFactory: new pdfjsViewer.DefaultAnnotationLayerFactory()
            });
            // Associates the actual page with the view, and drawing it
            pdfPageView.setPdfPage(pdfPage);
            that.m_LastPage = that.m_CurrPage;
            that.m_CurrPage = pdfPageView;

            that.updateToolbar();

            return pdfPageView.draw();
        }).then(() => {
            // cleanup old html so page renders in same place
            if (that.m_LastPage !== undefined) {
                that.m_LastPage.destroy();
                $(that.m_Container).find(".page").first().remove();
            }
        });
    }

    private updateToolbar() {
        const root = $(this.m_Container).parent().first();
        const pageInput = root.find("#page-number");
        pageInput.val(this.m_Page);
    }

    close(): Promise<any> {
        return super.close();
    }
}