import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { BluetoothDevice } from 'react-native-bluetooth-classic';

import useBLE from '../hooks/useBle';

const TARGET_RFIDS = [
  { name: 'Bola', rfid: 'E28011702000022D26C40945' },
  { name: 'Escadas', rfid: 'E280699520007002A6F2755C' },
];

type DeviceConnectionScreenProps = {
  route: {
    params: {
      device: BluetoothDevice;
    };
  };
};

interface RfidStatusItem {
  name: string;
  rfid: string;
  scanned: boolean;
}

const DeviceConnectionScreen = ({ route }: DeviceConnectionScreenProps) => {
  const { device } = route.params;

  const {
    connectToDevice,
    disconnectFromDevice,
    connectedDevice,
    scannedRfids,
  } = useBLE();


  const [rfidStatusList, setRfidStatusList] = useState<RfidStatusItem[]>(
    TARGET_RFIDS.map(item => ({ ...item, scanned: false }))
  );

  useFocusEffect(
    useCallback(() => {
      let connectionTimeout: NodeJS.Timeout | null = null;
      
      const connectAndSetup = async () => {
        await connectToDevice(device);
        
        connectionTimeout = setTimeout(() => {
          if (!rfidStatusList.every(item => item.scanned)) {
            console.log('Timeout: Desconectando por inatividade.');
            disconnectFromDevice();
          }
        }, 60000);
      };

      connectAndSetup();

      return () => {
        console.log('A tela perdeu o foco. Executando a limpeza...');
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }
        disconnectFromDevice();
      };
      
    }, [])
  );

  // useEffect para atualizar a lista de status de RFIDs escaneados
  useEffect(() => {
    setRfidStatusList(prevList => {
      const newList = prevList.map(item => {
        if (!item.scanned && scannedRfids.includes(item.rfid)) {
          console.log(`RFID "${item.name}" encontrado!`);
          return { ...item, scanned: true };
        }
        return item;
      });
      return newList;
    });
  }, [scannedRfids]);

  const isConnected = connectedDevice && connectedDevice.address === device.address;

  const renderRfidItem = ({ item }: { item: RfidStatusItem }) => {
    return (
      <View style={styles.rfidItem}>
        <Text style={styles.rfidText}>{item.name}</Text>
        {item.scanned ? (
          <MaterialCommunityIcons name="check-circle" size={24} color="green" />
        ) : (
          <MaterialCommunityIcons name="close-circle" size={24} color="red" />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Container principal para o conteúdo */}
      <View style={styles.mainContent}>

        {/* Bloco de status no topo da página */}
        <View style={styles.statusHeader}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={styles.connectionStatus}>
            {isConnected ? 'Dispositivo Conectado' : 'Conectando...'}
          </Text>
          <Text style={styles.deviceName}>{device.name || 'Dispositivo Desconhecido'}</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Status dos Objetos:</Text>
          <FlatList
            data={rfidStatusList}
            keyExtractor={item => item.rfid}
            renderItem={renderRfidItem}
            contentContainerStyle={styles.flatListContent}
          />
        </View>
        
        {!isConnected && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFA500" />
            <Text style={styles.loadingText}>Aguardando conexão...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statusLabel: {
    fontSize: 14,
    color: '#888',
  },
  connectionStatus: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  deviceName: {
    fontSize: 18,
    color: '#666',
  },
  statusContainer: {
    width: '100%',
    flex: 1, // Permite que a FlatList se expanda
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  flatListContent: {
    width: '100%',
  },
  rfidItem: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Alinha o texto e o ícone nas extremidades
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
  },
  rfidText: {
    fontSize: 18, // Aumenta a fonte
    color: '#333',
    flexShrink: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
});

export default DeviceConnectionScreen;