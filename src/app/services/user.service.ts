import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserInfo } from "../models/user.model";

export class UserService {
    private apiUrl = process.env.API_URL || "https://stuff-back.fly.dev";

    public async getUserInfo() : Promise<UserInfo> {
        try {
            console.log("Obtendo dado do usuário...");

            const accessToken = await AsyncStorage.getItem("accessToken");
            if(!accessToken) throw new Error("Usuário não autenticado!"); 

            const response = await fetch(`${this.apiUrl}/users/me`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer `
                }
            });

            if (!response.ok) {
                throw new Error("Não foi possível obter as informações do usuário");
            }

            const responseJson = await response.json();
            return responseJson["data"];
        } catch (error: any) {
            throw error;
        }
    }

    public async updateLoggedUser(infoToUpdate: Partial<UserInfo>) {

        try {
            const accessToken = await AsyncStorage.getItem("accessToken");
            if (!accessToken) throw new Error("Usuário não autenticado!");

            const response = await fetch(`${this.apiUrl}/users/me`, {
                method: "PATCH",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify(infoToUpdate)
            })

            if(!response.ok) {
                throw new Error("Não foi possível atualizar o perfil")
            }

        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}
