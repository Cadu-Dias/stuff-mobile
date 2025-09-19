import { MOCK_USERS } from './mockData';
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const adminService = {
    getUserByIdentifier: async (email: string) => {
        await delay(300);
        let user = MOCK_USERS.find(u => u.email === email);
        if (!user) {
            user = { id: Math.random().toString(), email };
            MOCK_USERS.push(user);
        }
        return user;
    }
}
