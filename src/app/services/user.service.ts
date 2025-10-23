import httpClient from './api';
import { UserInfo } from '../models/user.model';

export class UserService {

    public async getUserInfo(): Promise<UserInfo> {
        try {
            console.log('Obtendo dados do usuário...');

            const response = await httpClient.get<{ data: UserInfo }>('/users/me');
            return response.data.data;
        } catch (error) {
            console.error('Erro ao obter informações do usuário:', error);
            throw error;
        }
    }

    public async updateLoggedUser(infoToUpdate: Partial<UserInfo>): Promise<void> {
        try {
            await httpClient.patch('/users/me', infoToUpdate);
            console.log('Perfil atualizado com sucesso');
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            throw error;
        }
    }
}