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

/**
 * All available PDF Viewer events.
 */
export type PDFViewerEvent = PDFViewerWindowEvent | 'pageRendered' | 'pageChanging' | 'viewAreaUpdated' | 'scaleChanging';

/**
 * Meta events that occur on a PDF Viewer that relate to the state of the application.
 */
export type PDFViewerWindowEvent = PDFViewerOpening | PDFViewerOpened | PDFViewerClosed | PDFViewerClosing | PDFViewerReady;

/**
 * Fires when a viewer begins opening.
 */
export type PDFViewerOpening = 'viewerOpening';
/**
 * Fires when a viewer finishes opening, but is not ready for use. Foundry VTT methods are usable at this point.
 */
export type PDFViewerOpened = 'viewerOpened';
/**
 * Fires when the viewer begins closing.
 */
export type PDFViewerClosing = 'viewerClosing';
/**
 * Fires right before the viewer is deleted. This is the last event that will fire.
 */
export type PDFViewerClosed = 'viewerClosed';

/**
 * Fires when the viewer is ready for use.
 * @param {Viewer} The viewer that is ready
 */
export type PDFViewerReady = 'viewerReady';
