import httpClient from './api';
import { Organization } from '../models/organization.model';
import { UserInfo } from '../models/user.model';

export class OrganizationService {
  public async getAllOrganizations(): Promise<Organization[]> {
    try {
      const response = await httpClient.get<{ data: Organization[] }>('/organizations');
      return response.data.data;
    } catch (error) {
      console.error('Erro ao buscar organizações:', error);
      throw error;
    }
  }

  public async getOrganizationById(identifier: string): Promise<Organization> {
    try {
      const response = await httpClient.get<{ data: Organization }>(
        `/organizations/${identifier}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Erro ao buscar organização:', error);
      throw error;
    }
  }

  public async createOrganization(orgInfo: {name: string; slug: string; description: string;password: string }) {
    try {
      const response = await httpClient.post('/organizations', orgInfo);
      console.log('Organização criada com sucesso');
      return response.data;
    } catch (error) {
      console.error('Erro ao criar organização:', error);
      throw error;
    }
  }

  public async deleteOrganization(id: string) {
    try {
      const response = await httpClient.delete(`/organizations/${id}`);
      console.log('Organização deletada com sucesso');
      return response.data;
    } catch (error) {
      console.error('Erro ao deletar organização:', error);
      throw error;
    }
  }

  public async getMembers(orgId: string): Promise<UserInfo[]> {
    try {
      const response = await httpClient.get<{ data: UserInfo[]; message: string }>(
        `/organizations/${orgId}/members`
      );
      return response.data.data;
    } catch (error) {
      console.error('Erro ao buscar membros da organização:', error);
      throw error;
    }
  }

  public async addMember(orgId: string, member: { userId: string; role: string }) {
    try {
      const response = await httpClient.post(
        `/organizations/${orgId}/members`,
        member
      );
      console.log('Membro adicionado com sucesso');
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      throw error;
    }
  }

  public async updateMemberRole(orgId: string, userId: string, role: string) {
    try {
      const response = await httpClient.patch(
        `/organizations/${orgId}/members/${userId}`,
        { role }
      );
      console.log('Papel do membro atualizado com sucesso');
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar papel do membro:', error);
      throw error;
    }
  }

  public async deleteMember(orgId: string, userId: string) {
    try {
      const response = await httpClient.delete(
        `/organizations/${orgId}/members/${userId}`
      );
      console.log('Membro removido com sucesso');
      return response.data;
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      throw error;
    }
  }
}
