import { PDFLog } from '../log/PDFLog';
import { PDFSettings } from '../settings/PDFSettings';
import { PDFSetViewEvent } from './events/PDFSetViewEvent';
import { PDFoundryAPI } from '../api/PDFoundryAPI';
import { PDFPreloadEvent } from './events/PDFPreloadEvent';
import { PDFCache } from '../cache/PDFCache';

/**
 * @private
 */
export class PDFSocketHandler {
    public static registerHandlers() {
        // @ts-ignore
        game.socket.on(PDFSettings.SOCKET_NAME, (event) => {
            PDFLog.warn(`Incoming Event: ${event.type}`);
            PDFLog.warn(event);

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
                    PDFLog.error(`Event of type ${type} has no handler.`);
                    return;
                }
            }
        });
    }

    public static handleSetView(data: any) {
        PDFoundryAPI.openPDF(data.pdfData, data.page);
    }

    public static handlePreloadPDF(data: any) {
        PDFCache.preload(data.url);
    }
}
