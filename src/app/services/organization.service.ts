import { MOCK_MEMBERS, MOCK_ORGANIZATIONS, MOCK_USERS } from "./mockData";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

let organizations = [...MOCK_ORGANIZATIONS];
let members = JSON.parse(JSON.stringify(MOCK_MEMBERS));

export const organizationService = {
  getAllOrganizations: async () => {
    await delay(500);
    return { data: organizations };
  },
  createOrganization: async (form: any) => {
    await delay(500);
    const newOrg = { id: Math.random().toString(), ...form };
    organizations.push(newOrg);
    return { data: newOrg };
  },
  deleteOrganization: async (id: string) => {
    await delay(500);
    organizations = organizations.filter(org => org.id !== id);
    return { success: true };
  },
  getOrganizationById: async (id: string) => {
    await delay(500);
    const org = organizations.find(o => o.id === id);
    return { data: org };
  },
  getMembers: async (orgId: string) => {
    await delay(500);
    return { data: members[orgId] || [] };
  },
  addMember: async (orgId: string, { userId, role }: any) => {
    await delay(500);
    const userEmail = MOCK_USERS.find(u => u.id === userId)?.email || 'email.nao.encontrado@test.com';
    if (!members[orgId]) members[orgId] = [];
    members[orgId].push({ id: userId, email: userEmail, role });
    return { success: true };
  },
};
