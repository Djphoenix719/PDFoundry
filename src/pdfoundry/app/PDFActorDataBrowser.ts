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

import Settings from '../settings/Settings';

export default class PDFActorDataBrowser extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;

        options.template = `${Settings.PATH_TEMPLATES}/app/pdf-actor-data-browser.html`;
        options.width = 600;
        options.height = 400;

        return options;
    }

    private actor: Actor;
    private timeout: any;

    constructor(actor: Actor, options?: ApplicationOptions) {
        super(options);
        this.actor = actor;
    }

    get title(): string {
        return `Data Paths for ${this.actor.name}`;
    }

    getData(options?: any): any {
        const data = super.getData(options);

        data['paths'] = [];
        const flattened = flattenObject({ data: this.actor.data.data });
        for (const [k, v] of Object.entries(flattened)) {
            if (Array.isArray(v)) {
                data['paths'].push({
                    key: k,
                    value: `$$UNSUPPORTED TYPE: Array$$`,
                });
            } else if (typeof v === 'object') {
                data['paths'].push({
                    key: k,
                    value: `$$EMPTY OBJECT$$`,
                });
            } else {
                data['paths'].push({
                    key: k,
                    value: v,
                });
            }
        }
        data['paths'].sort();

        return data;
    }

    render(force?: boolean, options?: RenderOptions): Application {
        this.timeout = setTimeout(this.render.bind(this), 1000);
        return super.render(force, options);
    }

    close(): Promise<any> {
        clearTimeout(this.timeout);
        return super.close();
    }
}
