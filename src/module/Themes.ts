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

import { MODULE_NAME } from './Constants';

export interface PDFViewerTheme {
    /**
     * Unique ID of the theme. Themes with duplicate IDs will over-write each other.
     */
    id: string;
    /**
     * Display name of the theme, shown to the user in the options menu.
     */
    name: string;
    /**
     * Path to the CSS file to be injected with this theme.
     */
    path: string;
}

const ROOT_PATH = `modules/${MODULE_NAME}/themes`
const DEFAULT_THEMES: Record<string, PDFViewerTheme> = {
    'fantasy': {
        id: 'fantasy',
        name: 'Fantasy (Default)',
        path: `${ROOT_PATH}/fantasy.css`,
    },
    'dark': {
        id: 'dark',
        name: 'Dark',
        path: `${ROOT_PATH}/default-dark.css`,
    },
    'light': {
        id: 'light',
        name: 'Light',
        path: `${ROOT_PATH}/default-light.css`,
    },
    'net-runner-dark': {
        id: 'net-runner-dark',
        name: 'Net Runner',
        path: `${ROOT_PATH}/net-runner.css`,
    },
    'gay-pride-light': {
        id: 'gay-pride-light',
        name: 'Gay Pride (Light)',
        path: `${ROOT_PATH}/gay-pride-light.css`,
    },
    'gay-pride-dark': {
        id: 'gay-pride-dark',
        name: 'Gay Pride (Dark)',
        path: `${ROOT_PATH}/gay-pride-dark.css`,
    },
    'trans-light': {
        id: 'trans-light',
        name: 'Trans Pride (Light)',
        path: `${ROOT_PATH}/trans-pride-light.css`,
    },
    'trans-dark': {
        id: 'trans-dark',
        name: 'Trans Pride (Dark)',
        path: `${ROOT_PATH}/trans-pride-dark.css`,
    },
    'nonbinary-light': {
        id: 'nonbinary-light',
        name: 'Non-binary Pride (Light)',
        path: `${ROOT_PATH}/nonbinary-pride-light.css`,
    },
    'nonbinary-dark': {
        id: 'nonbinary-dark',
        name: 'Non-binary Pride (Dark)',
        path: `${ROOT_PATH}/nonbinary-pride-dark.css`,
    },
};

export class PDFThemeManager extends Map<string, PDFViewerTheme> {
    private static _instance: PDFThemeManager | undefined;

    public static get instance(): PDFThemeManager {
        if (!PDFThemeManager._instance) {
            const instance = new PDFThemeManager();
            PDFThemeManager.registerDefaultThemes(instance);
            PDFThemeManager._instance = instance;
        }

        return PDFThemeManager._instance;
    }

    /**
     * Register default themes into a manager.
     * @param manager
     * @private
     */
    private static registerDefaultThemes(manager: PDFThemeManager): void {
        for (const theme of Object.values(DEFAULT_THEMES)) {
            manager.set(theme.id, theme);
        }
    }

    public get active(): PDFViewerTheme {
        const id = 'fantasy'; // TODO: Register & query setting
        return this.get(id) ?? DEFAULT_THEMES['fantasy'];
    }
}
