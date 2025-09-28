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
    ScrollView 
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RootStackNavigationProp } from '../../models/stackType';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthService } from "../../services/auth.service";
import { UserService } from "../../services/user.service";

const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
};

const backgroundImage = require('../../../assets/img_login.png');

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    
    const navigator = useNavigation<RootStackNavigationProp>();

    const authService = new AuthService();
    const userService = new UserService();

    const handleLogin = async () => {
        setIsLogging(true);

        try {
            await authService.loginUser({ email, password })
            console.log('Login com E-mail:', email);
            console.log('Senha:', password);

            const userInfo = await userService.getUserInfo();
            AsyncStorage.setItem(
                "userData", 
                JSON.stringify({ firstName: userInfo.firstName, lastName: userInfo.lastName, username: userInfo.userName })
            );

            setIsLogging(false);
            navigator.navigate('MainTabs'); 
        } catch (error) {
            console.log(error)
            setIsLogging(false);
        }
    };

    const handleEmailChange = (text: string) => {
        setEmail(text);
        if (text && !validateEmail(text)) {
            setEmailError('Por favor, insira um e-mail válido.');
        } else {
            setEmailError('');
        }
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
                >
                    <View style={styles.card}>
                        <Text style={styles.title}>Stuff.</Text>
                        <Text style={styles.sub_title}>E aí? É bom te ver de novo!</Text>
                        <Text style={styles.login_description}>Faça seu login e organize-se agora mesmo</Text>

                        {/* Input de E-mail */}
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons 
                                name="email-outline" 
                                size={22} 
                                color="#888" 
                                style={styles.icon} 
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="E-mail"
                                placeholderTextColor="#888"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={handleEmailChange}
                            />
                        </View>
                        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons 
                                name="lock-outline" 
                                size={22} 
                                color="#888" 
                                style={styles.icon} 
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Senha"
                                placeholderTextColor="#888"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.iconButton}>
                                <MaterialCommunityIcons 
                                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                    size={24} 
                                    color="#888" 
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            style={[styles.loginButton, isButtonDisabled && styles.disabledButton]}
                            onPress={handleLogin}
                            disabled={isButtonDisabled}
                        >
                            <Text style={styles.loginButtonText}>{ isLogging ? "Entrando..." : "Entrar"}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.forgotPasswordButton}>
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
        backgroundColor: 'white',
        borderRadius: 15,
        paddingVertical: 40,
        paddingHorizontal: 25,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    title: {
        color: "#f89f3c",
        fontWeight: "bold",
        fontSize: 34,
        marginBottom: 10,
    },
    sub_title: {
        color: "#f89f3c",
        fontWeight: "bold",
        fontSize: 22,
        textAlign: "center",
        marginTop: 5,
    },
    login_description: {
        textAlign: "center",
        fontWeight: '500',
        color: "#555",
        fontSize: 15,
        marginVertical: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: 55,
        backgroundColor: '#f7f7f7',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 10,
        paddingHorizontal: 10,
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
    errorText: {
        color: 'red',
        fontSize: 12,
        alignSelf: 'flex-start',
        marginBottom: 10,
        marginLeft: 5,
    },
    loginButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#f89f3c',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#c7c7c7',
    },
    forgotPasswordButton: {
        marginTop: 20,
    },
    forgotPasswordText: {
        color: '#555',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default LoginScreen;