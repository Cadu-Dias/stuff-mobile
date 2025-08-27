import React, { useEffect } from 'react';
import useBLE from "../hooks/useBle";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BluetoothDevice } from 'react-native-bluetooth-classic';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../models/stackType';

const DeviceItem = ({ device, onConnect }: { device: BluetoothDevice, onConnect: () => Promise<void> }) => {
  return (
    <View style={styles.deviceItem}>
      <View style={styles.deviceInfo}>
        <MaterialCommunityIcons name="bluetooth" size={24} color="#333" />
        <Text style={styles.deviceName} numberOfLines={1} ellipsizeMode="tail">
          {device.name || 'Dispositivo Desconhecido'}
        </Text>
      </View>
      <TouchableOpacity style={styles.connectButton} onPress={onConnect}>
        <Text style={styles.connectButtonText}>Conectar</Text>
      </TouchableOpacity>
    </View>
  );
};

const LoadingModal = () => {
  return (
    <View style={styles.loadingModal}>
      <ActivityIndicator size="large" color="#FFA500" />
      <Text style={styles.loadingText}>Detectando Dispositivos...</Text>
    </View>
  );
};


const DeviceDiscovery = () => {
  const { scanForPeripherals, allDevices } = useBLE();
  const navigator = useNavigation<RootStackNavigationProp>();

  useEffect(() => {
    scanForPeripherals();
  }, []);

  const handleConnect = (device: BluetoothDevice) => {
    navigator.navigate("StorageScan", { device: device });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.devicesWrapper}>
        <Text style={styles.title}>Dispositivos Encontrados:</Text>
        <FlatList
          data={allDevices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DeviceItem device={item} onConnect={async () => handleConnect(item)} />
          )}
          contentContainerStyle={styles.flatListContent}
        />
      </View>
      
      {allDevices.length === 0 && <LoadingModal />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  devicesWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingVertical: 20,
    color: '#333',
    paddingHorizontal: 20,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceName: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  connectButton: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  connectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  flatListContent: {
    paddingHorizontal: 5,
  },
});

export default DeviceDiscovery;