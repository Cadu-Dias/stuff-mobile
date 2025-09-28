import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, SafeAreaView, ScrollView,
    ActivityIndicator, TouchableOpacity, TextInput,
    Alert, Modal
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { AssetService } from '../../services/asset.service';
import { Asset, AttributeDetail } from '../../models/asset.model';
import { RootStackNavigationProp } from '../../models/stackType';

interface EditModalProps {
    visible: boolean;
    type: 'asset' | 'new-attribute';
    data: any;
    onSave: (data: any) => void;
    onCancel: () => void;
}

const EditModal = ({ visible, type, data, onSave, onCancel }: EditModalProps) => {
    const [formData, setFormData] = useState(data || {});

    useEffect(() => {
        setFormData(data || {});
    }, [data]);

    const handleSave = () => {
        if (type === 'new-attribute') {
            if (!formData.name || !formData.description || !formData.type) {
                Alert.alert("Erro", "Nome, descrição e tipo são obrigatórios!");
                return;
            }
        }
        onSave(formData);
    };

    const getModalTitle = () => {
        switch (type) {
            case 'asset':
                return 'Editar Ativo';
            case 'new-attribute':
                return 'Novo Atributo';
            default:
                return 'Editar';
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={onCancel}>
                        <Feather name="x" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>{getModalTitle()}</Text>
                    <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>
                            {type === 'new-attribute' ? 'Criar' : 'Salvar'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                    {type === 'asset' ? (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Nome</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.name || ''}
                                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                                    placeholder="Nome do ativo"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Descrição</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={formData.description || ''}
                                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                                    placeholder="Descrição do ativo"
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Tipo</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.type || ''}
                                    onChangeText={(text) => setFormData({ ...formData, type: text })}
                                    placeholder="Tipo do ativo"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Quantidade</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.quantity?.toString() || ''}
                                    onChangeText={(text) => setFormData({ ...formData, quantity: parseInt(text) || 0 })}
                                    placeholder="Quantidade"
                                    keyboardType="numeric"
                                />
                            </View>
                        </>
                    ) : (
                        <>
                            {/* ✅ Formulário de criação de atributo */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Nome *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.name || ''}
                                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                                    placeholder="Nome do atributo"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Descrição *</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={formData.description || ''}
                                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                                    placeholder="Descrição do atributo"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Tipo *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.type || ''}
                                    onChangeText={(text) => setFormData({ ...formData, type: text })}
                                    placeholder="Ex: texto, número, data..."
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Unidade</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.unit || ''}
                                    onChangeText={(text) => setFormData({ ...formData, unit: text })}
                                    placeholder="Ex: kg, metros, unidades..."
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Unidade de Tempo</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.timeUnit || ''}
                                    onChangeText={(text) => setFormData({ ...formData, timeUnit: text })}
                                    placeholder="Ex: diário, semanal, mensal..."
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.checkboxContainer}>
                                    <TouchableOpacity
                                        style={[styles.checkbox, formData.required && styles.checkboxChecked]}
                                        onPress={() => setFormData({ ...formData, required: !formData.required })}
                                    >
                                        {formData.required && (
                                            <Feather name="check" size={16} color="white" />
                                        )}
                                    </TouchableOpacity>
                                    <Text style={styles.checkboxLabel}>Campo obrigatório</Text>
                                </View>
                            </View>

                            <View style={styles.helpText}>
                                <Feather name="info" size={16} color="#666" />
                                <Text style={styles.helpTextContent}>
                                    Após criar o atributo, você poderá gerenciar seus valores na tela de detalhes.
                                </Text>
                            </View>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const AttributeItem = ({
    attribute,
    onPress,
    onDelete
}: {
    attribute: AttributeDetail;
    onPress: (attribute: AttributeDetail) => void;
    onDelete: (attributeId: string) => void;
}) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMs = now.getTime() - date.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) return 'Hoje';
        if (diffInDays === 1) return 'Ontem';
        if (diffInDays < 7) return `${diffInDays} dias atrás`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} semanas atrás`;
        if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} meses atrás`;
        return `${Math.floor(diffInDays / 365)} anos atrás`;
    };

    return (
        <TouchableOpacity style={styles.attributeCard} onPress={() => onPress(attribute)}>
            <View style={styles.attributeHeader}>
                <View style={styles.attributeIcon}>
                    <Feather name="settings" size={18} color="#F4A64E" />
                </View>
                <View style={styles.attributeInfo}>
                    <Text style={styles.attributeName}>{attribute.name}</Text>
                    <Text style={styles.attributeDescription}>{attribute.description}</Text>
                </View>
                <View style={styles.attributeActions}>
                    <TouchableOpacity 
                        onPress={(e) => {
                            e.stopPropagation();
                            onDelete(attribute.id);
                        }} 
                        style={styles.actionButton}
                    >
                        <Feather name="trash-2" size={16} color="#C62828" />
                    </TouchableOpacity>
                    <Feather name="chevron-right" size={20} color="#ccc" style={{ marginLeft: 8 }} />
                </View>
            </View>

            <View style={styles.attributeDetails}>
                <View style={styles.attributeTag}>
                    <Text style={styles.attributeTagText}>Tipo: {attribute.type}</Text>
                </View>
                {attribute.unit && (
                    <View style={styles.attributeTag}>
                        <Text style={styles.attributeTagText}>Unidade: {attribute.unit}</Text>
                    </View>
                )}
                {attribute.timeUnit && (
                    <View style={styles.attributeTag}>
                        <Text style={styles.attributeTagText}>Tempo: {attribute.timeUnit}</Text>
                    </View>
                )}
                <View style={[styles.attributeTag, attribute.required && styles.requiredTag]}>
                    <Text style={styles.attributeTagText}>
                        {attribute.required ? 'Obrigatório' : 'Opcional'}
                    </Text>
                </View>
            </View>

            <View style={styles.attributeMetadata}>
                <View style={styles.metadataRow}>
                    <View style={styles.metadataItem}>
                        <Feather name="calendar" size={14} color="#666" />
                        <Text style={styles.metadataLabel}>Criado em:</Text>
                        <Text style={styles.metadataValue}>{formatDate(attribute.createdAt)}</Text>
                    </View>
                </View>
                
                <View style={styles.metadataRow}>
                    <View style={styles.metadataItem}>
                        <Feather name="clock" size={14} color="#666" />
                        <Text style={styles.metadataLabel}>Última atualização:</Text>
                        <Text style={styles.metadataValue}>{getTimeAgo(attribute.updatedAt)}</Text>
                    </View>
                </View>

                {attribute.options && (
                    <View style={styles.metadataRow}>
                        <View style={styles.metadataItem}>
                            <Feather name="list" size={14} color="#666" />
                            <Text style={styles.metadataLabel}>Opções configuradas:</Text>
                            <Text style={styles.metadataValue}>Sim</Text>
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.attributeFooter}>
                <Text style={styles.footerText}>Toque para gerenciar valores e configurações</Text>
                <View style={styles.footerIcon}>
                    <Feather name="arrow-right" size={16} color="#F4A64E" />
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default function AssetDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation<RootStackNavigationProp>();
    const { assetId, organizationId } = route.params as { organizationId: string; assetId: string };

    const [asset, setAsset] = useState<Asset | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editType, setEditType] = useState<'asset' | 'new-attribute'>('asset');
    const [editData, setEditData] = useState<any>(null);

    const assetService = new AssetService();

    const fetchAssetDetails = useCallback(async () => {
        if (!assetId) return;
        setLoading(true);
        setErrorMsg("");

        try {
            let assetResponse = await assetService.getAssetInfo(assetId);
            assetResponse.attributes = assetResponse.attributes.filter((attribute) => attribute.organizationId === organizationId);
            setAsset(assetResponse);
        } catch (err) {
            setErrorMsg("Erro ao buscar detalhes do ativo.");
            console.error("Error fetching asset details:", err);
        } finally {
            setLoading(false);
        }
    }, [assetId]);

    useEffect(() => {
        fetchAssetDetails();
    }, [fetchAssetDetails]);

    const handleDeleteAsset = () => {
        Alert.alert(
            "Confirmar Exclusão",
            "Tem certeza que deseja excluir este ativo? Esta ação não pode ser desfeita.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await assetService.deleteAsset(assetId);

                            console.log(`Deletando ativo: ${assetId}`);
                            Alert.alert("Sucesso", "Ativo excluído com sucesso!");
                            navigation.goBack();
                            
                        } catch (error) {
                            Alert.alert("Error", "Não foi possível deletar o Asset!");
                        }
                    }
                }
            ]
        );
    };

    const handleEditAsset = () => {
        setEditType('asset');
        setEditData(asset);
        setEditModalVisible(true);
    };

    const handleSaveAsset = async (updatedAsset: any) => {
        try {
            console.log('Salvando ativo atualizado:', updatedAsset);
            await assetService.updateAsset(assetId, updatedAsset);

            setAsset(updatedAsset);
            setEditModalVisible(false);
            Alert.alert("Sucesso", "Ativo atualizado com sucesso!");
        } catch (error) {
            Alert.alert("Erro", "Falha ao atualizar ativo.");
        }
    };

    const handleAddAttribute = () => {
        setEditType('new-attribute');
        setEditData({
            name: '',
            description: '',
            type: '',
            unit: '',
            timeUnit: '',
            required: false,
            organizationId: asset?.organizationId || '',
            authorId: asset?.creatorUserId || '',
        });
        setEditModalVisible(true);
    };

    const handleSaveNewAttribute = async (newAttribute: any) => {
        try {
            console.log('Criando novo atributo:', newAttribute);
            
            const attributeWithId = {
                ...newAttribute,
                id: `attr_${Date.now()}`,
                trashBin: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                options: null,
                values: []
            };

            if (asset) {
                const updatedAttributes = [...asset.attributes, attributeWithId];
                setAsset({ ...asset, attributes: updatedAttributes });
            }

            setEditModalVisible(false);
            Alert.alert("Sucesso", "Atributo criado com sucesso!");
        } catch (error) {
            Alert.alert("Erro", "Falha ao criar atributo.");
        }
    };

    const handleAttributePress = (attribute: AttributeDetail) => {
        navigation.navigate('AttributeDetails', { 
            attributeId: attribute.id,
            assetId: assetId
        });
    };

    const handleDeleteAttribute = (attributeId: string) => {
        Alert.alert(
            "Confirmar Exclusão",
            "Tem certeza que deseja excluir este atributo?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            console.log(`Deletando atributo: ${attributeId}`);

                            if (asset) {
                                const updatedAttributes = asset.attributes.filter(attr => attr.id !== attributeId);
                                setAsset({ ...asset, attributes: updatedAttributes });
                            }

                            Alert.alert("Sucesso", "Atributo excluído com sucesso!");
                        } catch (error) {
                            Alert.alert("Erro", "Falha ao excluir atributo.");
                        }
                    }
                }
            ]
        );
    };

    const handleSave = (data: any) => {
        switch (editType) {
            case 'asset':
                handleSaveAsset(data);
                break;
            case 'new-attribute':
                handleSaveNewAttribute(data);
                break;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#F4A64E" />
                    <Text style={styles.loadingText}>Carregando ativo...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (errorMsg) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={48} color="#C62828" />
                    <Text style={styles.errorMessage}>{errorMsg}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchAssetDetails}>
                        <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!asset) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.errorContainer}>
                    <Feather name="package" size={48} color="#ccc" />
                    <Text style={styles.errorMessage}>Ativo não encontrado</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
                {/* Header do Ativo */}
                <View style={styles.assetHeader}>
                    <View style={styles.assetTitleRow}>
                        <View style={styles.assetIcon}>
                            <Feather name="package" size={32} color="#F4A64E" />
                        </View>
                        <View style={styles.assetTitleInfo}>
                            <Text style={styles.assetTitle}>{asset.name}</Text>
                            <Text style={styles.assetSubtitle}>{asset.description}</Text>
                        </View>
                    </View>

                    <View style={styles.assetActions}>
                        <TouchableOpacity style={styles.editButton} onPress={handleEditAsset}>
                            <Feather name="edit-2" size={18} color="white" />
                            <Text style={styles.actionButtonText}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAsset}>
                            <Feather name="trash-2" size={18} color="white" />
                            <Text style={styles.actionButtonText}>Excluir</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Informações do Ativo */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Informações</Text>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Tipo</Text>
                            <Text style={styles.infoValue}>{asset.type}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Quantidade</Text>
                            <Text style={styles.infoValue}>{asset.quantity}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Status</Text>
                            <Text style={[styles.infoValue, asset.trashBin && styles.trashStatus]}>
                                {asset.trashBin ? 'Na Lixeira' : 'Ativo'}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Criado em</Text>
                            <Text style={styles.infoValue}>
                                {new Date(asset.createdAt).toLocaleDateString('pt-BR')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Seção de Atributos */}
                <View style={styles.attributesSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Atributos ({asset.attributes.length})</Text>
                        <TouchableOpacity style={styles.addButton} onPress={handleAddAttribute}>
                            <Feather name="plus" size={18} color="white" />
                            <Text style={styles.addButtonText}>Adicionar</Text>
                        </TouchableOpacity>
                    </View>

                    {asset.attributes.length > 0 ? (
                        asset.attributes.map((attribute) => (
                            <AttributeItem
                                key={attribute.id}
                                attribute={attribute}
                                onPress={handleAttributePress}
                                onDelete={handleDeleteAttribute}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyAttributes}>
                            <Feather name="settings" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>Nenhum atributo configurado</Text>
                            <TouchableOpacity style={styles.emptyAddButton} onPress={handleAddAttribute}>
                                <Feather name="plus" size={20} color="#F4A64E" />
                                <Text style={styles.emptyAddButtonText}>Adicionar primeiro atributo</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            <EditModal
                visible={editModalVisible}
                type={editType}
                data={editData}
                onSave={handleSave}
                onCancel={() => setEditModalVisible(false)}
            />
        </SafeAreaView>
    );
}


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
        gap: 10,
        margin: 12,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF0E0',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        gap: 15,
    },
    errorMessage: {
        color: '#C62828',
        fontSize: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#F4A64E',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    assetHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    assetTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    assetIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFF0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    assetTitleInfo: {
        flex: 1,
    },
    assetTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    assetSubtitle: {
        fontSize: 16,
        color: '#666',
        lineHeight: 22,
    },
    assetActions: {
        flexDirection: 'row',
        gap: 12,
    },
    editButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    deleteButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#C62828',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    infoSection: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    infoItem: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        minWidth: '47%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    infoLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    trashStatus: {
        color: '#C62828',
    },
    attributesSection: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4A64E',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    addButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    attributeCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    attributeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    attributeIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    attributeInfo: {
        flex: 1,
    },
    attributeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    attributeDescription: {
        fontSize: 14,
        color: '#666',
    },
    attributeActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        padding: 8,
    },
    attributeDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    attributeTag: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    requiredTag: {
        backgroundColor: '#ffebee',
    },
    attributeTagText: {
        fontSize: 12,
        color: '#666',
    },
    // ✅ Novos estilos para metadata
    attributeMetadata: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
        marginBottom: 12,
    },
    metadataRow: {
        marginBottom: 8,
    },
    metadataItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metadataLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    metadataValue: {
        fontSize: 12,
        color: '#333',
        fontWeight: '600',
    },
    // ✅ Novos estilos para footer
    attributeFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    footerText: {
        fontSize: 13,
        color: '#888',
        fontStyle: 'italic',
        flex: 1,
    },
    footerIcon: {
        marginLeft: 8,
    },
    emptyAttributes: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    emptyAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#F4A64E',
        borderStyle: 'dashed',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
        marginTop: 8,
    },
    emptyAddButtonText: {
        color: '#F4A64E',
        fontSize: 16,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    saveButton: {
        backgroundColor: '#F4A64E',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: 'white',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    checkboxChecked: {
        backgroundColor: '#F4A64E',
        borderColor: '#F4A64E',
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#333',
    },
    helpText: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        gap: 8,
        marginTop: 8,
    },
    helpTextContent: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
});