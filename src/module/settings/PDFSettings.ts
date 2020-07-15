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

import { PDFoundryAPI } from '../api/PDFoundryAPI';
import { PDFCache } from '../cache/PDFCache';
import { PDFUtil } from '../api/PDFUtil';
import { PDFPreloadEvent } from '../socket/events/PDFPreloadEvent';

/**
 * Internal settings and helper methods for PDFoundry.
 * @private
 */
export class PDFSettings {
    /**
     * Are feedback notifications enabled? Disable if you wish
     *  to handle them yourself.
     */
    public static NOTIFICATIONS: boolean = true;

    public static DIST_FOLDER: string = 'pdfoundry-dist';
    public static EXTERNAL_SYSTEM_NAME: string = '../modules/pdfoundry';
    public static INTERNAL_MODULE_NAME: string = 'pdfoundry';
    public static PDF_ENTITY_TYPE: string = 'PDFoundry_PDF';

    public static SETTING_EXISTING_VIEWER = 'ShowInExistingViewer';
    public static SETTING_CACHE_SIZE = 'CacheSize';

    public static HELP_SEEN_KEY: string = 'PDFoundry_HelpSeen';

    public static get SOCKET_NAME() {
        return `system.${PDFSettings.EXTERNAL_SYSTEM_NAME}`;
    }

    public static registerSettings() {
        PDFSettings.register(PDFSettings.SETTING_CACHE_SIZE, {
            name: game.i18n.localize('PDFOUNDRY.SETTINGS.CacheSizeName'),
            scope: 'user',
            type: Number,
            hint: game.i18n.localize('PDFOUNDRY.SETTINGS.CacheSizeHint'),
            default: 256,
            config: true,
            onChange: async (mb) => {
                mb = Math.round(mb);
                mb = Math.max(mb, 64);
                mb = Math.min(mb, 1024);
                await PDFSettings.set(PDFSettings.SETTING_CACHE_SIZE, mb);
            },
        });

        PDFSettings.register(PDFSettings.SETTING_EXISTING_VIEWER, {
            name: game.i18n.localize('PDFOUNDRY.SETTINGS.ShowInExistingViewerName'),
            scope: 'user',
            type: Boolean,
            hint: game.i18n.localize('PDFOUNDRY.SETTINGS.ShowInExistingViewerHint'),
            default: true,
            config: true,
        });
    }

    /**
     * Wrapper around game.settings.register. Ensures scope is correct.
     * @param key
     * @param data
     */
    public static register(key: string, data: any) {
        game.settings.register(PDFSettings.EXTERNAL_SYSTEM_NAME, key, data);
    }

    /**
     * Wrapper around game.settings.get. Ensures scope is correct.
     * @param key
     */
    public static get(key: string) {
        return game.settings.get(PDFSettings.EXTERNAL_SYSTEM_NAME, key);
    }

    /**
     * Wrapper around game.settings.set. Ensures scope is correct.
     * @param key
     * @param value
     */
    public static async set(key: string, value: any) {
        return game.settings.set(PDFSettings.EXTERNAL_SYSTEM_NAME, key, value);
    }
}
