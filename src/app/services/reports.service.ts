import AsyncStorage from "@react-native-async-storage/async-storage";
import { Report, ReportCreation, ReportCsvModel } from "../models/reports.model";
import * as FileSystem from 'expo-file-system';

export class ReportService {
    
    private apiUrl = process.env.API_URL || "https://stuff-back.fly.dev";

    public async generatePresignedUrl(filename: string) {
        try {
            const accessToken = await AsyncStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Usuário não autenticado!");

            const filenameTreated = filename
                .replace(/ /g, "_")
                .replace(/-/g, "_")
                .toLowerCase();

            const response = await fetch(`${this.apiUrl}/reports/upload`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${accessToken}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ filename: filenameTreated })
            })
            

            if(!response.ok) {
                throw new Error("Não foi gerar a URL pré-assinada");
            }
            
            const responseJson = await response.json() as { data: { url: string; key: string }};
            return responseJson.data;
            
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async getReport(reportId: string) {
        try {
            const accessToken = await AsyncStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Usuário não autenticado!");

            const response = await fetch(`${this.apiUrl}/reports/${reportId}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${accessToken}` }
            })

            if(!response.ok) {
                throw new Error("Não possível obter relatório específico");
            }

            const responseJson = await response.json() as { message: string; data: Report }
            return responseJson.data
            
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
    
    public async getAllReports() {
        try {
            const accessToken = await AsyncStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Usuário não autenticado!");

            const response = await fetch(`${this.apiUrl}/reports`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${accessToken}` }
            })

            if(!response.ok) {
                throw new Error("Não possível obter os relatórios");
            }

            const responseJson = await response.json() as Report[]
            return responseJson
            
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async getOrganizationReports(organizationId: string) {
        try {
            const accessToken = await AsyncStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Usuário não autenticado!");

            const response = await fetch(`${this.apiUrl}/organizations/${organizationId}/reports`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${accessToken}` }
            })

            if(!response.ok) {
                throw new Error("Não possível obter os relatórios");
            }

            const responseJson = await response.json() as { message: string; data: Report[] }
            return responseJson.data
            
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async createReport(report: ReportCreation) {

        try {
            const accessToken = await AsyncStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Usuário não autenticado!");
    
            const response = await fetch(`${this.apiUrl}/reports`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${accessToken}`,
                    "Accept": 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(report)
            })
            

            const responseJson = await response.json();
            if(!response.ok) {
                throw new Error("Não foi possível criar o relatório: " + responseJson["message"])
            }

            console.log("Relatório criado com sucesso: " + responseJson["message"]);

        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async downloadReport(key: string) {
        try {
            const accessToken = await AsyncStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Usuário não autenticado!");

            const downloadResponse = await fetch(`${this.apiUrl}/reports/download?key=${key}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${accessToken}` }
            })

            if(!downloadResponse.ok) {
                throw new Error("Não possível realizar o download do s");
            }

            const downloadContent = await downloadResponse.json() as { message: string; data: { url: string } }
            const downloadUrl = downloadContent.data.url

            const csvResponse = await fetch(downloadUrl, { method: "GET" });
            const csvText = await csvResponse.text();
            return csvText;
            
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async uploadFileAsCSV(presignedUrl: string, scanResults: ReportCsvModel[]) {
        try {
            const csvContent = this.transformJsonCSVString(scanResults);
            console.log(csvContent);
            
            const path = FileSystem.cacheDirectory + 'dados.csv';
            await FileSystem.writeAsStringAsync(path, csvContent, {
                encoding: FileSystem.EncodingType.UTF8
            });

            const uploadResult = await FileSystem.uploadAsync(presignedUrl, path, {
                httpMethod: 'PUT',
                headers: {
                    'Content-Type': 'text/csv',
                },
            });

            if (uploadResult.status !== 200) {
                throw new Error(`Erro ao enviar: ${uploadResult.status}`);
            }

            await FileSystem.deleteAsync(path, { idempotent: true });
            console.log('✅ Upload feito com sucesso para o S3!');
        } catch (error) {
            console.error('Erro no upload:', error);
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

        console.log(scanResults)

        const rows = scanResults.map(result =>
            keys.map(key => escapeValue(result[key] ?? "")).join(",")
        );

        console.log(rows)

        return [headers, ...rows].join("\n");
    }

}