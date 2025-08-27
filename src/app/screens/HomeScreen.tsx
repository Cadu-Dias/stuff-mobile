import React, { useEffect, useState } from "react";
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useBLE from "../hooks/useBle";


const HomeScreen = () => {

    const { requestPermissions } = useBLE();

    const [enableScanButton, setEnableScanButton] = useState(false);
    const navigator = useNavigation();

    useEffect(() => {
        requestPermissions(isGranted => setEnableScanButton(isGranted));
    }, [requestPermissions]);
    
    return (
        <View style={styles.container}>
            <StatusBar style="auto" />
            <View style={styles.header}>
                <MaterialCommunityIcons name="cube-outline" size={80} color="#FFA500" />
                <Text style={styles.title}>Stuff</Text>
                <Text style={styles.subtitle}>Gerenciamento de Estoque</Text>
            </View>

            <TouchableOpacity 
                onPress={() => { navigator.navigate('DeviceDiscovery' as never); }} 
                disabled={!enableScanButton}
                style={[styles.button, !enableScanButton && styles.buttonDisabled]}
            >
                <Text style={styles.buttonText}>Escanear Objeto</Text>
            </TouchableOpacity>

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 0.8,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#888',
        marginTop: 5,
    },
    button: {
        backgroundColor: '#FFA500',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    buttonDisabled: {
        backgroundColor: '#cccccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default HomeScreen;