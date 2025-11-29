import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Camera, CameraView } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIFuncionalitiesService } from '../../services/ai-functionalities.service';
import { AssetService } from '../../services/asset.service';
import { AttributeService } from '../../services/attribute.service';
import uuid from 'react-native-uuid';

const themeColors = {
  background: '#F4A64E',
  mainBackground: '#FFF0E0',
  text: '#333333',
  primary: '#F4A64E',
  secondary: '#2196F3',
  success: '#5ECC63',
  warning: '#FF9800',
  dark: '#333333',
  mid: '#555555',
  light: '#666666',
  cardBackground: 'white',
};

type Step = 'image-selection' | 'context' | 'processing' | 'review' | 'creating' | 'success';

interface DetectedAsset {
  name: string;
  description: string;
  attributes: Record<string, AttributeData>;
  selected: boolean;
}

interface AttributeData {
  type: 'number' | 'text' | 'metric' | 'boolean' | 'date' | 'selection' | 'multiselection' | 'timemetric';
  value: any;
  unit?: string;
  timeunit?: string;
  options?: string[];
}

interface SelectedImage {
  id: string;
  uri: string;
  base64: string;
  context?: string;
}

const AIAssetCreationScreen = () => {
  const [currentStep, setCurrentStep] = useState<Step>('image-selection');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [detectedAssets, setDetectedAssets] = useState<Record<string, DetectedAsset>>({});
  const [processing, setProcessing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [globalContext, setGlobalContext] = useState<string>('');

  const aiService = new AIFuncionalitiesService();
  const assetService = new AssetService();
  const attributeService = new AttributeService();

  useEffect(() => {
    loadOrganizationId();
    requestPermissions();
  }, []);

  const loadOrganizationId = async () => {
    const orgId = await AsyncStorage.getItem('organizationId');
    if (orgId) {
      setOrganizationId(orgId);
    } else {
      Alert.alert('Erro', 'Organização não encontrada');
    }
  };

  const requestPermissions = async () => {
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    await ImagePicker.requestCameraPermissionsAsync();
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const newImage: SelectedImage = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
          context: '',
        };
        setSelectedImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const takePhotoWithCamera = () => {
    setShowCameraModal(true);
  };

  const handleCameraCapture = async (photoBase64: string, photoUri: string) => {
    const newImage: SelectedImage = {
      id: Date.now().toString(),
      uri: photoUri,
      base64: photoBase64,
      context: '',
    };
    setSelectedImages(prev => [...prev, newImage]);
    setShowCameraModal(false);
  };

  const removeImage = (imageId: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const updateImageContext = (imageId: string, context: string) => {
    setSelectedImages(prev =>
      prev.map(img => (img.id === imageId ? { ...img, context } : img))
    );
  };

  const proceedToContext = () => {
    if (selectedImages.length === 0) {
      Alert.alert('Aviso', 'Selecione pelo menos uma imagem');
      return;
    }
    setCurrentStep('context');
  };

  const processImages = async () => {
    setProcessing(true);
    setCurrentStep('processing');

    try {
      const allDetectedAssets: Record<string, DetectedAsset> = {};
      
      for (const image of selectedImages) {
        try {
          const generatedUUID = uuid.v4();
          const { key, url } = await aiService.generatePresignedUrl(
            `${organizationId}_scan_${generatedUUID}.png`
          );
          await aiService.uploadImageBase64(url, image.base64);

          let combinedContext = '';
          if (globalContext.trim()) {
            combinedContext += globalContext.trim();
          }
          if (image.context?.trim()) {
            combinedContext += (combinedContext ? '. ' : '') + image.context.trim();
          }

          const result = await aiService.describeImage(key, combinedContext);

          if (result && Object.keys(result).length > 0) {
            Object.keys(result).forEach((assetName: any) => {
              let uniqueName = assetName as string;
              let counter = 1;
              while (allDetectedAssets[uniqueName]) {
                uniqueName = `${assetName} ${counter}`;
                counter++;
              }

              allDetectedAssets[uniqueName] = {
                ...result[assetName],
                name: uniqueName,
                selected: true,
              };
            });
          }
        } catch (error: any) {
          console.error('Erro ao processar imagem:', error['message']);
        }
      }

      if (Object.keys(allDetectedAssets).length > 0) {
        console.log(allDetectedAssets);
        setDetectedAssets(allDetectedAssets);
        setCurrentStep('review');
      } else {
        Alert.alert('Aviso', 'Nenhum ativo foi detectado nas imagens');
        setCurrentStep('image-selection');
      }
    } catch (error) {
      console.error('Erro ao processar imagens:', error);
      Alert.alert('Erro', 'Não foi possível processar as imagens. Tente novamente.');
      setCurrentStep('image-selection');
    } finally {
      setProcessing(false);
    }
  };

  const toggleAssetSelection = (assetName: string) => {
    setDetectedAssets(prev => ({
      ...prev,
      [assetName]: {
        ...prev[assetName],
        selected: !prev[assetName].selected,
      },
    }));
  };

  const updateAssetName = (oldName: string, newName: string) => {
    setDetectedAssets(prev => {
      const updated = { ...prev };
      updated[oldName].name = newName;
      return updated;
    });
  };

  const updateAssetDescription = (assetName: string, description: string) => {
    setDetectedAssets(prev => ({
      ...prev,
      [assetName]: {
        ...prev[assetName],
        description,
      },
    }));
  };

  const createAssets = async () => {
    const selectedAssetsList = Object.values(detectedAssets).filter(a => a.selected);

    if (selectedAssetsList.length === 0) {
      Alert.alert('Aviso', 'Selecione pelo menos um ativo para criar');
      return;
    }

    setCreating(true);
    setCurrentStep('creating');

    const fixAttributeType = (attributeType: string) => {
      switch(attributeType) {
        case 'selection':
          return 'select'
        case 'numeric': 
          return 'number'
        case 'textual':
          return 'text'
        default:
          return attributeType
      }
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const asset of selectedAssetsList) {
        try {
          const createdAsset = await assetService.createAsset({
            name: asset.name,
            type: 'replicable',
            description: asset.description,
            organizationId: organizationId,
            quantity: 1,
          });

          for (const [attrName, attrData] of Object.entries(asset.attributes)) {
            try {
              const attributePayload: any = {
                organizationId: organizationId,
                authorId: createdAsset.creatorUserId,
                name: attrName,
                description: attrName,
                type: fixAttributeType(attrData.type),
                required: false,
              }


              if (attrData.type === 'selection' || attrData.type === 'multiselection') {
                attributePayload.options = attrData.options?.join(',') || '';
              } else {
                attributePayload.options = '';
              }

              if (attrData.type === 'metric' && attrData.unit) {
                attributePayload.unit = attrData.unit;
              } else {
                attributePayload.unit = '';
              }

              if (attrData.type === 'timemetric' && attrData.timeunit) {
                attributePayload.timeUnit = attrData.timeunit;
              } else {
                attributePayload.timeUnit = '';
              }
              console.log('Criando atributo:', attrName, attributePayload);

              const createdAttribute = await attributeService.createAttribute(attributePayload);
              const valuePayload: any = {
                assetId: createdAsset.id,
                value: String(attrData.value)
              };

              console.log('Criando valor do atributo:', attrName, valuePayload);

              await attributeService.createAttributeValue(
                createdAttribute.id,
                createdAsset.id,
                valuePayload.value
              );

            } catch (attrError: any) {
              console.error(`Erro ao criar atributo ${attrName}:`, attrError?.response?.data || attrError?.message || attrError);
            }
          }

          successCount++;
          console.log(`Ativo ${asset.name} criado com sucesso`);

        } catch (assetError: any) {
          console.error(`Erro ao criar ativo ${asset.name}:`, assetError?.response?.data || assetError?.message || assetError);
          errorCount++;
        }
      }

      setCurrentStep('success');

      setTimeout(() => {
        Alert.alert(
          'Concluído!',
          `${successCount} ativo(s) criado(s) com sucesso${errorCount > 0 ? `\n${errorCount} erro(s)` : ''}`,
          [
            {
              text: 'OK',
              onPress: resetScreen,
            },
          ]
        );
      }, 1000);

    } catch (error: any) {
      console.error('Erro ao criar ativos:', error?.response?.data || error?.message || error);
      Alert.alert('Erro', 'Não foi possível criar os ativos');
      setCurrentStep('review');
    } finally {
      setCreating(false);
    }
  };


  const resetScreen = () => {
    setCurrentStep('image-selection');
    setSelectedImages([]);
    setDetectedAssets({});
    setProcessing(false);
    setCreating(false);
    setGlobalContext('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="brain" size={24} color="white" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Criação com IA</Text>
            <Text style={styles.headerSubtitle}>Detecte ativos através de imagens</Text>
          </View>
        </View>
      </View>

      <View style={styles.main}>
        {currentStep === 'image-selection' && (
          <ImageSelectionStep
            selectedImages={selectedImages}
            onPickFromGallery={pickImageFromGallery}
            onTakePhoto={takePhotoWithCamera}
            onRemoveImage={removeImage}
            onContinue={proceedToContext}
          />
        )}

        {currentStep === 'context' && (
          <ContextStep
            selectedImages={selectedImages}
            globalContext={globalContext}
            onUpdateGlobalContext={setGlobalContext}
            onUpdateImageContext={updateImageContext}
            onProcess={processImages}
            onBack={() => setCurrentStep('image-selection')}
          />
        )}

        {currentStep === 'processing' && <ProcessingStep />}

        {currentStep === 'review' && (
          <ReviewStep
            detectedAssets={detectedAssets}
            onToggleAsset={toggleAssetSelection}
            onUpdateName={updateAssetName}
            onUpdateDescription={updateAssetDescription}
            onCreate={createAssets}
            onBack={resetScreen}
          />
        )}

        {currentStep === 'creating' && <CreatingStep />}

        {currentStep === 'success' && <SuccessStep onFinish={resetScreen} />}
      </View>

      <CameraModal
        visible={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
      />
    </SafeAreaView>
  );
};

// ============ STEP 1: IMAGE SELECTION ============
interface ImageSelectionStepProps {
  selectedImages: SelectedImage[];
  onPickFromGallery: () => void;
  onTakePhoto: () => void;
  onRemoveImage: (imageId: string) => void;
  onContinue: () => void;
}

const ImageSelectionStep = ({
  selectedImages,
  onPickFromGallery,
  onTakePhoto,
  onRemoveImage,
  onContinue,
}: ImageSelectionStepProps) => {
  return (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeTitle}>Análise Inteligente</Text>
          <Text style={styles.welcomeSubtitle}>
            Adicione fotos de objetos e nossa IA irá detectar e criar ativos automaticamente
          </Text>
        </View>
        <View style={styles.welcomeIconContainer}>
          <MaterialCommunityIcons name="image-auto-adjust" size={32} color="#F4A64E" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Adicionar Imagens</Text>
        <View style={styles.imageOptionsContainer}>
          <TouchableOpacity style={styles.imageOptionButton} onPress={onPickFromGallery}>
            <View style={[styles.imageOptionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Feather name="image" size={24} color="#2196F3" />
            </View>
            <Text style={styles.imageOptionText}>Galeria</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.imageOptionButton} onPress={onTakePhoto}>
            <View style={[styles.imageOptionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Feather name="camera" size={24} color="#5ECC63" />
            </View>
            <Text style={styles.imageOptionText}>Câmera</Text>
          </TouchableOpacity>
        </View>
      </View>

      {selectedImages.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Imagens Selecionadas</Text>
            <View style={styles.imageBadge}>
              <Text style={styles.imageBadgeText}>{selectedImages.length}</Text>
            </View>
          </View>

          <View style={styles.imagesGrid}>
            {selectedImages.map((image) => (
              <View key={image.id} style={styles.imageItem}>
                <Image source={{ uri: image.uri }} style={styles.imageThumbnail} />
                <TouchableOpacity
                  style={styles.imageRemoveButton}
                  onPress={() => onRemoveImage(image.id)}
                >
                  <Feather name="x" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
            <Text style={styles.continueButtonText}>Continuar</Text>
            <Feather name="arrow-right" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {selectedImages.length === 0 && (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="image-off" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>Nenhuma imagem selecionada</Text>
          <Text style={styles.emptyStateSubtext}>
            Adicione fotos para começar a análise
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

interface ContextStepProps {
  selectedImages: SelectedImage[];
  globalContext: string;
  onUpdateGlobalContext: (context: string) => void;
  onUpdateImageContext: (imageId: string, context: string) => void;
  onProcess: () => void;
  onBack: () => void;
}

const ContextStep = ({
  selectedImages,
  globalContext,
  onUpdateGlobalContext,
  onUpdateImageContext,
  onProcess,
  onBack,
}: ContextStepProps) => {
  const hasAnyContext = globalContext.trim() !== '' || selectedImages.some(img => img.context?.trim());

  return (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeTitle}>Adicionar Contexto</Text>
          <Text style={styles.welcomeSubtitle}>
            Forneça informações adicionais para ajudar a IA a identificar melhor os ativos
          </Text>
        </View>
        <View style={styles.welcomeIconContainer}>
          <MaterialCommunityIcons name="text-box" size={32} color="#F4A64E" />
        </View>
      </View>

      {/* Contexto Global */}
      <View style={styles.section}>
        <View style={styles.contextHeaderSection}>
          <Feather name="globe" size={20} color={themeColors.primary} />
          <Text style={styles.sectionTitle}>Contexto Geral (Opcional)</Text>
        </View>
        <Text style={styles.contextHint}>
          Informações que se aplicam a todas as imagens
        </Text>
        <TextInput
          style={styles.contextInput}
          value={globalContext}
          onChangeText={onUpdateGlobalContext}
          placeholder="Ex: Equipamentos da sala de TI, localização X"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Contexto Individual */}
      <View style={styles.section}>
        <View style={styles.contextHeaderSection}>
          <Feather name="image" size={20} color={themeColors.secondary} />
          <Text style={styles.sectionTitle}>Contexto por Imagem (Opcional)</Text>
        </View>
        <Text style={styles.contextHint}>
          Informações específicas de cada foto
        </Text>

        {selectedImages.map((image, index) => (
          <View key={image.id} style={styles.imageContextCard}>
            <View style={styles.imageContextHeader}>
              <Image source={{ uri: image.uri }} style={styles.imageContextThumbnail} />
              <View style={styles.imageContextInfo}>
                <Text style={styles.imageContextTitle}>Imagem {index + 1}</Text>
                <Text style={styles.imageContextSubtitle}>
                  {image.context?.trim() ? 'Com contexto' : 'Sem contexto'}
                </Text>
              </View>
            </View>
            <TextInput
              style={styles.imageContextInput}
              value={image.context}
              onChangeText={(text) => onUpdateImageContext(image.id, text)}
              placeholder="Ex: Gato de raça Persa chamado Gilberto"
              placeholderTextColor="#999"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>
        ))}
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Feather name="info" size={20} color={themeColors.secondary} />
        <View style={styles.infoCardContent}>
          <Text style={styles.infoCardTitle}>Dica</Text>
          <Text style={styles.infoCardText}>
            Quanto mais detalhes você fornecer, melhor a IA conseguirá identificar e
            categorizar os ativos. Você pode pular esta etapa se preferir.
          </Text>
        </View>
      </View>

      <View style={styles.contextActions}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={20} color="#666" />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.processButton} onPress={onProcess}>
          <MaterialCommunityIcons name="brain" size={20} color="white" />
          <Text style={styles.processButtonText}>Processar</Text>
          <Feather name="arrow-right" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ============ STEP 3: PROCESSING ============
const ProcessingStep = () => {
  return (
    <View style={styles.processingContainer}>
      <View style={styles.processingCard}>
        <View style={styles.processingIconContainer}>
          <MaterialCommunityIcons name="brain" size={64} color="#F4A64E" />
        </View>
        <ActivityIndicator size="large" color="#F4A64E" style={styles.processingSpinner} />
        <Text style={styles.processingTitle}>Processando Imagens...</Text>
        <Text style={styles.processingSubtitle}>
          A IA está analisando as imagens e detectando os ativos
        </Text>

        <View style={styles.processingSteps}>
          <View style={styles.processingStepItem}>
            <Feather name="check-circle" size={18} color="#5ECC63" />
            <Text style={[styles.processingStepText, { color: '#5ECC63' }]}>
              Imagens recebidas
            </Text>
          </View>
          <View style={styles.processingStepItem}>
            <ActivityIndicator size="small" color="#F4A64E" />
            <Text style={styles.processingStepText}>Analisando conteúdo</Text>
          </View>
          <View style={styles.processingStepItem}>
            <Feather name="circle" size={18} color="#ccc" />
            <Text style={[styles.processingStepText, { color: '#ccc' }]}>
              Gerando atributos
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ============ STEP 3: REVIEW ============
interface ReviewStepProps {
  detectedAssets: Record<string, DetectedAsset>;
  onToggleAsset: (assetName: string) => void;
  onUpdateName: (oldName: string, newName: string) => void;
  onUpdateDescription: (assetName: string, description: string) => void;
  onCreate: () => void;
  onBack: () => void;
}

const ReviewStep = ({
  detectedAssets,
  onToggleAsset,
  onUpdateName,
  onUpdateDescription,
  onCreate,
  onBack,
}: ReviewStepProps) => {
  const assetsList = Object.values(detectedAssets);
  const selectedCount = assetsList.filter(a => a.selected).length;

  return (
    <View style={styles.stepContainer}>
      <View style={styles.reviewInfoCard}>
        <View style={styles.reviewInfoContent}>
          <MaterialCommunityIcons name="clipboard-check" size={24} color="#F4A64E" />
          <View style={styles.reviewInfoText}>
            <Text style={styles.reviewInfoTitle}>
              {assetsList.length} {assetsList.length === 1 ? 'Ativo Detectado' : 'Ativos Detectados'}
            </Text>
            <Text style={styles.reviewInfoSubtitle}>
              {selectedCount} selecionado(s) para criação
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.reviewList} showsVerticalScrollIndicator={false}>
        {assetsList.map((asset, index) => (
          <AssetReviewCard
            key={index}
            asset={asset}
            originalName={Object.keys(detectedAssets)[index]}
            onToggle={() => onToggleAsset(Object.keys(detectedAssets)[index])}
            onUpdateName={onUpdateName}
            onUpdateDescription={onUpdateDescription}
          />
        ))}
      </ScrollView>

      <View style={styles.reviewActions}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={20} color="#666" />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.createButton, selectedCount === 0 && styles.createButtonDisabled]}
          onPress={onCreate}
          disabled={selectedCount === 0}
        >
          <MaterialCommunityIcons name="plus-circle" size={20} color="white" />
          <Text style={styles.createButtonText}>Criar ({selectedCount})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============ ASSET REVIEW CARD ============
interface AssetReviewCardProps {
  asset: DetectedAsset;
  originalName: string;
  onToggle: () => void;
  onUpdateName: (oldName: string, newName: string) => void;
  onUpdateDescription: (assetName: string, description: string) => void;
}

const AssetReviewCard = ({
  asset,
  originalName,
  onToggle,
  onUpdateName,
  onUpdateDescription,
}: AssetReviewCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const attributesCount = Object.keys(asset.attributes).length;

  return (
    <View style={[styles.assetReviewCard, asset.selected && styles.assetReviewCardSelected]}>
      <TouchableOpacity
        style={styles.assetReviewHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <TouchableOpacity style={styles.assetReviewCheckbox} onPress={onToggle}>
          <View style={[styles.checkbox, asset.selected && styles.checkboxChecked]}>
            {asset.selected && <Feather name="check" size={16} color="white" />}
          </View>
        </TouchableOpacity>

        <View style={styles.assetReviewInfo}>
          <Text style={styles.assetReviewName}>{asset.name}</Text>
          <Text style={styles.assetReviewDescription} numberOfLines={1}>
            {asset.description}
          </Text>
          <View style={styles.assetReviewMeta}>
            <View style={styles.assetReviewMetaItem}>
              <Feather name="list" size={12} color="#666" />
              <Text style={styles.assetReviewMetaText}>
                {attributesCount} atributo(s)
              </Text>
            </View>
          </View>
        </View>

        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={24} color="#666" />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.assetReviewDetails}>
          <View style={styles.assetReviewSection}>
            <Text style={styles.assetReviewSectionTitle}>Descrição</Text>
            <TextInput
              style={styles.assetReviewInput}
              value={asset.description}
              onChangeText={(text) => onUpdateDescription(originalName, text)}
              placeholder="Descrição do ativo"
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.assetReviewSection}>
            <Text style={styles.assetReviewSectionTitle}>Atributos ({attributesCount})</Text>
            {Object.entries(asset.attributes).map(([attrName, attrData], idx) => (
              <View key={idx} style={styles.attributeItem}>
                <View style={styles.attributeHeader}>
                  <Feather name="tag" size={14} color="#F4A64E" />
                  <Text style={styles.attributeName}>{attrName}</Text>
                </View>

                <View style={styles.attributeValue}>
                  <Text style={styles.attributeValueText}>
                    {formatAttributeValue(attrData)}
                  </Text>
                  <View style={styles.attributeTypeBadge}>
                    <Text style={styles.attributeTypeText}>{attrData.type}</Text>
                  </View>
                </View>

                {(attrData.type === 'selection' || attrData.type === 'multiselection') &&
                  attrData.options &&
                  attrData.options.length > 0 && (
                    <View style={styles.attributeOptions}>
                      <Text style={styles.attributeOptionsLabel}>Opções disponíveis:</Text>
                      <View style={styles.attributeOptionsList}>
                        {attrData.options.map((option, optIdx) => {
                          const isSelected =
                            attrData.type === 'selection'
                              ? option === attrData.value
                              : attrData.value.split(',').map((v: string) => v.trim()).includes(option);

                          return (
                            <View
                              key={optIdx}
                              style={[
                                styles.attributeOptionChip,
                                isSelected && styles.attributeOptionChipSelected,
                              ]}
                            >
                              {isSelected && <Feather name="check" size={12} color={themeColors.primary} />}
                              <Text
                                style={[
                                  styles.attributeOptionText,
                                  isSelected && styles.attributeOptionTextSelected,
                                ]}
                              >
                                {option}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const formatAttributeValue = (attrData: AttributeData): string => {
  let value = String(attrData.value);

  if (attrData.type === 'metric' && attrData.unit) {
    value += ` ${attrData.unit}`;
  }

  if (attrData.type === 'timemetric' && attrData.timeunit) {
    value += ` ${attrData.timeunit}`;
  }

  if (attrData.type === 'boolean') {
    value = attrData.value ? 'Sim' : 'Não';
  }

  if (attrData.type === 'date') {
    value = new Date(attrData.value).toLocaleDateString('pt-BR');
  }

  if (attrData.type === 'selection') {
    value = `Selecionado: ${attrData.value}`;
  }

  if (attrData.type === 'multiselection') {
    const selected = attrData.value.split(',').map((v: string) => v.trim());
    value = `Selecionados: ${selected.join(', ')}`;
  }

  return value;
};

// ============ STEP 5: CREATING ============
const CreatingStep = () => {
  return (
    <View style={styles.processingContainer}>
      <View style={styles.processingCard}>
        <View style={styles.processingIconContainer}>
          <MaterialCommunityIcons name="package-variant" size={64} color="#5ECC63" />
        </View>
        <ActivityIndicator size="large" color="#5ECC63" style={styles.processingSpinner} />
        <Text style={styles.processingTitle}>Criando Ativos...</Text>
        <Text style={styles.processingSubtitle}>
          Estamos criando os ativos e seus atributos no sistema
        </Text>
      </View>
    </View>
  );
};

interface SuccessStepProps {
  onFinish: () => void;
}

const SuccessStep = ({ onFinish }: SuccessStepProps) => {
  return (
    <View style={styles.successContainer}>
      <View style={styles.successCard}>
        <View style={styles.successIconContainer}>
          <Feather name="check-circle" size={80} color="#5ECC63" />
        </View>
        <Text style={styles.successTitle}>Ativos Criados!</Text>
        <Text style={styles.successSubtitle}>
          Os ativos foram criados com sucesso através da análise de IA
        </Text>
        <TouchableOpacity style={styles.successButton} onPress={onFinish}>
          <MaterialCommunityIcons name="plus" size={20} color="white" />
          <Text style={styles.successButtonText}>Criar Mais Ativos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (photoBase64: string, photoUri: string) => void;
}

const CameraModal = ({ visible, onClose, onCapture }: CameraModalProps) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (visible) {
      getCameraPermissions();
    }
  }, [visible]);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const takePicture = async () => {
    if (cameraRef && !capturing) {
      setCapturing(true);
      try {
        const photo = await cameraRef.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        onCapture(photo.base64, photo.uri);
      } catch (error) {
        console.error('Erro ao capturar foto:', error);
        Alert.alert('Erro', 'Não foi possível tirar a foto');
      } finally {
        setCapturing(false);
      }
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.cameraModalContainer}>
        {hasPermission === false ? (
          <View style={styles.cameraPermissionContainer}>
            <Feather name="camera-off" size={48} color="#C62828" />
            <Text style={styles.cameraPermissionText}>
              Sem acesso à câmera. Por favor, habilite nas configurações.
            </Text>
            <TouchableOpacity style={styles.cameraPermissionButton} onPress={onClose}>
              <Text style={styles.cameraPermissionButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView style={styles.camera} facing="back" ref={(ref) => setCameraRef(ref)}>
              <View style={styles.cameraHeader}>
                <TouchableOpacity style={styles.cameraCloseButton} onPress={onClose}>
                  <Feather name="x" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.cameraTitle}>Tirar Foto</Text>
                <View style={{ width: 40 }} />
              </View>

              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={[styles.cameraCaptureButton, capturing && styles.cameraCaptureButtonDisabled]}
                  onPress={takePicture}
                  disabled={capturing}
                >
                  {capturing ? (
                    <ActivityIndicator size="large" color="white" />
                  ) : (
                    <View style={styles.cameraCaptureButtonInner} />
                  )}
                </TouchableOpacity>
              </View>
            </CameraView>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  header: {
    padding: 20,
    paddingTop: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  main: {
    backgroundColor: themeColors.mainBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.dark,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: themeColors.light,
    lineHeight: 20,
  },
  welcomeIconContainer: {
    marginLeft: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.dark,
    marginBottom: 12,
  },
  imageBadge: {
    backgroundColor: themeColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  imageOptionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  imageOptionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.dark,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  imageItem: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  imageRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: themeColors.primary,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  // Context Step
  contextHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  contextHint: {
    fontSize: 13,
    color: themeColors.light,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  contextInput: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 14,
    color: themeColors.dark,
    minHeight: 80,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContextCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  imageContextThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  imageContextInfo: {
    flex: 1,
  },
  imageContextTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.dark,
    marginBottom: 4,
  },
  imageContextSubtitle: {
    fontSize: 13,
    color: themeColors.light,
  },
  imageContextInput: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 14,
    color: themeColors.dark,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 20,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: themeColors.secondary,
    marginBottom: 4,
  },
  infoCardText: {
    fontSize: 13,
    color: themeColors.dark,
    lineHeight: 18,
  },
  contextActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  processButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: themeColors.success,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  processButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Processing
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  processingIconContainer: {
    marginBottom: 20,
  },
  processingSpinner: {
    marginVertical: 20,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeColors.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  processingSubtitle: {
    fontSize: 14,
    color: themeColors.light,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  processingSteps: {
    width: '100%',
    gap: 12,
  },
  processingStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  processingStepText: {
    fontSize: 14,
    color: themeColors.dark,
    fontWeight: '500',
  },

  // Review
  reviewInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewInfoText: {
    flex: 1,
  },
  reviewInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: themeColors.dark,
    marginBottom: 2,
  },
  reviewInfoSubtitle: {
    fontSize: 14,
    color: themeColors.light,
  },
  reviewList: {
    flex: 1,
    marginBottom: 16,
  },
  assetReviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  assetReviewCardSelected: {
    borderColor: themeColors.primary,
    backgroundColor: '#FFFBF5',
  },
  assetReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  assetReviewCheckbox: {
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: themeColors.primary,
    borderColor: themeColors.primary,
  },
  assetReviewInfo: {
    flex: 1,
  },
  assetReviewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: themeColors.dark,
    marginBottom: 4,
  },
  assetReviewDescription: {
    fontSize: 14,
    color: themeColors.light,
    marginBottom: 8,
  },
  assetReviewMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  assetReviewMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assetReviewMetaText: {
    fontSize: 12,
    color: '#666',
  },
  assetReviewDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 16,
    gap: 16,
  },
  assetReviewSection: {
    gap: 8,
  },
  assetReviewSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: themeColors.dark,
    marginBottom: 4,
  },
  assetReviewInput: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 14,
    color: themeColors.dark,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  attributeItem: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  attributeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  attributeName: {
    fontSize: 13,
    fontWeight: '600',
    color: themeColors.dark,
  },
  attributeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attributeValueText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  attributeTypeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  attributeTypeText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '600',
  },
  attributeOptions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  attributeOptionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: themeColors.mid,
    marginBottom: 8,
  },
  attributeOptionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attributeOptionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  attributeOptionChipSelected: {
    backgroundColor: '#FFF3E0',
    borderColor: themeColors.primary,
  },
  attributeOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  attributeOptionTextSelected: {
    color: themeColors.primary,
    fontWeight: '600',
  },

  // Actions
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: themeColors.success,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Success
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: themeColors.dark,
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 14,
    color: themeColors.light,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: themeColors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  successButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Camera Modal
  cameraModalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  cameraCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cameraCaptureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cameraCaptureButtonDisabled: {
    opacity: 0.5,
  },
  cameraCaptureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
  cameraPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
  },
  cameraPermissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 24,
  },
  cameraPermissionButton: {
    backgroundColor: themeColors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  cameraPermissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AIAssetCreationScreen;