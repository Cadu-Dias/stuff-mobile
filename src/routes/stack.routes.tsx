import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { RootStackParamList } from '../app/models/stackType';
import SCREENS from '../app/screens/screens';
import TabRoutes from './tab.routes';
import Header from '../app/components/header/Header';

const RootStack = createNativeStackNavigator<RootStackParamList>({
  initialRouteName: 'Login', 
  screenOptions: {
    headerStyle: {
      backgroundColor: '#FFF0E0',
    },
    headerShadowVisible: false,
    headerTitle: () => <Header />,
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
      options: {
        headerBackVisible: false
      }
    },
    OrganizationsScreen: {
      screen: SCREENS.OrganizationsScreen,
      options: () => ({
        title: 'Detalhes da Organização', 
        headerBackTitle: undefined,
        headerBackVisible: false,
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
      options: { title: "Rastreamento de Itens", headerBackVisible: false },
    },
    ResultsScreen: {
      screen: SCREENS.ResultsScreen,
      options: { title: "", headerBackVisible: false }
    }
  },
});

export default RootStack