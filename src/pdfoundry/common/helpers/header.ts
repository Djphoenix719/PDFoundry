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

import Api from '../../Api';

/**
 * Github link header button.
 * @internal
 */
export const BUTTON_GITHUB = {
    class: 'pdf-sheet-github',
    icon: 'fas fa-external-link-alt',
    label: 'PDFoundry',
    onclick: () => window.open('https://github.com/Djphoenix719/PDFoundry', '_blank'),
};

/**
 * Manual link header button.
 * @internal
 */
export const BUTTON_HELP = {
    class: 'pdf-sheet-manual',
    icon: 'fas fa-question-circle',
    label: 'Help',
    onclick: () => Api.showHelp(),
};

/**
 * Shameless shill link
 * @internal
 */
export const BUTTON_KOFI = {
    class: 'pdf-sheet-kofi',
    icon: 'fas fa-coffee',
    label: '',
    onclick: () => window.open('https://ko-fi.com/djsmods', '_blank'),
};
