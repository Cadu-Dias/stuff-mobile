import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { organizationService } from '../services/organization.service';
import { RootStackNavigationProp } from '../models/stackType';

interface Organization {
  id: string; name: string; slug: string; description: string;
}

type OrgModal = {
    visible: boolean;
    onClose: () => void;
    onSubmit: (form: { name: string; description: string; slug: string }) => Promise<void>;
}

const CreateOrgModal = ({ visible, onClose, onSubmit } : OrgModal) => {
  const [form, setForm] = useState({ name: "", description: "", slug: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nova Organização</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={24} color="#333" /></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <TextInput style={styles.input} placeholder="Nome da Organização" onChangeText={text => setForm(f => ({ ...f, name: text }))} />
            <TextInput style={styles.input} placeholder="Slug (ex: nome-da-org)" onChangeText={text => setForm(f => ({ ...f, slug: text }))} />
            <TextInput style={[styles.input, { height: 80 }]} placeholder="Descrição" multiline onChangeText={text => setForm(f => ({ ...f, description: text }))} />
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Criar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};


// Tela Principal
export default function OrganizationsScreen() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigation = useNavigation<RootStackNavigationProp>();

  const fetchAllOrganizations = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const response = await organizationService.getAllOrganizations();
      setOrganizations(response.data || []);
    } catch (err) {
      setErrorMsg("Erro ao buscar organizações.");
    } finally {
      setLoading(false);
    }
  };

  // useFocusEffect é como useEffect, mas roda toda vez que a tela entra em foco
  useFocusEffect(
    useCallback(() => {
      fetchAllOrganizations();
    }, [])
  );

  const handleCreateOrg = async (form : {name: string; description: string; slug: string }) => {
    try {
      await organizationService.createOrganization(form);
      setSuccessMsg("Organização criada com sucesso!");
      setShowCreateModal(false);
      await fetchAllOrganizations(); // Re-busca a lista
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
        { text: "Deletar", style: "destructive", onPress: async () => {
            setLoading(true);
            await organizationService.deleteOrganization(org.id);
            setSuccessMsg(`"${org.name}" deletada com sucesso.`);
            await fetchAllOrganizations();
            setLoading(false);
        }},
      ]
    );
  };

  const renderItem = ({ item }: { item: Organization }) => (
    <TouchableOpacity 
      style={styles.listItem}
      onPress={() => navigation.navigate('OrganizationDetail', { organizationId: item.id })}
    >
      <View style={styles.listItemTextContainer}>
        <Text style={styles.listItemTitle}>{item.name}</Text>
        <Text style={styles.listItemDescription} numberOfLines={1}>{item.description}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteIcon}>
        <Feather name="trash-2" size={20} color="#C62828" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.main}>
        {/* Header da Tela */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Minhas Organizações</Text>
            <Text style={styles.subtitle}>Junte a galera e seus ativos!</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={fetchAllOrganizations}><Feather name="refresh-ccw" size={22} color="#333" /></TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCreateModal(true)}><Feather name="plus" size={26} color="#333" /></TouchableOpacity>
          </View>
        </View>

        {/* Mensagens de Feedback */}
        {successMsg && <Text style={styles.successMessage}>{successMsg}</Text>}
        {errorMsg && <Text style={styles.errorMessage}>{errorMsg}</Text>}

        {/* Lista */}
        {loading && !organizations.length ? (
          <ActivityIndicator size="large" color="#F4A64E" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={organizations}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>Nenhuma organização encontrada.</Text>}
          />
        )}
      </View>
      <CreateOrgModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} onSubmit={handleCreateOrg} />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4A64E' },
  main: { flex: 1, backgroundColor: '#FFF0E0', margin: 12, borderRadius: 8, padding: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#555' },
  headerActions: { flexDirection: 'row', gap: 20, paddingTop: 8 },
  listItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#F4A64E' },
  listItemTextContainer: { flex: 1 },
  listItemTitle: { fontSize: 18, fontWeight: '600' },
  listItemDescription: { fontSize: 14, color: '#666' },
  deleteIcon: { padding: 5 },
  errorMessage: { color: '#C62828', backgroundColor: '#ffebee', padding: 10, borderRadius: 4, marginVertical: 10, textAlign: 'center' },
  successMessage: { color: '#4CAF50', backgroundColor: '#e8f5e9', padding: 10, borderRadius: 4, marginVertical: 10, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#FFF0E0', borderRadius: 8, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#F4A64E' },
  modalBody: { marginBottom: 20 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  button: { backgroundColor: '#F89F3C', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  dangerButton: { backgroundColor: '#C62828' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

