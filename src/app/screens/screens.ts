import HomeScreen from "./main-screens/HomeScreen";
import DeviceDiscovery from "./rfids-scan-screens/DeviceDiscoveryScreen";
import StorageScanScreen from "./rfids-scan-screens/StorageScanScreen";
import LoginScreen from "./auth-screens/LoginScreen";
import ResultsScreen from "./rfids-scan-screens/ResultsScreen";
import ProfileScreen from "./main-screens/ProfileScreen"
import OrganizationsScreen from "./main-screens/OrganizationSelectionScreen";
import OrganizationDetailScreen from "./main-screens/OrganizationDetailScreen";
import ScanScreen from "./main-screens/ScanScreen";
import QRCodeReaderScreen from "./qrcode-scan-screens/QRCodeScanScreen";
import AssetDetailScreen from "./assets-screens/AssetDetailScreen";
import RFIDScanManagerScreen from "./rfids-scan-screens/RfidScanManagerScreen";
import AssetSelectionScreen from "./assets-screens/AssetSelectionScreen";
import ReportDetailScreen from "./reports/ReportDetailScreen";
import ForgotPasswordScreen from "./auth-screens/ForgotPasswordScreen";
import AIAssetCreationScreen from "./ai-screens/AiAssetCreationScreen";

const SCREENS = { 
    HomeScreen, StorageScanScreen, DeviceDiscovery, 
    LoginScreen, ResultsScreen, ProfileScreen, OrganizationsScreen,
    OrganizationDetailScreen, ScanScreen, QRCodeReaderScreen, 
    AssetDetailScreen, RFIDScanManagerScreen, 
    AssetSelectionScreen, ReportDetailScreen, ForgotPasswordScreen,
    AIAssetCreationScreen
}

export default SCREENS