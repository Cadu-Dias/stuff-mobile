import HomeScreen from "./main-screens/HomeScreen";
import DeviceDiscovery from "./rfids-scan-screens/DeviceDiscoveryScreen";
import StorageScanScreen from "./rfids-scan-screens/StorageScanScreen";
import LoginScreen from "./main-screens/LoginScreen";
import ResultsScreen from "./rfids-scan-screens/ResultsScreen";
import ProfileScreen from "./main-screens/ProfileScreen"
import OrganizationsScreen from "./main-screens/OrganizationScreen";
import OrganizationDetailScreen from "./organizations-screens/OrganizationDetailScreen";
import ScanScreen from "./rfids-scan-screens/ScanScreen";
import QRCodeReaderScreen from "./qrcode-scan-screens/QRCodeScanScreen";
import AssetDetailScreen from "./assets-screens/AssetDetailScreen";
import AttributeDetailScreen from "./assets-screens/AttributeDetailScreen";
import RFIDScanManagerScreen from "./rfids-scan-screens/RfidScanManagerScreen";
import AssetSelectionScreen from "./assets-screens/AssetSelectionScreen";

const SCREENS = { 
    HomeScreen, StorageScanScreen, DeviceDiscovery, 
    LoginScreen, ResultsScreen, ProfileScreen, OrganizationsScreen,
    OrganizationDetailScreen, ScanScreen, QRCodeReaderScreen, 
    AssetDetailScreen, AttributeDetailScreen,
    RFIDScanManagerScreen, AssetSelectionScreen
}

export default SCREENS