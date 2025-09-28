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
  TouchableOpacity,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../models/stackType';
import useBLE from '../hooks/useBle';
import { RfidStatusItem } from '../models/rfids/rfidStatusItem';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SelectedAssets {
  organization: string;
  assets: Array<{
    asset_name: string;
    rfid_tag: string;
  }>;
}

type StorageScanScreenProps = {
  route: { 
    params: { 
      deviceAddress: string;
      selectedAssets?: SelectedAssets;
    } 
  };
};

const StorageScanScreen = ({ route }: StorageScanScreenProps) => {
  const { deviceAddress, selectedAssets } = route.params;
  const navigator = useNavigation<RootStackNavigationProp>();
  
  const { connectToDevice, disconnectFromDevice, connectedDevice, scannedRfids } = useBLE();

  const [isConnectionFailed, setIsConnectionFailed] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [scanStartTime, setScanStartTime] = useState<Date | null>(null);
  const [scanDuration, setScanDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Converte os selectedAssets para o formato RfidStatusItem[]
  const [rfidStatusList, setRfidStatusList] = useState<RfidStatusItem[]>(() => {
    if (selectedAssets && selectedAssets.assets) {
      return selectedAssets.assets.map(asset => ({
        name: asset.asset_name,
        rfid: asset.rfid_tag,
        scanned: false
      }));
    }
    return [];
  });

  const scannedCount = rfidStatusList.filter(item => item.scanned).length;
  const totalCount = rfidStatusList.length;
  const progress = totalCount > 0 ? (scannedCount / totalCount) * 100 : 0;

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

  // Timer do scan
  useEffect(() => {
    if (connectedDevice && !scanStartTime) {
      setScanStartTime(new Date());
      durationIntervalRef.current = setInterval(() => {
        setScanDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [connectedDevice, scanStartTime]);

  const handleInterruptScan = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    navigator.navigate('ResultsScreen', {
      results: rfidStatusList,
      deviceAddress: deviceAddress,
      selectedAssets: selectedAssets as SelectedAssets
    });
  };

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const tryToConnect = async () => {
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
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
      };
    }, [deviceAddress])
  );
  
  useEffect(() => {
    if (connectedDevice) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [connectedDevice, pulseAnim]);

  // Anima o progresso
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  useFocusEffect(
    useCallback(() => {
      const needsUpdate = rfidStatusList.some(item => !item.scanned && scannedRfids.includes(item.rfid));
      if (needsUpdate) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newList = rfidStatusList.map(item =>
          !item.scanned && scannedRfids.includes(item.rfid) ? { ...item, scanned: true } : item
        );
        setRfidStatusList(newList);
        
        // Navega para resultados quando todos foram encontrados
        if (newList.every(item => item.scanned)) {
          setTimeout(() => {
            if (durationIntervalRef.current) {
              clearInterval(durationIntervalRef.current);
            }
            navigator.navigate('ResultsScreen', { 
              results: newList, 
              deviceAddress,
              selectedAssets: selectedAssets as SelectedAssets
            });
          }, 1000); // Pequeno delay para mostrar o último item encontrado
        }
      }
    }, [scannedRfids, navigator, rfidStatusList, deviceAddress])
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isConnectionFailed) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.main}>
          <View style={styles.errorContainer}>
            <View style={styles.errorIcon}>
              <Feather name="alert-triangle" size={48} color="#F44336" />
            </View>
            <Text style={styles.errorTitle}>Falha na Conexão</Text>
            <Text style={styles.errorMessage}>
              Não foi possível conectar ao dispositivo. Verifique se ele está ligado e ao alcance.
            </Text>
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>
                Voltando em {countdown}s
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const isConnected = connectedDevice?.address === deviceAddress;

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>Verificação RFID</Text>
        <Text style={styles.headerSubtitle}>
          {selectedAssets?.organization || 'Organização'}
        </Text>
      </View>
      {isConnected && (
        <View style={styles.timerContainer}>
          <MaterialCommunityIcons name="timer" size={16} color="#666" />
          <Text style={styles.timerText}>{formatDuration(scanDuration)}</Text>
        </View>
      )}
    </View>
  );

  const renderScanner = () => (
    <View style={styles.scannerSection}>
      <Animated.View style={[styles.scannerContainer, { transform: [{ scale: pulseAnim }] }]}>
        <View style={[
          styles.scannerCircle,
          isConnected && styles.scannerCircleConnected
        ]}>
          {!isConnected ? (
            <>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.scannerStatusText}>Conectando...</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="radar" size={40} color="white" />
              <Text style={styles.scannerStatusText}>Escaneando</Text>
              <Text style={styles.scannerDeviceName}>
                {connectedDevice?.name || 'Dispositivo RFID'}
              </Text>
            </>
          )}
        </View>
      </Animated.View>

      {isConnected && (
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {scannedCount} de {totalCount} encontrados
            </Text>
            <Text style={styles.progressPercentage}>
              {Math.round(progress)}%
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  })
                }
              ]} 
            />
          </View>
        </View>
      )}
    </View>
  );

  const renderSectionTitle = () => (
    <View style={styles.sectionTitleContainer}>
      <Text style={styles.sectionTitle}>
        Itens para Verificação ({totalCount})
      </Text>
    </View>
  );

  const renderRfidItem = ({ item, index }: { item: RfidStatusItem; index: number }) => {
    const isScanned = item.scanned;
    const isRecent = isScanned && scannedRfids.indexOf(item.rfid) >= scannedRfids.length - 3;
    
    return (
      <Animated.View style={[
        styles.rfidCard,
        isScanned && styles.rfidCardScanned,
        isRecent && styles.rfidCardRecent
      ]}>
        <View style={styles.rfidHeader}>
          <View style={styles.rfidIndex}>
            <Text style={styles.rfidIndexText}>#{index + 1}</Text>
          </View>
          <View style={[
            styles.rfidStatus,
            isScanned && styles.rfidStatusScanned
          ]}>
            {isScanned ? (
              <Feather name="check-circle" size={20} color="#4CAF50" />
            ) : (
              <MaterialCommunityIcons name="radar" size={20} color="#ccc" />
            )}
          </View>
        </View>
        
        <View style={styles.rfidContent}>
          <Text style={[
            styles.rfidName,
            isScanned && styles.rfidNameScanned
          ]}>
            {item.name}
          </Text>
          <Text style={styles.rfidTag}>
            {item.rfid}
          </Text>
        </View>

        {isScanned && (
          <View style={styles.scannedBadge}>
            <Text style={styles.scannedBadgeText}>Encontrado</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderFooter = () => (
    <View style={styles.actionsSection}>
      <TouchableOpacity 
        style={styles.interruptButton} 
        onPress={handleInterruptScan}
      >
        <Feather name="square" size={18} color="#F44336" />
        <Text style={styles.interruptButtonText}>Parar Verificação</Text>
      </TouchableOpacity>
    </View>
  );

  const ListHeaderComponent = () => (
    <View>
      {renderHeader()}
      {renderScanner()}
      {renderSectionTitle()}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.main}>
        <FlatList
          data={rfidStatusList}
          keyExtractor={item => item.rfid}
          renderItem={renderRfidItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="close" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Nenhum item para verificar</Text>
              <Text style={styles.emptyText}>
                Selecione ativos na tela anterior para iniciar a verificação.
              </Text>
            </View>
          )}
        />
      </View>
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
    borderRadius: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },

  // Header
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'monospace',
  },

  // Scanner Section
  scannerSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  scannerContainer: { 
    marginBottom: 20,
  },
  scannerCircle: { 
    width: 160, 
    height: 160, 
    borderRadius: 80, 
    backgroundColor: '#ccc',
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  scannerCircleConnected: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.4,
  },
  scannerStatusText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: 'white', 
    marginTop: 8,
  },
  scannerDeviceName: { 
    fontSize: 12, 
    color: 'white', 
    opacity: 0.9,
    marginTop: 4,
  },

  // Progress Section
  progressSection: {
    width: '100%',
    alignItems: 'center',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },

  // Section Title
  sectionTitleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  // Item Separators
  itemSeparator: {
    height: 8,
  },

  // RFID Cards
  rfidCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
  },
  rfidCardScanned: {
    borderLeftColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  rfidCardRecent: {
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
    elevation: 6,
  },
  rfidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rfidIndex: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rfidIndexText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  rfidStatus: {
    padding: 4,
  },
  rfidStatusScanned: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  rfidContent: {
    marginBottom: 8,
  },
  rfidName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  rfidNameScanned: {
    color: '#2E7D32',
  },
  rfidTag: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  scannedBadge: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scannedBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },

  // Actions
  actionsSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  interruptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#F44336',
    gap: 8,
  },
  interruptButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    margin: 20,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  countdownContainer: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  countdownText: {
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '600',
  },
});

export default StorageScanScreen;
