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
    ActivityIndicator,
    Modal
} from "react-native";
import { useNavigation } from '@react-navigation/native';

import { RootStackNavigationProp } from '../../models/stackType';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { AuthService } from "../../services/auth.service";

const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
};

const backgroundImage = require('../../../../assets/img_login.png');

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [requestError, setRequestError] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    const navigator = useNavigation<RootStackNavigationProp>();
    const authService = new AuthService();

    const handleSendEmail = async () => {
        setIsSending(true);
        setRequestError('');

        try {
            await authService.requestPasswordReset(email);
            console.log('E-mail de recuperação enviado para:', email);

            setIsSending(false);
            setShowSuccessModal(true);
        } catch (error: any) {
            console.log(error);
            setRequestError(error.message || 'Erro ao enviar e-mail. Tente novamente.');
            setIsSending(false);
        }
    };

    const handleEmailChange = (text: string) => {
        setEmail(text);
        setRequestError('');
        
        if (text && !validateEmail(text)) {
            setEmailError('Por favor, insira um e-mail válido.');
        } else {
            setEmailError('');
        }
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        navigator.goBack();
    };

    const isButtonDisabled = !email || !!emailError || isSending;

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
                        {/* Botão de Voltar */}
                        <TouchableOpacity 
                            style={styles.backButton}
                            onPress={() => navigator.goBack()}
                            disabled={isSending}
                        >
                            <Ionicons name="arrow-back" size={24} color="#f89f3c" />
                        </TouchableOpacity>

                        {/* Header */}
                        <View style={styles.headerContainer}>
                            <View style={styles.iconCircle}>
                                <MaterialCommunityIcons name="lock-reset" size={40} color="#f89f3c" />
                            </View>
                            <Text style={styles.title}>Esqueceu sua senha?</Text>
                            <Text style={styles.description}>
                                Não se preocupe! Digite seu e-mail abaixo e enviaremos um link para redefinir sua senha.
                            </Text>
                        </View>

                        {/* Erro de Requisição */}
                        {requestError ? (
                            <View style={styles.errorContainer}>
                                <View style={styles.errorIcon}>
                                    <Feather name="alert-circle" size={20} color="#C62828" />
                                </View>
                                <Text style={styles.errorMessage}>{requestError}</Text>
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
                                    editable={!isSending}
                                />
                            </View>
                            {emailError ? (
                                <View style={styles.fieldErrorContainer}>
                                    <Feather name="alert-circle" size={14} color="#C62828" />
                                    <Text style={styles.fieldErrorText}>{emailError}</Text>
                                </View>
                            ) : null}
                        </View>

                        {/* Botão de Enviar E-mail */}
                        <TouchableOpacity 
                            style={[
                                styles.sendButton, 
                                isButtonDisabled && styles.disabledButton
                            ]}
                            onPress={handleSendEmail}
                            disabled={isButtonDisabled}
                            activeOpacity={0.8}
                        >
                            {isSending ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color="#fff" />
                                    <Text style={styles.sendButtonText}>Enviando...</Text>
                                </View>
                            ) : (
                                <Text style={styles.sendButtonText}>Enviar E-mail</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.backToLoginButton}
                            onPress={() => navigator.goBack()}
                            disabled={isSending}
                        >
                            <Text style={styles.backToLoginText}>Voltar para o login</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal de Sucesso */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleSuccessModalClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconContainer}>
                            <MaterialCommunityIcons name="email-check-outline" size={60} color="#4CAF50" />
                        </View>
                        
                        <Text style={styles.modalTitle}>E-mail Enviado!</Text>
                        
                        <Text style={styles.modalDescription}>
                            Um e-mail foi enviado para <Text style={styles.emailHighlight}>{email}</Text> pela nossa{' '}
                            <Text style={styles.boldText}>Support Team</Text>.
                        </Text>
                        
                        <View style={styles.emailDetailsContainer}>
                            <View style={styles.emailDetailRow}>
                                <MaterialCommunityIcons name="email-outline" size={18} color="#666" />
                                <Text style={styles.emailDetailLabel}>Título:</Text>
                                <Text style={styles.emailDetailValue}>Password Reset Request</Text>
                            </View>
                            <Text style={styles.emailDetailDescription}>
                                O e-mail contém um link onde você poderá realizar a troca da sua senha.
                            </Text>
                        </View>

                        <TouchableOpacity 
                            style={styles.modalButton}
                            onPress={handleSuccessModalClose}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.modalButtonText}>Ok</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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

    // Back Button
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#FFF9F0',
        zIndex: 10,
    },

    // Header
    headerContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF9F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        color: "#f89f3c",
        fontWeight: "bold",
        fontSize: 26,
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        textAlign: "center",
        fontWeight: '500',
        color: "#666",
        fontSize: 14,
        lineHeight: 22,
        paddingHorizontal: 10,
    },

    // Error Container
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

    // Field Error
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

    // Send Button
    sendButton: {
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
    sendButtonText: {
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

    // Back to Login
    backToLoginButton: {
        marginTop: 20,
        paddingVertical: 8,
    },
    backToLoginText: {
        color: '#f89f3c',
        fontSize: 15,
        fontWeight: '600',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
            },
            android: {
                elevation: 15,
            },
        }),
    },
    modalIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalDescription: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    emailHighlight: {
        fontWeight: '700',
        color: '#f89f3c',
    },
    boldText: {
        fontWeight: '700',
        color: '#333',
    },
    emailDetailsContainer: {
        width: '100%',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 25,
    },
    emailDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    emailDetailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    emailDetailValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
    },
    emailDetailDescription: {
        fontSize: 13,
        color: '#666',
        lineHeight: 20,
        marginTop: 4,
    },
    modalButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#f89f3c',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
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
    modalButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});

export default ForgotPasswordScreen;