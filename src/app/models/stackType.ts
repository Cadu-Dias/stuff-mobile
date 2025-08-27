import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BluetoothDevice } from "react-native-bluetooth-classic";

type RootStackParamList = {
    Home: undefined;
    DeviceDiscovery: undefined; 
    StorageScan: { device: BluetoothDevice };
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;