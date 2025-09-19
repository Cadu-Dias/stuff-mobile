import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ActivityIndicator, 
  FlatList, 
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
  TouchableOpacity
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../models/stackType';
import useBLE from '../hooks/useBle';
import { RfidStatusItem } from '../models/rfids/rfidStatusItem';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TARGET_RFIDS = [
  { name: 'Bola', rfid: 'E28011702000122F26C20945' },
  { name: 'Escadas', rfid: 'E280699520007002A6F2755C' },
];

type DeviceConnectionScreenProps = {
  route: { params: { deviceAddress: string; } };
};

const DeviceConnectionScreen = ({ route }: DeviceConnectionScreenProps) => {
  const { deviceAddress } = route.params;
  const navigator = useNavigation<RootStackNavigationProp>();
  
  const { connectToDevice, disconnectFromDevice, connectedDevice, scannedRfids } = useBLE();

  const [isConnectionFailed, setIsConnectionFailed] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isConnectionFailed) {
      intervalRef.current = setInterval(() => {
        setCountdown((prevCount) => prevCount - 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isConnectionFailed]);

  useEffect(() => {
    if (countdown <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      navigator.goBack();
    }
  }, [countdown, navigator]);

  const [rfidStatusList, setRfidStatusList] = useState<RfidStatusItem[]>(
    TARGET_RFIDS.map(item => ({ ...item, scanned: false }))
  );

  const handleInterruptScan = () => {
    navigator.navigate('ResultsScreen', {
      results: rfidStatusList,
      deviceAddress: deviceAddress,
    });
  };

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 3. CORREÇÃO PRINCIPAL: O efeito agora depende do 'deviceAddress' e não precisa mais encontrar o 'device' em uma lista.
  useFocusEffect(
    useCallback(() => {
      const tryToConnect = async () => {
        // Dispara a conexão diretamente com o endereço recebido.
        try {
          console.log("Tentando conectar ao dispositivo:", deviceAddress);
          await connectToDevice(deviceAddress);
        } catch (error) {
          console.error("Falha ao conectar:", error);
          setIsConnectionFailed(true);
        }
      };

      if (deviceAddress) {
        tryToConnect();
      }
      
      return () => {
        console.log("Tela perdeu o foco, desconectando...");
        disconnectFromDevice();
      };
    }, [deviceAddress])
  );
  
  useEffect(() => {
    if (connectedDevice) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [connectedDevice, pulseAnim]);

  useFocusEffect(
    useCallback(() => {
      const needsUpdate = rfidStatusList.some(item => !item.scanned && scannedRfids.includes(item.rfid));
      if (needsUpdate) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newList = rfidStatusList.map(item =>
          !item.scanned && scannedRfids.includes(item.rfid) ? { ...item, scanned: true } : item
        );
        setRfidStatusList(newList);
        if (newList.every(item => item.scanned)) {
          navigator.navigate('ResultsScreen', { results: newList, deviceAddress });
        }
      }
    }, [scannedRfids, navigator, rfidStatusList, deviceAddress])
  );

  if (isConnectionFailed) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.main}>
          <View style={styles.errorContainer}>
            <Feather name="alert-triangle" size={50} color="#C62828" />
            <Text style={styles.errorTitle}>Falha na Conexão</Text>
            <Text style={styles.errorMessage}>
              Não foi possível conectar ao dispositivo. Verifique se ele está ligado e ao alcance.
            </Text>
            <Text style={styles.countdownText}>
              Voltando para a tela anterior em {countdown}...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // A verificação de 'isConnected' agora usa o 'deviceAddress' da rota.
  const isConnected = connectedDevice?.address === deviceAddress;

  const renderRfidItem = ({ item }: { item: RfidStatusItem }) => {
    const isScanned = item.scanned;
    return (
      <View style={[styles.rfidItem, isScanned && styles.rfidItemScanned]}>
        <View style={[styles.rfidIconWrapper, isScanned && styles.rfidIconWrapperScanned]}>
          <Feather name={isScanned ? 'check' : 'radio'} size={20} color={isScanned ? '#4CAF50' : '#888'} />
        </View>
        <Text style={[styles.rfidText, isScanned && styles.rfidTextScanned]}>{item.name}</Text>
      </View>
    );
  };

 return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.main}>
        <View style={{ flex: 1 }}>
          <Animated.View style={[styles.scannerContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.scannerCircle}>
              {!isConnected ? (
                <>
                  <ActivityIndicator size="large" color="#F89F3C" />
                  <Text style={styles.scannerStatusText}>Conectando...</Text>
                </>
              ) : (
                <>
                  <Feather name="bluetooth" size={30} color="white" />
                  <Text style={styles.scannerStatusText}>Conectado</Text>
                  {/* 4. CORREÇÃO DA UI: Exibe o nome a partir do 'connectedDevice' do hook. */}
                  <Text style={styles.scannerDeviceName}>{connectedDevice?.name}</Text>
                </>
              )}
            </View>
          </Animated.View>

          <Text style={styles.listTitle}>Procurando por:</Text>
          <FlatList
            data={rfidStatusList}
            keyExtractor={item => item.rfid}
            renderItem={renderRfidItem}
            contentContainerStyle={styles.flatListContent}
          />
        </View>

        <TouchableOpacity style={styles.interruptButton} onPress={handleInterruptScan}>
          <Feather name="stop-circle" size={20} color="#C62828" />
          <Text style={styles.interruptButtonText}>Interromper Scan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4A64E' },
  main: { flex: 1, backgroundColor: '#FFF0E0', margin: 12, borderRadius: 8, padding: 20 },
  scannerContainer: { alignItems: 'center', marginVertical: 20 },
  scannerCircle: { width: 180, height: 180, borderRadius: 90, backgroundColor: '#F89F3C', justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#F89F3C', shadowOpacity: 0.5, shadowRadius: 15 },
  scannerStatusText: { fontSize: 18, fontWeight: 'bold', color: 'white', marginTop: 8 },
  scannerDeviceName: { fontSize: 12, color: 'white', opacity: 0.8 },
  listTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15, borderTopWidth: 1, borderTopColor: '#E0D2C2', paddingTop: 20 },
  flatListContent: { paddingBottom: 20 },
  rfidItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginVertical: 6, borderWidth: 1, borderColor: '#E0D2C2' },
  rfidItemScanned: { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
  rfidIconWrapper: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', marginRight: 15 },
  rfidIconWrapperScanned: { backgroundColor: 'white' },
  rfidText: { fontSize: 16, fontWeight: '500', color: '#333' },
  rfidTextScanned: { color: '#2E7D32', textDecorationLine: 'line-through', opacity: 0.7 },
  interruptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#C62828',
    gap: 10,
  },
  interruptButtonText: {
    color: '#C62828',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: '#C62828',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#C62828',
    marginTop: 15,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
  },
  countdownText: {
    fontSize: 14,
    color: '#B71C1C',
    marginTop: 20,
    fontWeight: '600',
  },
});

export default DeviceConnectionScreen;