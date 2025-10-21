import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, FlatList,
  ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { OrganizationService } from '../../services/organization.service';
import { AssetService } from '../../services/asset.service';
import { Asset } from '../../models/asset.model';
import { Organization } from '../../models/organization.model';
import { UserInfo } from '../../models/user.model';
import { RootStackNavigationProp } from '../../models/stackType';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TabType = 'members' | 'assets' | 'reports';

const CreateAssetModal = ({ 
  visible, 
  onClose, 
  onSave, 
  organizationId 
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (asset: Asset) => void;
  organizationId: string;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'unique' as 'unique' | 'replicable',
    description: '',
    quantity: '1'
  });
  const [loading, setLoading] = useState(false);

  const assetService = new AssetService();

  const handleSave = async () => {
    if (!formData.name || !formData.description) {
      Alert.alert("Erro", "Nome e descrição são obrigatórios!");
      return;
    }

    if (parseInt(formData.quantity) <= 0) {
      Alert.alert("Erro", "Quantidade deve ser maior que zero!");
      return;
    }

    setLoading(true);
    try {
      const newAsset = await assetService.createAsset({
        name: formData.name,
        type: formData.type,
        description: formData.description,
        quantity: parseInt(formData.quantity),
        organizationId: organizationId
      });

      onSave(newAsset);
      setFormData({ name: '', type: 'unique', description: '', quantity: '1' });
      onClose();
      Alert.alert("Sucesso", "Ativo criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar ativo:", error);
      Alert.alert("Erro", "Falha ao criar ativo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', type: 'unique', description: '', quantity: '1' });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleClose} disabled={loading}>
            <Feather name="x" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Criar Novo Ativo</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Criar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Informações Básicas</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Feather name="tag" size={14} color="#F4A64E" /> Nome *
              </Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Nome do ativo"
                placeholderTextColor="#999"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Feather name="file-text" size={14} color="#F4A64E" /> Descrição *
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Descrição do ativo"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Configurações</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Feather name="list" size={14} color="#F4A64E" /> Tipo *
              </Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    formData.type === 'unique' && styles.typeOptionSelected
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'unique' })}
                  disabled={loading}
                >
                  <Text style={[
                    styles.typeOptionText,
                    formData.type === 'unique' && styles.typeOptionTextSelected
                  ]}>
                    Único
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    formData.type === 'replicable' && styles.typeOptionSelected
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'replicable' })}
                  disabled={loading}
                >
                  <Text style={[
                    styles.typeOptionText,
                    formData.type === 'replicable' && styles.typeOptionTextSelected
                  ]}>
                    Replicável
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Feather name="hash" size={14} color="#F4A64E" /> Quantidade *
              </Text>
              <TextInput
                style={styles.input}
                value={formData.quantity}
                onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                placeholder="Quantidade"
                placeholderTextColor="#999"
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.helpText}>
            <Feather name="info" size={16} color="#2196F3" />
            <Text style={styles.helpTextContent}>
              Após criar o ativo, você poderá adicionar atributos e configurações adicionais.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const TabSelector = ({ 
  activeTab, 
  onTabChange, 
  membersCount, 
  assetsCount
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  membersCount: number;
  assetsCount: number;
}) => {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'members' && styles.activeTab]}
        onPress={() => onTabChange('members')}
      >
        <Feather 
          name="users" 
          size={18} 
          color={activeTab === 'members' ? '#fff' : '#F4A64E'} 
        />
        <Text style={[
          styles.tabText, 
          activeTab === 'members' && styles.activeTabText
        ]}>
          Membros
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'assets' && styles.activeTab]}
        onPress={() => onTabChange('assets')}
      >
        <Feather 
          name="package" 
          size={18} 
          color={activeTab === 'assets' ? '#fff' : '#F4A64E'} 
        />
        <Text style={[
          styles.tabText, 
          activeTab === 'assets' && styles.activeTabText
        ]}>
          Ativos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
        onPress={() => onTabChange('reports')}
      >
        <Feather 
          name="bar-chart-2" 
          size={18} 
          color={activeTab === 'reports' ? '#fff' : '#F4A64E'} 
        />
        <Text style={[
          styles.tabText, 
          activeTab === 'reports' && styles.activeTabText
        ]}>
          Relatórios
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const MemberItem = ({ member }: { member: UserInfo }) => (
  <View style={styles.listItem}>
    <View style={styles.itemContent}>
      <View style={styles.itemIcon}>
        <Feather name="user" size={20} color="#F4A64E" />
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle}>{`${member.firstName} ${member.lastName}`}</Text>
        <Text style={styles.itemSubtitle}>E-mail: {member.email}</Text>
      </View>
    </View>
    <View style={styles.memberRoleBadge}>
      <Text style={styles.memberRoleText}>{member.role === "user" ? "User" : "Admin"}</Text>
    </View>
  </View>
);

const AssetItem = ({ item, onPress }: { item: Asset; onPress: (organizationId: string, assetId: string) => void }) => (
  <TouchableOpacity style={styles.listItem} onPress={() => onPress(item.organizationId, item.id)}>
    <View style={styles.itemContent}>
      <View style={styles.itemIcon}>
        <Feather name="package" size={20} color="#F4A64E" />
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemSubtitle}>{item.description}</Text>
        <View style={styles.assetMetadata}>
          <Text style={styles.assetType}>Tipo: {item.type}</Text>
          <Text style={styles.assetQuantity}>Qtd: {item.quantity}</Text>
        </View>
      </View>
    </View>
    <View style={[
      styles.assetStatusBadge,
      { backgroundColor: item.trashBin ? '#C62828' : '#5ECC63' }
    ]}>
      <Text style={styles.assetStatusText}>
        {item.trashBin ? 'Lixeira' : 'Ativo'}
      </Text>
    </View>
    <Feather name="chevron-right" size={20} color="#ccc" style={{ marginLeft: 8 }} />
  </TouchableOpacity>
);

export default function OrganizationDetailScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();

  const [organizationId, setOrganizationId] = useState<string>("");
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<UserInfo[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [createAssetModalVisible, setCreateAssetModalVisible] = useState(false);
  
  const organizationService = new OrganizationService();
  const assetsService = new AssetService();

  useEffect(() => {
    const loadOrganizationId = async () => {
      try {
        const storedOrgId = await AsyncStorage.getItem("organizationId");
        console.log("OrganizationId carregado do AsyncStorage:", storedOrgId);
        
        if (storedOrgId) {
          setOrganizationId(storedOrgId);
        } else {
          setErrorMsg("ID da organização não encontrado.");
          setLoading(false);
        }
      } catch (error) {
        console.error("Erro ao carregar organizationId:", error);
        setErrorMsg("Erro ao carregar ID da organização.");
        setLoading(false);
      }
    };

    loadOrganizationId();
  }, []);

  const fetchOrganizationDetails = useCallback(async () => {
    if (!organizationId) {
      console.log("organizationId ainda não está disponível");
      return;
    }

    console.log("Buscando detalhes para organizationId:", organizationId);
    setLoading(true);
    setErrorMsg("");
    
    try {
      const orgResponse = await organizationService.getOrganizationById(organizationId);
      
      if (orgResponse) {
        console.log("Organização carregada:", orgResponse);
        setOrg(orgResponse);

        const [membersResponse, assetsResponse] = await Promise.all([
          organizationService.getMembers(organizationId),
          assetsService.getOrganizationAssets(organizationId)
        ]);

        console.log("Membros carregados:", membersResponse?.length || 0);
        console.log("Ativos carregados:", assetsResponse?.length || 0);

        setMembers(membersResponse || []);
        setAssets(assetsResponse || []);
      } else {
        setErrorMsg("Organização não encontrada.");
      }
    } catch (err) {
      setErrorMsg("Erro ao buscar detalhes da organização.");
      console.error("Error fetching organization details:", err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // ✅ Executa fetch quando organizationId mudar
  useEffect(() => {
    if (organizationId) {
      fetchOrganizationDetails();
    }
  }, [organizationId, fetchOrganizationDetails]);

  // ✅ Recarrega ao focar na tela
  useFocusEffect(
    useCallback(() => {
      if (organizationId) {
        console.log("Tela focada, recarregando dados...");
        fetchOrganizationDetails();
      }
    }, [organizationId, fetchOrganizationDetails])
  );

  const handleAssetCreated = (newAsset: Asset) => {
    setAssets(prevAssets => [newAsset, ...prevAssets]);
  };

  const renderHeader = () => {
    if (!org) {
      console.log("renderHeader: org é null");
      return null;
    }
    
    console.log("renderHeader: Renderizando com org:", org.name);
    
    return (
      <View style={styles.header}>
        <Text style={styles.title}>{org.name || 'Nome não disponível'}</Text>
        <Text style={styles.description}>{org.description || 'Sem descrição'}</Text>
        <Text style={styles.slug}>Slug: {org.slug || 'N/A'}</Text>
      </View>
    );
  };

  const renderTabContent = () => {
    if (activeTab === 'members') {
      return (
        <FlatList
          data={members}
          renderItem={({ item }) => <MemberItem member={item} />}
          keyExtractor={item => item.id}
          style={styles.tabContent}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="users" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum membro nesta organização</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (activeTab === 'reports') {
      return (
        <View style={styles.constructionContainer}>
          <Feather name="tool" size={64} color="#F4A64E" />
          <Text style={styles.constructionTitle}>Em Construção</Text>
          <Text style={styles.constructionText}>
            A funcionalidade de relatórios está sendo desenvolvida e estará disponível em breve.
          </Text>
          <View style={styles.constructionBadge}>
            <Feather name="clock" size={16} color="#F4A64E" />
            <Text style={styles.constructionBadgeText}>Em desenvolvimento</Text>
          </View>
        </View>
      );
    }

    const handleAssetPress = (organizationId: string, assetId: string) => {
      navigation.navigate('AssetDetails', { organizationId, assetId });
    };

    return (
      <View style={styles.assetsTabContainer}>
        <FlatList
          data={assets.filter((assets) => !assets.trashBin)}
          renderItem={({ item }) => <AssetItem item={item} onPress={handleAssetPress} />}
          keyExtractor={item => item.id}
          style={styles.tabContent}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="package" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum ativo nesta organização</Text>
              <TouchableOpacity 
                style={styles.emptyCreateButton} 
                onPress={() => setCreateAssetModalVisible(true)}
              >
                <Feather name="plus" size={20} color="#F4A64E" />
                <Text style={styles.emptyCreateButtonText}>Criar primeiro ativo</Text>
              </TouchableOpacity>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
        
        <TouchableOpacity
          style={styles.floatingAddButton}
          onPress={() => setCreateAssetModalVisible(true)}
        >
          <Feather name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F4A64E" />
          <Text style={styles.loadingText}>Carregando organização...</Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrganizationDetails}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.main}>
        {renderHeader()}
        
        <TabSelector
          activeTab={activeTab}
          onTabChange={setActiveTab}
          membersCount={members.length}
          assetsCount={assets.length}
        />
        
        {renderTabContent()}

        <CreateAssetModal
          visible={createAssetModalVisible}
          onClose={() => setCreateAssetModalVisible(false)}
          onSave={handleAssetCreated}
          organizationId={organizationId}
        />
      </View>
    </SafeAreaView>
  );
}

// ... (styles permanecem iguais)
const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F4A64E' 
  },
  main: { 
    flex: 1, 
    backgroundColor: '#FFF0E0', 
    margin: 12, 
    borderRadius: 8, 
    padding: 15  
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
    marginVertical: 10,
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
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#333',
    marginBottom: 8,
  },
  description: { 
    fontSize: 16, 
    color: '#555', 
    lineHeight: 24,
    marginBottom: 6,
  },
  slug: { 
    fontSize: 14, 
    color: '#888', 
    fontStyle: 'italic',
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#F4A64E',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F4A64E',
  },
  activeTabText: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  memberRoleBadge: {
    backgroundColor: '#F4A64E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  memberRoleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  assetMetadata: {
    flexDirection: 'row',
    gap: 12,
  },
  assetType: {
    fontSize: 12,
    color: '#888',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  assetQuantity: {
    fontSize: 12,
    color: '#888',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  assetStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  assetStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  emptyCreateButton: {
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
  emptyCreateButtonText: {
    color: '#F4A64E',
    fontSize: 16,
    fontWeight: '600',
  },
  assetsTabContainer: {
    flex: 1,
    position: 'relative',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F4A64E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  constructionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 20,
  },
  constructionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  constructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  constructionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginTop: 8,
  },
  constructionBadgeText: {
    color: '#F4A64E',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
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
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#F4A64E',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  typeOptionSelected: {
    backgroundColor: '#F4A64E',
    borderColor: '#F4A64E',
  },
  typeOptionText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  typeOptionTextSelected: {
    color: 'white',
  },
  helpText: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
    marginBottom: 25,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  helpTextContent: {
    fontSize: 14,
    color: '#1565C0',
    flex: 1,
  },
});
