import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RfidStatusItem } from "./rfids/rfidStatusItem";
import { SelectedAssets } from "./asset.model";

type RootStackParamList = {
    Login: undefined;
    MainTabs: undefined;
    OrganizationsScreen: undefined;
    AssetDetails: { organizationId: string, assetId: string };
    AttributeDetails: { attributeId: string, assetId: string };
    QrCodeScan: undefined;
    RFIDScanManager: undefined;
    AssetSelection: undefined;
    DeviceDiscovery: undefined; 
    StorageScan: { deviceAddress: string, selectedAssets: SelectedAssets };
    ResultsScreen: { results: RfidStatusItem[], deviceAddress: string, selectedAssets: SelectedAssets };
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;