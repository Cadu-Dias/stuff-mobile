import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, SafeAreaView, ScrollView,
    ActivityIndicator, TouchableOpacity, TextInput,
    Alert, Modal
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { AttributeService } from '../../services/attribute.service';
import { AttributeDetail, AttributeValue } from '../../models/asset.model';


interface EditModalProps {
    visible: boolean;
    type: 'attribute' | 'value' | 'new-value';
    data: any;
    onSave: (data: any) => void;
    onCancel: () => void;
}

// ✅ Modal para editar atributo e valores
const EditModal = ({ visible, type, data, onSave, onCancel }: EditModalProps) => {
    const [formData, setFormData] = useState(data || {});

    useEffect(() => {
        setFormData(data || {});
    }, [data]);

    const handleSave = () => {
        if (type === 'attribute') {
            if (!formData.name || !formData.description || !formData.type) {
                Alert.alert("Erro", "Nome, descrição e tipo são obrigatórios!");
                return;
            }
        }
        if (type === 'value' || type === 'new-value') {
            if (!formData.value?.trim()) {
                Alert.alert("Erro", "Valor é obrigatório!");
                return;
            }
        }
        onSave(formData);
    };

    const getModalTitle = () => {
        switch (type) {
            case 'attribute':
                return 'Editar Atributo';
            case 'value':
                return 'Editar Valor';
            case 'new-value':
                return 'Novo Valor';
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
                            {type === 'new-value' ? 'Criar' : 'Salvar'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                    {type === 'attribute' ? (
                        <>
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
                        </>
                    ) : (
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Valor *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.value || ''}
                                onChangeText={(text) => setFormData({ ...formData, value: text })}
                                placeholder="Digite o valor do atributo"
                            />
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

// ✅ Componente para mostrar um valor
const ValueItem = ({ 
    valueObj, 
    onEdit, 
    onDelete 
}: { 
    valueObj: AttributeValue; 
    onEdit: (value: AttributeValue) => void;
    onDelete: (valueId: string) => void;
}) => (
    <View style={styles.valueCard}>
        <View style={styles.valueHeader}>
            <View style={styles.valueIcon}>
                <Feather name="tag" size={16} color="#F4A64E" />
            </View>
            <View style={styles.valueContent}>
                <Text style={styles.valueText}>{valueObj.value}</Text>
                <Text style={styles.valueDate}>
                    Criado em: {new Date(valueObj.createdAt).toLocaleDateString('pt-BR')}
                </Text>
                {valueObj.updatedAt !== valueObj.createdAt && (
                    <Text style={styles.valueDate}>
                        Atualizado em: {new Date(valueObj.updatedAt).toLocaleDateString('pt-BR')}
                    </Text>
                )}
            </View>
            <View style={styles.valueActions}>
                <TouchableOpacity onPress={() => onEdit(valueObj)} style={styles.actionButton}>
                    <Feather name="edit-2" size={16} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(valueObj.id)} style={styles.actionButton}>
                    <Feather name="trash-2" size={16} color="#C62828" />
                </TouchableOpacity>
            </View>
        </View>
    </View>
);

export default function AttributeDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { attributeId, assetId } = route.params as { 
        attributeId: string; 
        assetId: string; 
    };

    const [attribute, setAttribute] = useState<AttributeDetail | null>(null);
    const [filteredValues, setFilteredValues] = useState<AttributeValue[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editType, setEditType] = useState<'attribute' | 'value' | 'new-value'>('attribute');
    const [editData, setEditData] = useState<any>(null);

    const attributeService = new AttributeService();

    const fetchAttributeDetails = useCallback(async () => {
        if (!attributeId) return;
        setLoading(true);
        setErrorMsg("");

        try {
            const attributeResponse = await attributeService.getAttribute(attributeId);
            if(!attributeResponse) throw new Error("Não foi possivel pegar os dados do atributo")

            setAttribute(attributeResponse);
            const valuesForThisAsset = attributeResponse.values.filter(
                (value: AttributeValue) => value.assetInstanceId === assetId
            );
            setFilteredValues(valuesForThisAsset);
            
        } catch (err) {
            setErrorMsg("Erro ao buscar detalhes do atributo.");
            console.error("Error fetching attribute details:", err);
        } finally {
            setLoading(false);
        }
    }, [attributeId, assetId]);

    useEffect(() => {
        fetchAttributeDetails();
    }, [fetchAttributeDetails]);

    const handleEditAttribute = () => {
        if (!attribute) return;
        setEditType('attribute');
        setEditData({
            name: attribute.name,
            description: attribute.description,
            type: attribute.type,
            unit: attribute.unit,
            timeUnit: attribute.timeUnit,
            required: attribute.required,
        });
        setEditModalVisible(true);
    };

    const handleSaveAttribute = async (updatedData: any) => {
        try {
            console.log('Salvando atributo:', updatedData);
            await attributeService.updateAttributeBasic(attributeId, updatedData);

            const updatedAttribute = {
                ...attribute,
                ...updatedData,
                updatedAt: new Date().toISOString()
            };
            setAttribute(updatedAttribute);
            setEditModalVisible(false);
            Alert.alert("Sucesso", "Atributo atualizado com sucesso!");
        } catch (error) {
            Alert.alert("Erro", "Falha ao salvar atributo.");
        }
    };

    const handleAddValue = () => {
        setEditType('new-value');
        setEditData({ value: '' });
        setEditModalVisible(true);
    };

    const handleEditValue = (valueObj: AttributeValue) => {
        setEditType('value');
        setEditData(valueObj);
        setEditModalVisible(true);
    };

    const handleSaveValue = async (valueData: any) => {
        try {
            console.log('Salvando valor:', valueData);
            
            if (!attribute) return;

            if (editType === 'new-value') {
                await attributeService.createAttributeValue(attribute.id, assetId, valueData.value)
                
                const fetchAllValues = await attributeService.getAttribute(attribute.id)
                const valuesForThisAsset = fetchAllValues.values.filter(
                    (value: AttributeValue) => value.assetInstanceId === assetId
                );

                setFilteredValues([...valuesForThisAsset]);
                Alert.alert("Sucesso", "Valor adicionado com sucesso!");
            } else {

                await attributeService.updateAttributeValues(valueData.id, { value: valueData.value })
                const updatedFilteredValues = filteredValues.map(val =>
                    val.id === valueData.id 
                        ? { ...val, value: valueData.value, updatedAt: new Date().toISOString() }
                        : val
                );
                setFilteredValues(updatedFilteredValues);
                
                Alert.alert("Sucesso", "Valor atualizado com sucesso!");
            }
            
            setEditModalVisible(false);
        } catch (error) {
            Alert.alert("Erro", "Falha ao salvar valor.");
        }
    };

    const handleDeleteValue = (valueId: string) => {
        Alert.alert(
            "Confirmar Exclusão",
            "Tem certeza que deseja excluir este valor?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            console.log(`Deletando valor: ${valueId}`);
                            await attributeService.deleteAttributeValues(valueId);

                            const updatedFilteredValues = filteredValues.filter(val => val.id !== valueId);
                            setFilteredValues(updatedFilteredValues);
                            
                            Alert.alert("Sucesso", "Valor excluído com sucesso!");
                        } catch (error) {
                            Alert.alert("Erro", "Falha ao excluir valor.");
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAttribute = () => {
        Alert.alert(
            "Confirmar Exclusão",
            "Tem certeza que deseja excluir este atributo? Todos os valores serão perdidos.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await attributeService.deleteAttribute(attributeId);

                            console.log(`Deletando atributo: ${attributeId}`);
                            Alert.alert("Sucesso", "Atributo excluído com sucesso!");
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert("Erro", "Não foi possível deletar o Atributo");
                        }
                    }
                }
            ]
        );
    };

    const handleSave = (data: any) => {
        if (editType === 'attribute') {
            handleSaveAttribute(data);
        } else {
            handleSaveValue(data);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#F4A64E" />
                    <Text style={styles.loadingText}>Carregando atributo...</Text>
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
                    <TouchableOpacity style={styles.retryButton} onPress={fetchAttributeDetails}>
                        <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!attribute) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.errorContainer}>
                    <Feather name="settings" size={48} color="#ccc" />
                    <Text style={styles.errorMessage}>Atributo não encontrado</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
                {/* Header do Atributo */}
                <View style={styles.attributeHeader}>
                    <View style={styles.attributeTitleRow}>
                        <View style={styles.attributeIcon}>
                            <Feather name="settings" size={32} color="#F4A64E" />
                        </View>
                        <View style={styles.attributeTitleInfo}>
                            <Text style={styles.attributeTitle}>{attribute.name}</Text>
                            <Text style={styles.attributeSubtitle}>{attribute.description}</Text>
                        </View>
                    </View>

                    <View style={styles.attributeActions}>
                        <TouchableOpacity style={styles.editButton} onPress={handleEditAttribute}>
                            <Feather name="edit-2" size={18} color="white" />
                            <Text style={styles.actionButtonText}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAttribute}>
                            <Feather name="trash-2" size={18} color="white" />
                            <Text style={styles.actionButtonText}>Excluir</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Informações do Atributo */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Informações</Text>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Tipo</Text>
                            <Text style={styles.infoValue}>{attribute.type}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Unidade</Text>
                            <Text style={styles.infoValue}>{attribute.unit || 'Não definido'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Unidade de Tempo</Text>
                            <Text style={styles.infoValue}>{attribute.timeUnit || 'Não definido'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Obrigatório</Text>
                            <Text style={[styles.infoValue, attribute.required ? styles.requiredText : styles.optionalText]}>
                                {attribute.required ? 'Sim' : 'Não'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Seção de Valores filtrados por assetId */}
                <View style={styles.valuesSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            Valores para este Ativo ({filteredValues.length})
                        </Text>
                        <TouchableOpacity style={styles.addButton} onPress={handleAddValue}>
                            <Feather name="plus" size={18} color="white" />
                            <Text style={styles.addButtonText}>Adicionar</Text>
                        </TouchableOpacity>
                    </View>

                    {filteredValues.length > 0 ? (
                        filteredValues.map((valueObj) => (
                            <ValueItem
                                key={valueObj.id}
                                valueObj={valueObj}
                                onEdit={handleEditValue}
                                onDelete={handleDeleteValue}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyValues}>
                            <Feather name="tag" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>Nenhum valor configurado para este ativo</Text>
                            <TouchableOpacity style={styles.emptyAddButton} onPress={handleAddValue}>
                                <Feather name="plus" size={20} color="#F4A64E" />
                                <Text style={styles.emptyAddButtonText}>Adicionar primeiro valor</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Informação sobre valores totais */}
                {attribute.values.length > filteredValues.length && (
                    <View style={styles.totalValuesInfo}>
                        <Feather name="info" size={16} color="#666" />
                        <Text style={styles.totalValuesText}>
                            Total de valores em outros ativos: {attribute.values.length - filteredValues.length}
                        </Text>
                    </View>
                )}
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
    // Attribute Header Styles
    attributeHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    attributeTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    attributeIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFF0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    attributeTitleInfo: {
        flex: 1,
    },
    attributeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    attributeSubtitle: {
        fontSize: 16,
        color: '#666',
        lineHeight: 22,
    },
    attributeActions: {
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
    // Info Section Styles
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
    requiredText: {
        color: '#C62828',
    },
    optionalText: {
        color: '#5ECC63',
    },
    valuesSection: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        flexWrap: "wrap",
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
    valueCard: {
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
    valueHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    valueIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFF0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    valueContent: {
        flex: 1,
    },
    valueText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    valueDate: {
        fontSize: 12,
        color: '#888',
        marginBottom: 2,
    },
    valueActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
    },
    emptyValues: {
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
    totalValuesInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        margin: 20,
        marginTop: 0,
        borderRadius: 8,
        gap: 8,
    },
    totalValuesText: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    // Modal Styles
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
});
