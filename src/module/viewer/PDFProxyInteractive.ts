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

import { PDFProxyConstructorArgs, PDFProxyStatic } from './PDFProxyStatic';
import { AbstractDataStore } from '../store/AbstractDataStore';

export class PDFProxyInteractive extends PDFProxyStatic {
    protected readonly _dataStore: AbstractDataStore;

    public constructor(dataStore: AbstractDataStore, options?: Partial<PDFProxyConstructorArgs>) {
        super(options);

        console.warn('PDFProxyInteractive');

        this._dataStore = dataStore;
    }

    public async bind(element: JQuery | HTMLElement): Promise<boolean> {
        const success = await super.bind(element);

        if (success) {
            console.warn('Interactive Viewer Bound Successfully.');
            console.warn(this._options);
            console.warn(this._iframe);
            console.warn(this._application);
            console.warn(this._eventBus);
            console.warn(this._dataStore);
        }

        return success;
    }
}
