import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen, DeviceDiscovery, StorageScanScreen } from './src/app/screens/screens';

const RootStack = createNativeStackNavigator({
  screens: {
    Home: {
      screen: HomeScreen,
      options: { title: 'Painel de Controle' },
    },
    DeviceDiscovery: {
      screen: DeviceDiscovery,
      options: { title: 'Conectar Dispositivo' },
    },
    StorageScan: {
      screen: StorageScanScreen,
      options: { title: "Rastreamento de Itens" },
    },
  },
});


const Navigation = createStaticNavigation(RootStack);

export default function App() {
  return <Navigation />;
}