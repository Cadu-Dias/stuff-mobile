import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserService } from '../services/user.service';

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

type EditableInputProps = {
  label: string;
  iconName: any;
  value: string;
  onChangeText: (name: string, text: string) => void;
  placeholder: string;
  name: string;
  disabled?: boolean;
}

const EditableInput = ({ 
  label, 
  iconName, 
  value, 
  onChangeText, 
  placeholder, 
  name,
  disabled = false 
}: EditableInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[
        styles.inputContainer, 
        isFocused && styles.inputContainerFocused,
        disabled && styles.inputContainerDisabled
      ]}>
        <View style={styles.inputIconContainer}>
          <Feather name={iconName} size={18} color={isFocused ? themeColors.primary : themeColors.light} />
        </View>
        <TextInput
          style={[styles.inputField, disabled && styles.inputFieldDisabled]}
          value={value}
          onChangeText={(text) => onChangeText(name, text)}
          placeholder={placeholder}
          placeholderTextColor={themeColors.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
        />
      </View>
    </View>
  );
};

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

export default function Profile() {
  const userService = new UserService();

  const [userData, setUserData] = useState<{ firstName: string; lastName: string; username: string } | null>(null);
  const [formData, setFormData] = useState({
    userName: "",
    firstName: "",
    lastName: "",
  });
  const [hasEnteredEdit, setHasEnteredEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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

  useEffect(() => {
    if (userData) {
      setFormData({
        userName: userData.username || "",
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
      });
    }
  }, [userData]);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async () => {
    if (!formData.userName || !formData.firstName || !formData.lastName) {
      Alert.alert("Erro", "Todos os campos são obrigatórios!");
      return;
    }

    setUpdating(true);
    try {
      await userService.updateLoggedUser(formData);

      const newUserData = { 
        username: formData.userName, 
        firstName: formData.firstName, 
        lastName: formData.lastName 
      };

      await AsyncStorage.setItem("userData", JSON.stringify(newUserData));
      setUserData(newUserData);
      setHasEnteredEdit(false);
      
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar o perfil");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setHasEnteredEdit(false);
    if (userData) {
      setFormData({
        userName: userData.username || "",
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
      });
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

  const renderEditSection = () => (
    <View style={styles.editSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Feather name="edit-3" size={20} color="#5ECC63" />
        </View>
        <Text style={styles.sectionTitle}>Editando Perfil</Text>
      </View>

      <View style={styles.formContainer}>
        <EditableInput
          label="Nome de Usuário"
          iconName="at-sign"
          name="userName"
          value={formData.userName}
          onChangeText={handleChange}
          placeholder="Digite seu username"
        />
        <EditableInput
          label="Primeiro Nome"
          iconName="user"
          name="firstName"
          value={formData.firstName}
          onChangeText={handleChange}
          placeholder="Digite seu primeiro nome"
        />
        <EditableInput
          label="Último Nome"
          iconName="users"
          name="lastName"
          value={formData.lastName}
          onChangeText={handleChange}
          placeholder="Digite seu último nome"
        />
      </View>

      <View style={styles.editActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.cancelButton]} 
          onPress={handleCancel}
          disabled={updating}
        >
          <Feather name="x" size={18} color="white" />
          <Text style={styles.actionButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.saveButton]} 
          onPress={handleUpdate}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Feather name="check" size={18} color="white" />
              <Text style={styles.actionButtonText}>Salvar</Text>
            </>
          )}
        </TouchableOpacity>
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
          onPress={() => setHasEnteredEdit(true)}
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
        <TouchableOpacity style={styles.optionItem}>
          <View style={styles.optionIcon}>
            <Feather name="shield" size={20} color="#FF9800" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Segurança</Text>
            <Text style={styles.optionSubtitle}>Alterar senha e configurações</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem}>
          <View style={styles.optionIcon}>
            <Feather name="bell" size={20} color="#2196F3" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Notificações</Text>
            <Text style={styles.optionSubtitle}>Gerenciar notificações</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem}>
          <View style={styles.optionIcon}>
            <Feather name="help-circle" size={20} color="#5ECC63" />
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
        {hasEnteredEdit ? renderEditSection() : renderInfoSection()}
        {!hasEnteredEdit && renderAccountSection()}
      </ScrollView>
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

  // Section Headers
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

  // Edit Section
  editSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  formContainer: {
    gap: 20,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: themeColors.primary,
  },
  inputContainerDisabled: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
  },
  inputIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputField: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: themeColors.text,
    paddingRight: 16,
  },
  inputFieldDisabled: {
    color: themeColors.light,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelButton: {
    backgroundColor: themeColors.danger,
  },
  saveButton: {
    backgroundColor: themeColors.success,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Info Section
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
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
});