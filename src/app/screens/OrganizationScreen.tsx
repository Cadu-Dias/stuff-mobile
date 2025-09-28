import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { OrganizationService } from '../services/organization.service';
import { RootStackNavigationProp } from '../models/stackType';
import { Organization } from '../models/organization.model';

type OrgModal = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: { name: string; description: string; slug: string, password: string }) => Promise<void>;
}

const CreateOrgModal = ({ visible, onClose, onSubmit }: OrgModal) => {
  const [form, setForm] = useState({ name: "", description: "", slug: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.slug || !form.description) {
      Alert.alert("Erro", "Todos os campos são obrigatórios!");
      return;
    }
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  };

  const handleClose = () => {
    setForm({ name: "", description: "", slug: "", password: "" });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleClose} disabled={loading}>
            <Feather name="x" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Nova Organização</Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[styles.modalSaveButton, loading && styles.modalSaveButtonDisabled]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.modalSaveButtonText}>Criar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.modalSection}>
            <View style={styles.modalIcon}>
              <MaterialCommunityIcons name="office-building" size={32} color="#F4A64E" />
            </View>
            <Text style={styles.modalDescription}>
              Crie uma nova organização para gerenciar seus ativos em grupo
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nome da Organização *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Minha Empresa" 
              value={form.name}
              onChangeText={text => setForm(f => ({ ...f, name: text }))}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Slug (Identificador único) *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: minha-empresa" 
              value={form.slug}
              onChangeText={text => setForm(f => ({ ...f, slug: text.toLowerCase().replace(/\s+/g, '-') }))}
              editable={!loading}
            />
            <Text style={styles.inputHint}>
              Será usado como identificador único. Use apenas letras minúsculas, números e hífens.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descrição *</Text>
            <TextInput 
              style={[styles.input, styles.textArea]}
              placeholder="Descreva o propósito da organização..." 
              value={form.description}
              onChangeText={text => setForm(f => ({ ...f, description: text }))}
              multiline
              numberOfLines={4}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Senha (Opcional)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Deixe em branco para organização pública" 
              value={form.password}
              onChangeText={text => setForm(f => ({ ...f, password: text }))}
              secureTextEntry
              editable={!loading}
            />
            <Text style={styles.inputHint}>
              Se definida, outros usuários precisarão da senha para entrar na organização.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const OrganizationCard = ({ 
  organization, 
  onPress, 
  onDelete 
}: { 
  organization: Organization; 
  onPress: () => void;
  onDelete: () => void;
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <TouchableOpacity style={styles.orgCard} onPress={onPress}>
      <View style={styles.orgHeader}>
        <View style={styles.orgIcon}>
          <MaterialCommunityIcons name="office-building" size={24} color="#F4A64E" />
        </View>
        <View style={styles.orgInfo}>
          <Text style={styles.orgName}>{organization.name}</Text>
          <Text style={styles.orgSlug}>@{organization.slug}</Text>
        </View>
        <View style={styles.orgActions}>
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={styles.deleteButton}
          >
            <Feather name="trash-2" size={18} color="#C62828" />
          </TouchableOpacity>
          <Feather name="chevron-right" size={20} color="#ccc" style={{ marginLeft: 8 }} />
        </View>
      </View>

      <Text style={styles.orgDescription} numberOfLines={2}>
        {organization.description}
      </Text>

      <View style={styles.orgFooter}>
        <View style={styles.orgMetadata}>
          <View style={styles.metadataItem}>
            <Feather name="calendar" size={14} color="#666" />
            <Text style={styles.metadataText}>
              Criada em {formatDate(organization.createdAt)}
            </Text>
          </View>
          <View style={styles.orgStatus}>
            <View style={[
              styles.statusIndicator, 
              { backgroundColor: organization.active ? '#5ECC63' : '#FF6B6B' }
            ]} />
            <Text style={styles.statusText}>
              {organization.active ? 'Ativa' : 'Inativa'}
            </Text>
          </View>
        </View>
        
        <View style={styles.orgTags}>
          {organization.password && (
            <View style={styles.privateTag}>
              <Feather name="lock" size={12} color="#FF9800" />
              <Text style={styles.privateTagText}>Privada</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function OrganizationsScreen() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigation = useNavigation<RootStackNavigationProp>();

  const organizationService = new OrganizationService();

  const fetchAllOrganizations = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const response = await organizationService.getAllOrganizations();
      setOrganizations(response || []);
    } catch (err) {
      setErrorMsg("Erro ao buscar organizações.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllOrganizations();
    }, [])
  );

  const handleCreateOrg = async (form: { name: string; description: string; slug: string, password: string }) => {
    try {
      await organizationService.createOrganization(form);
      setSuccessMsg("Organização criada com sucesso!");
      setShowCreateModal(false);
      await fetchAllOrganizations();
    } catch (err) {
      setErrorMsg("Erro ao criar organização.");
    }
  };

  const handleDelete = (org: Organization) => {
    Alert.alert(
      "Deletar Organização",
      `Você tem certeza que quer deletar "${org.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar", style: "destructive", onPress: async () => {
            setLoading(true);
            await organizationService.deleteOrganization(org.id);
            setSuccessMsg(`"${org.name}" deletada com sucesso.`);
            await fetchAllOrganizations();
            setLoading(false);
          }
        },
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="office-building-outline" size={64} color="#ccc" />
      </View>
      <Text style={styles.emptyTitle}>Nenhuma organização encontrada</Text>
      <Text style={styles.emptySubtitle}>
        Crie sua primeira organização para começar a gerenciar ativos em equipe
      </Text>
      <TouchableOpacity 
        style={styles.emptyCreateButton} 
        onPress={() => setShowCreateModal(true)}
      >
        <Feather name="plus" size={20} color="#F4A64E" />
        <Text style={styles.emptyCreateButtonText}>Criar primeira organização</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.headerIcon}>
        <MaterialCommunityIcons name="office-building" size={32} color="#F4A64E" />
      </View>
      <Text style={styles.title}>Organizações</Text>
      <Text style={styles.subtitle}>
        Gerencie suas organizações e trabalhe em equipe
      </Text>
    </View>
  );

  const renderControls = () => (
    <View style={styles.controlsSection}>
      <View style={styles.controlsHeader}>
        <Text style={styles.sectionTitle}>
          Minhas Organizações ({organizations.length})
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={fetchAllOrganizations}
            disabled={loading}
          >
            <Feather name="refresh-ccw" size={18} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.createButton} 
            onPress={() => setShowCreateModal(true)}
          >
            <Feather name="plus" size={18} color="white" />
            <Text style={styles.createButtonText}>Nova</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      {successMsg ? (
        <View style={styles.successMessage}>
          <Feather name="check-circle" size={16} color="#5ECC63" />
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      ) : null}

      {errorMsg ? (
        <View style={styles.errorMessage}>
          <Feather name="alert-circle" size={16} color="#C62828" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderControls()}

        {loading && !organizations.length ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F4A64E" />
            <Text style={styles.loadingText}>Carregando organizações...</Text>
          </View>
        ) : (
          <View style={styles.organizationsList}>
            <FlatList
              data={organizations}
              renderItem={({ item }) => (
                <OrganizationCard
                  organization={item}
                  onPress={() => navigation.navigate('OrganizationDetail', { organizationId: item.id })}
                  onDelete={() => handleDelete(item)}
                />
              )}
              keyExtractor={item => item.id}
              ListEmptyComponent={renderEmptyState}
              scrollEnabled={false}
              contentContainerStyle={{ flexGrow: 1 }}
            />
          </View>
        )}
      </ScrollView>

      <CreateOrgModal 
        visible={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onSubmit={handleCreateOrg} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F4A64E' 
  },
  main: { 
    flex: 1, 
    backgroundColor: '#FFF0E0', 
    margin: 12, 
    borderRadius: 8 
  },

  // Header Section
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
    fontSize: 28, 
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

  // Controls Section
  controlsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  controlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    rowGap: 20,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: { 
    flexDirection: 'row', 
    gap: 12,
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4A64E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  createButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Messages
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  successText: {
    color: '#5ECC63',
    fontSize: 14,
    flex: 1,
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    flex: 1,
  },

  // Organizations List
  organizationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Organization Cards
  orgCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orgIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orgSlug: {
    fontSize: 14,
    color: '#888',
  },
  orgActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  orgDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  orgFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  orgMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 12,
    color: '#666',
  },
  orgStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  orgTags: {
    flexDirection: 'row',
    gap: 8,
  },
  privateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  privateTagText: {
    fontSize: 10,
    color: '#FF9800',
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#F4A64E',
    borderStyle: 'dashed',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyCreateButtonText: {
    color: '#F4A64E',
    fontSize: 16,
    fontWeight: '600',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },

  // Modal
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
  modalSaveButton: {
    backgroundColor: '#F4A64E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalSaveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
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
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    lineHeight: 16,
  },
});