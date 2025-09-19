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
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const themeColors = {
  background: '#F4A64E',
  mainBackground: '#FFF0E0',
  text: '#333333',
  primary: '#F89F3C',
  primaryLight: '#FFC685',
  iconColor: '#f28c28',
  white: '#ffffff',
  placeholder: '#c1a480',
  danger: '#C62828',
};

type EditableInputProps = {
    label: string;
    iconName: any;
    value: string;
    onChangeText: (name: string, text: string) => void;
    placeholder: string,
    name: string
}

const user = {
    username: "cadub",
    firstName: "Cadu",
    lastName: "Machado",
};

const EditableInput = ({ label, iconName, value, onChangeText, placeholder, name } : EditableInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.editableInput}>
      <Text style={styles.legend}>{label}</Text>
      <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
        <Feather name={iconName} size={16} color={themeColors.iconColor} style={styles.inputIcon} />
        <TextInput
          style={styles.inputField}
          value={value}
          onChangeText={(text) => onChangeText(name, text)}
          placeholder={placeholder}
          placeholderTextColor={themeColors.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
    </View>
  );
};

export default function Profile() {

  // Lógica de estado (sem alterações)
  const [formData, setFormData] = useState({
    userName: "",
    firstName: "",
    lastName: "",
  });
  const [hasEnteredEdit, setHasEnteredEdit] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        userName: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
      });
    }
  }, [user]);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    setHasEnteredEdit(false);
    if (user) {
        setFormData({
            userName: user.username || "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
        });
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.main}>
        <View style={styles.mainTop}>
          <View style={styles.mainTopTexts}>
            <Text style={styles.h1}>Seu perfil{user?.firstName ? `, ${user.firstName}!` : ""}</Text>
            <Text style={styles.p}>Visualize e edite os dados do seu perfil abaixo:</Text>
          </View>

          {/* ALTERAÇÃO: Trocado <Icon> por <Feather> */}
          {!hasEnteredEdit ? (
            <TouchableOpacity style={styles.button} onPress={() => setHasEnteredEdit(true)}>
              <Feather name="edit-2" size={18} color="white" />
              <Text style={styles.buttonText}>Editar Perfil</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editButtons}>
              <TouchableOpacity style={styles.button} onPress={() => console.log("Atualizando:", formData)}>
                <Feather name="save" size={18} color="white" />
                <Text style={styles.buttonText}>Atualizar Perfil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleCancel}>
                <Feather name="x-circle" size={18} color="white" />
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {hasEnteredEdit ? (
          <View style={styles.mainEdit}>
            <EditableInput
              label="Username"
              iconName="user"
              name="userName"
              value={formData.userName}
              onChangeText={handleChange}
              placeholder="Username"
            />
            <EditableInput
              label="Primeiro Nome"
              iconName="user"
              name="firstName"
              value={formData.firstName}
              onChangeText={handleChange}
              placeholder="Primeiro Nome"
            />
            <EditableInput
              label="Último Nome"
              iconName="user"
              name="lastName"
              value={formData.lastName}
              onChangeText={handleChange}
              placeholder="Último Nome"
            />
          </View>
        ) : (
          <View style={styles.mainInfo}>
            <View style={styles.mainInfoContainer}>
              <Feather name="user" style={styles.mainInfoIcon} />
              <Text style={styles.infoH2}>{user?.username}</Text>
              <Text style={styles.infoH3}>Nome de Usuário</Text>
            </View>
            <View style={styles.mainInfoContainer}>
              <Feather name="credit-card" style={styles.mainInfoIcon} />
              <Text style={styles.infoH2}>{user?.firstName} {user?.lastName}</Text>
              <Text style={styles.infoH3}>Nome Completo</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Os estilos permanecem exatamente os mesmos
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.background,
    padding: 12,
  },
  main: {
    backgroundColor: themeColors.mainBackground,
    flex: 1,
    borderRadius: 8,
    padding: 15,
    ...Platform.select({
        ios: { shadowColor: 'rgba(0, 0, 0, 0.1)', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0 },
        android: { elevation: 5 },
    }),
  },
  mainTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  mainTopTexts: {
    flex: 1,
    minWidth: 200,
  },
  h1: { fontSize: 32, fontWeight: 'bold' },
  p: { fontSize: 18, color: '#444' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: themeColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  dangerButton: {
    backgroundColor: themeColors.danger,
  },
  mainInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 30,
  },
  mainInfoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 5,
    paddingVertical: 20,
    ...Platform.select({
        ios: { shadowColor: 'rgba(0, 0, 0, 0.1)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6 },
        android: { elevation: 3 },
    }),
  },
  mainInfoIcon: {
    color: themeColors.iconColor,
    fontSize: 36,
  },
  infoH2: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  infoH3: { fontSize: 16, color: '#555', textAlign: 'center' },
  mainEdit: {
    gap: 20,
    paddingVertical: 30,
  },
  editableInput: {
    gap: 10,
  },
  legend: {
    fontSize: 18,
    fontWeight: '500',
    color: themeColors.text
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.white,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputContainerFocused: {
    borderColor: themeColors.primary,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#3e3e3e',
    backgroundColor: 'transparent',
  },
});
