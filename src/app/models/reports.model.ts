export interface Report {
    id: string,
    authorId: string,
    organizationId: string,
    title: string,
    file_url: string,
    createdAt: string,
    updatedAt: string
}

export interface ReportCreation {
    authorId: string,
    organizationId: string,
    title: string,
    key: string
}

export interface ReportCsvModel {
    assetId : string;
    assetName: string;
    found: boolean;
    scanDate: string | undefined;
    creationDate: string;
    updateDate: string;
}