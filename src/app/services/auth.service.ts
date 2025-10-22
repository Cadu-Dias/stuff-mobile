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
                switch(response.status) {
                    case 400:
                        throw new Error("O e-mail ou a senha possuem valores invalídos. Insira os valores corretamente.")
                    case 404:
                        throw new Error("Não foi encontrado um usuário com esse e-mail ou senha. Tente outra conta.");
                    default:
                        throw new Error("Não foi possível realizar o login. Tente novamente mais tarde.");
                }

            }
            
            const responseJson = await response.json();
            await AsyncStorage.setItem("accessToken", responseJson["accessToken"]);
        } catch (error: any) {
            throw error;
        }
    }
}