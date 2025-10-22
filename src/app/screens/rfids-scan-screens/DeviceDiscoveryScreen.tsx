import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackNavigationProp } from '../../models/stackType';
import useBLE from '../../hooks/useBle';
import { BluetoothDevice } from 'react-native-bluetooth-classic';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DeviceDiscoveryScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  const {
    allDevices,
    isDiscovering,
    scanForPeripherals,
    testConnection,
    disconnectFromDevice,
    cancelDiscovery,
  } = useBLE();

  const [connectingTo, setConnectingTo] = useState<BluetoothDevice | null>(null);
  const [connectableDevice, setConectableDevice] = useState<BluetoothDevice | null>(null);
  const [isConnectable, setIsConnectable] = useState<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (isDiscovering) {
          console.log('Tela perdeu o foco sem conexão, cancelando a busca de dispositivos.');
          cancelDiscovery();
        }
      };
    }, [isDiscovering, cancelDiscovery])
  );

  useEffect(() => {
    let navigationTimeout: NodeJS.Timeout | null = null;
    if (isConnectable) {
      console.log('Dispositivo conectado! Redirecionando em 1 segundo...');
      navigationTimeout = setTimeout(async () => {
        
      }, 1000);
    }
    return () => {
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }
    };
  }, [isConnectable, navigation]);

  const handleConnectPress = async (device: BluetoothDevice) => {
    if (connectingTo) {
      console.log("Já existe uma conexão em andamento");
      return;
    }

    try {
      setConnectingTo(device);
      const isDeviceConnectable = await testConnection(device.address);
      
      if (isDeviceConnectable) {
        setConectableDevice(device);
        setIsConnectable(true);

        await AsyncStorage.setItem("device-info", JSON.stringify({ name: device.name, address: device.address }));
        setTimeout(() => {
          navigation.navigate('RFIDScanManager');
        }, 2000);
        
      } else {
        Alert.alert("Falha na Conexão", "Não foi possível conectar ao dispositivo. Tente novamente.", [{ text: "OK" }]);
      }
      
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro desconhecido ao conectar", [{ text: "OK" }]);
    } finally {
      setConnectingTo(null);
    }
  };

  const renderDeviceItem = ({ item }: { item: BluetoothDevice }) => {
    const isConnecting = connectingTo?.id === item.id;
    const isConnected = connectableDevice?.id === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.deviceCard,
          isConnected && styles.deviceCardConnected,
          isConnecting && styles.deviceCardConnecting
        ]}
        onPress={() => handleConnectPress(item)}
        disabled={isConnecting || isConnected}
      >
        <View style={styles.deviceHeader}>
          <View style={[
            styles.deviceIconContainer,
            isConnected && styles.deviceIconConnected,
            isConnecting && styles.deviceIconConnecting
          ]}>
            <MaterialCommunityIcons 
              name="bluetooth" 
              size={24} 
              color={isConnected ? 'white' : isConnecting ? '#FFA726' : '#F4A64E'} 
            />
          </View>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>
              {item.name || 'Dispositivo Sem Nome'}
            </Text>
            <Text style={styles.deviceAddress}>{item.address}</Text>
            <View style={styles.deviceTypeTag}>
              <Text style={styles.deviceTypeText}>Leitor RFID</Text>
            </View>
          </View>
        </View>

        <View style={styles.deviceFooter}>
          {isConnecting ? (
            <View style={styles.connectingState}>
              <ActivityIndicator size="small" color="#FFA726" />
              <Text style={styles.connectingText}>Conectando...</Text>
            </View>
          ) : isConnected ? (
            <View style={styles.connectedState}>
              <Feather name="check-circle" size={20} color="#5ECC63" />
              <Text style={styles.connectedText}>Conectado</Text>
            </View>
          ) : (
            <View style={styles.connectButton}>
              <Text style={styles.connectButtonText}>Conectar</Text>
              <Feather name="arrow-right" size={16} color="#F4A64E" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MaterialCommunityIcons 
          name={isDiscovering ? "bluetooth-connect" : "bluetooth-off"} 
          size={48} 
          color="#ccc" 
        />
      </View>
      <Text style={styles.emptyTitle}>
        {isDiscovering ? 'Procurando dispositivos...' : 'Nenhum dispositivo encontrado'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isDiscovering 
          ? 'Certifique-se de que o leitor RFID está ligado e próximo'
          : 'Toque em "Buscar Dispositivos" para encontrar leitores RFID'
        }
      </Text>
      {isDiscovering && (
        <View style={styles.searchingIndicator}>
          <ActivityIndicator size="large" color="#F4A64E" />
        </View>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.headerIcon}>
        <MaterialCommunityIcons name="bluetooth-connect" size={32} color="#F4A64E" />
      </View>
      <Text style={styles.title}>Descobrir Dispositivos</Text>
      <Text style={styles.subtitle}>
        Encontre e conecte-se ao seu leitor RFID para começar a gerenciar ativos
      </Text>
    </View>
  );

  const renderScanSection = () => (
    <View style={styles.scanSection}>
      <TouchableOpacity
        style={[
          styles.scanButton,
          isDiscovering && styles.scanButtonActive
        ]}
        onPress={isDiscovering ? cancelDiscovery : scanForPeripherals}
      >
        <View style={styles.scanButtonContent}>
          {isDiscovering ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.scanButtonText}>Cancelar Busca</Text>
            </>
          ) : (
            <>
              <Feather name="search" size={20} color="white" />
              <Text style={styles.scanButtonText}>Buscar Dispositivos</Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      {allDevices.length > 0 && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            Dispositivos Encontrados ({allDevices.length})
          </Text>
          <Text style={styles.resultsSubtitle}>
            Toque em um dispositivo para conectar
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderScanSection()}
        
        <View style={styles.devicesList}>
          <FlatList
            data={allDevices}
            renderItem={renderDeviceItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={renderEmptyState}
            scrollEnabled={false}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </View>

        {connectableDevice && (
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <Feather name="wifi" size={20} color="#5ECC63" />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Conectado com sucesso!</Text>
              <Text style={styles.statusSubtitle}>
                Redirecionando para leitura de tags...
              </Text>
            </View>
            <ActivityIndicator size="small" color="#5ECC63" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

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
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: { 
    fontSize: 16, 
    color: '#666', 
    textAlign: 'center',
    lineHeight: 22,
  },

  // Scan Section
  scanSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#F4A64E',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 20,
  },
  scanButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scanButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '600' 
  },

  // Results Header
  resultsHeader: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#666',
  },

  // Device List
  devicesList: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Device Cards
  deviceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  deviceCardConnecting: {
    borderColor: '#FFA726',
    backgroundColor: '#FFF8E1',
  },
  deviceCardConnected: {
    borderColor: '#5ECC63',
    backgroundColor: '#F1F8E9',
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceIconConnecting: {
    backgroundColor: '#FFA726',
  },
  deviceIconConnected: {
    backgroundColor: '#5ECC63',
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
    color: '#888',
    marginBottom: 8,
  },
  deviceTypeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  deviceTypeText: {
    fontSize: 10,
    color: '#1976D2',
    fontWeight: '600',
  },

  // Device Footer States
  deviceFooter: {
    alignItems: 'flex-end',
  },
  connectingState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectingText: {
    fontSize: 14,
    color: '#FFA726',
    fontWeight: '600',
  },
  connectedState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectedText: {
    fontSize: 14,
    color: '#5ECC63',
    fontWeight: '600',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  connectButtonText: {
    fontSize: 14,
    color: '#F4A64E',
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
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: { 
    fontSize: 14, 
    color: '#666', 
    textAlign: 'center',
    lineHeight: 20,
  },
  searchingIndicator: {
    marginTop: 20,
  },

  // Status Card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5ECC63',
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#5ECC63',
  },
});

export default DeviceDiscoveryScreen;