import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, SafeAreaView, TouchableOpacity,
    ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OrganizationService } from '../services/organization.service';
import { AssetService } from '../services/asset.service';
import { Organization } from '../models/organization.model';
import { Asset, AttributeDetail } from '../models/asset.model';
import { RootStackNavigationProp } from '../models/stackType';
import { AttributeService } from '../services/attribute.service';

interface AssetWithRFID {
    id: string;
    name: string;
    rfidTag: string;
    selected: boolean;
}

const AssetSelectionScreen = () => {
    const navigation = useNavigation<RootStackNavigationProp>();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [assetsWithRFID, setAssetsWithRFID] = useState<AssetWithRFID[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [saving, setSaving] = useState(false);

    const organizationService = new OrganizationService();
    const assetService = new AssetService();
    const attributeService = new AttributeService();

    useEffect(() => {
        loadOrganizations();
    }, []);

    const loadOrganizations = async () => {
        try {
            const orgs = await organizationService.getAllOrganizations();
            setOrganizations(orgs || []);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar as organizações');
        } finally {
            setLoading(false);
        }
    };

    const loadAssetsWithRFID = async (orgId: string) => {
        setLoadingAssets(true);
        try {
            const assets = await assetService.getOrganizationAssets(orgId);
            const assetsWithRFIDTags: AssetWithRFID[] = [];

            for(const asset of assets) {

                const assetInfo = await assetService.getAssetInfo(asset.id);
                const attributes = assetInfo.attributes.filter(
                    attr => attr.organizationId === orgId &&
                        attr.name.toLowerCase().includes('rfid') &&
                        attr.name.toLowerCase().includes('tag')
                )

                for(const attribute of attributes) {
                    const attributeValueInfo = await attributeService.getAttribute(attribute.id);

                    const rfidValue = attributeValueInfo.values.
                        find((value) => value.assetInstanceId === asset.id)?.value;
                    
                    if(rfidValue) {
                        assetsWithRFIDTags.push({
                            id: asset.id,
                            name: asset.name,
                            rfidTag: rfidValue,
                            selected: false
                        });
                    }
                }
            }

            setAssetsWithRFID(assetsWithRFIDTags);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar os ativos');
        } finally {
            setLoadingAssets(false);
        }
    };

    const handleSelectOrganization = (org: Organization) => {
        setSelectedOrg(org);
        setAssetsWithRFID([]);
        loadAssetsWithRFID(org.id);
    };

    const toggleAssetSelection = (assetId: string) => {
        setAssetsWithRFID(prev =>
            prev.map(asset =>
                asset.id === assetId
                    ? { ...asset, selected: !asset.selected }
                    : asset
            )
        );
    };

    const selectAllAssets = () => {
        setAssetsWithRFID(prev =>
            prev.map(asset => ({ ...asset, selected: true }))
        );
    };

    const deselectAllAssets = () => {
        setAssetsWithRFID(prev =>
            prev.map(asset => ({ ...asset, selected: false }))
        );
    };

    const handleSaveSelection = async () => {
        const selectedAssets = assetsWithRFID.filter(asset => asset.selected);

        if (selectedAssets.length === 0) {
            Alert.alert('Atenção', 'Selecione pelo menos um ativo para continuar');
            return;
        }

        setSaving(true);
        try {
            const dataToSave = {
                organization: selectedOrg!.name,
                assets: selectedAssets.map(asset => ({
                    asset_name: asset.name,
                    rfid_tag: asset.rfidTag
                }))
            };

            await AsyncStorage.setItem('selected-rfid-assets', JSON.stringify(dataToSave));

            Alert.alert(
                'Sucesso',
                `${selectedAssets.length} ativo(s) selecionado(s) para verificação`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível salvar a seleção');
        } finally {
            setSaving(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.headerSection}>
            <View style={styles.headerIcon}>
                <MaterialCommunityIcons name="package-variant-closed" size={32} color="#4CAF50" />
            </View>
            <Text style={styles.title}>Selecionar Ativos</Text>
            <Text style={styles.subtitle}>
                Escolha a organização e os ativos para verificação RFID
            </Text>
        </View>
    );

    const renderOrganizationSelection = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>1. Escolha a Organização</Text>
            </View>

            {selectedOrg ? (
                <View style={styles.selectedOrgCard}>
                    <View style={styles.orgIcon}>
                        <MaterialCommunityIcons name="office-building" size={24} color="#2196F3" />
                    </View>
                    <View style={styles.orgInfo}>
                        <Text style={styles.orgName}>{selectedOrg.name}</Text>
                        <Text style={styles.orgDescription}>{selectedOrg.description}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedOrg(null)} style={styles.changeButton}>
                        <Feather name="edit-2" size={16} color="#F4A64E" />
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.orgScrollView}>
                    {organizations.map(org => (
                        <TouchableOpacity
                            key={org.id}
                            style={styles.orgCard}
                            onPress={() => handleSelectOrganization(org)}
                        >
                            <View style={styles.orgCardIcon}>
                                <MaterialCommunityIcons name="office-building" size={20} color="#2196F3" />
                            </View>
                            <Text style={styles.orgCardName}>{org.name}</Text>
                            <Text style={styles.orgCardDescription} numberOfLines={2}>
                                {org.description}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );

    const renderAssetSelection = () => {
        if (!selectedOrg) return null;

        const selectedCount = assetsWithRFID.filter(asset => asset.selected).length;

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        2. Selecione os Ativos ({selectedCount}/{assetsWithRFID.length})
                    </Text>
                    {assetsWithRFID.length > 0 && (
                        <View style={styles.bulkActions}>
                            <TouchableOpacity onPress={selectAllAssets} style={styles.bulkButton}>
                                <Text style={styles.bulkButtonText}>Todos</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={deselectAllAssets} style={styles.bulkButton}>
                                <Text style={styles.bulkButtonText}>Nenhum</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {loadingAssets ? (
                    <View style={styles.loadingAssets}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={styles.loadingText}>Carregando ativos com RFID TAG...</Text>
                    </View>
                ) : assetsWithRFID.length > 0 ? (
                    <>
                        <View style={styles.rfidInfo}>
                            <Feather name="info" size={16} color="#2196F3" />
                            <Text style={styles.rfidInfoText}>
                                Mostrando apenas ativos com atributo "RFID TAG" configurado
                            </Text>
                        </View>
                        <View style={styles.assetsList}>
                            {assetsWithRFID.map(asset => (
                                <TouchableOpacity
                                    key={asset.id}
                                    style={[
                                        styles.assetCard,
                                        asset.selected && styles.assetCardSelected
                                    ]}
                                    onPress={() => toggleAssetSelection(asset.id)}
                                >
                                    <View style={styles.assetCheckbox}>
                                        {asset.selected ? (
                                            <Feather name="check-circle" size={20} color="#4CAF50" />
                                        ) : (
                                            <Feather name="circle" size={20} color="#ccc" />
                                        )}
                                    </View>
                                    <View style={styles.assetIcon}>
                                        <MaterialCommunityIcons name="package" size={20} color="#4CAF50" />
                                    </View>
                                    <View style={styles.assetInfo}>
                                        <Text style={styles.assetName}>{asset.name}</Text>
                                        <Text style={styles.assetRfid}>RFID: {asset.rfidTag}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                ) : (
                    <View style={styles.noAssetsCard}>
                        <MaterialCommunityIcons name="close" size={48} color="#ccc" />
                        <Text style={styles.noAssetsTitle}>Nenhum ativo com RFID TAG</Text>
                        <Text style={styles.noAssetsText}>
                            Esta organização não possui ativos com o atributo "RFID TAG" configurado.
                            Adicione o atributo aos ativos para habilitá-los para verificação RFID.
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    const renderActions = () => {
        const selectedCount = assetsWithRFID.filter(asset => asset.selected).length;
        const canSave = selectedOrg && selectedCount > 0;

        return (
            <View style={styles.actionsSection}>
                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        !canSave && styles.saveButtonDisabled
                    ]}
                    onPress={handleSaveSelection}
                    disabled={!canSave || saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <>
                            <Feather name="check" size={20} color={canSave ? "white" : "#ccc"} />
                            <Text style={[
                                styles.saveButtonText,
                                !canSave && styles.saveButtonTextDisabled
                            ]}>
                                Definir Ativos ({selectedCount})
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Carregando organizações...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
                {renderHeader()}
                {renderOrganizationSelection()}
                {renderAssetSelection()}
                {renderActions()}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F4A64E',
    },
    main: {
        flex: 1,
        backgroundColor: '#FFF0E0',
        margin: 12,
        borderRadius: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF0E0',
        margin: 12,
        borderRadius: 8,
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },

    // Header
    headerSection: {
        alignItems: 'center',
        paddingTop: 30,
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    headerIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },

    // Sections
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },

    // Organization Selection
    selectedOrgCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
    },
    orgIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    orgInfo: {
        flex: 1,
    },
    orgName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    orgDescription: {
        fontSize: 14,
        color: '#666',
    },
    changeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    orgScrollView: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    orgCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        width: 160,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orgCardIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    orgCardName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    orgCardDescription: {
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
    },

    // Asset Selection
    bulkActions: {
        flexDirection: 'row',
        gap: 8,
    },
    bulkButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
    },
    bulkButtonText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    loadingAssets: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 16,
    },
    rfidInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    rfidInfoText: {
        fontSize: 14,
        color: '#1976D2',
        flex: 1,
    },
    assetsList: {
        gap: 8,
    },
    assetCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    assetCardSelected: {
        borderColor: '#4CAF50',
        backgroundColor: '#F1F8E9',
    },
    assetCheckbox: {
        marginRight: 12,
    },
    assetIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    assetInfo: {
        flex: 1,
    },
    assetName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    assetRfid: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'monospace',
    },
    noAssetsCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    noAssetsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    noAssetsText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },

    // Actions
    actionsSection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonDisabled: {
        backgroundColor: '#E0E0E0',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    saveButtonTextDisabled: {
        color: '#ccc',
    },
});

export default AssetSelectionScreen;