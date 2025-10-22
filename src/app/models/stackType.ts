import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RfidStatusItem } from "./rfids/rfidStatusItem";
import { SelectedAssets } from "./asset.model";
import { Report } from "./reports.model";

export type RootStackParamList = {
    Login: undefined;
    MainTabs: { screen: string, params: any } | undefined;
    OrganizationsScreen: undefined;
    AssetDetails: { organizationId: string, assetId: string };
    ReportDetail: { report: Report };
    QrCodeScan: undefined;
    RFIDScanManager: undefined;
    AssetSelection: undefined;
    DeviceDiscovery: undefined; 
    StorageScan: { deviceAddress: string, selectedAssets: SelectedAssets };
    ResultsScreen: { results: RfidStatusItem[], deviceAddress: string, selectedAssets: SelectedAssets };
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;