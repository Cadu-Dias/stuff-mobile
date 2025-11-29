import httpClient from './api';
import { Asset } from '../models/asset.model';

export class AssetService {

    public async getAssets() {
        try {
            const response = await httpClient.get<{ data: { assets: Omit<Asset[], 'attributes'> }; message: string }>(
                '/assets'
            );
            return response.data.data;
        } catch (error) {
            console.error('Erro ao buscar assets:', error);
            throw error;
        }
    }

    public async getAssetInfo(assetId: string): Promise<Asset> {
        try {
            const response = await httpClient.get<{ data: Asset; message: string }>(
                `/assets/${assetId}`
            );
            return response.data.data;
        } catch (error) {
            console.error('Erro ao buscar asset:', error);
            throw error;
        }
    }

    public async getOrganizationAssets(organizationId: string): Promise<Asset[]> {
        try {
            const response = await httpClient.get<{ data: Asset[]; message: string }>(
                `/organizations/${organizationId}/assets`
            );
            return response.data.data;
        } catch (error) {
            console.error('Erro ao buscar assets da organização:', error);
            throw error;
        }
    }

    public async createAsset(assetProp: Pick<Asset, 'name' | 'type' | 'organizationId' | 'description' | 'quantity'>): Promise<Asset> {
        try {
            const response = await httpClient.post<{ data: Asset; message: string }>(
                '/assets',
                assetProp
            );
            return response.data.data;
        } catch (error) {
            console.error('Erro ao criar asset:', error);
            throw error;
        }
    }

    public async updateAsset(assetId: string,assetProperties: Omit<Partial<Asset>, 'attributes'>): Promise<Omit<Asset, 'attributes'>> {
        try {
            const response = await httpClient.patch<{ data: Omit<Asset, 'attributes'>; message: string }>(
                `/assets/${assetId}`,
                assetProperties
            );
            return response.data.data;
        } catch (error) {
            console.error('Erro ao atualizar asset:', error);
            throw error;
        }
    }

    public async deleteAsset(assetId: string) {
        try {
            const response = await httpClient.delete(`/assets/${assetId}`);
            console.log('Asset deletado com sucesso');
            return response.data;
        } catch (error) {
            console.error('Erro ao deletar asset:', error);
            throw error;
        }
    }
}