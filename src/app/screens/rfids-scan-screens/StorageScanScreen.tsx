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
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { RootStackNavigationProp } from '../../models/stackType';
import useBLE from '../../hooks/useBle';
import { RfidStatusItem } from '../../models/rfids/rfidStatusItem';
import { SelectedAssets } from '../../models/asset.model';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
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
  const isFocused = useIsFocused();
  
  const { connectToDevice, disconnectFromDevice, connectedDevice, scannedRfids } = useBLE();

  const [isConnectionFailed, setIsConnectionFailed] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [scanDuration, setScanDuration] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishingCountdown, setFinishingCountdown] = useState(3);
  
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const finishingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finishingCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const hasTriedConnection = useRef(false);

  const [rfidStatusList, setRfidStatusList] = useState<RfidStatusItem[]>(() => {
    if (selectedAssets && selectedAssets.assets) {
      return selectedAssets.assets.map(asset => ({
        id: asset.assetId,
        name: asset.assetName,
        rfid: asset.rfidTag,
        scanned: false
      }));
    }
    return [];
  });

  const scannedCount = rfidStatusList.filter(item => item.scanned).length;
  const totalCount = rfidStatusList.length;
  const progress = totalCount > 0 ? (scannedCount / totalCount) * 100 : 0;

  // Cleanup de todos os timers
  const cleanupTimers = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (finishingTimeoutRef.current) {
      clearTimeout(finishingTimeoutRef.current);
      finishingTimeoutRef.current = null;
    }
    if (finishingCountdownIntervalRef.current) {
      clearInterval(finishingCountdownIntervalRef.current);
      finishingCountdownIntervalRef.current = null;
    }
  }, []);

  // Countdown para falha de conexão
  useEffect(() => {
    if (isConnectionFailed) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prevCount) => {
          if (prevCount <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            navigator.goBack();
            return 0;
          }
          return prevCount - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [isConnectionFailed, navigator]);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const tryToConnect = async () => {
      if (hasTriedConnection.current || isFinishing || connectedDevice) {
        return;
      }

      hasTriedConnection.current = true;

      try {
        console.log("🔌 Tentando conectar ao dispositivo:", deviceAddress);
        await connectToDevice(deviceAddress);
        console.log("✅ Conectado com sucesso");
      } catch (error) {
        console.error("❌ Falha ao conectar:", error);
        setIsConnectionFailed(true);
        hasTriedConnection.current = false;
      }
    };

    tryToConnect();

    return () => {
      console.log("👋 Cleanup da tela");
      cleanupTimers();
      if (pulseAnimRef.current) {
        pulseAnimRef.current.stop();
      }
      if (!isFinishing && hasTriedConnection.current) {
        console.log("🔌 Desconectando dispositivo...");
        disconnectFromDevice();
        hasTriedConnection.current = false;
      }
    };
  }, [isFocused]); // Apenas isFocused como dependência

  // Timer de duração do scan
  useEffect(() => {
    if (!connectedDevice || isFinishing || durationIntervalRef.current) {
      return;
    }

    console.log('✅ Iniciando timer de scan');
    setIsScanning(true);
    setScanDuration(0);
    
    durationIntervalRef.current = setInterval(() => {
      setScanDuration(prev => prev + 1);
    }, 1000);

    return () => {
      if (durationIntervalRef.current) {
        console.log('🛑 Parando timer de scan');
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    };
  }, [connectedDevice, isFinishing]);

  // Navegar para resultados após desconectar
  const navigateToResults = useCallback((results: RfidStatusItem[]) => {
    console.log('📊 Navegando para tela de resultados...');
    cleanupTimers();
    
    navigator.navigate('ResultsScreen', { 
      results, 
      deviceAddress,
      selectedAssets: selectedAssets as SelectedAssets
    });
  }, [navigator, deviceAddress, selectedAssets, cleanupTimers]);

  // Finalizar scan (todos os itens encontrados)
  const finishScan = useCallback(async (allItems: RfidStatusItem[]) => {
    if (isFinishing) return;
    
    console.log('🏁 Todos os itens escaneados! Iniciando finalização...');
    setIsFinishing(true);
    setFinishingCountdown(3);
    
    // Timer visual de countdown
    finishingCountdownIntervalRef.current = setInterval(() => {
      setFinishingCountdown((prev) => {
        if (prev <= 1) {
          if (finishingCountdownIntervalRef.current) {
            clearInterval(finishingCountdownIntervalRef.current);
            finishingCountdownIntervalRef.current = null;
          }
        }
        return prev - 1;
      });
    }, 1000);

    // Timeout para desconectar e navegar
    finishingTimeoutRef.current = setTimeout(async () => {
      console.log('⏱️ Timeout finalizado, desconectando dispositivo...');
      
      await disconnectFromDevice();
      
      setTimeout(() => {
        console.log('✅ Dispositivo desconectado, navegando...');
        navigateToResults(allItems);
      }, 500);
    }, 3000);
  }, [isFinishing, disconnectFromDevice, navigateToResults]);

  // Parar verificação manualmente
  const handleInterruptScan = () => {
    Alert.alert(
      'Parar Verificação',
      'Deseja realmente parar a verificação? O progresso atual será salvo.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Parar',
          style: 'destructive',
          onPress: async () => {
            console.log('🛑 Usuário interrompeu o scan');
            setIsFinishing(true);
            cleanupTimers();
            
            await disconnectFromDevice();
            setTimeout(() => {
              navigateToResults(rfidStatusList);
            }, 500);
          }
        }
      ]
    );
  };

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const finishAnim = useRef(new Animated.Value(0)).current;
  
  // Animação de pulso
  useEffect(() => {
    if (!connectedDevice || isFinishing) {
      if (pulseAnimRef.current) {
        pulseAnimRef.current.stop();
      }
      pulseAnim.setValue(1);
      return;
    }

    console.log('🎬 Iniciando animação de pulso');
    
    pulseAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { 
          toValue: 1.15, 
          duration: 1000, 
          useNativeDriver: true 
        }),
        Animated.timing(pulseAnim, { 
          toValue: 1, 
          duration: 1000, 
          useNativeDriver: true 
        }),
      ])
    );
    
    pulseAnimRef.current.start();

    return () => {
      if (pulseAnimRef.current) {
        pulseAnimRef.current.stop();
      }
    };
  }, [connectedDevice, isFinishing]);

  // Animação de finalização
  useEffect(() => {
    if (!isFinishing) return;

    const finishAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(finishAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(finishAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    
    finishAnimation.start();

    return () => {
      finishAnimation.stop();
    };
  }, [isFinishing]);

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    if (isFinishing) return;
    
    const needsUpdate = rfidStatusList.some(
      item => !item.scanned && scannedRfids.includes(item.rfid)
    );
    
    if (needsUpdate) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const newList = rfidStatusList.map(item =>
        !item.scanned && scannedRfids.includes(item.rfid) 
          ? { ...item, scanned: true } 
          : item
      );
      setRfidStatusList(newList);
      
      const allFound = newList.every(item => item.scanned);
      if (allFound) {
        console.log('🎉 Todos os itens foram encontrados!');
        finishScan(newList);
      }
    }
  }, [scannedRfids, isFinishing]);

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
            <View style={styles.errorIconContainer}>
              <MaterialCommunityIcons name="bluetooth-off" size={64} color="#F44336" />
            </View>
            <Text style={styles.errorTitle}>Falha na Conexão</Text>
            <Text style={styles.errorMessage}>
              Não foi possível conectar ao dispositivo. Verifique se ele está ligado e próximo.
            </Text>
            <View style={styles.countdownBadge}>
              <MaterialCommunityIcons name="timer-sand" size={20} color="#FF9800" />
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
      <View style={styles.headerTop}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Verificação RFID</Text>
          <Text style={styles.headerSubtitle}>
            {selectedAssets?.organizationName || 'Organização'}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <View style={[
            styles.statusBadge,
            isFinishing && styles.statusBadgeFinishing
          ]}>
            <View style={[
              styles.statusDot, 
              isConnected && !isFinishing && styles.statusDotConnected,
              isFinishing && styles.statusDotFinishing
            ]} />
            <Text style={styles.statusText}>
              {isFinishing ? 'Finalizando' : isConnected ? 'Conectado' : 'Conectando...'}
            </Text>
          </View>
          
          {isConnected && !isFinishing && (
            <View style={styles.timerBadge}>
              <MaterialCommunityIcons name="timer-outline" size={16} color="#666" />
              <Text style={styles.timerText}>{formatDuration(scanDuration)}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderScanner = () => (
    <View style={styles.scannerSection}>
      {isFinishing ? (
        <View style={styles.finishingContainer}>
          <Animated.View style={[
            styles.finishingCircle,
            {
              opacity: finishAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              })
            }
          ]}>
            <MaterialCommunityIcons name="check-circle" size={64} color="white" />
            <Text style={styles.finishingText}>Scan Completo!</Text>
            <Text style={styles.finishingSubtext}>
              Finalizando em {finishingCountdown}s
            </Text>
          </Animated.View>
          
          <View style={styles.finishingInfo}>
            <ActivityIndicator size="small" color="#4CAF50" />
            <Text style={styles.finishingInfoText}>
              Desconectando dispositivo e preparando resultados...
            </Text>
          </View>
        </View>
      ) : (
        <>
          <Animated.View style={[
            styles.scannerContainer, 
            { transform: [{ scale: pulseAnim}] }
          ]}>
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
                  <MaterialCommunityIcons name="radar" size={48} color="white" />
                  <Text style={styles.scannerStatusText}>Escaneando</Text>
                  <Text style={styles.scannerDeviceName}>
                    {connectedDevice?.name || 'Leitor RFID'}
                  </Text>
                </>
              )}
            </View>
            
            {isConnected && (
              <>
                <View style={[styles.radarWave, styles.radarWave1]} />
                <View style={[styles.radarWave, styles.radarWave2]} />
                <View style={[styles.radarWave, styles.radarWave3]} />
              </>
            )}
          </Animated.View>

          {isConnected && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>Progresso</Text>
                <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
              </View>
              
              <View style={styles.progressBarContainer}>
                <Animated.View 
                  style={[
                    styles.progressBar,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: progress === 100 ? '#4CAF50' : '#F4A64E'
                    }
                  ]} 
                />
              </View>
              
              <View style={styles.progressStats}>
                <View style={styles.progressStat}>
                  <Feather name="check-circle" size={14} color="#4CAF50" />
                  <Text style={styles.progressStatText}>{scannedCount} encontrados</Text>
                </View>
                <View style={styles.progressStat}>
                  <Feather name="circle" size={14} color="#FF9800" />
                  <Text style={styles.progressStatText}>{totalCount - scannedCount} pendentes</Text>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderSectionTitle = () => (
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name="package-variant-closed" size={20} color="#333" />
      <Text style={styles.sectionTitle}>
        Itens ({scannedCount}/{totalCount})
      </Text>
    </View>
  );

  const renderRfidItem = ({ item, index }: { item: RfidStatusItem; index: number }) => {
    const isScanned = item.scanned;
    const itemPosition = scannedRfids.indexOf(item.rfid);
    const isRecent = isScanned && itemPosition >= scannedRfids.length - 3 && !isFinishing;
    
    return (
      <Animated.View style={[
        styles.rfidCard,
        isScanned && styles.rfidCardScanned,
        isRecent && styles.rfidCardRecent
      ]}>
        <View style={styles.rfidCardContent}>
          <View style={styles.rfidLeft}>
            <View style={[
              styles.rfidStatusIcon,
              isScanned && styles.rfidStatusIconScanned
            ]}>
              {isScanned ? (
                <Feather name="check" size={18} color="white" />
              ) : (
                <MaterialCommunityIcons name="scanner-off" size={18} color="#999" />
              )}
            </View>
            
            <View style={styles.rfidInfo}>
              <Text style={[
                styles.rfidName,
                isScanned && styles.rfidNameScanned
              ]}>
                {item.name}
              </Text>
              <View style={styles.rfidTagContainer}>
                <MaterialCommunityIcons name="tag" size={12} color="#999" />
                <Text style={styles.rfidTag}>{item.rfid}</Text>
              </View>
            </View>
          </View>

          <View style={styles.rfidRight}>
            <View style={styles.rfidIndex}>
              <Text style={styles.rfidIndexText}>#{index + 1}</Text>
            </View>
            {isScanned && (
              <View style={styles.scannedBadge}>
                <Text style={styles.scannedBadgeText}>✓</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderFooter = () => (
    <View style={styles.actionsSection}>
      {!isFinishing && (
        <>
          <TouchableOpacity 
            style={styles.interruptButton} 
            onPress={handleInterruptScan}
            disabled={!isScanning}
          >
            <Feather name="stop-circle" size={20} color="#F44336" />
            <Text style={styles.interruptButtonText}>Parar Verificação</Text>
          </TouchableOpacity>
          
          <View style={styles.helpCard}>
            <Feather name="info" size={16} color="#2196F3" />
            <Text style={styles.helpText}>
              Aproxime as tags RFID do leitor para detectá-las automaticamente
            </Text>
          </View>
        </>
      )}
    </View>
  );

  const ListHeaderComponent = () => (
    <View>
      {renderHeader()}
      {renderScanner()}
      {!isFinishing && renderSectionTitle()}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.main}>
        <FlatList
          data={isFinishing ? [] : rfidStatusList}
          keyExtractor={item => item.rfid}
          renderItem={renderRfidItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={() => !isFinishing ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="package-variant-closed" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Nenhum item para verificar</Text>
              <Text style={styles.emptyText}>
                Selecione ativos na tela anterior para iniciar a verificação.
              </Text>
            </View>
          ) : null}
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

  // Header Section - TIMER REDUZIDO
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadgeFinishing: {
    backgroundColor: '#E8F5E9',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
  },
  statusDotConnected: {
    backgroundColor: '#4CAF50',
  },
  statusDotFinishing: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Scanner Section
  scannerSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  scannerContainer: { 
    marginBottom: 24,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerCircle: { 
    width: 180, 
    height: 180, 
    borderRadius: 90, 
    backgroundColor: '#999',
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 10,
  },
  scannerCircleConnected: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.5,
  },
  radarWave: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#4CAF50',
    opacity: 0.3,
  },
  radarWave1: {
    width: 220,
    height: 220,
  },
  radarWave2: {
    width: 260,
    height: 260,
    opacity: 0.2,
  },
  radarWave3: {
    width: 300,
    height: 300,
    opacity: 0.1,
  },
  scannerStatusText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: 'white', 
    marginTop: 12,
  },
  scannerDeviceName: { 
    fontSize: 12, 
    color: 'white', 
    opacity: 0.9,
    marginTop: 4,
  },

  // Finishing Section
  finishingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  finishingCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 24,
  },
  finishingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
  },
  finishingSubtext: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
  },
  finishingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  finishingInfoText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },

  // Progress Section
  progressSection: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F4A64E',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressStatText: {
    fontSize: 12,
    color: '#666',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  // Item Separator
  itemSeparator: {
    height: 10,
  },

  // RFID Cards
  rfidCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
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
    elevation: 8,
  },
  rfidCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rfidLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  rfidStatusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rfidStatusIconScanned: {
    backgroundColor: '#4CAF50',
  },
  rfidInfo: {
    flex: 1,
  },
  rfidName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  rfidNameScanned: {
    color: '#2E7D32',
  },
  rfidTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rfidTag: {
    fontSize: 11,
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  rfidRight: {
    alignItems: 'flex-end',
    gap: 8,
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
  scannedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannedBadgeText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },

  // Actions Section
  actionsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  interruptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#F44336',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  interruptButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
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
    fontSize: 15,
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
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
    lineHeight: 24,
    marginBottom: 24,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  countdownText: {
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '600',
  },
});

export default StorageScanScreen;