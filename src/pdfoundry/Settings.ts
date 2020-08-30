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

import Api from './Api';

/**
 * Internal settings and helper methods for PDFoundry.
 * @internal
 */
export default class Settings {
    public static readonly MODULE_NAME: string = 'pdfoundry';

    public static get PATH_MODULE() {
        return `modules/${Settings.MODULE_NAME}`;
    }
    public static get PATH_ASSETS() {
        return `${Settings.PATH_MODULE}/assets`;
    }
    public static get PATH_LOCALE() {
        return `${Settings.PATH_MODULE}/locale`;
    }
    public static get PATH_TEMPLATES() {
        return `${Settings.PATH_MODULE}/templates`;
    }
    public static get PATH_PDFJS() {
        return `${Settings.PATH_MODULE}/pdfjs`;
    }

    public static get SOCKET_NAME() {
        return `module.${Settings.MODULE_NAME}`;
    }

    public static readonly CSS_CLASS = 'pdf-app';

    public static readonly MENU_KEY = 'PDFoundrySettings';

    public static readonly SETTINGS_KEY = {
        EXISTING_VIEWER: 'ShowInExistingViewer',
        CACHE_SIZE: 'CacheSize',
        VIEWER_THEME: 'ViewerTheme',
        HELP_SEEN: 'HelpSeen',
        DATA_VERSION: 'DataVersion',
    };
    public static readonly FLAGS_KEY = {
        // PDF Data
        PDF_DATA: 'PDFData',
        // Actor Sheets
        FORM_DATA: 'FormData',
        SHEET_ID: 'ActorSheet',
        // Canvas Notes
        PAGE_NUMBER: 'PageNumber',
    };

    public static initialize() {
        Settings.register(Settings.SETTINGS_KEY.CACHE_SIZE, {
            name: game.i18n.localize('PDFOUNDRY.SETTINGS.CacheSizeName'),
            hint: game.i18n.localize('PDFOUNDRY.SETTINGS.CacheSizeHint'),
            scope: 'user',
            type: Number,
            default: 256,
            config: true,
            onChange: async (mb) => {
                if (Settings.get(Settings.SETTINGS_KEY.CACHE_SIZE) === mb) {
                    return;
                }

                mb = Math.round(mb);
                mb = Math.max(mb, 64);
                mb = Math.min(mb, 1024);
                await Settings.set(Settings.SETTINGS_KEY.CACHE_SIZE, mb);
            },
        });

        Settings.register(Settings.SETTINGS_KEY.EXISTING_VIEWER, {
            name: game.i18n.localize('PDFOUNDRY.SETTINGS.ShowInExistingViewerName'),
            hint: game.i18n.localize('PDFOUNDRY.SETTINGS.ShowInExistingViewerHint'),
            scope: 'user',
            type: Boolean,
            default: true,
            config: true,
        });

        Settings.register(Settings.SETTINGS_KEY.VIEWER_THEME, {
            name: game.i18n.localize('PDFOUNDRY.SETTINGS.ViewerThemeName'),
            hint: game.i18n.localize('PDFOUNDRY.SETTINGS.ViewerThemeHint'),
            scope: 'user',
            type: String,
            default: 'fantasy',
            choices: Api.availableThemes,
            config: true,
        });

        Settings.register(Settings.SETTINGS_KEY.HELP_SEEN, {
            scope: 'user',
            type: Boolean,
            default: false,
            config: false,
        });

        Settings.register(Settings.SETTINGS_KEY.DATA_VERSION, {
            scope: 'world',
            type: String,
            default: undefined,
            config: false,
        });
    }

    /**
     * Wrapper around game.settings.register. Ensures scope is correct.
     * @param key
     * @param data
     * @internal
     */
    public static register(key: string, data: any) {
        game.settings.register(Settings.MODULE_NAME, key, data);
    }

    /**
     * Wrapper around game.settings.get. Ensures scope is correct.
     * @param key
     * @internal
     */
    public static get(key: string) {
        return game.settings.get(Settings.MODULE_NAME, key);
    }

    /**
     * Wrapper around game.settings.set. Ensures scope is correct.
     * @param key
     * @param value
     * @internal
     */
    public static async set(key: string, value: any) {
        return game.settings.set(Settings.MODULE_NAME, key, value);
    }
}
