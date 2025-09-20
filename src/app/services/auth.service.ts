import AsyncStorage from "@react-native-async-storage/async-storage";
import { LoginData } from "../models/login.model";

export class AuthService {

    private apiUrl = process.env.API_URL || "https://stuff-back.fly.dev"


    async loginUser(data: LoginData) {
        try {
            console.log('Tentando logar usuário:', data);
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: "POST",
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "email": data.email.trim(),
                    "password": data.password.trim(),
                })
            });

            if(!response.ok) {
                throw new Error("Não foi possível realizar o Login");
            }

            const responseJson = await response.json()
            console.log('Resposta do login:', responseJson);

           await AsyncStorage.setItem("accessToken", responseJson["accessToken"]);
        } catch (error: any) {
            console.error('Erro no loginUser:', error.response?.data || error.message);
            throw error;
        }
    }
}