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

import { PDFType } from './PDFType';

/**
 * A data object containing properties of a user-created PDF file. This is the data filled out by the user
 *  when they edit a PDF or click the 'Create PDF' button.
 */
export interface PDFData {
    /**
     * The name of the PDF
     */
    name: string;
    /**
     * The type of data stored. Used to determine what type of viewer to open.
     */
    type: PDFType;
    /**
     * The location of the PDF on the server.
     */
    url: string;
    /**
     * The shorthand code PDF
     */
    code: string;
    /**
     * Page offset for the PDF vs. represented book page
     */
    offset: number | string;
    /**
     * If the user has requested caching for this PDF
     */
    cache: boolean;
}

type PDFDataUpdateKeys = Exclude<keyof PDFData, 'name'>;

/**
 * Update mapping for a {@link PDFData}
 * @internal
 */
export type PDFDataUpdate = {
    [P in PDFDataUpdateKeys]: PDFData[P];
};

/**
 * Delete mapping for a {@link PDFData}
 * @internal
 */
export type PDFDataDelete = {
    [P in PDFDataUpdateKeys]: null;
};
