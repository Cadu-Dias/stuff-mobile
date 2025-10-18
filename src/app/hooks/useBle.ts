import { useState, useRef, useEffect, useCallback } from "react";
import { Alert, Linking, Platform } from "react-native";
import RNBluetoothClassic, {
  BluetoothDevice,
  BluetoothDeviceReadEvent,
} from "react-native-bluetooth-classic";
import { PERMISSIONS, requestMultiple, RESULTS } from "react-native-permissions";
import DeviceInfo from "react-native-device-info";
import Geolocation from "@react-native-community/geolocation"

type VoidCallback = (result: boolean) => void;

interface BluetoothLowEnergyApi {
  requestPermissions(cb: VoidCallback): Promise<void>;
  checkBluetoothEnabled(): Promise<boolean>;
  checkLocationEnabled(): Promise<boolean>;
  scanForPeripherals(): void;
  cancelDiscovery(): void;
  connectToDevice: (deviceAddress: string) => Promise<void>;
  disconnectFromDevice: () => void;
  connectedDevice: BluetoothDevice | null;
  allDevices: BluetoothDevice[];
  scannedRfids: string[];
  isDiscovering: boolean;
}

function useBLE(): BluetoothLowEnergyApi {
  const [allDevices, setAllDevices] = useState<BluetoothDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [scannedRfids, setScannedRfids] = useState<string[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const discoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (discoveryTimeoutRef.current) {
        clearTimeout(discoveryTimeoutRef.current);
      }
    };
  }, []);

  const checkBluetoothEnabled = useCallback(async (): Promise<boolean> => {
    try {
      const isEnabled = await RNBluetoothClassic.isBluetoothEnabled();
      console.log("Bluetooth habilitado:", isEnabled);
      return isEnabled;
    } catch (error) {
      console.error("Erro ao verificar Bluetooth:", error);
      return false;
    }
  }, []);

  const checkLocationEnabled = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {

      Geolocation.getCurrentPosition(
        () => {
          console.log("Localização habilitada");
          resolve(true);
        },
        (error: any) => {
          console.log("Localização desabilitada ou sem permissão:", error);
          resolve(error.code !== 2);
        },
        { 
          enableHighAccuracy: false, 
          timeout: 5000,
          maximumAge: 10000 
        }
      );
    });
  }, []);

  // Requisitar permissões
  const requestPermissions = useCallback(async (cb: VoidCallback) => {
    if (Platform.OS !== "android") {
      cb(true);
      return;
    }

    try {
      const apiLevel = await DeviceInfo.getApiLevel();
      console.log("API Level:", apiLevel);

      const bluetoothEnabled = await checkBluetoothEnabled();
      if (!bluetoothEnabled) {
        Alert.alert(
          "Bluetooth Desabilitado",
          "Por favor, habilite o Bluetooth para usar a leitura RFID.",
          [
            { text: "Cancelar", style: "cancel" },
            { 
              text: "Habilitar", 
              onPress: async () => {
                try {
                  await RNBluetoothClassic.requestBluetoothEnabled();
                  requestPermissions(cb);
                } catch (error) {
                  console.error("Erro ao habilitar Bluetooth:", error);
                  cb(false);
                }
              }
            }
          ]
        );
        cb(false);
        return;
      }

      const locationEnabled = await checkLocationEnabled();
      if (!locationEnabled) {
        Alert.alert(
          "Localização Desabilitada",
          "A localização precisa estar habilitada para usar Bluetooth. Por favor, ative a localização nas configurações.",
          [
            { text: "Cancelar", style: "cancel", onPress: () => cb(false) },
            { 
              text: "Abrir Configurações", 
              onPress: () => {
                Linking.openSettings();
                cb(false);
              }
            }
          ]
        );
        return;
      }

      if (apiLevel < 31) {
        const permissions = await requestMultiple([
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
        ]);

        const isGranted =
          permissions[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] === RESULTS.GRANTED ||
          permissions[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] === RESULTS.GRANTED;

        if (!isGranted) {
          Alert.alert(
            "Permissões Necessárias",
            "As permissões de localização são necessárias para usar Bluetooth. Por favor, conceda as permissões.",
            [
              { text: "Cancelar", style: "cancel", onPress: () => cb(false) },
              { text: "Abrir Configurações", onPress: () => Linking.openSettings() }
            ]
          );
        }

        cb(isGranted);
      } else {
        const permissions = await requestMultiple([
          PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
          PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
        ]);

        const isGranted =
          permissions[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT] === RESULTS.GRANTED &&
          permissions[PERMISSIONS.ANDROID.BLUETOOTH_SCAN] === RESULTS.GRANTED &&
          (permissions[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] === RESULTS.GRANTED ||
           permissions[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] === RESULTS.GRANTED);

        if (!isGranted) {
          const deniedPermissions = [];
          if (permissions[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT] !== RESULTS.GRANTED) {
            deniedPermissions.push("Bluetooth Connect");
          }
          if (permissions[PERMISSIONS.ANDROID.BLUETOOTH_SCAN] !== RESULTS.GRANTED) {
            deniedPermissions.push("Bluetooth Scan");
          }
          if (permissions[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] !== RESULTS.GRANTED &&
              permissions[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] !== RESULTS.GRANTED) {
            deniedPermissions.push("Localização");
          }

          Alert.alert(
            "Permissões Necessárias",
            `As seguintes permissões são necessárias: ${deniedPermissions.join(", ")}. Por favor, conceda-as nas configurações.`,
            [
              { text: "Cancelar", style: "cancel", onPress: () => cb(false) },
              { text: "Abrir Configurações", onPress: () => Linking.openSettings() }
            ]
          );
        }

        cb(isGranted);
      }
    } catch (error) {
      console.error("Erro ao solicitar permissões:", error);
      Alert.alert(
        "Erro",
        "Ocorreu um erro ao verificar permissões. Por favor, tente novamente.",
        [{ text: "OK", onPress: () => cb(false) }]
      );
      cb(false);
    }
  }, [checkBluetoothEnabled, checkLocationEnabled]);

  const isDuplicteDevice = (
    devices: BluetoothDevice[],
    nextDevice: BluetoothDevice
  ) => devices.findIndex((device) => nextDevice.id === device.id) > -1;

  const scanForPeripherals = useCallback(async () => {
    if (isDiscovering) {
      return;
    }

    setIsDiscovering(true);
    setAllDevices([]);

    if (discoveryTimeoutRef.current) {
      clearTimeout(discoveryTimeoutRef.current);
    }

    try {
      discoveryTimeoutRef.current = setTimeout(async () => {
        if (isDiscovering) {
          await RNBluetoothClassic.cancelDiscovery();
          setIsDiscovering(false);
        }
      }, 120000);

      const unpaired = await RNBluetoothClassic.startDiscovery();
      const invalidDeviceNameRegex = /([a-zA-Z0-9]{2}\:)+[a-zA-Z0-9]/;

      for (const device of unpaired) {
        if (device && device.name && !invalidDeviceNameRegex.test(device.name)) {
          setAllDevices((prevState) => {
            if (!isDuplicteDevice(prevState, device)) {
              return [...prevState, device];
            }
            return prevState;
          });
        }
      }
    } catch (error) {
      console.error("Erro durante a busca de dispositivos:", error);
    } finally {
      if (discoveryTimeoutRef.current) {
        clearTimeout(discoveryTimeoutRef.current);
      }
      await cancelDiscovery();
      setIsDiscovering(false);
    }
  }, [isDiscovering]);

  const cancelDiscovery = useCallback(async () => {
    setIsDiscovering(false);
    await RNBluetoothClassic.cancelDiscovery();
  }, []);

  const onRfidScanned = useCallback((readEvent: BluetoothDeviceReadEvent) => {
    if (readEvent.eventType === "ERROR") {
      console.error("Erro ao ler dados do dispositivo:", readEvent.data);
      return;
    }

    let convertedData = readEvent.data?.split(",")[0].trim();

    if (convertedData) {
      const isInvalidValue =
        scannedRfids.includes(convertedData) ||
        convertedData.includes("000000");

      if (!isInvalidValue) {
        setScannedRfids((prevState) => [...prevState, convertedData]);
      }
    }
  }, [scannedRfids]);

  const startStreamingData = useCallback(async (device: BluetoothDevice) => {
    if (device) {
      device.onDataReceived(onRfidScanned);
    } else {
      console.log("Nenhum dispositivo conectado");
    }
  }, [onRfidScanned]);

  const connectToDevice = useCallback(async (deviceAddress: string) => {
    try {
      if (isDiscovering) {
        await RNBluetoothClassic.cancelDiscovery();
        setIsDiscovering(false);
      }
      const deviceConnection = await RNBluetoothClassic.connectToDevice(deviceAddress);
      setConnectedDevice(deviceConnection);
      await startStreamingData(deviceConnection);
    } catch (e) {
      console.log("FALHA AO CONECTAR", e);
      throw e;
    }
  }, [isDiscovering, startStreamingData]);

  const disconnectFromDevice = useCallback(async () => {
    if (connectedDevice) {
      try {
        console.log('Dispositivo Desconectado');
        await RNBluetoothClassic.disconnectFromDevice(connectedDevice.address);
      } catch (error) {
        console.log("Dispositivo já foi desconectado");
      } finally {
        setConnectedDevice(null);
        setScannedRfids([]);
      }
    }
  }, [connectedDevice]);

  return {
    scanForPeripherals,
    cancelDiscovery,
    requestPermissions,
    checkBluetoothEnabled,
    checkLocationEnabled,
    connectToDevice,
    allDevices,
    connectedDevice,
    disconnectFromDevice,
    scannedRfids,
    isDiscovering,
  };
}

export default useBLE;