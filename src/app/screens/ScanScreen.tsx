import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useBLE from '../hooks/useBle';

const ScanScreen = () => {
    const navigation = useNavigation();
    const { requestPermissions } = useBLE();
    const [hasBlePermissions, setHasBlePermissions] = useState(false);

    const handleRfidScanPress = () => {
        if (hasBlePermissions) {
            navigation.navigate('DeviceDiscovery' as never);
        } else {
            requestPermissions(isGranted => {
                setHasBlePermissions(isGranted);
                if (isGranted) {
                    navigation.navigate('DeviceDiscovery' as never);
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
        Alert.alert("Funcionalidade Futura", "A leitura de QR Code será implementada em breve.");
    };

    const handleHistoryPress = () => {
        Alert.alert("Funcionalidade Futura", "O histórico de gerenciamento será implementado em breve.");
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.main}>
                <Text style={styles.title}>Central de Leitura</Text>
                <Text style={styles.subtitle}>Escolha uma opção para começar</Text>

                <TouchableOpacity style={styles.button} onPress={handleQrCodeScanPress}>
                    <MaterialCommunityIcons name="qrcode-scan" size={30} color="white" style={styles.icon} />
                    <Text style={styles.buttonText}>Ler QR Code</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleRfidScanPress}>
                    <MaterialCommunityIcons name="contactless-payment" size={30} color="white" style={styles.icon} />
                    <Text style={styles.buttonText}>
                        {hasBlePermissions ? 'Iniciar Leitura RFID' : 'Permissão RFID'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleHistoryPress}>
                    <MaterialCommunityIcons name="history" size={30} color="white" style={styles.icon} />
                    <Text style={styles.buttonText}>Histórico</Text>
                </TouchableOpacity>
            </View>
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
        justifyContent: 'center',
        alignItems: 'center', 
        padding: 20,
    },
    // Textos
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
        textAlign: 'center',
    },
    // Botões (sem alteração)
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F89F3C',
        paddingVertical: 18,
        paddingHorizontal: 25,
        borderRadius: 15,
        marginBottom: 20,
        width: '90%',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    icon: {
        marginRight: 15,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default ScanScreen;