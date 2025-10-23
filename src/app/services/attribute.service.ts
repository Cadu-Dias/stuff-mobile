import httpClient from './api';
import { AttributeDetail } from '../models/asset.model';

export class AttributeService {
    public async getAttribute(attributeId: string): Promise<AttributeDetail> {
        try {
            const response = await httpClient.get<{ data: AttributeDetail; message: string }>(
                `/attributes/${attributeId}`
            );
            console.log('Atributo obtido:', response.data);
            return response.data.data;
        } catch (error) {
            console.error('Erro ao buscar atributo:', error);
            throw error;
        }
    }

    public async createAttribute(attributeProperties: Record<string, any>): Promise<AttributeDetail> {
        try {
            const response = await httpClient.post<{ data: AttributeDetail; message: string }>(
                '/attributes',
                attributeProperties
            );
            console.log('Atributo criado com sucesso');
            return response.data.data;
        } catch (error) {
            console.error('Erro ao criar atributo:', error);
            throw error;
        }
    }

    public async updateAttributeBasic(attributeId: string, attributeProperties: any): Promise<AttributeDetail> {
        try {
            const response = await httpClient.patch<{ data: AttributeDetail; message: string }>(
                `/attributes/${attributeId}`,
                attributeProperties
            );
            console.log('Atributo atualizado:', response.data);
            return response.data.data;
        } catch (error) {
            console.error('Erro ao atualizar atributo:', error);
            throw error;
        }
    }

    public async deleteAttribute(attributeId: string): Promise<void> {
        try {
            await httpClient.delete(`/attributes/${attributeId}`);
            console.log('Atributo deletado com sucesso');
        } catch (error) {
            console.error('Erro ao deletar atributo:', error);
            throw error;
        }
    }

    public async createAttributeValue(attributeId: string, assetId: string, value: any): Promise<void> {
        try {
            await httpClient.post(`/attributes/${attributeId}/value`, {
                assetId,
                value,
            });
            console.log('Valor do atributo criado com sucesso');
        } catch (error) {
            console.error('Erro ao criar valor do atributo:', error);
            throw error;
        }
    }

    public async updateAttributeValue(
        attributeValueId: string,
        attributeValueProperties: Partial<{ value: string; timeUnit: string; metricUnit: string }>
    ): Promise<AttributeDetail> {
        try {
            const response = await httpClient.patch<{ data: AttributeDetail; message: string }>(
                `/attributes/value/${attributeValueId}`,
                attributeValueProperties
            );
            return response.data.data;
        } catch (error) {
            console.error('Erro ao atualizar valor do atributo:', error);
            throw error;
        }
    }

    public async deleteAttributeValue(attributeValueId: string): Promise<void> {
        try {
            await httpClient.delete(`/attributes/value/${attributeValueId}`);
            console.log('Valor do atributo deletado com sucesso');
        } catch (error) {
            console.error('Erro ao deletar valor do atributo:', error);
            throw error;
        }
    }
}
