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

/**
 * Internal settings and helper methods for PDFoundry.
 * @private
 */
export default class Settings {
    /**
     * Are feedback notifications enabled? Disable if you wish
     *  to handle them yourself.
     */
    public static NOTIFICATIONS: boolean = true;

    public static EXTERNAL_SYSTEM_NAME: string = '../modules/pdfoundry';
    public static INTERNAL_MODULE_NAME: string = 'pdfoundry';

    public static ACTOR_DATA_KEY: string = 'PDFoundry_ActorData';
    public static ACTOR_SHEET_KEY: string = 'PDFoundry_ActorSheet';

    public static DIST_NAME = 'pdfoundry-dist';

    public static get DIST_PATH() {
        return `${Settings.EXTERNAL_SYSTEM_NAME}/${Settings.DIST_NAME}`;
    }

    public static PDF_ENTITY_TYPE: string = 'PDFoundry_PDF';

    public static SETTING_KEY = {
        EXISTING_VIEWER: 'ShowInExistingViewer',
        CACHE_SIZE: 'CacheSize',
        HELP_SEEN: 'PDFoundry_HelpSeen',
    };

    public static get SOCKET_NAME() {
        return `system.${Settings.EXTERNAL_SYSTEM_NAME}`;
    }

    public static initialize() {
        Settings.register(Settings.SETTING_KEY.CACHE_SIZE, {
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
                await Settings.set(Settings.SETTING_KEY.CACHE_SIZE, mb);
            },
        });

        Settings.register(Settings.SETTING_KEY.EXISTING_VIEWER, {
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
        game.settings.register(Settings.EXTERNAL_SYSTEM_NAME, key, data);
    }

    /**
     * Wrapper around game.settings.get. Ensures scope is correct.
     * @param key
     */
    public static get(key: string) {
        return game.settings.get(Settings.EXTERNAL_SYSTEM_NAME, key);
    }

    /**
     * Wrapper around game.settings.set. Ensures scope is correct.
     * @param key
     * @param value
     */
    public static async set(key: string, value: any) {
        return game.settings.set(Settings.EXTERNAL_SYSTEM_NAME, key, value);
    }
}
