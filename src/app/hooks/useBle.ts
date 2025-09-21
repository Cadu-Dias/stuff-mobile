import { useState, useRef, useEffect, useCallback } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import RNBluetoothClassic, {
  BluetoothDevice,
  BluetoothDeviceReadEvent,
} from "react-native-bluetooth-classic";
import { PERMISSIONS, requestMultiple } from "react-native-permissions";
import DeviceInfo from "react-native-device-info";

type VoidCallback = (result: boolean) => void;

interface BluetoothLowEnergyApi {
  requestPermissions(cb: VoidCallback): Promise<void>;
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

  const requestPermissions = useCallback(async (cb: VoidCallback) => {
    if (Platform.OS === "android") {
      const apiLevel = await DeviceInfo.getApiLevel();

      if (apiLevel < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonNeutral: "Ask Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        cb(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const result = await requestMultiple([
          PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
          PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        ]);

        const isGranted =
          result["android.permission.BLUETOOTH_CONNECT"] === "granted" &&
          result["android.permission.BLUETOOTH_SCAN"] === "granted" &&
          result["android.permission.ACCESS_FINE_LOCATION"] === "granted";

        cb(isGranted);
      }
    } else {
      cb(true);
    }
  }, []);

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
        // A chamada abaixo pode ser redundante, mas por segurança a mantemos.
        await connectedDevice.disconnect();
      } catch (error) {
        console.error("Erro ao desconectar:", error);
      } finally {
        // Garante que o estado seja limpo, independentemente do sucesso da desconexão
        setConnectedDevice(null);
        setScannedRfids([]);
      }
    }
  }, [connectedDevice]);

  return {
    scanForPeripherals,
    cancelDiscovery,
    requestPermissions,
    connectToDevice,
    allDevices,
    connectedDevice,
    disconnectFromDevice,
    scannedRfids,
    isDiscovering,
  };
}

export default useBLE;