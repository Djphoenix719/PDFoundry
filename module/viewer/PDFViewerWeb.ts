import { PDFViewerBase } from './PDFViewerBase';

export class PDFViewerWeb extends PDFViewerBase {
    private m_Page: number;
    private m_FilePath: string;

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = 'modules/pdfoundry/templates/web-viewer-app.html';
        return options;
    }

    constructor(file: string, page: number) {
        super();

        this.m_FilePath = file;
        this.m_Page = page;
    }

    getData(options?: any): any | Promise<any> {
        const data = super.getData(options);
        data.page = this.m_Page;
        data.filePath = this.m_FilePath;
        return data;
    }
}
