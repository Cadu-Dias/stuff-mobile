import React, { useState } from "react";
import { 
    StyleSheet, 
    Text, 
    View, 
    TextInput, 
    TouchableOpacity, 
    ImageBackground, 
    KeyboardAvoidingView, 
    Platform,
    ScrollView,
    ActivityIndicator
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RootStackNavigationProp } from '../../models/stackType';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { AuthService } from "../../services/auth.service";
import { UserService } from "../../services/user.service";

const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
};

const backgroundImage = require('../../../../assets/img_login.png');

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loginError, setLoginError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    
    const navigator = useNavigation<RootStackNavigationProp>();

    const authService = new AuthService();
    const userService = new UserService();

    const handleLogin = async () => {
        setIsLogging(true);
        setLoginError('');

        try {
            await authService.loginUser({ email, password });
            console.log('Login com E-mail:', email);

            const userInfo = await userService.getUserInfo();
            await AsyncStorage.setItem(
                "userData", 
                JSON.stringify({ 
                    id: userInfo.id,
                    firstName: userInfo.firstName, 
                    lastName: userInfo.lastName, 
                    username: userInfo.userName 
                })
            );

            setIsLogging(false);
            navigator.navigate('OrganizationsScreen'); 
        } catch (error: any) {
            console.log(error)
            setLoginError(error["message"]);
            setIsLogging(false);
        }
    };

    const handleEmailChange = (text: string) => {
        setEmail(text);
        setLoginError('');
        
        if (text && !validateEmail(text)) {
            setEmailError('Por favor, insira um e-mail válido.');
        } else {
            setEmailError('');
        }
    };

    const handlePasswordChange = (text: string) => {
        setPassword(text);
        setLoginError('');
    };
    

    const isButtonDisabled = !email || !password || !!emailError || isLogging;

    return (
        <ImageBackground 
            source={backgroundImage}
            style={styles.backgroundContainer}
            resizeMode="cover"
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingContainer}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.card}>
                        {/* Header */}
                        <View style={styles.headerContainer}>
                            <Text style={styles.title}>Stuff.</Text>
                            <Text style={styles.sub_title}>E aí? É bom te ver de novo!</Text>
                            <Text style={styles.login_description}>
                                Faça seu login e organize-se agora mesmo
                            </Text>
                        </View>

                        {/* Erro de Login */}
                        {loginError ? (
                            <View style={styles.errorContainer}>
                                <View style={styles.errorIcon}>
                                    <Feather name="alert-circle" size={20} color="#C62828" />
                                </View>
                                <Text style={styles.errorMessage}>{loginError}</Text>
                            </View>
                        ) : null}

                        {/* Input de E-mail */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>E-mail</Text>
                            <View style={[
                                styles.inputContainer,
                                emailFocused && styles.inputContainerFocused,
                                emailError && styles.inputContainerError
                            ]}>
                                <MaterialCommunityIcons 
                                    name="email-outline" 
                                    size={22} 
                                    color={emailFocused ? "#f89f3c" : "#888"} 
                                    style={styles.icon} 
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="seu@email.com"
                                    placeholderTextColor="#999"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={handleEmailChange}
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                    editable={!isLogging}
                                />
                            </View>
                            {emailError ? (
                                <View style={styles.fieldErrorContainer}>
                                    <Feather name="alert-circle" size={14} color="#C62828" />
                                    <Text style={styles.fieldErrorText}>{emailError}</Text>
                                </View>
                            ) : null}
                        </View>

                        {/* Input de Senha */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Senha</Text>
                            <View style={[
                                styles.inputContainer,
                                passwordFocused && styles.inputContainerFocused
                            ]}>
                                <MaterialCommunityIcons 
                                    name="lock-outline" 
                                    size={22} 
                                    color={passwordFocused ? "#f89f3c" : "#888"} 
                                    style={styles.icon} 
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Digite sua senha"
                                    placeholderTextColor="#999"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={handlePasswordChange}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                    editable={!isLogging}
                                />
                                <TouchableOpacity 
                                    onPress={() => setShowPassword(!showPassword)} 
                                    style={styles.iconButton}
                                    disabled={isLogging}
                                >
                                    <MaterialCommunityIcons 
                                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                        size={22} 
                                        color="#888" 
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Botão de Login */}
                        <TouchableOpacity 
                            style={[
                                styles.loginButton, 
                                isButtonDisabled && styles.disabledButton
                            ]}
                            onPress={handleLogin}
                            disabled={isButtonDisabled}
                            activeOpacity={0.8}
                        >
                            {isLogging ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color="#fff" />
                                    <Text style={styles.loginButtonText}>Entrando...</Text>
                                </View>
                            ) : (
                                <Text style={styles.loginButtonText}>Entrar</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.forgotPasswordButton}
                            onPress={() => navigator.navigate('ForgotPassword')}
                            disabled={isLogging}
                        >
                            <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    backgroundContainer: {
        flex: 1,
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingVertical: 20, 
    },
    card: {
        width: '90%',
        maxWidth: 450,
        backgroundColor: 'white',
        borderRadius: 20,
        paddingVertical: 40,
        paddingHorizontal: 30,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 15,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    headerContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 25,
    },
    title: {
        color: "#f89f3c",
        fontWeight: "bold",
        fontSize: 38,
        marginBottom: 10,
        letterSpacing: 1,
    },
    sub_title: {
        color: "#f89f3c",
        fontWeight: "bold",
        fontSize: 20,
        textAlign: "center",
        marginTop: 5,
    },
    login_description: {
        textAlign: "center",
        fontWeight: '500',
        color: "#666",
        fontSize: 14,
        marginTop: 12,
        lineHeight: 20,
    },

    // Error Container (Login Error)
    errorContainer: {
        width: '100%',
        backgroundColor: '#FFEBEE',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#C62828',
    },
    errorIcon: {
        marginRight: 10,
    },
    errorMessage: {
        color: '#C62828',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        lineHeight: 18,
    },

    // Input Wrapper
    inputWrapper: {
        width: '100%',
        marginBottom: 18,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: 56,
        backgroundColor: '#f7f7f7',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        paddingHorizontal: 14,
        
    },
    inputContainerFocused: {
        borderColor: '#f89f3c',
        backgroundColor: '#FFF9F0',
    },
    inputContainerError: {
        borderColor: '#C62828',
        backgroundColor: '#FFEBEE',
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: "#333",
    },
    iconButton: {
        padding: 5,
    },

    // Field Error (Email validation)
    fieldErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        marginLeft: 4,
        gap: 5,
    },
    fieldErrorText: {
        color: '#C62828',
        fontSize: 13,
        fontWeight: '500',
    },

    // Login Button
    loginButton: {
        width: '100%',
        height: 54,
        backgroundColor: '#f89f3c',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#f89f3c',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    disabledButton: {
        backgroundColor: '#D0D0D0',
        ...Platform.select({
            ios: {
                shadowOpacity: 0,
            },
            android: {
                elevation: 0,
            },
        }),
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    // Forgot Password
    forgotPasswordButton: {
        marginTop: 20,
        paddingVertical: 8,
    },
    forgotPasswordText: {
        color: '#f89f3c',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default LoginScreen;