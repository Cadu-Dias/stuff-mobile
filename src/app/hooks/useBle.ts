/* eslint-disable no-bitwise */
import { useState, useRef, useEffect } from "react"; // Import useRef e useEffect
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
  connectToDevice: (deviceId: BluetoothDevice) => Promise<void>;
  disconnectFromDevice: () => void;
  connectedDevice: BluetoothDevice | null;
  allDevices: BluetoothDevice[];
  scannedRfids: string[];
  isDiscovering: boolean;
}

function useBLE(): BluetoothLowEnergyApi {
  const [allDevices, setAllDevices] = useState<BluetoothDevice[]>([]);
  const [connectedDevice, setConnectedDevice] =
    useState<BluetoothDevice | null>(null);
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

  const requestPermissions = async (cb: VoidCallback) => {
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
          result["android.permission.BLUETOOTH_CONNECT"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result["android.permission.BLUETOOTH_SCAN"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result["android.permission.ACCESS_FINE_LOCATION"] ===
            PermissionsAndroid.RESULTS.GRANTED;

        cb(isGranted);
      }
    } else {
      cb(true);
    }
  };

  const isDuplicteDevice = (
    devices: BluetoothDevice[],
    nextDevice: BluetoothDevice
  ) => devices.findIndex((device) => nextDevice.id === device.id) > -1;

  const scanForPeripherals = async () => {
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
        console.log(
          "Busca de dispositivos encerrada por tempo limite (2 minutos)."
        );

        if (isDiscovering) {
          await RNBluetoothClassic.cancelDiscovery();
          setIsDiscovering(false);
        }
      }, 120000);

      const unpaired = await RNBluetoothClassic.startDiscovery();
      const invalidDeviceNameRegex = /([a-zA-Z0-9]\:)+[a-zA-Z0-9]/

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
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      if (isDiscovering) {
        await RNBluetoothClassic.cancelDiscovery();
        setIsDiscovering(false);
      }

      const deviceConnection = await RNBluetoothClassic.connectToDevice(
        device.address
      );
      setConnectedDevice(deviceConnection);
      startStreamingData(deviceConnection);
    } catch (e) {
      console.log("FALHA AO CONECTAR", e);
    }
  };

  const disconnectFromDevice = async () => {
    if (connectedDevice) {
      await RNBluetoothClassic.disconnectFromDevice(connectedDevice.address);
      await connectedDevice.disconnect();
      setConnectedDevice(null);
    }
  };

  const onRfidScanned = (readEvent: BluetoothDeviceReadEvent) => {
    if (readEvent.eventType === "ERROR") {
      console.error("Erro ao ler dados do dispositivo:", readEvent.data);
      return;
    }

    let convertedData = readEvent.data;

    if (convertedData) {
      convertedData = convertedData.split(",")[0].trim();
      const isInvalidValue =
        scannedRfids.includes(convertedData) ||
        convertedData.includes("000000");

      if (!isInvalidValue) {
        setScannedRfids((prevState) => [...prevState, convertedData]);
      }
    }
  };

  const startStreamingData = async (device: BluetoothDevice) => {
    if (device) {
      device.onDataReceived((event) => onRfidScanned(event));
    } else {
      console.log("Nenhum dispositivo conectado");
    }
  };

  return {
    scanForPeripherals,
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
