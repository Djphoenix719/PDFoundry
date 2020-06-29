import { PDFViewerBase } from './PDFViewerBase';
import { PDFSettings } from '../settings/PDFSettings';

export class PDFViewerWeb extends PDFViewerBase {
    private m_Page: number;
    private m_FilePath: string;

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = `systems/${PDFSettings.SYSTEM_NAME}/pdfoundry-dist/templates/web-viewer-app.html`;
        return options;
    }

    constructor(file: string, page: number) {
        super();

        this.m_FilePath = encodeURIComponent(file);
        this.m_Page = page;
    }

    getData(options?: any): any | Promise<any> {
        const data = super.getData(options);
        data.page = this.m_Page;
        data.filePath = this.m_FilePath;
        data.systemName = PDFSettings.SYSTEM_NAME;
        return data;
    }
}
