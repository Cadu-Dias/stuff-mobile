import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, FlatList,
  ActivityIndicator
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { organizationService } from '../services/organization.service'; // Ajuste o caminho

interface Organization { id: string; name: string; slug: string; description: string; }
interface Member { id: string; email: string; role: string; }

export default function OrganizationDetailScreen() {
  const route = useRoute();
  const { organizationId } = route.params as { organizationId: string };

  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchOrganizationDetails = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const orgResponse = await organizationService.getOrganizationById(organizationId);
      if (orgResponse.data) {
        setOrg(orgResponse.data);
        const membersResponse = await organizationService.getMembers(organizationId);
        setMembers(membersResponse.data || []);
      } else {
        setErrorMsg("Organização não encontrada.");
      }
    } catch (err) {
      setErrorMsg("Erro ao buscar detalhes da organização.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchOrganizationDetails();
  }, [fetchOrganizationDetails]);


  const renderHeader = () => {
    if (!org) return null;
    return (
      <View>
        <Text style={styles.title}>{org.name}</Text>
        <Text style={styles.description}>{org.description}</Text>
        <Text style={styles.slug}>Slug: {org.slug}</Text>
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Membros</Text>
      </View>
    );
  };

  if (loading) {
    return <SafeAreaView style={styles.safeArea}><ActivityIndicator size="large" color="#F4A64E" /></SafeAreaView>;
  }

  if (errorMsg) {
    return <SafeAreaView style={styles.safeArea}><Text style={styles.errorMessage}>{errorMsg}</Text></SafeAreaView>;
  }

  const renderMemberItem = ({ item }: { item: Member }) => (
    <View style={styles.memberListItem}>
      <Text style={styles.memberEmail}>{item.email}</Text>
      <View style={styles.memberRoleBadge}>
        <Text style={styles.memberRoleText}>{item.role}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={members}
        renderItem={renderMemberItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        style={styles.main}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum membro nesta organização.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4A64E' },
  main: { flex: 1, backgroundColor: '#FFF0E0', margin: 12, borderRadius: 8, padding: 15 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  errorMessage: { color: '#C62828', backgroundColor: '#ffebee', padding: 10, borderRadius: 4, marginVertical: 10, textAlign: 'center' },
  description: { fontSize: 16, color: '#555', marginTop: 4 },
  slug: { fontSize: 14, color: '#888', fontStyle: 'italic', marginTop: 8 },
  divider: { height: 1, backgroundColor: '#ddd', marginVertical: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  memberListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  memberEmail: { fontSize: 16 },
  memberRoleBadge: { backgroundColor: '#F4A64E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  memberRoleText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  }
});
