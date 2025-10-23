import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { RootStackParamList } from '../app/models/stackType';
import SCREENS from '../app/screens/screens';
import TabRoutes from './tab.routes';
import HeaderTitle from '../app/components/Header';

const RootStack = createNativeStackNavigator<RootStackParamList>({
  initialRouteName: 'Login', 
  screenOptions: {
    headerStyle: {
      backgroundColor: '#FFF0E0',
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
    ForgotPassword: {
      screen: SCREENS.ForgotPasswordScreen,
      options: {
        headerShown: false
      }
    },
    MainTabs: {
      screen: TabRoutes,
    },
    OrganizationsScreen: {
      screen: SCREENS.OrganizationsScreen,
      options: () => ({
        title: 'Detalhes da Organização', 
        headerBackTitle: undefined
      }),
    },
    AssetDetails: {
      screen: SCREENS.AssetDetailScreen,
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
    ReportDetail: {
      screen: SCREENS.ReportDetailScreen,
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