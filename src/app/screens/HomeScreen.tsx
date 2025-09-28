import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { OrganizationService } from '../services/organization.service';
import { AssetService } from '../services/asset.service';
import { RootStackNavigationProp } from '../models/stackType';

const themeColors = {
  background: '#F4A64E',
  mainBackground: '#FFF0E0',
  text: '#333333',
  primary: '#F4A64E',
  secondary: '#2196F3',
  success: '#5ECC63',
  warning: '#FF9800',
  dark: '#333333',
  mid: '#555555',
  light: '#666666',
  cardBackground: 'white',
  gradientStart: '#F4A64E',
  gradientEnd: '#FF8A50',
};

const HomeScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const organizationService = new OrganizationService();
  const assetService = new AssetService();

  const [userData, setUserData] = useState<{ firstName: string; lastName: string; username: string } | null>(null);
  const [organizationsNum, setOrganizationNum] = useState<number>(0);
  const [assetsNum, setAssetsNum] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadAsynContent = async () => {
    try {
      const [storedData, organizationNumber, assetsNumber] = await Promise.all([
        AsyncStorage.getItem('userData'),
        AsyncStorage.getItem("organizationNumber"),
        AsyncStorage.getItem("assetsNumber")
      ]);
      
      if (storedData) {
        setUserData(JSON.parse(storedData));
      }
      
      if(organizationNumber !== null && organizationNumber !== undefined) {
        setOrganizationNum(Number(organizationNumber))
      } else {
        const organizations = await organizationService.getAllOrganizations();
        setOrganizationNum(organizations.length);
        await AsyncStorage.setItem("organizationNumber", String(organizations.length))
      }

      if(assetsNumber !== null) {
        setAssetsNum(Number(assetsNumber));
      } else {
        const assets = (await assetService.getAssets()).assets;
        const assetsQuantityArray = assets.map((value) => value.quantity || 0)
        const assetsNumber = assetsQuantityArray.reduce((prev, cur) => prev + cur, 0);

        setAssetsNum(assetsNumber)
        await AsyncStorage.setItem("assetsNumber", String(assetsNumber))
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAsynContent();
  }, [])

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    onPress 
  }: { 
    title: string; 
    value: string | number; 
    icon: string; 
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        </View>
        {onPress && (
          <Feather name="external-link" size={16} color="#ccc" />
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const QuickActionCard = ({
    title,
    description,
    icon,
    color,
    onPress
  }: {
    title: string;
    description: string;
    icon: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Feather name={icon as any} size={20} color="white" />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="loading" size={48} color="#F4A64E" />
          <Text style={styles.loadingText}>Carregando dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Feather name="user" size={24} color="white" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>
                {getGreeting()}{userData?.firstName ? `, ${userData.firstName}!` : '!'}
              </Text>
              <Text style={styles.date}>{getCurrentDate()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.main}>
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>Painel de Controle</Text>
              <Text style={styles.welcomeSubtitle}>
                Acompanhe todos os seus ativos e organizações em um só lugar
              </Text>
            </View>
            <View style={styles.welcomeIcon}>
              <MaterialCommunityIcons name="view-dashboard" size={32} color="#F4A64E" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estatísticas</Text>
            <View style={styles.statsGrid}>
              <StatCard
                title="Ativos Totais"
                value={assetsNum}
                icon="package-variant"
                color="#5ECC63"
              />
              <StatCard
                title="Organizações"
                value={organizationsNum}
                icon="office-building"
                color="#2196F3"
              />
              <StatCard
                title="Último Acesso"
                value="Hoje"
                icon="clock-outline"
                color="#FF9800"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ações Rápidas</Text>
            <View style={styles.actionsContainer}>
              <QuickActionCard
                title="Ler QR Code"
                description="Escaneie códigos QR dos ativos"
                icon="camera"
                color="#5ECC63"
                onPress={() => navigation.navigate('QrCodeScan')}
              />
              <QuickActionCard
                title="Conectar RFID"
                description="Conecte ao leitor RFID"
                icon="bluetooth"
                color="#2196F3"
                onPress={() => navigation.navigate('DeviceDiscovery')}
              />
              <QuickActionCard
                title="Criar Organização"
                description="Adicione uma nova organização"
                icon="plus-circle"
                color="#FF9800"
                onPress={() => navigation.navigate('Organizations' as never)}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default HomeScreen

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeColors.mainBackground,
    margin: 12,
    borderRadius: 8,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: themeColors.mid,
  },

  header: {
    padding: 20,
    paddingTop: 20,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'capitalize',
  },

  // Main Content
  main: {
    backgroundColor: themeColors.mainBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 1,
    padding: 20,
    marginTop: 10,
  },

  // Welcome Card
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.dark,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: themeColors.light,
    lineHeight: 20,
  },
  welcomeIcon: {
    marginLeft: 16,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeColors.dark,
    marginBottom: 16,
  },

  // Statistics
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '30%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: themeColors.dark,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: themeColors.light,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Quick Actions
  actionsContainer: {
    gap: 12,
  },
  actionCard: {
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
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.dark,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: themeColors.light,
  },

  // Activity Overview
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.dark,
    marginLeft: 12,
  },
  activityDescription: {
    fontSize: 14,
    color: themeColors.light,
    lineHeight: 20,
    marginBottom: 16,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTime: {
    fontSize: 12,
    color: themeColors.light,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5ECC63',
  },
});
