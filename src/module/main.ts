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

import { PDFoundryAPI } from './api/PDFoundryAPI';
import { PDFSettings } from './settings/PDFSettings';
import { PDFLocalization } from './settings/PDFLocalization';
CONFIG.debug.hooks = true;

Hooks.once('init', function () {
    // @ts-ignore
    ui.PDFoundry = PDFoundryAPI;
});
Hooks.once('init', PDFSettings.registerSettings);

Hooks.once('ready', async function () {
    await PDFLocalization.init();
});
Hooks.once('ready', PDFSettings.registerPDFSheet);
Hooks.once('ready', PDFSettings.injectCSS);

Hooks.once('ready', () => {
    let viewed = false;
    try {
        const help = game.settings.get(PDFSettings.INTERNAL_MODULE_NAME, 'help');
        viewed = help.viewed;
    } catch (error) {}

    if (!viewed) {
        PDFSettings.showHelp();
    }
});

Hooks.on('preCreateItem', PDFSettings.preCreateItem);
Hooks.on('getItemDirectoryEntryContext', PDFSettings.getItemContextOptions);
Hooks.on('renderSettings', PDFSettings.onRenderSettings);
