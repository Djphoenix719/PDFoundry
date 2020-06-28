export class PDFViewerBase extends Application {
    protected m_Frame: HTMLIFrameElement;

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'pdf-viewer';
        options.classes = ['app', 'window-app'];
        options.title = 'View PDF';
        options.width = 8.5 * 100 + 64;
        options.height = 11 * 100 + 64;
        options.resizable = true;
        return options;
    }

    protected async activateListeners(html: JQuery<HTMLElement>): Promise<void> {
        super.activateListeners(html);

        this.m_Frame = html.parents().find('iframe.pdfViewer').first().get(0) as HTMLIFrameElement;
    }

    //TODO: Cleanup PDFjs
    close(): Promise<any> {
        return super.close();
    }
}
