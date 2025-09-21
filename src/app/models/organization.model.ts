export interface Organization {
    id: string;
    ownerId: string;
    name: string;
    slug: string;
    description: string;
    password: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}
