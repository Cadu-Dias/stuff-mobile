import AsyncStorage from "@react-native-async-storage/async-storage";
import { AttributeDetail } from "../models/asset.model";

export class AttributeService {

    private apiUrl = process.env.API_URL || "https://stuff-back.fly.dev";

    public async getAttribute(attributeId: string) {
        try {
            const accessToken = await AsyncStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Usuário não autenticado!");

            const response = await fetch(`${this.apiUrl}/attributes/${attributeId}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${accessToken}` }
            })
            

            if(!response.ok) {
                throw new Error("Não foi possível atualizar o Atributo")
            }
    
            const responseJson = await response.json() as { data: AttributeDetail; message: string }
            console.log(responseJson)
            return responseJson.data
            
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async updateAttributeBasic(attributeId: string, attributeProperties: any) {

        try {
            const accessToken = await AsyncStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Usuário não autenticado!");
    
            const response = await fetch(`${this.apiUrl}/attributes/${attributeId}`, {
                method: "PATCH",
                headers: { 
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: attributeProperties 
            })
            

            if(!response.ok) {
                throw new Error("Não foi possível atualizar o Atributo")
            }
    
            const responseJson = await response.json() as { data: AttributeDetail; message: string }
            console.log(responseJson)
            return responseJson.data
            
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async deleteAttribute(attributeId: string) {
        try {
            const accessToken = await AsyncStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Usuário não autenticado!");

            const response = await fetch(`${this.apiUrl}/attributes/value/${attributeId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${accessToken}` }
            })
                

            if(!response.ok) {
                console.log(response)
                throw new Error("Não foi possível deletar o valor do Atributo")
            }
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async createAttributeValue(attributeId: string, assetId: string, value: any) {
        try {
            const accessToken = await AsyncStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Usuário não autenticado!");

            const response = await fetch(`${this.apiUrl}/attributes/${attributeId}/value`, {
                method: "PATCH",
                headers: { 
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    assetId: assetId,
                    value: value
                }) 
            })

            if(!response.ok) {
                throw new Error("Não foi possível adicionar valor ao atributo")
            }
            
        } catch (error) {
            console.log(error)
            throw error;
        }
    }

    public async updateAttributeValues(attributeValueId: string, attributeValueProperties: Partial<{ value: string, timeUnit: string, metricUnit: string }>) {
        try {
            const accessToken = await AsyncStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Usuário não autenticado!");
    
            const response = await fetch(`${this.apiUrl}/attributes/value/${attributeValueId}`, {
                method: "PATCH",
                headers: { 
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify(attributeValueProperties)
            })
            

            if(!response.ok) {
                console.log(response)
                throw new Error("Não foi possível atualizar o Atributo")
            }
    
            const responseJson = await response.json() as { data: AttributeDetail; message: string }
            return responseJson.data
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    public async deleteAttributeValues(attributeValueId: string) {
        try {
            const accessToken = await AsyncStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Usuário não autenticado!");

            const response = await fetch(`${this.apiUrl}/attributes/value/${attributeValueId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${accessToken}` }
            })
                

            if(!response.ok) {
                console.log(response)
                throw new Error("Não foi possível deletar o valor do Atributo")
            }

            console.log("Valor do atributo deletado com sucesso!")
        } catch (error) {
            console.log(error)
            throw error
        }

    }
}