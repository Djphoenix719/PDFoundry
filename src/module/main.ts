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
import { PDFCache } from './cache/PDFCache';
import { PDFLog } from './log/PDFLog';
import { PDFSetup } from './setup/PDFSetup';

// <editor-fold desc="Init Hooks">

// Register the API on the ui object
Hooks.once('init', PDFSetup.registerAPI);
// Initialize the settings
Hooks.once('init', PDFSettings.registerSettings);
// Inject the css into the page
Hooks.once('init', PDFSetup.injectCSS);

// </editor-fold>

// <editor-fold desc="Setup Hooks">

// Initialize the cache system, creating the DB
Hooks.once('setup', PDFCache.initialize);

// </editor-fold>

// <editor-fold desc="Ready Hooks">

// Register the PDF sheet with the class picker, unregister others
Hooks.once('ready', PDFSetup.registerPDFSheet);
// Load the relevant localization file. Can't auto load with module setup
Hooks.once('ready', PDFLocalization.init);

// </editor-fold>

// <editor-fold desc="Persistent Hooks">

// preCreateItem - Setup default values for a new PDFoundry_PDF
Hooks.on('preCreateItem', PDFSettings.preCreateItem);
// getItemDirectoryEntryContext - Setup context menu for 'Open PDF' links
Hooks.on('getItemDirectoryEntryContext', PDFSettings.getItemContextOptions);
// renderSettings - Inject a 'Open Manual' button into help section
Hooks.on('renderSettings', PDFSettings.onRenderSettings);

// </editor-fold>

Hooks.once('ready', async () => {
    PDFLog.verbose('Loading PDF.');

    const pdf = PDFoundryAPI.getPDFData('SR5');
    if (pdf === null) return;

    const { code, name } = pdf;

    const viewer = await PDFoundryAPI.open(code, 69);
});
