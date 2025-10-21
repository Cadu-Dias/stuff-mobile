import AsyncStorage from "@react-native-async-storage/async-storage";
import { Report, ReportCreation, ReportCsvModel } from "../models/reports.model";
import { Buffer } from "buffer";
import * as FileSystem from 'expo-file-system';

export class ReportService {
    
    private apiUrl = process.env.API_URL || "https://stuff-back.fly.dev";

    public async generatePresignedUrl(filename: string) {
        try {
            const accessToken = await AsyncStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Usuário não autenticado!");
            
            const response = await fetch(`${this.apiUrl}/reports/presigned-url`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${accessToken}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ filename })
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

        const rows = scanResults.map(result =>
            keys.map(key => escapeValue(result[key] ?? "")).join(",")
        );

        return [headers, ...rows].join("\n");
    }

}