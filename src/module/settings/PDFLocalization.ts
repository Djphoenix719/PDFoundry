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

import { PDFSettings } from './PDFSettings';

/**
 * Localization helper
 */
export class PDFLocalization {
    /**
     * Load the localization file for the user's language.
     */
    public static async init() {
        const lang = game.i18n.lang;
        // user's language path
        const u_path = `systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/locale/${lang}/config.json`;
        // english fallback path
        const f_path = `systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/locale/en/config.json`;

        let json;
        try {
            json = await $.getJSON(u_path);
        } catch (error) {
            // if no translation exits for the users locale the fallback
            json = await $.getJSON(f_path;
        }

        for (const key of Object.keys(json)) {
            game.i18n.translations[key] = json[key];
        }

        // setup the fallback as english so partial translations do not display keys
        let fb_json = await $.getJSON(f_path);
        for (const key of Object.keys(json)) {
            // @ts-ignore
            game.i18n._fallback[key] = json[key];
        }
    }
}
