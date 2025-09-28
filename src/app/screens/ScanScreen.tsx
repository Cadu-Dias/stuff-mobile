import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { RootStackNavigationProp } from '../models/stackType';
import useBLE from '../hooks/useBle';

const ScanScreen = () => {
    const navigation = useNavigation<RootStackNavigationProp>();
    const { requestPermissions } = useBLE();
    const [hasBlePermissions, setHasBlePermissions] = useState(false);

    const handleRfidScanPress = () => {
        if (hasBlePermissions) {
            navigation.navigate('RFIDScanManager');
        } else {
            requestPermissions(isGranted => {
                setHasBlePermissions(isGranted);
                if (isGranted) {
                    navigation.navigate('RFIDScanManager');
                } else {
                    Alert.alert(
                        "Permissões Negadas",
                        "Para usar a leitura de RFID, as permissões de Bluetooth e Localização são necessárias. Por favor, habilite-as nas configurações do seu dispositivo.",
                        [{ text: "OK" }]
                    );
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
                            style={[styles.actionCard, styles.secondaryCard]} 
                            onPress={handleRfidScanPress}
                        >
                            <View style={styles.cardIconContainer}>
                                <MaterialCommunityIcons name="contactless-payment" size={28} color="white" />
                            </View>
                            <Text style={styles.cardTitle}>RFID</Text>
                            <Text style={styles.cardDescription}>
                                {hasBlePermissions ? 'Leitura sem\ncontato' : 'Configurar\npermissões'}
                            </Text>
                            <View style={styles.cardArrow}>
                                <Feather name="arrow-right" size={16} color="white" />
                            </View>
                            {!hasBlePermissions && (
                                <View style={styles.permissionBadge}>
                                    <Feather name="alert-triangle" size={12} color="#FF6B6B" />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
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
                                Para melhor resultado na leitura RFID, mantenha o dispositivo próximo à tag
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
        marginBottom: 30,
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
        backgroundColor: '#5ECC63',
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
    permissionBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Additional Options Section
    additionalSection: {
        paddingHorizontal: 20,
        marginBottom: 30,
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