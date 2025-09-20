import AsyncStorage from "@react-native-async-storage/async-storage";
import { Asset } from "../models/asset.model";

export class AssetService {

    private apiUrl = process.env.API_URL || "https://stuff-back.fly.dev"

    public async getAssets() {
        const accessToken = await AsyncStorage.getItem("accessToken");
        if (!accessToken) throw new Error("Usuário não autenticado!");

        const response = await fetch(`${this.apiUrl}/assets`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${accessToken}` }
        })

        const responseJson = await response.json() as { data: { assets: Omit<Asset[], 'attributes'> }; message: string };
        return responseJson.data;
    }

    public async getAssetInfo(assetId: string) {
        const accessToken = await AsyncStorage.getItem("accessToken");
        if (!accessToken) throw new Error("Usuário não autenticado!");

        const response = await fetch(`${this.apiUrl}/assets/${assetId}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${accessToken}` }
        })

        const responseJson = await response.json() as { data: Asset; message: string };
        return responseJson.data;
    }

    public async getOrganizationAssets(organizationId: string) {
        const accessToken = await AsyncStorage.getItem("accessToken");
        if (!accessToken) throw new Error("Usuário não autenticado!");

        const response = await fetch(`${this.apiUrl}/organizations/${organizationId}/assets`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${accessToken}` }
        })

        const responseJson = await response.json() as { data: Asset[]; message: string };
        return responseJson.data;
    }


    public async createAsset(assetProp: Pick<Asset, "name" | "type" | "organizationId" | "description" | "quantity">) {
        try {
            const accessToken = await AsyncStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Usuário não autenticado!");

            const response = await fetch(`${this.apiUrl}/assets`, {
                method: "POST",
                headers: { 
                    "Accept": "applcation/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({ ...assetProp })
            })

            if(!response.ok) {
                throw new Error("Não foi possível adicionar um novo ativo")
            }

            const responseJson = await response.json() as { data: Asset[], message: string }
            return responseJson.data[0];
        } catch (error) {
            throw error
        }        
    }

    public async updateAsset(assetId: string, assetProperties: Omit<Partial<Asset>, "attributes">) {
        const accessToken = await AsyncStorage.getItem("accessToken");
        if (!accessToken) throw new Error("Usuário não autenticado!");

        const response = await fetch(`${this.apiUrl}/assets/${assetId}`, {
            method: "PATCH",
            headers: { 
                "Accept": "applcation/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({ ...assetProperties })
        })

        const responseJson = await response.json() as { data: Omit<Asset, "attributes">; message: string }
        return responseJson.data
    }

    public async deleteAsset(assetId: string) {
        const accessToken = await AsyncStorage.getItem("accessToken");
        if (!accessToken) throw new Error("Usuário não autenticado!");

        const response = await fetch(`${this.apiUrl}/assets/${assetId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const data = await response.json();
        return data;
    }
}