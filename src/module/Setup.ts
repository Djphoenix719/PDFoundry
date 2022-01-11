/*
 * Copyright 2022 Andrew Cuccinello
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
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

import ModuleSettings, { IFeatureDefinition } from '../../FVTT-Common/src/module/ModuleSettings';
import { FEATURE_CACHE_ENABLED, FEATURE_CACHE_SIZE, MODULE_NAME } from './Constants';
import { PDFViewerApplication } from './application/PDFViewerApplication';
import { DocumentDataStore } from './store/DocumentDataStore';

export const FEATURES: IFeatureDefinition[] = [
    {
        id: FEATURE_CACHE_ENABLED,
        title: 'PDFOUNDRY.SETTINGS.CacheEnabledName',
        attributes: [],
        description: 'PDFOUNDRY.SETTINGS.CacheEnabledHint',
        default: true,
        inputs: [
            {
                name: FEATURE_CACHE_SIZE,
                label: 'PDFOUNDRY.SETTINGS.CacheSizeName',
                type: 'number',
                value: 256,
                help: 'PDFOUNDRY.SETTINGS.CacheSizeHint',
            },
        ],
        register: [
            {
                name: FEATURE_CACHE_SIZE,
                type: Number,
                default: 256,
                onChange: async (mb) => {
                    if (game.settings.get(MODULE_NAME, FEATURE_CACHE_SIZE) === mb) {
                        return;
                    }

                    mb = Math.round(mb);
                    mb = Math.max(mb, 64);
                    mb = Math.min(mb, 1024);
                    await game.settings.set(MODULE_NAME, FEATURE_CACHE_SIZE, mb);
                },
            },
        ],
        help: '',
    },
];

Hooks.on('init', () =>
    ModuleSettings.initialize({
        moduleName: MODULE_NAME,
        moduleTitle: 'PDFoundry',
        features: FEATURES,
    }),
);

Hooks.on('ready', () => {
    setTimeout(() => {
        new PDFViewerApplication('http://localhost:30000/5EFillableTestSheet.pdf', {
            page: 1,
            renderInteractiveForms: true,
            enableScripting: true,
        }).render(true);

        const journal = game.journal!.getName('Store')!;
        const journalStore = new DocumentDataStore(journal);
        console.warn(journalStore.getAll());

        const actor = game.actors!.getName('Test Actor')!;
        const actorStore = new DocumentDataStore(actor);
        console.warn(actorStore.getAll());
    }, 250);
});
CONFIG.debug.hooks = true;
