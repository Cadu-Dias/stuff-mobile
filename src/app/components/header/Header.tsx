import React, { useState, useRef, useEffect } from 'react';
import { 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Modal,
  Animated,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useNavigationState } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackNavigationProp } from '../../models/stackType';
import { AuthService } from '../../services/auth.service';

const DRAWER_WIDTH = 280;

interface MenuItem {
  label: string;
  icon: string;
  iconFamily: 'Feather' | 'MaterialCommunity';
  route: string;
  params?: any;
  tabScreen?: string;
}

const Header = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const authService = new AuthService();

  // ✅ Pegar a tab ativa dentro de MainTabs
  const activeTabScreen = useNavigationState(state => {
    // Encontrar a rota MainTabs
    const mainTabsRoute = state.routes.find(r => r.name === 'MainTabs');
    if (mainTabsRoute && mainTabsRoute.state) {
      // Pegar a tab ativa dentro de MainTabs
      const tabState = mainTabsRoute.state as any;
      const activeRoute = tabState.routes?.[tabState.index];
      return activeRoute?.name;
    }
    return null;
  });

  const menuItems: MenuItem[] = [
    {
      label: 'Início',
      icon: 'home',
      iconFamily: 'Feather',
      route: 'MainTabs',
      params: { screen: "Home" },
      tabScreen: 'Home',
    },
    {
      label: 'Scan',
      icon: 'radar',
      iconFamily: 'MaterialCommunity',
      route: 'MainTabs',
      params: { screen: "Scan" },
      tabScreen: 'Scan',
    },
    {
      label: 'Relatórios',
      icon: 'file-text',
      iconFamily: 'Feather',
      route: 'MainTabs',
      params: { screen: "Organization", params: { tab: "reports" }},
      tabScreen: 'Organization',
    },
    {
      label: 'Inteligência Artificial',
      icon: 'robot',
      iconFamily: 'MaterialCommunity',
      route: 'MainTabs',
      params: { screen: "AI" },
      tabScreen: 'AI'
    },
    {
      label: 'Perfil',
      icon: 'user',
      iconFamily: 'Feather',
      route: 'MainTabs',
      params: { screen: "Profile" },
      tabScreen: 'Profile'
    },
  ];

  const currentRoute = route.name;
  const isOnOrganizationsScreen = currentRoute === 'OrganizationsScreen';

  useEffect(() => {
    if (isDrawerOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDrawerOpen]);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const handleMenuItemPress = (routeName: string, params: object | undefined) => {
    if (isOnOrganizationsScreen) {
      Alert.alert(
        'Ação Bloqueada',
        'Selecione uma organização antes de navegar para outras telas.',
        [{ text: 'OK' }]
      );
      return;
    }

    navigation.navigate(routeName as any, params);
    setTimeout(() => {
      closeDrawer();
    }, 250);
  };

  const handleLogout = () => {
    closeDrawer();
    
    setTimeout(() => {
      Alert.alert(
        'Confirmar Saída',
        'Tem certeza que deseja sair da sua conta?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Sair',
            style: 'destructive',
            onPress: async () => {
              try {
                await authService.logoutUser();

                await AsyncStorage.multiRemove([
                  'userData',
                  'organizationId',
                ]);
                
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
                
                console.log('Logout realizado com sucesso');
              } catch (error) {
                console.error('Erro ao fazer logout:', error);
                Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
              }
            },
          },
        ]
      );
    }, 300);
  };

  const handleChangeOrganization = () => {
    if (isOnOrganizationsScreen) {
      closeDrawer();
      Alert.alert(
        'Já está aqui',
        'Você já está na tela de seleção de organizações.',
        [{ text: 'OK' }]
      );
      return;
    }

    closeDrawer();
    
    setTimeout(() => {
      Alert.alert(
        'Trocar Organização',
        'Deseja selecionar outra organização?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Trocar',
            onPress: async () => {
              try {
                await AsyncStorage.removeItem('organizationId');
                navigation.reset({
                  index: 0,
                  routes: [{ name: "OrganizationsScreen" }]
                });
                console.log('Redirecionando para seleção de organização');
              } catch (error) {
                console.error('Erro ao trocar organização:', error);
                Alert.alert('Erro', 'Não foi possível trocar de organização.');
              }
            },
          },
        ]
      );
    }, 300);
  };

  const isItemActive = (item: MenuItem): boolean => {
    if (currentRoute !== 'MainTabs') {
      return false;
    }

    return activeTabScreen === item.tabScreen;
  };

  const renderIcon = (item: MenuItem, isActive: boolean, isDisabled: boolean) => {
    const iconColor = isDisabled ? '#CCC' : isActive ? '#F4A64E' : '#666';
    const iconSize = 22;

    if (item.iconFamily === 'MaterialCommunity') {
      return (
        <MaterialCommunityIcons 
          name={item.icon as any} 
          size={iconSize} 
          color={iconColor} 
        />
      );
    }
    
    return (
      <Feather 
        name={item.icon as any} 
        size={iconSize} 
        color={iconColor} 
      />
    );
  };

  return (
    <>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={openDrawer}
          activeOpacity={0.7}
        >
          <Feather name="menu" size={24} color="#F4A64E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>stuff.</Text>
      </View>

      {/* Custom Drawer Modal */}
      <Modal
        visible={isDrawerOpen}
        transparent={true}
        animationType="none"
        onRequestClose={closeDrawer}
      >
        <View style={styles.modalContainer}>
          {/* Overlay */}
          <TouchableWithoutFeedback onPress={closeDrawer}>
            <Animated.View 
              style={[
                styles.overlay,
                {
                  opacity: overlayOpacity,
                }
              ]} 
            />
          </TouchableWithoutFeedback>

          {/* Drawer Content */}
          <Animated.View 
            style={[
              styles.drawerContainer,
              {
                transform: [{ translateX: slideAnim }],
              }
            ]}
          >
            <SafeAreaView style={styles.drawerSafeArea}>
              {/* Drawer Header */}
              <View style={styles.drawerHeader}>
                <View style={styles.drawerHeaderTop}>
                  <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>stuff.</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={closeDrawer}
                    style={styles.closeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="x" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.drawerSubtitle}>Menu de Navegação</Text>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* ✅ Aviso quando na OrganizationsScreen */}
              {isOnOrganizationsScreen && (
                <View style={styles.warningBanner}>
                  <MaterialCommunityIcons name="alert-circle" size={18} color="#FF9800" />
                  <Text style={styles.warningText}>
                    Selecione uma organização para continuar
                  </Text>
                </View>
              )}

              {/* Scrollable Content */}
              <ScrollView 
                style={styles.drawerScrollView}
                showsVerticalScrollIndicator={false}
              >
                {/* Menu Items */}
                <View style={styles.menuSection}>
                  {menuItems.map((item, index) => {
                    // ✅ Usar a nova função de verificação
                    const isActive = isItemActive(item);
                    const isDisabled = isOnOrganizationsScreen;
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.menuItem,
                          isActive && !isDisabled && styles.menuItemActive,
                          isDisabled && styles.menuItemDisabled,
                        ]}
                        onPress={() => handleMenuItemPress(item.route, item.params)}
                        activeOpacity={isDisabled ? 1 : 0.7}
                        disabled={isDisabled}
                      >
                        <View style={styles.menuItemIcon}>
                          {renderIcon(item, isActive, isDisabled)}
                        </View>
                        <Text style={[
                          styles.menuItemText,
                          isActive && !isDisabled && styles.menuItemTextActive,
                          isDisabled && styles.menuItemTextDisabled,
                        ]}>
                          {item.label}
                        </Text>
                        {isActive && !isDisabled && <View style={styles.activeIndicator} />}
                        {isDisabled && (
                          <Feather name="lock" size={14} color="#CCC" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Action Buttons */}
                <View style={styles.actionsSection}>
                  {/* Trocar Organização - ✅ Desabilitado na OrganizationsScreen */}
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      isOnOrganizationsScreen && styles.actionButtonDisabled,
                    ]}
                    onPress={handleChangeOrganization}
                    activeOpacity={isOnOrganizationsScreen ? 1 : 0.7}
                    disabled={isOnOrganizationsScreen}
                  >
                    <View style={styles.actionButtonIcon}>
                      <MaterialCommunityIcons 
                        name="swap-horizontal" 
                        size={22} 
                        color={isOnOrganizationsScreen ? '#CCC' : '#2196F3'} 
                      />
                    </View>
                    <Text style={[
                      styles.actionButtonText,
                      isOnOrganizationsScreen && styles.actionButtonTextDisabled,
                    ]}>
                      Trocar Organização
                    </Text>
                    {isOnOrganizationsScreen ? (
                      <Feather name="lock" size={14} color="#CCC" />
                    ) : (
                      <Feather name="chevron-right" size={18} color="#999" />
                    )}
                  </TouchableOpacity>

                  {/* Sair - ✅ SEMPRE HABILITADO */}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.logoutButton]}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                  >
                    <View style={styles.actionButtonIcon}>
                      <Feather name="log-out" size={22} color="#F44336" />
                    </View>
                    <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
                      Sair
                    </Text>
                    <Feather name="chevron-right" size={18} color="#999" />
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Versão 1.0.0</Text>
                <Text style={styles.footerCopyright}>© 2024 Stuff</Text>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Header Styles
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    color: "#f89f3c",
    fontWeight: "bold",
    fontSize: 24,
  },

  // Modal Container
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },

  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  // Drawer Container
  drawerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },

  drawerSafeArea: {
    flex: 1,
  },

  // Drawer Header
  drawerHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFF0E0',
  },
  drawerHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  logoContainer: {
    flex: 1,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F4A64E',
  },
  closeButton: {
    padding: 4,
  },
  drawerSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // Warning Banner
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    fontWeight: '500',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },

  // Scroll View
  drawerScrollView: {
    flex: 1,
  },

  // Menu Section
  menuSection: {
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: '#FFF0E0',
  },
  menuItemDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.5,
  },
  menuItemIcon: {
    marginRight: 16,
    width: 24,
    alignItems: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: '#F4A64E',
    fontWeight: '600',
  },
  menuItemTextDisabled: {
    color: '#CCC',
  },
  activeIndicator: {
    width: 4,
    height: 24,
    backgroundColor: '#F4A64E',
    borderRadius: 2,
    position: 'absolute',
    right: 0,
  },

  // Actions Section
  actionsSection: {
    paddingHorizontal: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  actionButtonDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.5,
  },
  logoutButton: {
    backgroundColor: '#FFEBEE',
  },
  actionButtonIcon: {
    marginRight: 16,
    width: 24,
    alignItems: 'center',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  actionButtonTextDisabled: {
    color: '#CCC',
  },
  logoutButtonText: {
    color: '#F44336',
    fontWeight: '600',
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  footerCopyright: {
    fontSize: 11,
    color: '#CCC',
  },
});

export default Header;