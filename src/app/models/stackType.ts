import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RfidStatusItem } from "./rfids/rfidStatusItem";

type RootStackParamList = {
    Login: undefined;
    MainTabs: undefined;
    OrganizationDetail: { organizationId: string };
    AssetDetails: { assetId: string };
    AttributeDetails: { attributeId: string, assetId: string };
    QrCodeScan: undefined;
    DeviceDiscovery: undefined; 
    StorageScan: { deviceAddress: string };
    ResultsScreen: { results: RfidStatusItem[], deviceAddress: string };
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;