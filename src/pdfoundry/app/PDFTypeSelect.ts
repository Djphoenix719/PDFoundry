import SelectApp, { SelectOption } from './SelectApp';
import { PDFType } from '../common/types/PDFType';

export default class PDFTypeSelect extends SelectApp {
    protected get selectId(): string {
        return 'create-pdf';
    }

    protected get selectTitle(): string {
        return 'PDFOUNDRY.MISC.CreatePDF';
    }

    protected get selectLabel(): string {
        return 'PDFOUNDRY.MISC.SelectTypeLabel';
    }

    protected get selectOptions(): SelectOption[] {
        return Object.entries(PDFType).map(([key]) => {
            return {
                value: key,
                text: `PDFOUNDRY.MISC.PDFTYPE.${key}`,
            };
        });
    }
}
