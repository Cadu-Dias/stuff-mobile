import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SelectedAssets } from '../app/models/asset.model';
import { RfidStatusItem } from '../app/models/rfids/rfidStatusItem';
import SCREENS from '../app/screens/screens';
import TabRoutes from './tab.routes';
import HeaderTitle from '../app/components/Header';

type RootStackParamList = {
    Login: undefined;
    MainTabs: undefined;
    OrganizationDetail: { organizationId: string };
    AssetDetails: { organizationId: string, assetId: string };
    AttributeDetails: { attributeId: string, assetId: string };
    QrCodeScan: undefined;
    RFIDScanManager: undefined;
    AssetSelection: undefined;
    DeviceDiscovery: undefined; 
    StorageScan: { deviceAddress: string, selectedAssets: SelectedAssets };
    ResultsScreen: { results: RfidStatusItem[], deviceAddress: string, selectedAssets: SelectedAssets };
};

const RootStack = createNativeStackNavigator<RootStackParamList>({
  initialRouteName: 'Login', 
  screenOptions: {
    headerStyle: {
      backgroundColor: '#FFF0E0', // Cor de fundo principal do app
    },
    headerShadowVisible: false,
    headerTitle: () => <HeaderTitle />,
    headerTitleAlign: 'center',
    headerTintColor: '#333',
  },
  screens: {
    Login: {
      screen: SCREENS.LoginScreen,
      options: { 
        headerShown: false 
      },
    },
    MainTabs: {
      screen: TabRoutes,
    },
    OrganizationDetail: {
      screen: SCREENS.OrganizationDetailScreen,
      options: () => ({
        title: 'Detalhes da Organização', 
        headerBackTitle: undefined
      }),
    },
    AssetDetails: {
      screen: SCREENS.AssetDetailScreen,
      options: {}
    },
    AttributeDetails: {
      screen: SCREENS.AttributeDetailScreen,
      options: {}
    },
    RFIDScanManager: {
      screen: SCREENS.RFIDScanManagerScreen,
      options: {}
    },
    AssetSelection: {
      screen: SCREENS.AssetSelectionScreen,
      options: {}
    },
    QrCodeScan: {
      screen: SCREENS.QRCodeReaderScreen,
      options: {}
    },
    DeviceDiscovery: {
      screen: SCREENS.DeviceDiscovery,
      options: { 
        title: 'Conectar Dispositivo',
        headerBackTitle: undefined
        // Você pode customizar a apresentação para ser um modal, por exemplo
        // presentation: 'modal', 
      },
    },
    StorageScan: {
      screen: SCREENS.StorageScanScreen,
      options: { title: "Rastreamento de Itens" },
    },
    ResultsScreen: {
      screen: SCREENS.ResultsScreen,
      options: { title: ""}
    }
  },
});

export default RootStack