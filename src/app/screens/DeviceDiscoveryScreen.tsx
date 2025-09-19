import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackNavigationProp } from '../models/stackType';
import useBLE from '../hooks/useBle';
import { BluetoothDevice } from 'react-native-bluetooth-classic';

const DeviceDiscoveryScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  const {
    allDevices,
    isDiscovering,
    scanForPeripherals,
    connectToDevice,
    connectedDevice,
    cancelDiscovery,
  } = useBLE();

  const [connectingTo, setConnectingTo] = useState<BluetoothDevice | null>(null);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (isDiscovering && !connectedDevice) {
          console.log('Tela perdeu o foco sem conexão, cancelando a busca de dispositivos.');
          cancelDiscovery();
        }
      };
    }, [isDiscovering, connectedDevice, cancelDiscovery])
  );

  useEffect(() => {
    let navigationTimeout: NodeJS.Timeout | null = null;
    if (connectedDevice) {
      console.log('Dispositivo conectado! Redirecionando em 2 segundos...');
      navigationTimeout = setTimeout(() => {
        navigation.navigate('StorageScan', { deviceAddress: connectedDevice.address });
      }, 2000);
    }
    return () => {
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }
    };
  }, [connectedDevice, navigation]);

  const handleConnectPress = async (device: BluetoothDevice) => {
    if (connectingTo || connectedDevice) return;

    setConnectingTo(device);
    try {
      await connectToDevice(device.address);
    } catch (error) {
      console.error("Falha ao conectar:", error);
    } finally {
      setConnectingTo(null);
    }
  };

  const renderDeviceItem = ({ item }: { item: BluetoothDevice }) => {
    const isConnecting = connectingTo?.id === item.id;
    const isConnected = connectedDevice?.id === item.id;

    return (
      <TouchableOpacity
        style={styles.deviceItem}
        onPress={() => handleConnectPress(item)}
        disabled={isConnecting || isConnected}
      >
        <View style={styles.deviceIconWrapper}>
          <Feather name="bluetooth" size={24} color="#F89F3C" />
        </View>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name || 'Dispositivo Sem Nome'}</Text>
          <Text style={styles.deviceAddress}>{item.address}</Text>
        </View>
        <View style={styles.deviceAction}>
          {isConnecting ? (
            <ActivityIndicator size="small" color="#F89F3C" />
          ) : isConnected ? (
            <Feather name="check-circle" size={24} color="#4CAF50" />
          ) : (
            <Feather name="chevron-right" size={24} color="#ccc" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name="search" size={40} color="#ccc" />
      <Text style={styles.emptyText}>
        {isDiscovering
          ? 'Procurando por dispositivos...'
          : 'Nenhum dispositivo encontrado.\nToque em "Procurar" para iniciar.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.main}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Conectar ao Leitor</Text>
          <Text style={styles.subtitle}>
            Pressione o botão para encontrar leitores RFID próximos.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.scanButton, isDiscovering && styles.scanButtonDisabled]}
          onPress={scanForPeripherals}
          disabled={isDiscovering}
        >
          <Feather name={isDiscovering ? 'loader' : 'search'} size={20} color="white" />
          <Text style={styles.scanButtonText}>
            {isDiscovering ? 'Procurando...' : 'Procurar Dispositivos'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <FlatList
          data={allDevices}
          renderItem={renderDeviceItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4A64E' },
  main: { flex: 1, backgroundColor: '#FFF0E0', margin: 12, borderRadius: 8, padding: 20 },
  headerContainer: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 5 },
  scanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F89F3C', paddingVertical: 15, borderRadius: 12, elevation: 3, gap: 10 },
  scanButtonDisabled: { backgroundColor: '#FFC685' },
  scanButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#E0D2C2', marginVertical: 20 },
  deviceItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  deviceIconWrapper: { backgroundColor: '#FFF0E0', padding: 10, borderRadius: 20, marginRight: 15 },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 16, fontWeight: '600', color: '#333' },
  deviceAddress: { fontSize: 12, color: '#888', marginTop: 2 },
  deviceAction: { paddingLeft: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 15, fontSize: 16, color: '#aaa', textAlign: 'center' },
});

export default DeviceDiscoveryScreen;