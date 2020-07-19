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

import SocketEvent from './SocketEvent';

/**
 * @private
 */
export default class PreloadEvent extends SocketEvent {
    public static get EVENT_TYPE() {
        return `${super.EVENT_TYPE}/PRELOAD_PDF`;
    }

    get type() {
        return PreloadEvent.EVENT_TYPE;
    }

    public url: string;

    constructor(userIds: string[] | null, url: string) {
        super(userIds);

        this.url = url;
    }

    protected getPayload(): any {
        const payload = super.getPayload();
        payload.url = this.url;
        return payload;
    }
}
