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

type TestKeySet = 'a' | 'b';
type TestTypeSet = {
    a: { value: number };
    b: { message: string };
    c: { value: number; message: string };
};

type TypedCallback<TArgs> = (...args: TArgs[]) => void;

let Test: TypedCallback<[number, number, string]> = '' as any;
Test(0, 1, 'hi');

export class EventMap<TTypes extends {}> {
    private _callbacks: Record<keyof TTypes, Function[]>;

    public constructor() {
        this._callbacks = {} as Record<keyof TTypes, Function[]>;
    }

    public on<TEventName extends keyof TTypes>(): void {
        return '' as any;
    }
}

let t = new EventMap();
t.on<'b'>();
