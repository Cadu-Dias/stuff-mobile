import { createNativeStackNavigator } from '@react-navigation/native-stack'
import SCREENS from '../app/screens/screens';
import { BluetoothDevice } from 'react-native-bluetooth-classic';
import { RfidStatusItem } from '../app/models/rfids/rfidStatusItem';
import TabRoutes from './tab.routes';
import HeaderTitle from '../app/components/Header';

type RootStackParamList = {
    Login: undefined;
    MainTabs: undefined;
    OrganizationDetail: { organizationId: string }
    DeviceDiscovery: undefined; 
    StorageScan: { device: BluetoothDevice };
    ResultsScreen: { results: RfidStatusItem[] };
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
        options: ({ route }) => ({
            title: 'Detalhes da Organização', 
            headerBackTitle: undefined
        }),
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