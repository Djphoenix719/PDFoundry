import { PDFSettings } from '../settings/PDFSettings';
import { PDFSetViewEvent } from './events/PDFSetViewEvent';
import { PDFoundryAPI } from '../api/PDFoundryAPI';
import { PDFPreloadEvent } from './events/PDFPreloadEvent';
import { PDFCache } from '../cache/PDFCache';
import { PDFData } from '../api/types/PDFData';
import { PDFViewer } from '../viewer/PDFViewer';

/**
 * @private
 */
export class PDFSocketHandler {
    public static registerHandlers() {
        // @ts-ignore
        game.socket.on(PDFSettings.SOCKET_NAME, (event) => {
            const { userIds, type, payload } = event;
            // null = all users, otherwise check if this event effects us
            if (userIds !== null && !userIds.includes(game.userId)) {
                return;
            }

            if (type === PDFSetViewEvent.EVENT_TYPE) {
                PDFSocketHandler.handleSetView(payload);
                return;
            } else if (type === PDFPreloadEvent.EVENT_TYPE) {
                PDFSocketHandler.handlePreloadPDF(payload);
                return;
            } else {
                if (type.includes('PDFOUNDRY')) {
                    console.error(`Event of type ${type} has no handler.`);
                    return;
                }
            }
        });
    }

    public static handleSetView(data: any) {
        if (PDFSettings.get(PDFSettings.SETTING_EXISTING_VIEWER)) {
            function appIsViewer(app: Application): app is PDFViewer {
                return app['pdfData'] !== undefined;
            }

            for (const app of Object.values(ui.windows)) {
                if (!appIsViewer(app)) {
                    continue;
                }

                const pdfData = app.pdfData;
                if (data.pdfData.url === pdfData.url) {
                    app.page = data.page;
                    return;
                }
            }
            // App not found, fall through.
        }
        PDFoundryAPI.openPDF(data.pdfData, data.page);
    }

    public static handlePreloadPDF(data: any) {
        PDFCache.preload(data.url);
    }
}
