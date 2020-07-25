import PDFBaseData, { PDFDataType } from './PDFBaseData';

export default interface PDFActorData extends PDFBaseData {
    /**
     * Key value pairs from the character sheet, where the key is the name of the PDF field
     *  and the value is the last value it contained from the user.
     */
    data: Record<string, string>;

    type: PDFDataType.Actor;
}

/**
 * Returns true if data is of type PDFBookData
 * @param data
 */
export function isPDFActorData(data: PDFBaseData | null | undefined): data is PDFActorData {
    return !!data && data.type === PDFDataType.Actor;
}
