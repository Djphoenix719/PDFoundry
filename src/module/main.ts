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

import { PDFSetup } from './setup/PDFSetup';
import { PDFCache } from './cache/PDFCache';
import { PDFEvents } from './events/PDFEvents';
import { PDFI18n } from './settings/PDFI18n';
import { PDFSettings } from './settings/PDFSettings';
import { PDFLog } from './log/PDFLog';
import { PDFSetViewEvent } from './socket/events/PDFSetViewEvent';
import { PDFSocketHandler } from './socket/PDFSocketHandler';

CONFIG.debug.hooks = true;

PDFSetup.registerSystem();
PDFSetup.registerAPI();

const init = async () => {
    // Inject the css into the page
    PDFSetup.registerCSS();

    PDFEvents.fire('init');

    await setup();
};
const setup = async () => {
    // Initialize the cache system, creating the DB
    await PDFCache.initialize();
    // Load the relevant internationalization file.
    await PDFI18n.initialize();

    PDFEvents.fire('setup');

    await ready();
};
const ready = async () => {
    // Register the PDF sheet with the class picker, unregister others
    PDFSetup.registerPDFSheet();
    // Initialize the settings
    await PDFSettings.registerSettings();

    PDFSetup.userLogin();

    PDFSocketHandler.registerHandlers();

    PDFEvents.fire('ready');
};

Hooks.once('setup', init);

// <editor-fold desc="Persistent Hooks">

// preCreateItem - Setup default values for a new PDFoundry_PDF
Hooks.on('preCreateItem', PDFSettings.preCreateItem);
// getItemDirectoryEntryContext - Setup context menu for 'Open PDF' links
Hooks.on('getItemDirectoryEntryContext', PDFSettings.getItemContextOptions);
// renderSettings - Inject a 'Open Manual' button into help section
Hooks.on('renderSettings', PDFSettings.onRenderSettings);

// </editor-fold>