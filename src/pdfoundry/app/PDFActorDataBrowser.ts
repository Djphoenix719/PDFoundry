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

import Settings from '../Settings';
import { BUTTON_GITHUB, BUTTON_KOFI } from '../common/helpers/header';

/**
 * Basic app to allow the user to see data keys for actor sheets
 * @internal
 */
export default class PDFActorDataBrowser extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;

        options.template = `${Settings.PATH_TEMPLATES}/app/pdf-actor-data-browser.html`;
        options.width = 600;
        options.height = 400;
        options.resizable = true;

        return options;
    }

    private actor: Actor;
    private timeout: any;

    constructor(actor: Actor, options?: Application.Options) {
        super(options);
        this.actor = actor;
    }

    get title(): string {
        return `${this.actor.name}`;
    }

    protected _getHeaderButtons(): any[] {
        const buttons = super._getHeaderButtons();
        buttons.unshift(BUTTON_GITHUB);
        buttons.unshift(BUTTON_KOFI);
        buttons.unshift({
            class: 'pdf-sheet-refresh',
            icon: 'fas fa-sync',
            label: game.i18n.localize('PDFOUNDRY.MISC.Refresh'),
            onclick: () => this.render(),
        });
        return buttons;
    }

    getData(options?: any): any {
        const data = super.getData(options);

        enum DangerLevel {
            Safe = 0,
            Low = 1,
            High = 2,
            Critical = 3,
        }
        type DataPath = { key: string; value: string; danger: DangerLevel };
        const flatten = (data: object, current: string = '', danger: DangerLevel = DangerLevel.Safe): DataPath[] => {
            let results: DataPath[] = [];

            window['actorData'] = this.actor.data.data;

            const path = (curr: string, ...next: (string | number)[]) => {
                if (curr.length > 0) {
                    for (let i = 0; i < next.length; i++) {
                        curr = `${curr}.${next[i]}`;
                    }
                    return curr;
                } else {
                    return `${next}`;
                }
            };

            const wrap = (value: string) => {
                return `\{\{${value}\}\}`;
            };

            const boundDanger = (curr: DangerLevel, next: DangerLevel) => {
                if (curr < next) {
                    return next;
                }
                return curr;
            };

            if (data === null) return results;
            if (data === undefined) return results;

            if (typeof data === 'object') {
                for (const [key, value] of Object.entries(data)) {
                    if (Array.isArray(value)) {
                        // Case 1 : The value is an array
                        if (value.length === 0) {
                            results.push({
                                key: path(current, key),
                                danger: DangerLevel.Critical,
                                value: wrap('Empty Array, do not use!'),
                            });
                        } else {
                            for (let i = 0; i < value.length; i++) {
                                const next = value[i];
                                results = [...results, ...flatten(next, path(current, key, i), boundDanger(danger, DangerLevel.High))];
                            }
                        }
                    } else if (typeof value === 'object') {
                        // Case 2 : The value is an object
                        if (value === null || value === undefined) {
                            results.push({
                                key: path(current, key),
                                danger: DangerLevel.High,
                                value: wrap('Null/Undefined, be cautious!'),
                            });
                        } else if (isObjectEmpty(value)) {
                            results.push({
                                key: path(current, key),
                                danger: DangerLevel.Critical,
                                value: wrap('Empty Object, do not use!'),
                            });
                        } else {
                            for (let [key2, value2] of Object.entries(value)) {
                                results = [...results, ...flatten(value2 as any, path(current, key, key2), boundDanger(danger, DangerLevel.Low))];
                            }
                        }
                    } else if (typeof value === 'function') {
                        // Case 3 : Base Case : The value is a function
                        results.push({
                            key: path(current, key),
                            danger: boundDanger(danger, DangerLevel.Critical),
                            value: wrap('Function, do not use!'),
                        });
                    } else {
                        // Case 4 : Base Case : The value is a primitive
                        results.push({
                            key: path(current, key),
                            danger: boundDanger(danger, DangerLevel.Safe),
                            value: (value as any).toString(),
                        });
                    }
                }
            } else if (typeof data === 'function') {
                // Case 3 : Base Case : The value is a function
                results.push({
                    key: current,
                    danger: boundDanger(danger, DangerLevel.Critical),
                    value: wrap('Function, do not use!'),
                });
            } else {
                // Case 4 : Base Case : The value is a primitive
                results.push({
                    key: current,
                    danger: boundDanger(danger, DangerLevel.Safe),
                    value: data,
                });
            }

            return results;
        };

        const icons = {
            [DangerLevel.Safe]: '<i class="fas fa-check-circle"></i>',
            [DangerLevel.Low]: '<i class="fas fa-question-circle"></i>',
            [DangerLevel.High]: '<i class="fas fa-exclamation-triangle"></i>',
            [DangerLevel.Critical]: '<i class="fas fa-radiation-alt"></i>',
        };
        const tooltips = {
            [DangerLevel.Safe]: game.i18n.localize('PDFOUNDRY.MISC.DANGER.Safe'),
            [DangerLevel.Low]: game.i18n.localize('PDFOUNDRY.MISC.DANGER.Low'),
            [DangerLevel.High]: game.i18n.localize('PDFOUNDRY.MISC.DANGER.High'),
            [DangerLevel.Critical]: game.i18n.localize('PDFOUNDRY.MISC.DANGER.Critical'),
        };

        data['paths'] = flatten(this.actor.data.data, 'data');
        data['paths'].push({
            key: 'name',
            value: this.actor.name,
            danger: DangerLevel.Safe,
        });

        data['paths'].sort((a: DataPath, b: DataPath) => a.key.localeCompare(b.key));
        data['paths'] = data['paths'].map((element) => {
            let splitRoll = element['key'].split('.') as string[];
            splitRoll.shift();

            return {
                ...element,
                icon: icons[element.danger],
                roll: `@${splitRoll.join('.')}`,
                tooltip: tooltips[element.danger],
            };
        });

        return data;
    }

    protected activateListeners(html: JQuery) {
        super.activateListeners(html);

        html.find('i.copy').on('click', async (event) => {
            const target = $(event.currentTarget);

            await navigator.clipboard.writeText(target.data('value') as string);

            ui.notifications.info(game.i18n.localize('PDFOUNDRY.MISC.CopiedToClipboard'));
        });
    }

    render(force?: boolean, options?: Application.RenderOptions): Application {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(this.render.bind(this), 10000);
        return super.render(force, options);
    }

    close(): Promise<any> {
        clearTimeout(this.timeout);
        return super.close();
    }
}
