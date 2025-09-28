import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, TouchableOpacity,
  ScrollView, Alert
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackNavigationProp } from '../../models/stackType';
import { SelectedAssets } from '../../models/asset.model';

const RFIDScanManagerScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [deviceInfo, setDeviceInfoAddress] = useState<{ name : string; address: string } | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<SelectedAssets | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStoredData = async () => {
    try {
      const [deviceInfo, storedAssets] = await Promise.all([
        AsyncStorage.getItem('device-info'),
        AsyncStorage.getItem('selected-rfid-assets')
      ]);

      if(deviceInfo) {
        setDeviceInfoAddress(JSON.parse(deviceInfo));
      }
      
      if (storedAssets) {
        setSelectedAssets(JSON.parse(storedAssets));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadStoredData();
    }, [])
  );

  const handleDeviceSelection = () => {
    navigation.navigate('DeviceDiscovery');
  };

  const handleAssetSelection = () => {
    navigation.navigate('AssetSelection');
  };

  const handleStartScan = () => {
    if (!deviceInfo || !selectedAssets) return;
    
    // Navegar para tela de scan com os dados necessários
    navigation.navigate('StorageScan', { 
      deviceAddress: deviceInfo.address,
      selectedAssets 
    });
  };

  const handleClearDevice = async () => {
    try {
      await AsyncStorage.removeItem('device-info');
      setDeviceInfoAddress(null);
    } catch (error) {
      console.error('Erro ao limpar dispositivo:', error);
    }
  };

  const handleClearAssets = async () => {
    try {
      await AsyncStorage.removeItem('selected-rfid-assets');
      setSelectedAssets(null);
    } catch (error) {
      console.error('Erro ao limpar ativos:', error);
    }
  };

  const canStartScan = deviceInfo?.address && selectedAssets && selectedAssets.assets.length > 0;

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.headerIcon}>
        <MaterialCommunityIcons name="radar" size={32} color="#F4A64E" />
      </View>
      <Text style={styles.title}>Gerenciar Scan RFID</Text>
      <Text style={styles.subtitle}>
        Configure o dispositivo e ativos para iniciar a verificação
      </Text>
    </View>
  );

  const renderDeviceSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <MaterialCommunityIcons name="bluetooth" size={20} color="#2196F3" />
        </View>
        <Text style={styles.sectionTitle}>Dispositivo RFID</Text>
        {deviceInfo && (
          <TouchableOpacity onPress={handleClearDevice} style={styles.clearButton}>
            <Feather name="x" size={16} color="#F44336" />
          </TouchableOpacity>
        )}
      </View>

      {deviceInfo ? (
        <View style={styles.deviceCard}>
          <View style={styles.deviceIcon}>
            <Feather name="bluetooth" size={24} color="#4CAF50" />
          </View>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{deviceInfo.name}</Text>
            <Text style={styles.deviceAddress}>{deviceInfo.address}</Text>
          </View>
          <View style={styles.statusIndicator}>
            <View style={styles.connectedDot} />
            <Text style={styles.statusText}>Conectado</Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.setupCard} onPress={handleDeviceSelection}>
          <View style={styles.setupIcon}>
            <Feather name="plus" size={24} color="#F4A64E" />
          </View>
          <View style={styles.setupContent}>
            <Text style={styles.setupTitle}>Conectar Dispositivo</Text>
            <Text style={styles.setupDescription}>
              Encontre e conecte-se ao seu leitor RFID
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAssetsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <MaterialCommunityIcons name="package-variant" size={20} color="#4CAF50" />
        </View>
        <Text style={styles.sectionTitle}>Ativos Selecionados</Text>
        {selectedAssets && (
          <TouchableOpacity onPress={handleClearAssets} style={styles.clearButton}>
            <Feather name="x" size={16} color="#F44336" />
          </TouchableOpacity>
        )}
      </View>

      {selectedAssets ? (
        <View style={styles.assetsContainer}>
          <View style={styles.organizationCard}>
            <View style={styles.orgIcon}>
              <MaterialCommunityIcons name="office-building" size={20} color="#2196F3" />
            </View>
            <Text style={styles.orgName}>{selectedAssets.organization}</Text>
            <Text style={styles.assetsCount}>
              {selectedAssets.assets.length} {selectedAssets.assets.length === 1 ? 'ativo' : 'ativos'}
            </Text>
          </View>

          <View style={styles.assetsList}>
            {selectedAssets.assets.slice(0, 3).map((asset, index) => (
              <View key={index} style={styles.assetItem}>
                <View style={styles.assetIcon}>
                  <MaterialCommunityIcons name="package" size={16} color="#4CAF50" />
                </View>
                <Text style={styles.assetName}>{asset.asset_name}</Text>
                <Text style={styles.rfidTag}>{asset.rfid_tag}</Text>
              </View>
            ))}
            {selectedAssets.assets.length > 3 && (
              <Text style={styles.moreAssets}>
                +{selectedAssets.assets.length - 3} mais...
              </Text>
            )}
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.setupCard} onPress={handleAssetSelection}>
          <View style={styles.setupIcon}>
            <Feather name="plus" size={24} color="#F4A64E" />
          </View>
          <View style={styles.setupContent}>
            <Text style={styles.setupTitle}>Selecionar Ativos</Text>
            <Text style={styles.setupDescription}>
              Escolha a organização e ativos para verificação
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsSection}>
      <TouchableOpacity 
        style={[
          styles.startButton,
          !canStartScan && styles.startButtonDisabled
        ]}
        onPress={handleStartScan}
        disabled={!canStartScan}
      >
        <MaterialCommunityIcons 
          name="radar" 
          size={20} 
          color={canStartScan ? "white" : "#ccc"} 
        />
        <Text style={[
          styles.startButtonText,
          !canStartScan && styles.startButtonTextDisabled
        ]}>
          Iniciar Scan RFID
        </Text>
      </TouchableOpacity>

      {!canStartScan && (
        <View style={styles.requirementsCard}>
          <Feather name="info" size={16} color="#FF9800" />
          <Text style={styles.requirementsText}>
            Conecte um dispositivo e selecione ativos para iniciar
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="loading" size={48} color="#F4A64E" />
          <Text style={styles.loadingText}>Carregando configurações...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderDeviceSection()}
        {renderAssetsSection()}
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
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Device Section
  deviceCard: {
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
    borderLeftColor: '#4CAF50',
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deviceAddress: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  statusIndicator: {
    alignItems: 'center',
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },

  // Setup Card
  setupCard: {
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
    borderWidth: 2,
    borderColor: '#F0F0F0',
    borderStyle: 'dashed',
  },
  setupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  setupContent: {
    flex: 1,
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  setupDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },

  // Assets Section
  assetsContainer: {
    gap: 16,
  },
  organizationCard: {
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
  orgIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  assetsCount: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  assetsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  assetIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assetName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  rfidTag: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  moreAssets: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  editAssetsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0E0',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  editAssetsText: {
    color: '#F4A64E',
    fontSize: 14,
    fontWeight: '600',
  },

  // Actions
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  startButton: {
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
  startButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  startButtonTextDisabled: {
    color: '#ccc',
  },
  requirementsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  requirementsText: {
    fontSize: 14,
    color: '#FF9800',
    flex: 1,
  },
});

export default RFIDScanManagerScreen;