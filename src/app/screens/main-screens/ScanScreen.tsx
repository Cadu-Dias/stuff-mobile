import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { RootStackNavigationProp } from '../../models/stackType';
import useBLE from '../../hooks/useBle';

const ScanScreen = () => {
    const navigation = useNavigation<RootStackNavigationProp>();
    const { requestPermissions, checkBluetoothEnabled, checkLocationEnabled } = useBLE();
    
    const [hasBlePermissions, setHasBlePermissions] = useState(false);
    const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
    const [isLocationEnabled, setIsLocationEnabled] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);

    const checkServicesStatus = async () => {
        setIsCheckingStatus(true);
        try {
            const [bluetooth, location] = await Promise.all([
                checkBluetoothEnabled(),
                checkLocationEnabled()
            ]);
            
            setIsBluetoothEnabled(bluetooth);
            setIsLocationEnabled(location);
            console.log("Status - Bluetooth:", bluetooth, "Localização:", location);
        } catch (error) {
            console.error("Erro ao verificar status:", error);
        } finally {
            setIsCheckingStatus(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            checkServicesStatus();
        }, [])
    );

    const canUseRfid = isBluetoothEnabled && isLocationEnabled;

    const handleRfidScanPress = () => {
        if (!isBluetoothEnabled) {
            Alert.alert(
                "Bluetooth Desabilitado",
                "Por favor, habilite o Bluetooth para usar a leitura RFID.",
                [{ text: "OK" }]
            );
            return;
        }

        if (!isLocationEnabled) {
            Alert.alert(
                "Localização Desabilitada",
                "Por favor, habilite a localização para usar a leitura RFID via Bluetooth.",
                [{ text: "OK" }]
            );
            return;
        }

        if (hasBlePermissions) {
            navigation.navigate('RFIDScanManager');
        } else {
            requestPermissions(isGranted => {
                setHasBlePermissions(isGranted);
                if (isGranted) {
                    navigation.navigate('RFIDScanManager');
                }
            });
        }
    };

    const handleQrCodeScanPress = () => {
        navigation.navigate("QrCodeScan" as never);
    };

    const handleHistoryPress = () => {
        Alert.alert("Funcionalidade Futura", "O histórico de gerenciamento será implementado em breve.");
    };

    const getRfidStatusMessage = () => {
        if (isCheckingStatus) return 'Verificando...';
        if (!isBluetoothEnabled) return 'Bluetooth\ndesabilitado';
        if (!isLocationEnabled) return 'Localização\ndesabilitada';
        if (!hasBlePermissions) return 'Configurar\npermissões';
        return 'Leitura sem\ncontato';
    };

    const getRfidStatusIcon = () => {
        if (!isBluetoothEnabled) return 'bluetooth-off';
        if (!isLocationEnabled) return 'location-exit';
        return 'contactless-payment';
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
                {/* Header Section */}
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

                {/* Quick Actions Section */}
                <View style={styles.actionsSection}>
                    <Text style={styles.sectionTitle}>Ações Rápidas</Text>
                    
                    <View style={styles.buttonsGrid}>
                        {/* QR Code Button */}
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

                        {/* RFID Button */}
                        <TouchableOpacity 
                            style={[
                                styles.actionCard, 
                                canUseRfid ? styles.secondaryCard : styles.disabledCard
                            ]} 
                            onPress={handleRfidScanPress}
                            disabled={!canUseRfid}
                        >
                            <View style={styles.cardIconContainer}>
                                <MaterialCommunityIcons 
                                    name={getRfidStatusIcon()} 
                                    size={28} 
                                    color="white" 
                                />
                            </View>
                            <Text style={styles.cardTitle}>RFID</Text>
                            <Text style={styles.cardDescription}>
                                {getRfidStatusMessage()}
                            </Text>
                            {canUseRfid && (
                                <View style={styles.cardArrow}>
                                    <Feather name="arrow-right" size={16} color="white" />
                                </View>
                            )}
                            {!canUseRfid && (
                                <View style={styles.warningBadge}>
                                    <Feather name="alert-triangle" size={12} color="#FF6B6B" />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Status Messages */}
                    {!canUseRfid && !isCheckingStatus && (
                        <View style={styles.statusMessage}>
                            <Feather name="info" size={16} color="#FF9800" />
                            <Text style={styles.statusMessageText}>
                                {!isBluetoothEnabled && !isLocationEnabled
                                    ? 'Habilite o Bluetooth e a Localização para usar RFID'
                                    : !isBluetoothEnabled
                                    ? 'Habilite o Bluetooth para usar RFID'
                                    : 'Habilite a Localização para usar RFID'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Requirements Section */}
                <View style={styles.requirementsSection}>
                    <Text style={styles.sectionTitle}>Requisitos para RFID</Text>
                    
                    <View style={styles.requirementItem}>
                        <View style={[
                            styles.requirementIcon,
                            isBluetoothEnabled && styles.requirementIconActive
                        ]}>
                            <Feather 
                                name={isBluetoothEnabled ? "check" : "x"} 
                                size={16} 
                                color="white" 
                            />
                        </View>
                        <Text style={styles.requirementText}>Bluetooth habilitado</Text>
                        {isCheckingStatus && <ActivityIndicator size="small" color="#F4A64E" />}
                    </View>

                    <View style={styles.requirementItem}>
                        <View style={[
                            styles.requirementIcon,
                            isLocationEnabled && styles.requirementIconActive
                        ]}>
                            <Feather 
                                name={isLocationEnabled ? "check" : "x"} 
                                size={16} 
                                color="white" 
                            />
                        </View>
                        <Text style={styles.requirementText}>Localização habilitada</Text>
                        {isCheckingStatus && <ActivityIndicator size="small" color="#F4A64E" />}
                    </View>

                    <TouchableOpacity 
                        style={styles.refreshButton}
                        onPress={checkServicesStatus}
                    >
                        <Feather name="refresh-cw" size={16} color="#F4A64E" />
                        <Text style={styles.refreshButtonText}>Verificar novamente</Text>
                    </TouchableOpacity>
                </View>

                {/* Additional Options Section */}
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
                        <View style={styles.comingSoonBadge}>
                            <Text style={styles.comingSoonText}>Em breve</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Tips Section */}
                <View style={styles.tipsSection}>
                    <View style={styles.tipCard}>
                        <Feather name="info" size={20} color="#5ECC63" />
                        <View style={styles.tipContent}>
                            <Text style={styles.tipTitle}>Dica</Text>
                            <Text style={styles.tipText}>
                                Para melhor resultado na leitura RFID, mantenha o dispositivo próximo à tag e certifique-se de que o Bluetooth e a Localização estejam habilitados
                            </Text>
                        </View>
                    </View>
                </View>
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
    disabledCard: {
        backgroundColor: '#B0B0B0',
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
    warningBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Status Message
    statusMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        gap: 8,
    },
    statusMessageText: {
        flex: 1,
        fontSize: 13,
        color: '#F57C00',
        fontWeight: '500',
    },

    // Requirements Section
    requirementsSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 14,
        borderRadius: 10,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    requirementIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#C62828',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    requirementIconActive: {
        backgroundColor: '#5ECC63',
    },
    requirementText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 10,
        marginTop: 8,
        gap: 8,
        borderWidth: 1,
        borderColor: '#F4A64E',
    },
    refreshButtonText: {
        fontSize: 14,
        color: '#F4A64E',
        fontWeight: '600',
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
});

export default ScanScreen;