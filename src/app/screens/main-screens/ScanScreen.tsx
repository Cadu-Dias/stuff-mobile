import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator,
  Modal 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { RootStackNavigationProp } from '../../models/stackType';
import useBLE from '../../hooks/useBle';

const RfidRequirementsModal = ({ 
  visible, 
  onClose, 
  onProceed 
}: {
  visible: boolean;
  onClose: () => void;
  onProceed: () => void;
}) => {
  const { requestPermissions, checkBluetoothEnabled, checkLocationEnabled } = useBLE();
  
  const [checking, setChecking] = useState(false);
  const [hasBlePermissions, setHasBlePermissions] = useState(false);
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [checked, setChecked] = useState(false);

  const checkRequirements = async () => {
    setChecking(true);
    setChecked(false);
    
    try {
      const [bluetooth, location] = await Promise.all([
        checkBluetoothEnabled(),
        checkLocationEnabled()
      ]);
      
      setIsBluetoothEnabled(bluetooth);
      setIsLocationEnabled(location);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setChecked(true);
    } catch (error) {
      console.error("Erro ao verificar requisitos:", error);
      Alert.alert("Erro", "Não foi possível verificar os requisitos");
    } finally {
      setChecking(false);
    }
  };

  React.useEffect(() => {
    if (visible) {
      checkRequirements();
    } else {
      setChecked(false);
      setHasBlePermissions(false);
    }
  }, [visible]);

  const canProceed = isBluetoothEnabled && isLocationEnabled;

  const handleProceed = () => {
    if (!canProceed) {
      if (!isBluetoothEnabled) {
        Alert.alert(
          "Bluetooth Desabilitado",
          "Por favor, habilite o Bluetooth nas configurações do dispositivo.",
          [{ text: "OK" }]
        );
        return;
      }
      
      if (!isLocationEnabled) {
        Alert.alert(
          "Localização Desabilitada",
          "Por favor, habilite a Localização nas configurações do dispositivo.",
          [{ text: "OK" }]
        );
        return;
      }
    }

    if (hasBlePermissions) {
      onProceed();
    } else {
      requestPermissions(isGranted => {
        setHasBlePermissions(isGranted);
        if (isGranted) {
          onProceed();
        } else {
          Alert.alert(
            "Permissões Necessárias",
            "As permissões de Bluetooth são necessárias para usar a leitura RFID.",
            [{ text: "OK" }]
          );
        }
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Verificação RFID</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.modalHeaderInfo}>
            <View style={styles.modalIcon}>
              <MaterialCommunityIcons name="contactless-payment" size={48} color="#2196F3" />
            </View>
            <Text style={styles.modalInfoTitle}>Configuração RFID</Text>
            <Text style={styles.modalInfoSubtitle}>
              Verificando requisitos necessários para leitura de tags RFID
            </Text>
          </View>

          {checking && (
            <View style={styles.checkingContainer}>
              <ActivityIndicator size="large" color="#F4A64E" />
              <Text style={styles.checkingText}>Verificando requisitos...</Text>
            </View>
          )}

          {!checking && checked && (
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Status dos Requisitos</Text>

              {/* Bluetooth */}
              <View style={styles.requirementCard}>
                <View style={[
                  styles.requirementIconLarge,
                  isBluetoothEnabled ? styles.requirementActiveIcon : styles.requirementInactiveIcon
                ]}>
                  <MaterialCommunityIcons 
                    name={isBluetoothEnabled ? "bluetooth" : "bluetooth-off"} 
                    size={32} 
                    color="white" 
                  />
                </View>
                <View style={styles.requirementContent}>
                  <Text style={styles.requirementTitle}>Bluetooth</Text>
                  <Text style={[
                    styles.requirementStatus,
                    isBluetoothEnabled ? styles.statusActive : styles.statusInactive
                  ]}>
                    {isBluetoothEnabled ? '✓ Habilitado' : '✗ Desabilitado'}
                  </Text>
                  <Text style={styles.requirementDescription}>
                    Necessário para comunicação com o leitor RFID
                  </Text>
                </View>
              </View>

              {/* Location */}
              <View style={styles.requirementCard}>
                <View style={[
                  styles.requirementIconLarge,
                  isLocationEnabled ? styles.requirementActiveIcon : styles.requirementInactiveIcon
                ]}>
                  <Feather 
                    name={isLocationEnabled ? "map-pin" : "map-pin"} 
                    size={32} 
                    color="white" 
                  />
                </View>
                <View style={styles.requirementContent}>
                  <Text style={styles.requirementTitle}>Localização</Text>
                  <Text style={[
                    styles.requirementStatus,
                    isLocationEnabled ? styles.statusActive : styles.statusInactive
                  ]}>
                    {isLocationEnabled ? '✓ Habilitada' : '✗ Desabilitada'}
                  </Text>
                  <Text style={styles.requirementDescription}>
                    Exigida pelo Android para uso de Bluetooth
                  </Text>
                </View>
              </View>

              <View style={styles.requirementCard}>
                <View style={[
                  styles.requirementIconLarge,
                  hasBlePermissions ? styles.requirementActiveIcon : styles.requirementWarningIcon
                ]}>
                  <Feather 
                    name="shield" 
                    size={32} 
                    color="white" 
                  />
                </View>
                <View style={styles.requirementContent}>
                  <Text style={styles.requirementTitle}>Permissões BLE</Text>
                  <Text style={[
                    styles.requirementStatus,
                    hasBlePermissions ? styles.statusActive : styles.statusWarning
                  ]}>
                    {hasBlePermissions ? '✓ Concedidas' : '⚠ Pendente'}
                  </Text>
                  <Text style={styles.requirementDescription}>
                    Será solicitada ao prosseguir
                  </Text>
                </View>
              </View>
            </View>
          )}
          {!checking && checked && !canProceed && (
            <View style={styles.warningCard}>
              <Feather name="alert-triangle" size={24} color="#FF9800" />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Ação Necessária</Text>
                <Text style={styles.warningText}>
                  {!isBluetoothEnabled && !isLocationEnabled
                    ? 'Habilite o Bluetooth e a Localização nas configurações do dispositivo.'
                    : !isBluetoothEnabled
                    ? 'Habilite o Bluetooth nas configurações do dispositivo.'
                    : 'Habilite a Localização nas configurações do dispositivo.'}
                </Text>
              </View>
            </View>
          )}
          {!checking && checked && canProceed && (
            <View style={styles.successCard}>
              <Feather name="check-circle" size={24} color="#5ECC63" />
              <View style={styles.successContent}>
                <Text style={styles.successTitle}>Tudo Pronto!</Text>
                <Text style={styles.successText}>
                  Todos os requisitos foram atendidos. Você pode prosseguir com a leitura RFID.
                </Text>
              </View>
            </View>
          )}

          {!checking && checked && (
            <View style={styles.helpCard}>
              <Feather name="info" size={20} color="#2196F3" />
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>Como funciona?</Text>
                <Text style={styles.helpText}>
                  1. O Bluetooth permite a comunicação com o leitor RFID{'\n'}
                  2. A Localização é exigida pelo Android para Bluetooth{'\n'}
                  3. As permissões concedem acesso ao Bluetooth LE
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {!checking && checked && (
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={checkRequirements}
            >
              <Feather name="refresh-cw" size={18} color="#F4A64E" />
              <Text style={styles.retryButtonText}>Verificar Novamente</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.proceedButton,
                !canProceed && styles.proceedButtonDisabled
              ]}
              onPress={handleProceed}
              disabled={!canProceed}
            >
              <Text style={styles.proceedButtonText}>
                {canProceed ? 'Continuar' : 'Requisitos Pendentes'}
              </Text>
              {canProceed && <Feather name="arrow-right" size={18} color="white" />}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const ScanScreen = () => {
    const navigation = useNavigation<RootStackNavigationProp>();
    const [rfidModalVisible, setRfidModalVisible] = useState(false);

    const handleRfidScanPress = () => {
        setRfidModalVisible(true);
    };

    const handleRfidProceed = () => {
        setRfidModalVisible(false);
        navigation.navigate('RFIDScanManager');
    };

    const handleQrCodeScanPress = () => {
        navigation.navigate("QrCodeScan" as never);
    };

    const handleHistoryPress = () => {
        navigation.navigate('MainTabs', {
            screen: 'Organizations',
            params: { tab: 'reports' }
        })
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
                <View style={styles.headerSection}>
                    <View style={styles.headerIcon}>
                        <MaterialCommunityIcons name="radar" size={32} color="#F4A64E" />
                    </View>
                    <Text style={styles.title}>Central de Leitura</Text>
                    <Text style={styles.subtitle}>
                        Gerencie seus ativos através de leitura{'\n'}
                        de códigos QR ou tags RFID
                    </Text>
                </View>
                <View style={styles.actionsSection}>
                    <Text style={styles.sectionTitle}>Ações Rápidas</Text>
                    
                    <View style={styles.buttonsGrid}>
                        <TouchableOpacity 
                            style={[styles.actionCard, styles.primaryCard]} 
                            onPress={handleQrCodeScanPress}
                        >
                            <View style={styles.cardIconContainer}>
                                <MaterialCommunityIcons name="qrcode-scan" size={28} color="white" />
                            </View>
                            <Text style={styles.cardTitle}>QR Code</Text>
                            <Text style={styles.cardDescription}>
                                Leitura rápida{'\n'}e precisa
                            </Text>
                            <View style={styles.cardArrow}>
                                <Feather name="arrow-right" size={16} color="white" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.actionCard, styles.secondaryCard]} 
                            onPress={handleRfidScanPress}
                        >
                            <View style={styles.cardIconContainer}>
                                <MaterialCommunityIcons 
                                    name="contactless-payment" 
                                    size={28} 
                                    color="white" 
                                />
                            </View>
                            <Text style={styles.cardTitle}>RFID</Text>
                            <Text style={styles.cardDescription}>
                                Leitura sem{'\n'}contato
                            </Text>
                            <View style={styles.cardArrow}>
                                <Feather name="arrow-right" size={16} color="white" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.additionalSection}>
                    <Text style={styles.sectionTitle}>Outras Opções</Text>
                    
                    <TouchableOpacity style={styles.optionItem} onPress={handleHistoryPress}>
                        <View style={styles.optionIcon}>
                            <MaterialCommunityIcons name="history" size={24} color="#F4A64E" />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Histórico de Leituras</Text>
                            <Text style={styles.optionDescription}>
                                Visualize todas as leituras anteriores
                            </Text>
                        </View>
                        <View style={styles.optionArrow}>
                            <Feather name="chevron-right" size={20} color="#ccc" />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.tipsSection}>
                    <View style={styles.tipCard}>
                        <Feather name="info" size={20} color="#5ECC63" />
                        <View style={styles.tipContent}>
                            <Text style={styles.tipTitle}>Dica</Text>
                            <Text style={styles.tipText}>
                                Para leitura RFID, mantenha o dispositivo próximo à tag. Os requisitos serão verificados antes de iniciar.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <RfidRequirementsModal
                visible={rfidModalVisible}
                onClose={() => setRfidModalVisible(false)}
                onProceed={handleRfidProceed}
            />
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
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },

    // Actions Section
    actionsSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    buttonsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    actionCard: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 16,
        padding: 20,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        position: 'relative',
    },
    primaryCard: {
        backgroundColor: '#FF9800',
    },
    secondaryCard: {
        backgroundColor: '#2196F3',
    },
    cardIconContainer: {
        alignSelf: 'flex-start',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 8,
    },
    cardDescription: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 16,
    },
    cardArrow: {
        position: 'absolute',
        top: 16,
        right: 16,
    },

    // Additional Options Section
    additionalSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        position: 'relative',
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    optionDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 18,
    },
    optionArrow: {
        marginLeft: 8,
    },
    comingSoonBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#FFE0B2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    comingSoonText: {
        fontSize: 10,
        color: '#F57C00',
        fontWeight: '600',
    },

    // Tips Section
    tipsSection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    tipCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#5ECC63',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tipContent: {
        flex: 1,
        marginLeft: 12,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#5ECC63',
        marginBottom: 4,
    },
    tipText: {
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
    },

    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: 'white',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    modalHeaderInfo: {
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    modalIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalInfoTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    modalInfoSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },

    // Checking State
    checkingContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 40,
        alignItems: 'center',
        gap: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    checkingText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },

    // Requirements
    requirementsContainer: {
        gap: 12,
        marginBottom: 20,
    },
    requirementsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    requirementCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        gap: 16,
    },
    requirementIconLarge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    requirementActiveIcon: {
        backgroundColor: '#5ECC63',
    },
    requirementInactiveIcon: {
        backgroundColor: '#C62828',
    },
    requirementWarningIcon: {
        backgroundColor: '#FF9800',
    },
    requirementContent: {
        flex: 1,
        justifyContent: 'center',
    },
    requirementTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    requirementStatus: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    statusActive: {
        color: '#5ECC63',
    },
    statusInactive: {
        color: '#C62828',
    },
    statusWarning: {
        color: '#FF9800',
    },
    requirementDescription: {
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
    },

    // Warning Card
    warningCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF3E0',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
        marginBottom: 16,
        gap: 12,
    },
    warningContent: {
        flex: 1,
    },
    warningTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F57C00',
        marginBottom: 4,
    },
    warningText: {
        fontSize: 14,
        color: '#E65100',
        lineHeight: 20,
    },

    // Success Card
    successCard: {
        flexDirection: 'row',
        backgroundColor: '#F1F8E9',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#5ECC63',
        marginBottom: 16,
        gap: 12,
    },
    successContent: {
        flex: 1,
    },
    successTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5ECC63',
        marginBottom: 4,
    },
    successText: {
        fontSize: 14,
        color: '#2E7D32',
        lineHeight: 20,
    },
    helpCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 20
    },
    helpContent: {
        flex: 1,
    },
    helpTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2196F3',
        marginBottom: 8,
    },
    helpText: {
        fontSize: 13,
        color: '#1565C0',
        lineHeight: 20,
    },

    // Modal Footer
    modalFooter: {
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        gap: 12,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        borderWidth: 2,
        borderColor: '#F4A64E',
    },
    retryButtonText: {
        fontSize: 16,
        color: '#F4A64E',
        fontWeight: '600',
    },
    proceedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4A64E',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#F4A64E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    proceedButtonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    proceedButtonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: '600',
    },
});

export default ScanScreen;