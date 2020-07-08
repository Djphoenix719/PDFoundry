import { PDFLog } from '../log/PDFLog';
import { PDFSocketEvent } from './events/PDFSocketEvent';
import { PDFSettings } from '../settings/PDFSettings';
import { PDFSetViewEvent } from './events/PDFSetViewEvent';
import { PDFoundryAPI } from '../api/PDFoundryAPI';

export class PDFSocketHandler {
    public static get SOCKET_NAME() {
        return `system.${PDFSettings.EXTERNAL_SYSTEM_NAME}`;
    }

    public static registerHandlers() {
        // @ts-ignore
        game.socket.on(PDFSocketHandler.SOCKET_NAME, (event) => {
            PDFLog.warn(`Incoming Event: ${event.type}`);
            PDFLog.warn(event);

            const { userIds, type, payload } = event;
            // null = all users, otherwise check if this event effects us
            if (userIds !== null && !userIds.includes(game.userId)) {
                return;
            }

            if (type === PDFSetViewEvent.EVENT_TYPE) {
                PDFSocketHandler.handleSetView(payload);
            }
        });
    }

    public static handleSetView(data: any) {
        PDFoundryAPI.openPDF(data.pdfData, data.page);
    }
}
