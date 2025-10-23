import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Feather } from '@expo/vector-icons'
import SCREENS from '../app/screens/screens'

const Tab = createBottomTabNavigator();
const TabRoutes = () => {
    return (
        <Tab.Navigator 
            screenOptions={{ 
                tabBarActiveTintColor: '#F4A64E',
                tabBarInactiveTintColor: 'gray',
                headerShown: false
            }}
        >
            <Tab.Screen 
                name='Home'
                component={SCREENS.HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Feather name='home' color={color} size={size} />,
                    tabBarLabel: 'Home'
                }}
            />
            <Tab.Screen 
                name='Organization'
                component={SCREENS.OrganizationDetailScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Feather name='briefcase' color={color} size={size} />,
                    tabBarLabel: 'Organização'
                }}
            />
            <Tab.Screen 
                name='Scan'
                component={SCREENS.ScanScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Feather name='camera' color={color} size={size} />,
                    tabBarLabel: 'Escanear'
                }}
            />
            <Tab.Screen 
                name='Profile'
                component={SCREENS.ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Feather name='user' color={color} size={size} />,
                    tabBarLabel: 'Conta'
                }}
            />
        </Tab.Navigator>
    )
}

export default TabRoutes