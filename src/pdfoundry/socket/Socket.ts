/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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

import PreloadEvent from './events/PreloadEvent';
import StaticViewer from '../viewer/StaticViewer';
import Api from '../Api';
import Settings from '../Settings';
import SetViewEvent from './events/SetViewEvent';
import PDFCache from '../cache/PDFCache';

/**
 * @private
 */
export class Socket {
    public static initialize() {
        // @ts-ignore TODO
        game.socket.on(Settings.SOCKET_NAME, (event) => {
            try {
                const { userIds, type, payload } = event;
                // null = all users, otherwise check if this event effects us
                if (userIds !== null && !userIds.includes(game.userId)) {
                    return;
                }

                if (type === SetViewEvent.EVENT_TYPE) {
                    Socket.handleSetView(payload);
                    return;
                } else if (type === PreloadEvent.EVENT_TYPE) {
                    Socket.handlePreloadPDF(payload);
                    return;
                } else {
                    if (type.includes('PDFOUNDRY')) {
                        console.error(`Event of type ${type} has no handler.`);
                        return;
                    }
                }
            } catch (e) {
                // Pass
            }
        });
    }

    public static handleSetView(data: any) {
        if (Settings.get(Settings.SETTINGS_KEY.EXISTING_VIEWER)) {
            function appIsViewer(app: Application): app is StaticViewer {
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
        Api.openPDF(data.pdfData, {
            page: data.page,
        });
    }

    public static handlePreloadPDF(data: any) {
        PDFCache.preload(data.url);
    }
}
