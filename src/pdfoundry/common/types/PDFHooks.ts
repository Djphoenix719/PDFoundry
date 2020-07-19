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

import Viewer from '../../viewer/Viewer';
import Api from '../../api';

export type PDFSetupEvent = 'init' | 'setup' | 'ready';

export type PDFViewerEvent = 'viewerOpen' | 'viewerClose' | 'viewerReady' | 'pageRendered' | 'pageChanging';

export type PDFEvent = PDFSetupEvent | PDFViewerEvent;

export type CallbackSetup = (api: Api) => void;

export type CallbackViewer = (viewer: Viewer) => void;

export type CallbackPageRendered = (viewer: Viewer, page: HTMLDivElement) => void;

export type CallbackPageChanging = (viewer: Viewer, pageNumber: number, pageLabel: string | null) => void;
