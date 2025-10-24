import httpClient from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LoginData } from "../models/login.model";
import { AxiosError } from "axios";

export class AuthService {


    async loginUser(data: LoginData) {
        try {
            console.log('Tentando logar usuário:', data);

            const response = await httpClient.post<{ accessToken: string }>("/auth/login", {
                email: data.email.trim(),
                password: data.password.trim()
            }, { skipAuth: true })

            await AsyncStorage.setItem("accessToken", response.data["accessToken"]);
        } catch (error: any) {

            if(error instanceof AxiosError) {
                switch(error.status) {
                    case 400:
                        throw new Error("O e-mail ou a senha possuem valores invalídos. Insira os valores corretamente.")
                    case 404:
                        throw new Error("Não foi encontrado um usuário com esse e-mail ou senha. Tente outra conta.");
                    default:
                        throw new Error("Não foi possível realizar o login. Tente novamente mais tarde.");
                }
            }
            
            throw error;
        }
    }

    async logoutUser() {
        try {
            console.log("Realizando logout do usuário...");
            await httpClient.post<{ message: string, data: any }>("/auth/logout", {});
            
        } catch (error) {
            
            throw new Error("Não foi possível sair da conta!");
        }
    }

    async requestPasswordReset(email: string) {
        try {
            console.log('Enviando e-mail para alterar a senha...');

            const response = await httpClient.post<{ message: string }>("/auth/forgot-password", {
                email: email.trim()
            }, { skipAuth: true })

            return response.data
        } catch (error: any) {

            if(error instanceof AxiosError) {
                console.log(error.response)
                switch(error.status) {
                    case 400:
                        throw new Error("O e-mail possue valor invalído. Insira o valor corretamente.")
                    default:
                        throw new Error("Houve algum erro no envio do e-mail. Tente novamente mais tarde.");
                }
            }
            
            throw error;
        }
    }
}