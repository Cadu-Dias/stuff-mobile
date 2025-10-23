import httpClient from "./api";
import {
  Report,
  ReportCreation,
  ReportCsvModel,
} from "../models/reports.model";
import * as FileSystem from "expo-file-system";

export class ReportService {

    public async generatePresignedUrl(filename: string): Promise<{ url: string; key: string }> {
        try {
            const filenameTreated = filename
                .replace(/ /g, "_")
                .replace(/-/g, "_")
                .toLowerCase();

            const response = await httpClient.post<{
                data: { url: string; key: string };
            }>("/reports/upload", { filename: filenameTreated });

            return response.data.data;
        } catch (error) {
            console.error("Erro ao gerar URL pré-assinada:", error);
            throw error;
        }
    }

    public async getReport(reportId: string): Promise<Report> {
        try {
            const response = await httpClient.get<{ message: string; data: Report }>(
                `/reports/${reportId}`
            );
            return response.data.data;
        } catch (error) {
            console.error("Erro ao buscar relatório:", error);
            throw error;
        }
    }

    public async getAllReports(): Promise<Report[]> {
        try {
            const response = await httpClient.get<Report[]>("/reports");
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar relatórios:", error);
            throw error;
        }
    }

    public async getOrganizationReports(organizationId: string): Promise<Report[]> {
        try {
            const response = await httpClient.get<{
                message: string;
                data: Report[];
            }>(`/organizations/${organizationId}/reports`);
            return response.data.data;
        } catch (error) {
            console.error("Erro ao buscar relatórios da organização:", error);
            throw error;
        }
    }

    public async createReport(report: ReportCreation): Promise<void> {
        try {
            const response = await httpClient.post("/reports", report);
            console.log("✅ Relatório criado com sucesso:", response.data.message);
        } catch (error) {
            console.error("Erro ao criar relatório:", error);
            throw error;
        }
    }

    public async downloadReport(key: string): Promise<string> {
        try {
            const response = await httpClient.get<{
                message: string;
                data: { url: string };
            }>(`/reports/download?key=${key}`);

            const downloadUrl = response.data.data.url;
            const csvResponse = await httpClient.get(downloadUrl, {
                skipAuth: true,
            });

            return csvResponse.data;
        } catch (error) {
            console.error("Erro ao baixar relatório:", error);
            throw error;
        }
    }

    public async uploadFileAsCSV(presignedUrl: string, scanResults: ReportCsvModel[]): Promise<void> {
        try {
            const csvContent = this.transformJsonCSVString(scanResults);
            console.log("📄 CSV gerado");

            const path = FileSystem.cacheDirectory + "dados.csv";
            await FileSystem.writeAsStringAsync(path, csvContent, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            const uploadResult = await FileSystem.uploadAsync(presignedUrl, path, {
                httpMethod: "PUT",
                headers: {
                "Content-Type": "text/csv",
                },
            });

            if (uploadResult.status !== 200) {
                throw new Error(`Erro ao enviar: ${uploadResult.status}`);
            }

            await FileSystem.deleteAsync(path, { idempotent: true });
            console.log("✅ Upload feito com sucesso para o S3!");
        } catch (error) {
            console.error("Erro no upload:", error);
            throw error;
        }
    }

    private transformJsonCSVString(scanResults: ReportCsvModel[]): string {

        if (!scanResults?.length) {
            return "";
        }

        const keys = Object.keys(scanResults[0]) as (keyof ReportCsvModel)[];
        const headers = keys.join(",");

        const escapeValue = (value: string | boolean): string => {
        if (value == null) return "";
            const str = String(value);
            return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
        };

        const rows = scanResults.map((result) =>
            keys.map((key) => escapeValue(result[key] ?? "")).join(",")
        );

        console.log("📋 Linhas CSV:", rows);

        return [headers, ...rows].join("\n");
    }
}