import AsyncStorage from "@react-native-async-storage/async-storage";
import { Organization } from "../models/organization.model";

export class OrganizationService {
  private apiUrl = process.env.API_URL || "https://stuff-back.fly.dev";

  public async getAllOrganizations() : Promise<Organization[]> {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      if (!accessToken) throw new Error("Usuário não autenticado!");

      const response = await fetch(`${this.apiUrl}/organizations/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = await response.json() as { data: Organization[]};
      return responseJson.data;
    } catch (error) {
      throw error;
    }
  }

  public async getOrganizationById(identifier: string) : Promise<Organization> {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      if (!accessToken) throw new Error("Usuário não autenticado!");

      const response = await fetch(`${this.apiUrl}/organizations/${identifier}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const responseJson = await response.json() as { data: Organization };
      return responseJson.data;
    } catch (error) {
      throw error;
    }
  }

  async createOrganization(orgInfo: { name: string; slug: string; description: string; password: string }) {
    const accessToken = await AsyncStorage.getItem("accessToken");
    if (!accessToken) throw new Error("Usuário não autenticado!");

    const response = await fetch(`${this.apiUrl}/organizations/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orgInfo),
    });

    const data = await response.json();
    return data;
  }

  async deleteOrganization(id: string) {
    const accessToken = await AsyncStorage.getItem("accessToken");
    if (!accessToken) throw new Error("Usuário não autenticado!");

    const response = await fetch(`${this.apiUrl}/organizations/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();
    return data;
  }

  async getMembers(orgId: string) {
    const accessToken = await AsyncStorage.getItem("accessToken");
    if (!accessToken) throw new Error("Usuário não autenticado!");

    const response = await fetch(
      `${this.apiUrl}/organizations/${orgId}/members`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if(!response.ok) {
      throw new Error("Não foi possível carregar os membros da Organização!");
    }

    const responseJson = await response.json() as { data: any[]; message: string };
    return responseJson.data;
  }

  async addMember(orgId: string, member: { userId: string; role: string }) {
    const accessToken = await AsyncStorage.getItem("accessToken");
    if (!accessToken) throw new Error("Usuário não autenticado!");

    const response = await fetch(
      `${this.apiUrl}/organizations/${orgId}/members`,
      {
        method: "POST",
        headers: { 
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}` 
        },
        body: JSON.stringify(member),
      }
    );

    const data = await response.json();
    return data;
  }

  async updateMemberRole(orgId: string, userId: string, role: string) {
    const accessToken = await AsyncStorage.getItem("accessToken");
    if (!accessToken) throw new Error("Usuário não autenticado!");

    const response = await fetch(
      `${this.apiUrl}/organizations/${orgId}/members/${userId}`,
      {
        method: "PATCH",
        headers: { 
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}` 
        },
        body: JSON.stringify({ role }),
      }
    );

    const data = await response.json();
    return data;
  }

  async deleteMember(orgId: string, userId: string) {
    const accessToken = await AsyncStorage.getItem("accessToken");
    if (!accessToken) throw new Error("Usuário não autenticado!");

    const response = await fetch(
      `${this.apiUrl}/organizations/${orgId}/members/${userId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const data = await response.json();
    return data;
  }
}
