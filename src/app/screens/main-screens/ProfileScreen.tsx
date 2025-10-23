import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserService } from '../../services/user.service';

const themeColors = {
  background: '#F4A64E',
  mainBackground: '#FFF0E0',
  text: '#333333',
  primary: '#F4A64E',
  secondary: '#2196F3',
  success: '#5ECC63',
  warning: '#FF9800',
  danger: '#C62828',
  white: '#ffffff',
  light: '#666666',
  placeholder: '#999999',
};

const EditProfileModal = ({ 
  visible, 
  onClose, 
  userData, 
  onSave 
}: {
  visible: boolean;
  onClose: () => void;
  userData: { firstName: string; lastName: string; username: string } | null;
  onSave: (data: any) => Promise<void>;
}) => {
  const [formData, setFormData] = useState({
    userName: '',
    firstName: '',
    lastName: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userData) {
      setFormData({
        userName: userData.username || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
      });
    }
  }, [userData]);

  const handleSave = async () => {
    if (!formData.userName || !formData.firstName || !formData.lastName) {
      Alert.alert("Erro", "Todos os campos são obrigatórios!");
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} disabled={saving}>
            <Feather name="x" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Editar Perfil</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Informações Pessoais</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Feather name="at-sign" size={14} color="#F4A64E" /> Nome de Usuário *
              </Text>
              <TextInput
                style={styles.input}
                value={formData.userName}
                onChangeText={(text) => setFormData({ ...formData, userName: text })}
                placeholder="Digite seu username"
                placeholderTextColor="#999"
                editable={!saving}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Feather name="user" size={14} color="#F4A64E" /> Primeiro Nome *
              </Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                placeholder="Digite seu primeiro nome"
                placeholderTextColor="#999"
                editable={!saving}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Feather name="users" size={14} color="#F4A64E" /> Último Nome *
              </Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                placeholder="Digite seu último nome"
                placeholderTextColor="#999"
                editable={!saving}
              />
            </View>
          </View>

          <View style={styles.helpText}>
            <Feather name="info" size={16} color="#2196F3" />
            <Text style={styles.helpTextContent}>
              Essas informações serão exibidas em seu perfil e visíveis para outros membros.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// Modal de Notificações
const NotificationsModal = ({ 
  visible, 
  onClose 
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const [notifications, setNotifications] = useState({
    rfidScans: true,
    assetUpdates: true,
    reportGenerated: true,
    systemAlerts: false,
    emailNotifications: true,
    pushNotifications: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(notifications));
      Alert.alert("Sucesso", "Configurações salvas!");
      onClose();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar as configurações");
    } finally {
      setSaving(false);
    }
  };

  const NotificationOption = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    field 
  }: {
    icon: string;
    title: string;
    subtitle: string;
    value: boolean;
    field: keyof typeof notifications;
  }) => (
    <View style={styles.notificationOption}>
      <View style={styles.notificationIcon}>
        <Feather name={icon as any} size={20} color="#F4A64E" />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{title}</Text>
        <Text style={styles.notificationSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(val) => setNotifications({ ...notifications, [field]: val })}
        trackColor={{ false: '#ccc', true: '#F4A64E' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} disabled={saving}>
            <Feather name="x" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Notificações</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Atividades</Text>
            
            <NotificationOption
              icon="radio"
              title="Leituras RFID"
              subtitle="Notificar quando houver novas leituras"
              value={notifications.rfidScans}
              field="rfidScans"
            />

            <NotificationOption
              icon="package"
              title="Atualizações de Ativos"
              subtitle="Mudanças em ativos que você gerencia"
              value={notifications.assetUpdates}
              field="assetUpdates"
            />

            <NotificationOption
              icon="file-text"
              title="Relatórios Gerados"
              subtitle="Quando um relatório for criado"
              value={notifications.reportGenerated}
              field="reportGenerated"
            />

            <NotificationOption
              icon="alert-triangle"
              title="Alertas do Sistema"
              subtitle="Avisos importantes e manutenções"
              value={notifications.systemAlerts}
              field="systemAlerts"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Canais de Notificação</Text>
            
            <NotificationOption
              icon="mail"
              title="E-mail"
              subtitle="Receber notificações por e-mail"
              value={notifications.emailNotifications}
              field="emailNotifications"
            />

            <NotificationOption
              icon="smartphone"
              title="Push"
              subtitle="Notificações push no dispositivo"
              value={notifications.pushNotifications}
              field="pushNotifications"
            />
          </View>

          <View style={styles.helpText}>
            <Feather name="info" size={16} color="#2196F3" />
            <Text style={styles.helpTextContent}>
              Você pode personalizar como e quando receber notificações sobre atividades do app.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// Modal de Ajuda
const HelpModal = ({ 
  visible, 
  onClose 
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const helpTopics = [
    {
      icon: 'book-open',
      title: 'Guia de Início Rápido',
      description: 'Aprenda o básico sobre o uso do app',
      action: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento'),
    },
    {
      icon: 'radio',
      title: 'Como usar Leitores RFID',
      description: 'Tutorial completo sobre leitura de tags',
      action: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento'),
    },
    {
      icon: 'package',
      title: 'Gerenciamento de Ativos',
      description: 'Criar, editar e organizar ativos',
      action: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento'),
    },
    {
      icon: 'users',
      title: 'Trabalho em Equipe',
      description: 'Colaborar com membros da organização',
      action: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento'),
    },
    {
      icon: 'headphones',
      title: 'Suporte Técnico',
      description: 'Entre em contato com nossa equipe',
      action: () => Linking.openURL('mailto:suporte@stuffapp.com'),
    },
    {
      icon: 'message-circle',
      title: 'Perguntas Frequentes',
      description: 'Respostas para dúvidas comuns',
      action: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento'),
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Ajuda & Suporte</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.helpHeader}>
            <View style={styles.helpIconLarge}>
              <Feather name="help-circle" size={48} color="#5ECC63" />
            </View>
            <Text style={styles.helpHeaderTitle}>Como podemos ajudar?</Text>
            <Text style={styles.helpHeaderSubtitle}>
              Explore nossos recursos de ajuda ou entre em contato
            </Text>
          </View>

          {helpTopics.map((topic, index) => (
            <TouchableOpacity
              key={index}
              style={styles.helpTopic}
              onPress={topic.action}
            >
              <View style={styles.helpTopicIcon}>
                <Feather name={topic.icon as any} size={24} color="#F4A64E" />
              </View>
              <View style={styles.helpTopicContent}>
                <Text style={styles.helpTopicTitle}>{topic.title}</Text>
                <Text style={styles.helpTopicDescription}>{topic.description}</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}

          <View style={styles.contactCard}>
            <Feather name="mail" size={24} color="#2196F3" />
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>E-mail de Suporte</Text>
              <Text style={styles.contactValue}>suporte@stuffapp.com</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// Componente Principal
export default function Profile() {
  const userService = new UserService();

  const [userData, setUserData] = useState<{ firstName: string; lastName: string; username: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('userData');
        if (storedData) {
          setUserData(JSON.parse(storedData));
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleUpdateProfile = async (formData: any) => {
    try {
      await userService.updateLoggedUser(formData);

      const newUserData = { 
        username: formData.userName, 
        firstName: formData.firstName, 
        lastName: formData.lastName 
      };

      await AsyncStorage.setItem("userData", JSON.stringify(newUserData));
      setUserData(newUserData);
      
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar o perfil");
      throw error;
    }
  };

  const getInitials = () => {
    if (!userData) return '?';
    const first = userData.firstName?.charAt(0) || '';
    const last = userData.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || userData.username?.charAt(0).toUpperCase() || '?';
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials()}</Text>
        </View>
        <View style={styles.onlineIndicator} />
      </View>
      <Text style={styles.userName}>
        {userData?.firstName ? `${userData.firstName} ${userData.lastName}` : userData?.username}
      </Text>
      <Text style={styles.userSubtitle}>
        @{userData?.username || 'usuário'}
      </Text>
    </View>
  );

  const ProfileInfoCard = ({ 
    icon, 
    title, 
    value, 
    subtitle,
    color = themeColors.primary 
  }: {
    icon: string;
    title: string;
    value: string;
    subtitle: string;
    color?: string;
  }) => (
    <View style={styles.infoCard}>
      <View style={[styles.infoIcon, { backgroundColor: color + '20' }]}>
        <Feather name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoValue}>{value}</Text>
        <Text style={styles.infoSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );

  const renderInfoSection = () => (
    <View style={styles.infoSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Feather name="info" size={20} color="#2196F3" />
        </View>
        <Text style={styles.sectionTitle}>Informações do Perfil</Text>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => setEditModalVisible(true)}
        >
          <Feather name="edit-2" size={16} color="#F4A64E" />
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoGrid}>
        <ProfileInfoCard
          icon="at-sign"
          title="Nome de Usuário"
          value={userData?.username || 'Não informado'}
          subtitle="Identificador único"
          color="#2196F3"
        />
        <ProfileInfoCard
          icon="user"
          title="Nome Completo"
          value={userData?.firstName && userData?.lastName 
            ? `${userData.firstName} ${userData.lastName}` 
            : 'Não informado'}
          subtitle="Nome de exibição"
          color="#5ECC63"
        />
      </View>
    </View>
  );

  const renderAccountSection = () => (
    <View style={styles.accountSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Feather name="settings" size={20} color="#FF9800" />
        </View>
        <Text style={styles.sectionTitle}>Configurações da Conta</Text>
      </View>

      <View style={styles.accountOptions}>
        <TouchableOpacity 
          style={styles.optionItem}
          onPress={() => setNotificationsModalVisible(true)}
        >
          <View style={styles.optionIcon}>
            <Feather name="bell" size={20} color="#FF9800" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Notificações</Text>
            <Text style={styles.optionSubtitle}>Gerenciar notificações</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionItem}
          onPress={() => setHelpModalVisible(true)}
        >
          <View style={styles.optionIcon}>
            <Feather name="help-circle" size={20} color="#2196F3" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Ajuda</Text>
            <Text style={styles.optionSubtitle}>Suporte e documentação</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F4A64E" />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderInfoSection()}
        {renderAccountSection()}
      </ScrollView>

      {/* Modais */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        userData={userData}
        onSave={handleUpdateProfile}
      />

      <NotificationsModal
        visible={notificationsModalVisible}
        onClose={() => setNotificationsModalVisible(false)}
      />

      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  main: {
    flex: 1,
    backgroundColor: themeColors.mainBackground,
    margin: 12,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeColors.mainBackground,
    margin: 12,
    borderRadius: 8,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: themeColors.light,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: 'white',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: themeColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#5ECC63',
    borderWidth: 3,
    borderColor: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: themeColors.text,
    marginBottom: 4,
  },
  userSubtitle: {
    fontSize: 16,
    color: themeColors.light,
  },

  // Info Section
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.text,
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  editButtonText: {
    color: '#F4A64E',
    fontSize: 14,
    fontWeight: '600',
  },
  infoGrid: {
    gap: 16,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    color: themeColors.light,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.text,
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    color: themeColors.light,
  },

  // Account Section
  accountSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  accountOptions: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: themeColors.light,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#F4A64E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#F4A64E',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#333',
  },
  helpText: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 25,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  helpTextContent: {
    fontSize: 14,
    color: '#1565C0',
    flex: 1,
  },

  // Security Modal
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    padding: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4A64E',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Notifications Modal
  notificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 14,
    color: '#666',
  },

  // Help Modal
  helpHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
  },
  helpIconLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  helpHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  helpHeaderSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  helpTopic: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  helpTopicIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  helpTopicContent: {
    flex: 1,
  },
  helpTopicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  helpTopicDescription: {
    fontSize: 14,
    color: '#666',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  contactInfo: {
    marginLeft: 16,
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    color: '#1565C0',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
});