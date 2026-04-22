import * as FileSaver from 'file-saver';
export class ExportarHelper {
    static EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    static EXCEL_EXTENSION = '.xlsx';
    static PDF_EXTENSION = '.pdf';

    static saveAsExcelFile(buffer: any, fileName: string): void {
        const data: Blob = new Blob([buffer], {
            type: this.EXCEL_TYPE,
        });
        FileSaver.saveAs(data, this.fileName(fileName, this.EXCEL_EXTENSION));

    }

    static exportExcel(lista, fileName) {
        import('xlsx').then((xlsx) => {
            const worksheet = xlsx.utils.json_to_sheet(lista);
            const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
            const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
            this.saveAsExcelFile(excelBuffer, this.fileName(fileName, this.EXCEL_EXTENSION));
        });
    }

    static exportExcel2(lista, lista2, fileName) {
        import('xlsx').then((xlsx) => {
            const worksheet = xlsx.utils.json_to_sheet(lista);
            const worksheet2 = xlsx.utils.json_to_sheet(lista2);
            const workbook = { Sheets: { data: worksheet, data2: worksheet2 }, SheetNames: ['data', 'data2'] };
            const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
            this.saveAsExcelFile(excelBuffer, this.fileName(fileName, this.EXCEL_EXTENSION));
        });
    }

    static exportPdf(cols, lista, fileName) {
        // let exportColumns = cols.map((col) => ({ title: col.header, dataKey: col.dataKey }));
        // import('jspdf').then((jsPDF) => {
        //     import('jspdf-autotable').then((x) => {
        //         const doc = new jsPDF.default('l', 0, 0);
        //         doc.autoTable(exportColumns, lista);
        //         doc.save(this.fileName(fileName, this.PDF_EXTENSION));
        //     });
        // });
    }

    static fileName(fileName, extension) {
        return fileName + '_export_' + new Date().getTime() + extension
    }
}