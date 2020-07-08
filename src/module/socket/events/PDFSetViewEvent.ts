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

import { PDFSocketEvent } from './PDFSocketEvent';
import { PDFData } from '../../types/PDFData';

export class PDFSetViewEvent extends PDFSocketEvent {
    public static get EVENT_TYPE() {
        return `${super.EVENT_TYPE}/SET_VIEW`;
    }

    public page: number;
    public pdfData: PDFData;

    constructor(userIds: string[] | null, pdfData: PDFData, page: number) {
        super(userIds);

        this.pdfData = pdfData;
        this.page = page;
    }

    get type() {
        return PDFSetViewEvent.EVENT_TYPE;
    }

    protected getPayload() {
        const payload = super.getPayload();
        payload.pdfData = this.pdfData;
        payload.page = this.page;
        return payload;
    }
}
