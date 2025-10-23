import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, SafeAreaView, ScrollView,
    ActivityIndicator, TouchableOpacity, TextInput,
    Alert, Modal, Platform, Switch
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AssetService } from '../../services/asset.service';
import { Asset, AttributeDetail, AttributeValue } from '../../models/asset.model';
import { RootStackNavigationProp } from '../../models/stackType';
import { AttributeService } from '../../services/attribute.service';
import useBLE from '../../hooks/useBle';
import { BluetoothDevice } from 'react-native-bluetooth-classic';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ATTRIBUTE_TYPES = {
    number: 'Número',
    text: 'Texto',
    metric: 'Métrica',
    date: 'Data',
    switch: 'Interruptor',
    selection: 'Seleção',
    multi_selection: 'Múltipla Seleção',
    file: 'Arquivo',
    time_metric: 'Métrica de Tempo',
    rfid: 'RFID'
};

interface RFIDScanModalProps {
    visible: boolean;
    onClose: () => void;
    onRFIDScanned: (rfid: string) => void;
}

const RFIDScanModal = ({ visible, onClose, onRFIDScanned }: RFIDScanModalProps) => {
    const {
        allDevices,
        isDiscovering,
        scanForPeripherals,
        connectToDevice,
        connectedDevice,
        cancelDiscovery,
        disconnectFromDevice,
        scannedRfids,
    } = useBLE();

    const [connectingTo, setConnectingTo] = useState<BluetoothDevice | null>(null);
    const [scanStage, setScanStage] = useState<'confirmation' | 'discovery' | 'scanning'>('discovery');
    const [savedDevice, setSavedDevice] = useState<{name: string, address: string} | null>(null);

    useEffect(() => {
        if (visible) {
            checkSavedDevice();
        } else {
            cancelDiscovery();
            disconnectFromDevice();
        }
    }, [visible]);

    const checkSavedDevice = async () => {
        try {
            const deviceInfoStr = await AsyncStorage.getItem("device-info");
            if (deviceInfoStr) {
                const deviceInfo = JSON.parse(deviceInfoStr);
                setSavedDevice(deviceInfo);
                setScanStage('confirmation');
            } else {
                setSavedDevice(null);
                setScanStage('discovery');
                scanForPeripherals();
            }
        } catch (error) {
            console.error("Erro ao verificar dispositivo salvo:", error);
            setScanStage('discovery');
            scanForPeripherals();
        }
    };

    useEffect(() => {
        if (connectedDevice) {
            setScanStage('scanning');
        }
    }, [connectedDevice]);

    useEffect(() => {
        if (scannedRfids.length > 0 && scanStage === 'scanning') {
            const firstRFID = scannedRfids[0];
            onRFIDScanned(firstRFID);
            disconnectFromDevice();
            onClose();
        }
    }, [scannedRfids, scanStage]);

    const handleUseSavedDevice = async () => {
        if (!savedDevice) return;

        setConnectingTo({ address: savedDevice.address, name: savedDevice.name } as BluetoothDevice);
        
        try {
            await connectToDevice(savedDevice.address);
        } catch (error) {
            console.error("Falha ao conectar ao dispositivo salvo:", error);
            Alert.alert(
                "Erro de Conexão", 
                "Não foi possível conectar ao dispositivo anterior. Deseja procurar novos dispositivos?",
                [
                    {
                        text: "Cancelar",
                        style: "cancel",
                        onPress: () => {
                            setConnectingTo(null);
                            onClose();
                        }
                    },
                    {
                        text: "Procurar",
                        onPress: async () => {
                            await handleUseNewDevice();
                        }
                    }
                ]
            );
        } finally {
            setConnectingTo(null);
        }
    };

    const handleUseNewDevice = async () => {
        try {
            await AsyncStorage.removeItem("device-info");
            setSavedDevice(null);
            setScanStage('discovery');
            scanForPeripherals();
        } catch (error) {
            console.error("Erro ao limpar dispositivo salvo:", error);
            setScanStage('discovery');
            scanForPeripherals();
        }
    };

    const handleConnectPress = async (device: BluetoothDevice) => {
        if (connectingTo || connectedDevice) return;

        setConnectingTo(device);
        try {
            await connectToDevice(device.address);
            await AsyncStorage.setItem("device-info", JSON.stringify({ name: device.name, address: device.address }));
        } catch (error) {
            console.error("Falha ao conectar:", error);
            Alert.alert("Erro", "Não foi possível conectar ao dispositivo");
        } finally {
            setConnectingTo(null);
        }
    };

    const handleClose = () => {
        cancelDiscovery();
        disconnectFromDevice();
        onClose();
    };

    const renderConfirmationStage = () => (
        <>
            <View style={styles.scanModalHeader}>
                <TouchableOpacity onPress={handleClose}>
                    <Feather name="x" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.scanModalTitle}>Dispositivo Salvo</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.scanModalContent}>
                <View style={styles.rfidScanHeader}>
                    <View style={styles.rfidScanIcon}>
                        <MaterialCommunityIcons name="bluetooth-connect" size={32} color="#F4A64E" />
                    </View>
                    <Text style={styles.rfidScanTitle}>Usar Dispositivo Anterior?</Text>
                    <Text style={styles.rfidScanSubtitle}>
                        Encontramos um dispositivo conectado anteriormente
                    </Text>
                </View>

                <View style={styles.savedDeviceCard}>
                    <View style={styles.savedDeviceIcon}>
                        <MaterialCommunityIcons name="bluetooth" size={32} color="#4CAF50" />
                    </View>
                    <View style={styles.savedDeviceInfo}>
                        <Text style={styles.savedDeviceName}>{savedDevice?.name || 'Dispositivo Sem Nome'}</Text>
                        <Text style={styles.savedDeviceAddress}>{savedDevice?.address}</Text>
                    </View>
                    <View style={styles.savedDeviceBadge}>
                        <Feather name="check-circle" size={16} color="#4CAF50" />
                        <Text style={styles.savedDeviceBadgeText}>Salvo</Text>
                    </View>
                </View>

                <View style={styles.confirmationButtons}>
                    <TouchableOpacity
                        style={[styles.confirmationButton, styles.useSavedButton]}
                        onPress={handleUseSavedDevice}
                        disabled={!!connectingTo}
                    >
                        {connectingTo ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <Feather name="zap" size={20} color="white" />
                                <Text style={styles.confirmationButtonText}>Usar Este Dispositivo</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.confirmationButton, styles.useNewButton]}
                        onPress={handleUseNewDevice}
                        disabled={!!connectingTo}
                    >
                        <Feather name="search" size={20} color="#F4A64E" />
                        <Text style={[styles.confirmationButtonText, styles.useNewButtonText]}>
                            Procurar Outro
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.confirmationHint}>
                    <Feather name="info" size={16} color="#2196F3" />
                    <Text style={styles.confirmationHintText}>
                        Conectar ao dispositivo salvo é mais rápido. Você pode procurar outro se preferir.
                    </Text>
                </View>
            </View>
        </>
    );

    const renderDiscoveryStage = () => (
        <>
            <View style={styles.scanModalHeader}>
                <TouchableOpacity onPress={handleClose}>
                    <Feather name="x" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.scanModalTitle}>Conectar Leitor RFID</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.scanModalContent}>
                <View style={styles.rfidScanHeader}>
                    <View style={styles.rfidScanIcon}>
                        <MaterialCommunityIcons name="bluetooth-connect" size={32} color="#F4A64E" />
                    </View>
                    <Text style={styles.rfidScanTitle}>Procurando Dispositivos</Text>
                    <Text style={styles.rfidScanSubtitle}>
                        Certifique-se de que o leitor está ligado e próximo
                    </Text>
                </View>

                <View style={styles.scanActionButtons}>
                    <TouchableOpacity
                        style={[styles.scanActionButton, isDiscovering && styles.scanActionButtonActive]}
                        onPress={isDiscovering ? cancelDiscovery : scanForPeripherals}
                    >
                        {isDiscovering && <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />}
                        <Text style={styles.scanActionButtonText}>
                            {isDiscovering ? 'Parando...' : 'Buscar Dispositivos'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.devicesList} showsVerticalScrollIndicator={false}>
                    {allDevices.length === 0 ? (
                        <View style={styles.emptyDevices}>
                            <MaterialCommunityIcons 
                                name={isDiscovering ? "bluetooth-connect" : "bluetooth-off"} 
                                size={48} 
                                color="#ccc" 
                            />
                            <Text style={styles.emptyDevicesText}>
                                {isDiscovering ? 'Procurando...' : 'Nenhum dispositivo encontrado'}
                            </Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.devicesListTitle}>
                                Dispositivos Encontrados ({allDevices.length})
                            </Text>
                            {allDevices.map((device) => {
                                const isConnecting = connectingTo?.id === device.id;
                                return (
                                    <TouchableOpacity
                                        key={device.id}
                                        style={[styles.deviceCard, isConnecting && styles.deviceCardConnecting]}
                                        onPress={() => handleConnectPress(device)}
                                        disabled={isConnecting}
                                    >
                                        <View style={styles.deviceCardIcon}>
                                            <MaterialCommunityIcons name="bluetooth" size={24} color="#F4A64E" />
                                        </View>
                                        <View style={styles.deviceCardInfo}>
                                            <Text style={styles.deviceCardName}>
                                                {device.name || 'Dispositivo Sem Nome'}
                                            </Text>
                                            <Text style={styles.deviceCardAddress}>{device.address}</Text>
                                        </View>
                                        {isConnecting ? (
                                            <ActivityIndicator size="small" color="#F4A64E" />
                                        ) : (
                                            <Feather name="chevron-right" size={20} color="#ccc" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </>
                    )}
                </ScrollView>
            </View>
        </>
    );

    const renderScanningStage = () => (
        <>
            <View style={styles.scanModalHeader}>
                <TouchableOpacity onPress={handleClose}>
                    <Feather name="x" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.scanModalTitle}>Escaneando RFID</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.scanModalContent}>
                <View style={styles.rfidScanningContainer}>
                    <View style={styles.rfidScanIcon}>
                        <MaterialCommunityIcons name="radar" size={64} color="#F4A64E" />
                    </View>
                    <ActivityIndicator size="large" color="#F4A64E" style={{ marginVertical: 20 }} />
                    <Text style={styles.rfidScanningTitle}>Aguardando Tag RFID...</Text>
                    <Text style={styles.rfidScanningSubtitle}>
                        Aproxime a tag do leitor
                    </Text>
                    
                    {connectedDevice && (
                        <View style={styles.connectedDeviceInfo}>
                            <View style={styles.connectedDot} />
                            <Text style={styles.connectedDeviceText}>
                                Conectado: {connectedDevice.name}
                            </Text>
                        </View>
                    )}

                    <View style={styles.scanningInstruction}>
                        <Feather name="info" size={16} color="#2196F3" />
                        <Text style={styles.scanningInstructionText}>
                            O primeiro RFID detectado será automaticamente preenchido no campo
                        </Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.cancelScanButton} onPress={handleClose}>
                    <Text style={styles.cancelScanButtonText}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        </>
    );

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={styles.scanModalContainer}>
                {scanStage === 'confirmation' && renderConfirmationStage()}
                {scanStage === 'discovery' && renderDiscoveryStage()}
                {scanStage === 'scanning' && renderScanningStage()}
            </SafeAreaView>
        </Modal>
    );
};

interface EditModalProps {
    visible: boolean;
    type: 'asset' | 'new-attribute';
    data: any;
    assetId?: string;
    onSave: (data: any) => Promise<void>;
    onCancel: () => void;
}

const EditModal = ({ visible, type, data, assetId, onSave, onCancel }: EditModalProps) => {
    const [formData, setFormData] = useState(data || {});
    const [saving, setSaving] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [dateValue, setDateValue] = useState(new Date());
    const [tempDate, setTempDate] = useState(new Date());
    const [rfidScanModalVisible, setRfidScanModalVisible] = useState(false);

    const [hasBlePermissions, setHasBlePermissions] = useState(false);
    const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
    const [isLocationEnabled, setIsLocationEnabled] = useState(false);

    const { 
        requestPermissions, 
        checkBluetoothEnabled, 
        checkLocationEnabled 
    } = useBLE();


    useEffect(() => {
        setFormData(data || {});
        if (data?.value && data?.type === 'date') {
            const parsedDate = new Date(data.value);
            if (!isNaN(parsedDate.getTime())) {
                setDateValue(parsedDate);
                setTempDate(parsedDate);
            }
        } else {
            setDateValue(new Date());
            setTempDate(new Date());
        }
    }, [data]);


    useEffect(() => {
        if (visible) {
            checkServicesStatus();
        }
    }, [visible]);


    useEffect(() => {
        setFormData(data || {});
        if (data?.value && data?.type === 'date') {
            const parsedDate = new Date(data.value);
            if (!isNaN(parsedDate.getTime())) {
                setDateValue(parsedDate);
                setTempDate(parsedDate);
            }
        } else {
            setDateValue(new Date());
            setTempDate(new Date());
        }
    }, [data]);

    
    const checkServicesStatus = async () => {
        try {
            const [bluetooth, location] = await Promise.all([
                checkBluetoothEnabled(),
                checkLocationEnabled()
            ]);
            
            setIsBluetoothEnabled(bluetooth);
            setIsLocationEnabled(location);
        } catch (error) {
            console.error("Erro ao verificar status:", error);
        }
    };

    const handleOpenRfidScan = async () => {
        // Verificar se Bluetooth está habilitado
        if (!isBluetoothEnabled) {
            Alert.alert(
                "Bluetooth Desabilitado",
                "Por favor, habilite o Bluetooth para usar a leitura RFID.",
                [
                    { 
                        text: "OK",
                        onPress: checkServicesStatus // Verificar novamente quando fechar
                    }
                ]
            );
            return;
        }

        // Verificar se Localização está habilitada
        if (!isLocationEnabled) {
            Alert.alert(
                "Localização Desabilitada",
                "Por favor, habilite a localização para usar a leitura RFID via Bluetooth.",
                [
                    { 
                        text: "OK",
                        onPress: checkServicesStatus // Verificar novamente quando fechar
                    }
                ]
            );
            return;
        }

        // Verificar permissões BLE
        if (hasBlePermissions) {
            setRfidScanModalVisible(true);
        } else {
            requestPermissions(isGranted => {
                setHasBlePermissions(isGranted);
                if (isGranted) {
                    setRfidScanModalVisible(true);
                } else {
                    Alert.alert(
                        "Permissões Necessárias",
                        "As permissões de Bluetooth são necessárias para escanear tags RFID.",
                        [{ text: "OK" }]
                    );
                }
            });
        }
    };

    const validateValue = (value: string, type: string): boolean => {
        if (!value || value.trim() === '') {
            Alert.alert("Erro", "O valor não pode estar vazio!");
            return false;
        }

        switch (type) {
            case 'number':
            case 'metric':
            case 'time_metric':
                if (isNaN(Number(value))) {
                    Alert.alert("Erro", "O valor deve ser um número válido!");
                    return false;
                }
                break;
            
            case 'date':
                const parsedDate = new Date(value);
                if (isNaN(parsedDate.getTime())) {
                    Alert.alert("Erro", "Data inválida!");
                    return false;
                }
                break;
        }

        return true;
    };

    const handleSave = async () => {
        if (type === 'new-attribute') {
            if (!formData.name || !formData.description || !formData.type) {
                Alert.alert("Erro", "Nome, descrição e tipo são obrigatórios!");
                return;
            }

            if (formData.type === 'switch') {
                if (formData.value === undefined || formData.value === null || formData.value === '') {
                    formData.value = 'false';
                }
            } else if (formData.type === 'date') {
                if (!formData.value) {
                    Alert.alert("Erro", "Por favor, selecione uma data!");
                    return;
                }
            } else {
                if (!validateValue(formData.value, formData.type)) {
                    return;
                }
            }
        }
        
        setSaving(true);
        try {
            await onSave(formData);
        } finally {
            setSaving(false);
        }
    };

    const handleRFIDScanned = (rfid: string) => {
        setFormData({ ...formData, value: rfid });
        setRfidScanModalVisible(false);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || tempDate;
        
        if (event.type === 'dismissed') {
            setShowDatePicker(false);
            setShowTimePicker(false);
            return;
        }

        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            if (selectedDate) {
                setTempDate(currentDate);
                setShowTimePicker(true);
            }
        } else {
            if (selectedDate) {
                setTempDate(currentDate);
            }
        }
    };

    const handleTimeChange = (event: any, selectedTime?: Date) => {
        if (event.type === 'dismissed') {
            setShowTimePicker(false);
            return;
        }

        setShowTimePicker(false);
        
        if (selectedTime) {
            const combined = new Date(tempDate);
            combined.setHours(selectedTime.getHours());
            combined.setMinutes(selectedTime.getMinutes());
            
            setDateValue(combined);
            setFormData({ ...formData, value: combined.toISOString() });
        }
    };

    const confirmIOSDate = () => {
        setShowDatePicker(false);
        setDateValue(tempDate);
        setFormData({ ...formData, value: tempDate.toISOString() });
    };

    const formatDateTime = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderValueInput = () => {
        const attributeType = formData.type;

        switch (attributeType) {
            case 'number':
            case 'metric':
            case 'time_metric':
                return (
                    <>
                        <TextInput
                            style={styles.input}
                            value={formData.value || ''}
                            onChangeText={(text) => {
                                const numericValue = text.replace(/[^0-9.]/g, '');
                                setFormData({ ...formData, value: numericValue });
                            }}
                            placeholder="Digite um valor numérico"
                            placeholderTextColor="#999"
                            keyboardType="decimal-pad"
                            editable={!saving}
                        />
                        <Text style={styles.inputHint}>
                            Digite apenas números. Use ponto (.) para decimais.
                        </Text>
                    </>
                );

            case 'date':
                return (
                    <>
                        <TouchableOpacity
                            style={[styles.input, styles.dateButton]}
                            onPress={() => {
                                setTempDate(formData.value ? new Date(formData.value) : new Date());
                                setShowDatePicker(true);
                            }}
                            disabled={saving}
                        >
                            <Feather name="calendar" size={16} color="#666" />
                            <Text style={[
                                styles.dateButtonText,
                                !formData.value && styles.dateButtonPlaceholder
                            ]}>
                                {formData.value ? formatDateTime(formData.value) : 'Selecione data e hora'}
                            </Text>
                        </TouchableOpacity>
                        
                        {showDatePicker && (
                            <>
                                <DateTimePicker
                                    value={tempDate}
                                    mode="date"
                                    is24Hour={true}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDateChange}
                                    locale="pt-BR"
                                />
                                {Platform.OS === 'ios' && (
                                    <TouchableOpacity
                                        style={styles.confirmDateButton}
                                        onPress={confirmIOSDate}
                                    >
                                        <Text style={styles.confirmDateButtonText}>Confirmar Data</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                        
                        {showTimePicker && Platform.OS === 'android' && (
                            <DateTimePicker
                                value={tempDate}
                                mode="time"
                                is24Hour={true}
                                display="default"
                                onChange={handleTimeChange}
                                locale="pt-BR"
                            />
                        )}
                        
                        <Text style={styles.inputHint}>
                            Selecione a data e hora desejadas
                        </Text>
                    </>
                );

            case 'switch':
                return (
                    <>
                        <View style={styles.switchContainer}>
                            <Text style={styles.switchLabel}>
                                {formData.value === 'true' || formData.value === true ? 'Ativado' : 'Desativado'}
                            </Text>
                            <Switch
                                value={formData.value === 'true' || formData.value === true}
                                onValueChange={(val) => setFormData({ ...formData, value: val.toString() })}
                                trackColor={{ false: '#ccc', true: '#F4A64E' }}
                                thumbColor={formData.value === 'true' || formData.value === true ? '#fff' : '#f4f3f4'}
                                disabled={saving}
                            />
                        </View>
                        <Text style={styles.inputHint}>
                            Defina o valor inicial do interruptor
                        </Text>
                    </>
                );

            case 'rfid':
                const canUseRfid = isBluetoothEnabled && isLocationEnabled;
                
                return (
                    <>
                        <View style={styles.valueInputContainer}>
                            <TextInput
                                style={[styles.input, styles.inputWithButton]}
                                value={formData.value || ''}
                                onChangeText={(text) => setFormData({ ...formData, value: text })}
                                placeholder="Escaneie ou digite o RFID"
                                placeholderTextColor="#999"
                                editable={!saving}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.scanButton,
                                    !canUseRfid && styles.scanButtonDisabled
                                ]}
                                onPress={handleOpenRfidScan}
                                disabled={saving}
                            >
                                <MaterialCommunityIcons 
                                    name={canUseRfid ? "radar" : "radio-off"} 
                                    size={20} 
                                    color="white" 
                                />
                                <Text style={styles.scanButtonText}>Escanear</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {/* Indicadores de status */}
                        <View style={styles.rfidStatusContainer}>
                            <View style={styles.rfidStatusItem}>
                                <Feather 
                                    name={isBluetoothEnabled ? "check-circle" : "x-circle"} 
                                    size={14} 
                                    color={isBluetoothEnabled ? "#5ECC63" : "#FF6B6B"} 
                                />
                                <Text style={[
                                    styles.rfidStatusText,
                                    !isBluetoothEnabled && styles.rfidStatusTextError
                                ]}>
                                    Bluetooth {isBluetoothEnabled ? 'ativo' : 'inativo'}
                                </Text>
                            </View>
                            
                            <View style={styles.rfidStatusItem}>
                                <Feather 
                                    name={isLocationEnabled ? "check-circle" : "x-circle"} 
                                    size={14} 
                                    color={isLocationEnabled ? "#5ECC63" : "#FF6B6B"} 
                                />
                                <Text style={[
                                    styles.rfidStatusText,
                                    !isLocationEnabled && styles.rfidStatusTextError
                                ]}>
                                    Localização {isLocationEnabled ? 'ativa' : 'inativa'}
                                </Text>
                            </View>
                        </View>

                        {!canUseRfid && (
                            <View style={styles.rfidWarning}>
                                <Feather name="alert-triangle" size={16} color="#FF9800" />
                                <Text style={styles.rfidWarningText}>
                                    {!isBluetoothEnabled && !isLocationEnabled
                                        ? 'Habilite o Bluetooth e a Localização para escanear'
                                        : !isBluetoothEnabled
                                        ? 'Habilite o Bluetooth para escanear'
                                        : 'Habilite a Localização para escanear'}
                                </Text>
                            </View>
                        )}

                        <Text style={styles.inputHint}>
                            Use o botão para escanear um RFID tag ou digite manualmente
                        </Text>
                    </>
                );

            case 'text':
            default:
                return (
                    <>
                        <TextInput
                            style={styles.input}
                            value={formData.value || ''}
                            onChangeText={(text) => setFormData({ ...formData, value: text })}
                            placeholder="Digite o valor inicial"
                            placeholderTextColor="#999"
                            editable={!saving}
                        />
                        <Text style={styles.inputHint}>
                            Digite o valor inicial do atributo
                        </Text>
                    </>
                );
        }
    };

    const getModalTitle = () => {
        switch (type) {
            case 'asset':
                return 'Editar Ativo';
            case 'new-attribute':
                return 'Novo Atributo';
            default:
                return 'Editar';
        }
    };

    return (
        <>
            <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={onCancel} disabled={saving}>
                            <Feather name="x" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{getModalTitle()}</Text>
                        <TouchableOpacity 
                            onPress={handleSave} 
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.saveButtonText}>
                                    {type === 'new-attribute' ? 'Criar' : 'Salvar'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        {type === 'asset' ? (
                            <>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>
                                        <Feather name="tag" size={14} color="#F4A64E" /> Nome
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.name || ''}
                                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                                        placeholder="Nome do ativo"
                                        placeholderTextColor="#999"
                                        editable={!saving}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>
                                        <Feather name="file-text" size={14} color="#F4A64E" /> Descrição
                                    </Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        value={formData.description || ''}
                                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                                        placeholder="Descrição do ativo"
                                        placeholderTextColor="#999"
                                        multiline
                                        numberOfLines={4}
                                        editable={!saving}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>
                                        <Feather name="bookmark" size={14} color="#F4A64E" /> Tipo
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.type || ''}
                                        onChangeText={(text) => setFormData({ ...formData, type: text })}
                                        placeholder="Tipo do ativo"
                                        placeholderTextColor="#999"
                                        editable={!saving}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>
                                        <Feather name="hash" size={14} color="#F4A64E" /> Quantidade
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.quantity?.toString() || ''}
                                        onChangeText={(text) => setFormData({ ...formData, quantity: parseInt(text) || 0 })}
                                        placeholder="Quantidade"
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                        editable={!saving}
                                    />
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={styles.formSection}>
                                    <Text style={styles.formSectionTitle}>Informações Básicas</Text>
                                    
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>
                                            <Feather name="tag" size={14} color="#F4A64E" /> Nome *
                                        </Text>
                                        <TextInput
                                            style={styles.input}
                                            value={formData.name || ''}
                                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                                            placeholder="Nome do atributo"
                                            placeholderTextColor="#999"
                                            editable={!saving}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>
                                            <Feather name="file-text" size={14} color="#F4A64E" /> Descrição *
                                        </Text>
                                        <TextInput
                                            style={[styles.input, styles.textArea]}
                                            value={formData.description || ''}
                                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                                            placeholder="Descrição do atributo"
                                            placeholderTextColor="#999"
                                            multiline
                                            numberOfLines={3}
                                            editable={!saving}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>
                                            <Feather name="list" size={14} color="#F4A64E" /> Tipo *
                                        </Text>
                                        <View style={styles.pickerContainer}>
                                            <Picker
                                                selectedValue={formData.type || ''}
                                                onValueChange={(itemValue) => {
                                                    setFormData({ ...formData, type: itemValue, value: '' });
                                                    if (itemValue === 'switch') {
                                                        setFormData({ ...formData, type: itemValue, value: 'false' });
                                                    }
                                                }}
                                                enabled={!saving}
                                                style={styles.picker}
                                            >
                                                <Picker.Item label="Selecione o tipo" value="" />
                                                {Object.entries(ATTRIBUTE_TYPES).map(([key, label]) => (
                                                    <Picker.Item key={key} label={label} value={key} />
                                                ))}
                                            </Picker>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.formSection}>
                                    <Text style={styles.formSectionTitle}>Configurações Adicionais</Text>
                                    
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>
                                            <Feather name="minimize-2" size={14} color="#F4A64E" /> Unidade
                                        </Text>
                                        <TextInput
                                            style={styles.input}
                                            value={formData.unit || ''}
                                            onChangeText={(text) => setFormData({ ...formData, unit: text })}
                                            placeholder="Ex: kg, metros, unidades..."
                                            placeholderTextColor="#999"
                                            editable={!saving}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>
                                            <Feather name="clock" size={14} color="#F4A64E" /> Unidade de Tempo
                                        </Text>
                                        <TextInput
                                            style={styles.input}
                                            value={formData.timeUnit || ''}
                                            onChangeText={(text) => setFormData({ ...formData, timeUnit: text })}
                                            placeholder="Ex: diário, semanal, mensal..."
                                            placeholderTextColor="#999"
                                            editable={!saving}
                                        />
                                    </View>
                                </View>

                                <View style={styles.formSection}>
                                    <Text style={styles.formSectionTitle}>Valor Inicial</Text>
                                    
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>
                                            <Feather name="database" size={14} color="#F4A64E" /> Valor *
                                        </Text>
                                        {formData.type ? renderValueInput() : (
                                            <Text style={styles.selectTypeFirst}>
                                                Selecione um tipo primeiro para configurar o valor
                                            </Text>
                                        )}
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <View style={styles.checkboxContainer}>
                                            <TouchableOpacity
                                                style={[styles.checkbox, formData.required && styles.checkboxChecked]}
                                                onPress={() => setFormData({ ...formData, required: !formData.required })}
                                                disabled={saving}
                                            >
                                                {formData.required && (
                                                    <Feather name="check" size={16} color="white" />
                                                )}
                                            </TouchableOpacity>
                                            <Text style={styles.checkboxLabel}>Campo obrigatório</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.helpText}>
                                    <Feather name="info" size={16} color="#2196F3" />
                                    <Text style={styles.helpTextContent}>
                                        O valor inicial será criado automaticamente após a criação do atributo.
                                    </Text>
                                </View>
                            </>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            <RFIDScanModal
                visible={rfidScanModalVisible}
                onClose={() => setRfidScanModalVisible(false)}
                onRFIDScanned={handleRFIDScanned}
            />
        </>
    );
};

// Modal para editar valor
interface EditValueModalProps {
    visible: boolean;
    value: AttributeValue | null;
    attributeType: string;
    onSave: (newValue: string) => void;
    onCancel: () => void;
}

const EditValueModal = ({ visible, value, attributeType, onSave, onCancel }: EditValueModalProps) => {
    const [newValue, setNewValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [dateValue, setDateValue] = useState(new Date());
    const [tempDate, setTempDate] = useState(new Date());
    const [rfidScanModalVisible, setRfidScanModalVisible] = useState(false);

    const { 
        requestPermissions, 
        checkBluetoothEnabled, 
        checkLocationEnabled 
    } = useBLE();

    const [hasBlePermissions, setHasBlePermissions] = useState(false);
    const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
    const [isLocationEnabled, setIsLocationEnabled] = useState(false);

    useEffect(() => {
        const val = value?.value || '';
        setNewValue(val);
        
        if (attributeType === 'date' && val) {
            const parsedDate = new Date(val);
            if (!isNaN(parsedDate.getTime())) {
                setDateValue(parsedDate);
                setTempDate(parsedDate);
            }
        } else {
            setDateValue(new Date());
            setTempDate(new Date());
        }
    }, [value, attributeType]);

    useEffect(() => {
        if (visible && attributeType === 'rfid') {
            checkServicesStatus();
        }
    }, [visible, attributeType]);

    const checkServicesStatus = async () => {
        try {
            const [bluetooth, location] = await Promise.all([
                checkBluetoothEnabled(),
                checkLocationEnabled()
            ]);
            
            setIsBluetoothEnabled(bluetooth);
            setIsLocationEnabled(location);
        } catch (error) {
            console.error("Erro ao verificar status:", error);
        }
    };

    const handleOpenRfidScan = async () => {
        if (!isBluetoothEnabled) {
            Alert.alert(
                "Bluetooth Desabilitado",
                "Por favor, habilite o Bluetooth para usar a leitura RFID.",
                [
                    { 
                        text: "OK",
                        onPress: checkServicesStatus
                    }
                ]
            );
            return;
        }

        if (!isLocationEnabled) {
            Alert.alert(
                "Localização Desabilitada",
                "Por favor, habilite a localização para usar a leitura RFID via Bluetooth.",
                [
                    { 
                        text: "OK",
                        onPress: checkServicesStatus
                    }
                ]
            );
            return;
        }

        if (hasBlePermissions) {
            setRfidScanModalVisible(true);
        } else {
            requestPermissions(isGranted => {
                setHasBlePermissions(isGranted);
                if (isGranted) {
                    setRfidScanModalVisible(true);
                } else {
                    Alert.alert(
                        "Permissões Necessárias",
                        "As permissões de Bluetooth são necessárias para escanear tags RFID.",
                        [{ text: "OK" }]
                    );
                }
            });
        }
    };

    useEffect(() => {
        const val = value?.value || '';
        setNewValue(val);
        
        if (attributeType === 'date' && val) {
            const parsedDate = new Date(val);
            if (!isNaN(parsedDate.getTime())) {
                setDateValue(parsedDate);
                setTempDate(parsedDate);
            }
        } else {
            setDateValue(new Date());
            setTempDate(new Date());
        }
    }, [value, attributeType]);

    const validateValue = (val: string, type: string): boolean => {
        if (!val || val.trim() === '') {
            Alert.alert("Erro", "O valor não pode estar vazio!");
            return false;
        }

        switch (type) {
            case 'number':
            case 'metric':
            case 'time_metric':
                if (isNaN(Number(val))) {
                    Alert.alert("Erro", "O valor deve ser um número válido!");
                    return false;
                }
                break;
            
            case 'date':
                const parsedDate = new Date(val);
                if (isNaN(parsedDate.getTime())) {
                    Alert.alert("Erro", "Data inválida!");
                    return false;
                }
                break;
        }

        return true;
    };

    const handleSave = async () => {
        if (attributeType === 'switch') {
            // Para switch, qualquer valor é válido
        } else if (!validateValue(newValue, attributeType)) {
            return;
        }

        setSaving(true);
        try {
            await onSave(newValue);
        } finally {
            setSaving(false);
        }
    };

    const handleRFIDScanned = (rfid: string) => {
        setNewValue(rfid);
        setRfidScanModalVisible(false);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || tempDate;
        
        if (event.type === 'dismissed') {
            setShowDatePicker(false);
            setShowTimePicker(false);
            return;
        }

        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            if (selectedDate) {
                setTempDate(currentDate);
                setShowTimePicker(true);
            }
        } else {
            if (selectedDate) {
                setTempDate(currentDate);
            }
        }
    };

    const handleTimeChange = (event: any, selectedTime?: Date) => {
        if (event.type === 'dismissed') {
            setShowTimePicker(false);
            return;
        }

        setShowTimePicker(false);
        
        if (selectedTime) {
            const combined = new Date(tempDate);
            combined.setHours(selectedTime.getHours());
            combined.setMinutes(selectedTime.getMinutes());
            
            setDateValue(combined);
            setNewValue(combined.toISOString());
        }
    };

    const confirmIOSDate = () => {
        setShowDatePicker(false);
        setDateValue(tempDate);
        setNewValue(tempDate.toISOString());
    };

    const formatDateTime = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderValueInput = () => {
        switch (attributeType) {
            case 'number':
            case 'metric':
            case 'time_metric':
                return (
                    <TextInput
                        style={styles.input}
                        value={newValue}
                        onChangeText={(text) => {
                            const numericValue = text.replace(/[^0-9.]/g, '');
                            setNewValue(numericValue);
                        }}
                        placeholder="Digite um valor numérico"
                        placeholderTextColor="#999"
                        keyboardType="decimal-pad"
                        editable={!saving}
                    />
                );

            case 'date':
                return (
                    <>
                        <TouchableOpacity
                            style={[styles.input, styles.dateButton]}
                            onPress={() => {
                                setTempDate(newValue ? new Date(newValue) : new Date());
                                setShowDatePicker(true);
                            }}
                            disabled={saving}
                        >
                            <Feather name="calendar" size={16} color="#666" />
                            <Text style={[
                                styles.dateButtonText,
                                !newValue && styles.dateButtonPlaceholder
                            ]}>
                                {newValue ? formatDateTime(newValue) : 'Selecione data e hora'}
                            </Text>
                        </TouchableOpacity>
                        
                        {showDatePicker && (
                            <>
                                <DateTimePicker
                                    value={tempDate}
                                    mode="date"
                                    is24Hour={true}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDateChange}
                                    locale="pt-BR"
                                />
                                {Platform.OS === 'ios' && (
                                    <TouchableOpacity
                                        style={styles.confirmDateButton}
                                        onPress={confirmIOSDate}
                                    >
                                        <Text style={styles.confirmDateButtonText}>Confirmar Data</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                        
                        {showTimePicker && Platform.OS === 'android' && (
                            <DateTimePicker
                                value={tempDate}
                                mode="time"
                                is24Hour={true}
                                display="default"
                                onChange={handleTimeChange}
                                locale="pt-BR"
                            />
                        )}
                    </>
                );

            case 'switch':
                return (
                    <View style={styles.switchContainer}>
                        <Text style={styles.switchLabel}>
                            {newValue === 'true' ? 'Ativado' : 'Desativado'}
                        </Text>
                        <Switch
                            value={newValue === 'true'}
                            onValueChange={(val) => setNewValue(val.toString())}
                            trackColor={{ false: '#ccc', true: '#F4A64E' }}
                            thumbColor={newValue === 'true' ? '#fff' : '#f4f3f4'}
                            disabled={saving}
                        />
                    </View>
                );

            case 'rfid':
                const canUseRfid = isBluetoothEnabled && isLocationEnabled;

                return (
                    <>
                        <View style={styles.valueInputContainer}>
                            <TextInput
                                style={[styles.input, styles.inputWithButton]}
                                value={newValue}
                                onChangeText={setNewValue}
                                placeholder="Digite o novo valor"
                                placeholderTextColor="#999"
                                editable={!saving}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.scanButton,
                                    !canUseRfid && styles.scanButtonDisabled
                                ]}
                                onPress={handleOpenRfidScan}
                                disabled={saving}
                            >
                                <MaterialCommunityIcons 
                                    name={canUseRfid ? "radar" : "radio-off"} 
                                    size={20} 
                                    color="white" 
                                />
                                <Text style={styles.scanButtonText}>Escanear</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Indicadores de status */}
                        <View style={styles.rfidStatusContainer}>
                            <View style={styles.rfidStatusItem}>
                                <Feather 
                                    name={isBluetoothEnabled ? "check-circle" : "x-circle"} 
                                    size={14} 
                                    color={isBluetoothEnabled ? "#5ECC63" : "#FF6B6B"} 
                                />
                                <Text style={[
                                    styles.rfidStatusText,
                                    !isBluetoothEnabled && styles.rfidStatusTextError
                                ]}>
                                    Bluetooth {isBluetoothEnabled ? 'ativo' : 'inativo'}
                                </Text>
                            </View>
                            
                            <View style={styles.rfidStatusItem}>
                                <Feather 
                                    name={isLocationEnabled ? "check-circle" : "x-circle"} 
                                    size={14} 
                                    color={isLocationEnabled ? "#5ECC63" : "#FF6B6B"} 
                                />
                                <Text style={[
                                    styles.rfidStatusText,
                                    !isLocationEnabled && styles.rfidStatusTextError
                                ]}>
                                    Localização {isLocationEnabled ? 'ativa' : 'inativa'}
                                </Text>
                            </View>
                        </View>

                        {!canUseRfid && (
                            <View style={styles.rfidWarning}>
                                <Feather name="alert-triangle" size={16} color="#FF9800" />
                                <Text style={styles.rfidWarningText}>
                                    {!isBluetoothEnabled && !isLocationEnabled
                                        ? 'Habilite o Bluetooth e a Localização para escanear'
                                        : !isBluetoothEnabled
                                        ? 'Habilite o Bluetooth para escanear'
                                        : 'Habilite a Localização para escanear'}
                                </Text>
                            </View>
                        )}
                    </>
                );

            default:
                return (
                    <TextInput
                        style={styles.input}
                        value={newValue}
                        onChangeText={setNewValue}
                        placeholder="Digite o novo valor"
                        placeholderTextColor="#999"
                        editable={!saving}
                    />
                );
        }
    };

    return (
        <>
            <Modal visible={visible} animationType="fade" transparent={true}>
                <View style={styles.editValueOverlay}>
                    <View style={styles.editValueModal}>
                        <View style={styles.editValueHeader}>
                            <Text style={styles.editValueTitle}>Editar Valor</Text>
                            <TouchableOpacity onPress={onCancel} disabled={saving}>
                                <Feather name="x" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.editValueContent}>
                            <Text style={styles.inputLabel}>Novo Valor *</Text>
                            {renderValueInput()}
                        </View>

                        <View style={styles.editValueActions}>
                            <TouchableOpacity 
                                style={[styles.editValueButton, styles.cancelButton]} 
                                onPress={onCancel}
                                disabled={saving}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.editValueButton, styles.confirmButton, saving && styles.saveButtonDisabled]} 
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Salvar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <RFIDScanModal
                visible={rfidScanModalVisible}
                onClose={() => setRfidScanModalVisible(false)}
                onRFIDScanned={handleRFIDScanned}
            />
        </>
    );
};

// ... (resto do código continua igual - AttributeItem e AssetDetailScreen)
// Por brevidade, continuando apenas com os styles atualizados

const AttributeItem = ({
    attribute,
    assetId,
    onDelete,
    onRefresh
}: {
    attribute: AttributeDetail;
    assetId: string;
    onDelete: (attributeId: string) => void;
    onRefresh: () => void;
}) => {
    const attributeService = new AttributeService();
    const [editValueModalVisible, setEditValueModalVisible] = useState(false);
    const [selectedValue, setSelectedValue] = useState<AttributeValue | null>(null);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMs = now.getTime() - date.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) return 'Hoje';
        if (diffInDays === 1) return 'Ontem';
        if (diffInDays < 7) return `${diffInDays} dias atrás`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} semanas atrás`;
        if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} meses atrás`;
        return `${Math.floor(diffInDays / 365)} anos atrás`;
    };

    const formatValueDisplay = (valueObj: AttributeValue, type: string) => {
        switch (type) {
            case 'date':
                return formatDateTime(valueObj.value);
            case 'switch':
                return valueObj.value === 'true' ? 'Ativado' : 'Desativado';
            default:
                return valueObj.value;
        }
    };

    const handleEditValue = (valueObj: AttributeValue) => {
        setSelectedValue(valueObj);
        setEditValueModalVisible(true);
    };

    const handleSaveValue = async (newValue: string) => {
        if (!selectedValue) return;

        try {
            await attributeService.updateAttributeValue(selectedValue.id, { value: newValue });
            setEditValueModalVisible(false);
            onRefresh();
            Alert.alert("Sucesso", "Valor atualizado com sucesso!");
        } catch (error) {
            Alert.alert("Erro", "Falha ao atualizar valor.");
        }
    };

    const handleDeleteValue = (valueId: string) => {
        Alert.alert(
            "Confirmar Exclusão",
            "Tem certeza que deseja excluir este valor?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await attributeService.deleteAttributeValue(valueId);
                            onRefresh();
                            Alert.alert("Sucesso", "Valor excluído com sucesso!");
                        } catch (error) {
                            Alert.alert("Erro", "Falha ao excluir valor.");
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.attributeCard}>
            <View style={styles.attributeHeader}>
                <View style={styles.attributeIcon}>
                    <Feather name="settings" size={18} color="#F4A64E" />
                </View>
                <View style={styles.attributeInfo}>
                    <Text style={styles.attributeName}>{attribute.name}</Text>
                    <Text style={styles.attributeDescription}>{attribute.description}</Text>
                </View>
                <View style={styles.attributeActions}>
                    <TouchableOpacity 
                        onPress={() => onDelete(attribute.id)} 
                        style={styles.actionButton}
                    >
                        <Feather name="trash-2" size={16} color="#C62828" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.attributeDetails}>
                <View style={styles.attributeTag}>
                    <Text style={styles.attributeTagText}>
                        Tipo: {ATTRIBUTE_TYPES[attribute.type as keyof typeof ATTRIBUTE_TYPES] || attribute.type}
                    </Text>
                </View>
                {attribute.unit && (
                    <View style={styles.attributeTag}>
                        <Text style={styles.attributeTagText}>Unidade: {attribute.unit}</Text>
                    </View>
                )}
                {attribute.timeUnit && (
                    <View style={styles.attributeTag}>
                        <Text style={styles.attributeTagText}>Tempo: {attribute.timeUnit}</Text>
                    </View>
                )}
                <View style={[styles.attributeTag, attribute.required && styles.requiredTag]}>
                    <Text style={styles.attributeTagText}>
                        {attribute.required ? 'Obrigatório' : 'Opcional'}
                    </Text>
                </View>
            </View>

            <View style={styles.attributeMetadata}>
                <View style={styles.metadataRow}>
                    <View style={styles.metadataItem}>
                        <Feather name="calendar" size={14} color="#666" />
                        <Text style={styles.metadataLabel}>Criado em:</Text>
                        <Text style={styles.metadataValue}>{formatDate(attribute.createdAt)}</Text>
                    </View>
                </View>
                
                <View style={styles.metadataRow}>
                    <View style={styles.metadataItem}>
                        <Feather name="clock" size={14} color="#666" />
                        <Text style={styles.metadataLabel}>Atualizado:</Text>
                        <Text style={styles.metadataValue}>{getTimeAgo(attribute.updatedAt)}</Text>
                    </View>
                </View>
            </View>

            {attribute.values && attribute.values.length > 0 && (
                <View style={styles.valuesSection}>
                    <View style={styles.valuesSectionHeader}>
                        <Feather name="database" size={14} color="#666" />
                        <Text style={styles.valuesSectionTitle}>
                            Valores ({attribute.values.length})
                        </Text>
                    </View>
                    {attribute.values.map((valueObj: AttributeValue) => (
                        <View key={valueObj.id} style={styles.valueItem}>
                            <View style={styles.valueIcon}>
                                <Feather name="circle" size={8} color="#F4A64E" />
                            </View>
                            <View style={styles.valueContent}>
                                <Text style={styles.valueText}>
                                    {formatValueDisplay(valueObj, attribute.type)}
                                </Text>
                                <Text style={styles.valueDate}>
                                    {formatDate(valueObj.createdAt)}
                                </Text>
                            </View>
                            <View style={styles.valueActions}>
                                <TouchableOpacity 
                                    style={styles.valueActionButton}
                                    onPress={() => handleEditValue(valueObj)}
                                >
                                    <Feather name="edit-2" size={14} color="#666" />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.valueActionButton}
                                    onPress={() => handleDeleteValue(valueObj.id)}
                                >
                                    <Feather name="trash-2" size={14} color="#C62828" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <EditValueModal
                visible={editValueModalVisible}
                value={selectedValue}
                attributeType={attribute.type}
                onSave={handleSaveValue}
                onCancel={() => setEditValueModalVisible(false)}
            />
        </View>
    );
};

export default function AssetDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation<RootStackNavigationProp>();
    const { assetId, organizationId } = route.params as { organizationId: string; assetId: string };

    const [asset, setAsset] = useState<Asset | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editType, setEditType] = useState<'asset' | 'new-attribute'>('asset');
    const [editData, setEditData] = useState<any>(null);

    const assetService = new AssetService();
    const attributeService = new AttributeService();

    const fetchAssetDetails = useCallback(async () => {
        if (!assetId) return;
        setLoading(true);
        setErrorMsg("");

        try {
            let assetResponse = await assetService.getAssetInfo(assetId);
            assetResponse.attributes = assetResponse.attributes.filter((attribute) => attribute.organizationId === organizationId);
            setAsset(assetResponse);
        } catch (err) {
            setErrorMsg("Erro ao buscar detalhes do ativo.");
            console.error("Error fetching asset details:", err);
        } finally {
            setLoading(false);
        }
    }, [assetId]);

    useEffect(() => {
        fetchAssetDetails();
    }, [fetchAssetDetails]);

    const handleDeleteAsset = () => {
        Alert.alert(
            "Confirmar Exclusão",
            "Tem certeza que deseja excluir este ativo? Esta ação não pode ser desfeita.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await assetService.deleteAsset(assetId);
                            Alert.alert("Sucesso", "Ativo excluído com sucesso!");
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert("Erro", "Não foi possível deletar o Asset!");
                        }
                    }
                }
            ]
        );
    };

    const handleEditAsset = () => {
        setEditType('asset');
        setEditData(asset);
        setEditModalVisible(true);
    };

    const handleSaveAsset = async (updatedAsset: any) => {
        try {
            await assetService.updateAsset(assetId, updatedAsset);
            setAsset(updatedAsset);
            setEditModalVisible(false);
            Alert.alert("Sucesso", "Ativo atualizado com sucesso!");
        } catch (error) {
            Alert.alert("Erro", "Falha ao atualizar ativo.");
        }
    };

    const handleAddAttribute = () => {
        setEditType('new-attribute');
        setEditData({
            name: "",
            description: "",
            type: "",
            unit: "",
            timeUnit: "",
            required: false,
            value: "",
            organizationId: asset?.organizationId || "",
            authorId: asset?.creatorUserId || "",
        });
        setEditModalVisible(true);
    };

    const handleSaveNewAttribute = async (newAttribute: any) => {
        try {
            const createdAttribute = await attributeService.createAttribute({
                organizationId: newAttribute.organizationId,
                authorId: newAttribute.authorId,
                name: newAttribute.name,
                description: newAttribute.description,
                type: newAttribute.type,
                unit: newAttribute.unit || null,
                timeUnit: newAttribute.timeUnit || null,
                options: "sdsdsddssdsd",
                required: newAttribute.required || false
            });

            if (newAttribute.value && createdAttribute.id) {
                await attributeService.createAttributeValue(
                    createdAttribute.id,
                    assetId,
                    newAttribute.value
                );
            }

            await fetchAssetDetails();
            
            setEditModalVisible(false);
            Alert.alert("Sucesso", "Atributo criado com sucesso!");
        } catch (error) {
            console.error("Erro ao criar atributo:", error);
            Alert.alert("Erro", "Falha ao criar atributo.");
        }
    };

    const handleDeleteAttribute = (attributeId: string) => {
        Alert.alert(
            "Confirmar Exclusão",
            "Tem certeza que deseja excluir este atributo?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await attributeService.deleteAttribute(attributeId);

                            const attributeValueId = asset?.attributes.find(attr => attr.id === attributeId)
                                ?.values.find(value => value.attributeId === attributeId)?.id;
                                
                            await attributeService.deleteAttributeValue(attributeValueId as string)
                            
                            if (asset) {
                                const updatedAttributes = asset.attributes.filter(attr => attr.id !== attributeId);
                                setAsset({ ...asset, attributes: updatedAttributes });
                            }

                            Alert.alert("Sucesso", "Atributo excluído com sucesso!");
                        } catch (error) {
                            Alert.alert("Erro", "Falha ao excluir atributo.");
                        }
                    }
                }
            ]
        );
    };

    const handleSave = async (data: any) => {
        switch (editType) {
            case 'asset':
                await handleSaveAsset(data);
                break;
            case 'new-attribute':
                await handleSaveNewAttribute(data);
                break;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#F4A64E" />
                    <Text style={styles.loadingText}>Carregando ativo...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (errorMsg) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={48} color="#C62828" />
                    <Text style={styles.errorMessage}>{errorMsg}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchAssetDetails}>
                        <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!asset) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.errorContainer}>
                    <Feather name="package" size={48} color="#ccc" />
                    <Text style={styles.errorMessage}>Ativo não encontrado</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
                <View style={styles.assetHeader}>
                    <View style={styles.assetTitleRow}>
                        <View style={styles.assetIcon}>
                            <Feather name="package" size={32} color="#F4A64E" />
                        </View>
                        <View style={styles.assetTitleInfo}>
                            <Text style={styles.assetTitle}>{asset.name}</Text>
                            <Text style={styles.assetSubtitle}>{asset.description}</Text>
                        </View>
                    </View>

                    <View style={styles.assetActions}>
                        <TouchableOpacity style={styles.editButton} onPress={handleEditAsset}>
                            <Feather name="edit-2" size={18} color="white" />
                            <Text style={styles.actionButtonText}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAsset}>
                            <Feather name="trash-2" size={18} color="white" />
                            <Text style={styles.actionButtonText}>Excluir</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Informações</Text>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Tipo</Text>
                            <Text style={styles.infoValue}>{asset.type === "unique" ? "Único" : "Replicável"}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Quantidade</Text>
                            <Text style={styles.infoValue}>{asset.quantity}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Status</Text>
                            <Text style={[styles.infoValue, asset.trashBin && styles.trashStatus]}>
                                {asset.trashBin ? 'Na Lixeira' : 'Ativo'}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Criado em</Text>
                            <Text style={styles.infoValue}>
                                {new Date(asset.createdAt).toLocaleDateString('pt-BR')}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.attributesSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Atributos ({asset.attributes.length})</Text>
                        <TouchableOpacity style={styles.addButton} onPress={handleAddAttribute}>
                            <Feather name="plus" size={18} color="white" />
                            <Text style={styles.addButtonText}>Adicionar</Text>
                        </TouchableOpacity>
                    </View>

                    {asset.attributes.length > 0 ? (
                        asset.attributes.map((attribute) => (
                            <AttributeItem
                                key={attribute.id}
                                attribute={attribute}
                                assetId={assetId}
                                onDelete={handleDeleteAttribute}
                                onRefresh={fetchAssetDetails}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyAttributes}>
                            <Feather name="settings" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>Nenhum atributo configurado</Text>
                            <TouchableOpacity style={styles.emptyAddButton} onPress={handleAddAttribute}>
                                <Feather name="plus" size={20} color="#F4A64E" />
                                <Text style={styles.emptyAddButtonText}>Adicionar primeiro atributo</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            <EditModal
                visible={editModalVisible}
                type={editType}
                data={editData}
                assetId={assetId}
                onSave={handleSave}
                onCancel={() => setEditModalVisible(false)}
            />
        </SafeAreaView>
    );
}

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
    loadingContainer: {
        flex: 1,
        gap: 10,
        margin: 12,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF0E0',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        gap: 15,
    },
    errorMessage: {
        color: '#C62828',
        fontSize: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#F4A64E',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    assetHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    assetTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    assetIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFF0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    assetTitleInfo: {
        flex: 1,
    },
    assetTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    assetSubtitle: {
        fontSize: 16,
        color: '#666',
        lineHeight: 22,
    },
    assetActions: {
        flexDirection: 'row',
        gap: 12,
    },
    editButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    deleteButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#C62828',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    infoSection: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    infoItem: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        minWidth: '47%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    infoLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    trashStatus: {
        color: '#C62828',
    },
    attributesSection: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4A64E',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    addButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    attributeCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    attributeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    attributeIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    attributeInfo: {
        flex: 1,
    },
    attributeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    attributeDescription: {
        fontSize: 14,
        color: '#666',
    },
    attributeActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        padding: 8,
    },
    attributeDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    attributeTag: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    requiredTag: {
        backgroundColor: '#ffebee',
    },
    attributeTagText: {
        fontSize: 12,
        color: '#666',
    },
    attributeMetadata: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
        marginBottom: 12,
    },
    metadataRow: {
        marginBottom: 8,
    },
    metadataItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metadataLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    metadataValue: {
        fontSize: 12,
        color: '#333',
        fontWeight: '600',
    },
    valuesSection: {
        backgroundColor: '#F9F9F9',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    valuesSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    valuesSectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    valueItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 6,
        marginBottom: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#F4A64E',
    },
    valueIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFF0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    valueContent: {
        flex: 1,
    },
    valueText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    valueDate: {
        fontSize: 11,
        color: '#888',
    },
    valueActions: {
        flexDirection: 'row',
        gap: 8,
    },
    valueActionButton: {
        padding: 6,
    },
    emptyAttributes: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    emptyAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#F4A64E',
        borderStyle: 'dashed',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
        marginTop: 8,
    },
    emptyAddButtonText: {
        color: '#F4A64E',
        fontSize: 16,
        fontWeight: '600',
    },
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
    saveButton: {
        backgroundColor: '#F4A64E',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        minWidth: 60,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    formSection: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    formSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 2,
        borderBottomColor: '#F4A64E',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: 'white',
        color: '#333',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: 'white',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        color: '#333',
    },
    valueInputContainer: {
        position: 'relative',
    },
    inputWithButton: {
        paddingRight: 120,
    },
    scanButton: {
        position: 'absolute',
        right: 4,
        top: 4,
        bottom: 4,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4A64E',
        paddingHorizontal: 12,
        borderRadius: 6,
        gap: 6,
    },
    scanButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    inputHint: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
        fontStyle: 'italic',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    checkboxChecked: {
        backgroundColor: '#F4A64E',
        borderColor: '#F4A64E',
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#333',
    },
    helpText: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 8,
        gap: 8,
        marginTop: 8,
        marginBottom: 25,
        borderLeftWidth: 3,
        borderLeftColor: '#2196F3',
    },
    helpTextContent: {
        fontSize: 14,
        color: '#1565C0',
        flex: 1,
    },
    editValueOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    editValueModal: {
        backgroundColor: 'white',
        borderRadius: 12,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    editValueHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    editValueTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    editValueContent: {
        padding: 16,
    },
    editValueActions: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    editValueButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    confirmButton: {
        backgroundColor: '#F4A64E',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateButtonText: {
        fontSize: 16,
        color: '#333',
    },
    dateButtonPlaceholder: {
        color: '#999',
    },
    confirmDateButton: {
        backgroundColor: '#F4A64E',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    confirmDateButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
    },
    switchLabel: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    selectTypeFirst: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        textAlign: 'center',
    },

    // Estilos do Modal de Scan RFID
    savedDeviceCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginVertical: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    savedDeviceIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    savedDeviceInfo: {
        flex: 1,
    },
    savedDeviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    savedDeviceAddress: {
        fontSize: 13,
        color: '#666',
        fontFamily: 'monospace',
    },
    savedDeviceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    savedDeviceBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4CAF50',
    },
    confirmationButtons: {
        gap: 12,
        marginTop: 10,
    },
    confirmationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 10,
    },
    useSavedButton: {
        backgroundColor: '#F4A64E',
        shadowColor: '#F4A64E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    useNewButton: {
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#F4A64E',
    },
    confirmationButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    useNewButtonText: {
        color: '#F4A64E',
    },
    confirmationHint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#E3F2FD',
        padding: 14,
        borderRadius: 10,
        gap: 10,
        marginTop: 20,
        borderLeftWidth: 3,
        borderLeftColor: '#2196F3',
    },
    confirmationHintText: {
        flex: 1,
        fontSize: 13,
        color: '#1565C0',
        lineHeight: 19,
    },
    scanModalContainer: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    scanModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: 'white',
    },
    scanModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    scanModalContent: {
        flex: 1,
        padding: 16,
    },
    rfidScanHeader: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    rfidScanIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    rfidScanTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    rfidScanSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    rfidStatusContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
        marginBottom: 4,
    },
    rfidStatusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    rfidStatusText: {
        fontSize: 12,
        color: '#666',
    },
    rfidStatusTextError: {
        color: '#FF6B6B',
    },
    rfidWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFF3E0',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#FF9800',
    },
    rfidWarningText: {
        flex: 1,
        fontSize: 13,
        color: '#E65100',
        lineHeight: 18,
    },
    scanButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.6,
    },
    scanActionButtons: {
        paddingVertical: 16,
    },
    scanActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4A64E',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    scanActionButtonActive: {
        backgroundColor: '#FF6B6B',
    },
    scanActionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    devicesList: {
        flex: 1,
    },
    emptyDevices: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 16,
    },
    emptyDevicesText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    devicesListTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    deviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 14,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    deviceCardConnecting: {
        backgroundColor: '#FFF8E1',
        borderWidth: 2,
        borderColor: '#F4A64E',
    },
    deviceCardIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    deviceCardInfo: {
        flex: 1,
    },
    deviceCardName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    deviceCardAddress: {
        fontSize: 12,
        color: '#888',
        fontFamily: 'monospace',
    },
    rfidScanningContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    rfidScanningTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    rfidScanningSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    connectedDeviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 20,
        gap: 8,
    },
    connectedDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50',
    },
    connectedDeviceText: {
        fontSize: 14,
        color: '#2E7D32',
        fontWeight: '600',
    },
    scanningInstruction: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 8,
        marginTop: 30,
        gap: 8,
    },
    scanningInstructionText: {
        fontSize: 14,
        color: '#1565C0',
        flex: 1,
    },
    cancelScanButton: {
        backgroundColor: '#FFEBEE',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F44336',
    },
    cancelScanButtonText: {
        color: '#F44336',
        fontSize: 16,
        fontWeight: '600',
    },
});