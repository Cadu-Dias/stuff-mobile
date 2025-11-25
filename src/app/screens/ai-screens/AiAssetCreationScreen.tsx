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

type Step = 'image-selection' | 'processing' | 'review' | 'creating' | 'success';

interface DetectedAsset {
  name: string;
  description: string;
  attributes: Record<string, AttributeData>;
  selected: boolean;
  editing?: boolean;
}

interface AttributeData {
  type: 'number' | 'text' | 'metric' | 'boolean' | 'date' | 'selection' | 'multiselection' | 'timemetric';
  value: any;
  unit?: string;
  timeUnit?: string;
  options?: string[];
}

const AIAssetCreationScreen = () => {
  const [currentStep, setCurrentStep] = useState<Step>('image-selection');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detectedAssets, setDetectedAssets] = useState<Record<string, DetectedAsset>>({});
  const [processing, setProcessing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<string | null>(null);

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setSelectedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const takePhotoWithCamera = () => {
    setShowCameraModal(true);
  };

  const handleCameraCapture = async (photoBase64: string) => {
    setSelectedImage(`data:image/jpeg;base64,${photoBase64}`);
    setShowCameraModal(false);
  };

  const processImage = async () => {
    if (!selectedImage) {
      Alert.alert('Erro', 'Selecione uma imagem primeiro');
      return;
    }

    setProcessing(true);
    setCurrentStep('processing');

    try {
      const base64Data = selectedImage.split(',')[1];
      const result = await aiService.describeImage(base64Data);

      if (result && Object.keys(result).length > 0) {
        const assetsWithSelection: Record<string, DetectedAsset> = {};
        
        Object.keys(result).forEach((assetName) => {
          assetsWithSelection[assetName] = {
            ...result[assetName],
            name: assetName,
            selected: true,
          };
        });

        setDetectedAssets(assetsWithSelection);
        setCurrentStep('review');
      } else {
        Alert.alert('Aviso', 'Nenhum ativo foi detectado na imagem');
        setCurrentStep('image-selection');
      }
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      Alert.alert('Erro', 'Não foi possível processar a imagem. Tente novamente.');
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

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const asset of selectedAssetsList) {
        try {
          // Criar o ativo
          const createdAsset = await assetService.createAsset({
            name: asset.name,
            description: asset.description,
            type: 'object',
            organizationId: organizationId,
            quantity: 1,
          });

          // Criar os atributos
          for (const [attrName, attrData] of Object.entries(asset.attributes)) {
            try {
              const attributePayload: any = {
                assetId: createdAsset.id,
                name: attrName,
                type: attrData.type,
              };

              // Adicionar campos específicos baseado no tipo
              if (attrData.type === 'selection' || attrData.type === 'multiselection') {
                attributePayload.options = attrData.options?.join(',');
              }

              const createdAttribute = await attributeService.createAttribute(attributePayload);

              // Criar o valor do atributo
              const valuePayload: any = {
                assetId: createdAsset.id,
                value: attrData.value,
              };

              if (attrData.type === 'metric' && attrData.unit) {
                valuePayload.metricUnit = attrData.unit;
              }

              if (attrData.type === 'timemetric' && attrData.timeUnit) {
                valuePayload.timeUnit = attrData.timeUnit;
              }

              await attributeService.createAttributeValue(
                createdAttribute.id,
                createdAsset.id,
                valuePayload.value
              );
            } catch (attrError) {
              console.error(`Erro ao criar atributo ${attrName}:`, attrError);
            }
          }

          successCount++;
        } catch (assetError) {
          console.error(`Erro ao criar ativo ${asset.name}:`, assetError);
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
    } catch (error) {
      console.error('Erro ao criar ativos:', error);
      Alert.alert('Erro', 'Não foi possível criar os ativos');
      setCurrentStep('review');
    } finally {
      setCreating(false);
    }
  };

  const resetScreen = () => {
    setCurrentStep('image-selection');
    setSelectedImage(null);
    setDetectedAssets({});
    setProcessing(false);
    setCreating(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="brain" size={28} color="#F4A64E" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Criação com IA</Text>
            <Text style={styles.headerSubtitle}>Detecte ativos através de imagens</Text>
          </View>
        </View>
      </View>

      {/* Steps */}
      {currentStep === 'image-selection' && (
        <ImageSelectionStep
          selectedImage={selectedImage}
          onPickFromGallery={pickImageFromGallery}
          onTakePhoto={takePhotoWithCamera}
          onProcess={processImage}
          onReset={() => setSelectedImage(null)}
        />
      )}

      {currentStep === 'processing' && (
        <ProcessingStep />
      )}

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

      {currentStep === 'creating' && (
        <CreatingStep />
      )}

      {currentStep === 'success' && (
        <SuccessStep onFinish={resetScreen} />
      )}

      {/* Camera Modal */}
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
  selectedImage: string | null;
  onPickFromGallery: () => void;
  onTakePhoto: () => void;
  onProcess: () => void;
  onReset: () => void;
}

const ImageSelectionStep = ({
  selectedImage,
  onPickFromGallery,
  onTakePhoto,
  onProcess,
  onReset,
}: ImageSelectionStepProps) => {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconContainer}>
          <MaterialCommunityIcons name="image-plus" size={28} color="#F4A64E" />
        </View>
        <Text style={styles.stepTitle}>Selecione uma Imagem</Text>
        <Text style={styles.stepSubtitle}>
          Escolha uma foto da galeria ou tire uma foto do objeto
        </Text>
      </View>

      {!selectedImage ? (
        <View style={styles.imageSelectionContainer}>
          <TouchableOpacity style={styles.imageOptionCard} onPress={onPickFromGallery}>
            <View style={styles.imageOptionIcon}>
              <Feather name="image" size={48} color="#2196F3" />
            </View>
            <Text style={styles.imageOptionTitle}>Galeria</Text>
            <Text style={styles.imageOptionDescription}>
              Selecione uma foto da sua galeria
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.imageOptionCard} onPress={onTakePhoto}>
            <View style={styles.imageOptionIcon}>
              <Feather name="camera" size={48} color="#5ECC63" />
            </View>
            <Text style={styles.imageOptionTitle}>Câmera</Text>
            <Text style={styles.imageOptionDescription}>
              Tire uma foto agora
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.imagePreviewContainer}>
          <View style={styles.imagePreviewCard}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.imageRemoveButton} onPress={onReset}>
              <Feather name="x" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.imagePreviewInfo}>
            <Feather name="check-circle" size={24} color="#5ECC63" />
            <Text style={styles.imagePreviewText}>Imagem selecionada com sucesso</Text>
          </View>

          <TouchableOpacity style={styles.processButton} onPress={onProcess}>
            <MaterialCommunityIcons name="brain" size={20} color="white" />
            <Text style={styles.processButtonText}>Processar com IA</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ============ STEP 2: PROCESSING ============
const ProcessingStep = () => {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.processingContainer}>
        <View style={styles.processingIconContainer}>
          <MaterialCommunityIcons name="brain" size={64} color="#F4A64E" />
        </View>
        <ActivityIndicator size="large" color="#F4A64E" style={styles.processingSpinner} />
        <Text style={styles.processingTitle}>Processando Imagem...</Text>
        <Text style={styles.processingSubtitle}>
          A IA está analisando a imagem e detectando os ativos
        </Text>
        <View style={styles.processingSteps}>
          <View style={styles.processingStepItem}>
            <Feather name="check" size={16} color="#5ECC63" />
            <Text style={styles.processingStepText}>Analisando imagem</Text>
          </View>
          <View style={styles.processingStepItem}>
            <ActivityIndicator size="small" color="#F4A64E" />
            <Text style={styles.processingStepText}>Detectando objetos</Text>
          </View>
          <View style={styles.processingStepItem}>
            <Feather name="circle" size={16} color="#ccc" />
            <Text style={[styles.processingStepText, { color: '#ccc' }]}>Gerando atributos</Text>
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
      <View style={styles.stepHeader}>
        <View style={styles.stepIconContainer}>
          <MaterialCommunityIcons name="clipboard-check" size={28} color="#F4A64E" />
        </View>
        <Text style={styles.stepTitle}>Revisar Ativos Detectados</Text>
        <Text style={styles.stepSubtitle}>
          {assetsList.length} ativo(s) encontrado(s) • {selectedCount} selecionado(s)
        </Text>
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

      <View style={styles.stepActions}>
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
        <TouchableOpacity
          style={styles.assetReviewCheckbox}
          onPress={onToggle}
        >
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

        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#666"
        />
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
            <Text style={styles.assetReviewSectionTitle}>
              Atributos ({attributesCount})
            </Text>
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

  if (attrData.type === 'timemetric' && attrData.timeUnit) {
    value += ` ${attrData.timeUnit}`;
  }

  if (attrData.type === 'boolean') {
    value = attrData.value ? 'Sim' : 'Não';
  }

  if (attrData.type === 'date') {
    value = new Date(attrData.value).toLocaleDateString('pt-BR');
  }

  return value;
};

// ============ STEP 4: CREATING ============
const CreatingStep = () => {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.processingContainer}>
        <View style={styles.processingIconContainer}>
          <MaterialCommunityIcons name="package-variant" size={64} color="#5ECC63" />
        </View>
        <ActivityIndicator size="large" color="#5ECC63" style={styles.processingSpinner} />
        <Text style={styles.processingTitle}>Criando Ativos...</Text>
        <Text style={styles.processingSubtitle}>
          Estamos criando os ativos e seus atributos
        </Text>
      </View>
    </View>
  );
};

// ============ STEP 5: SUCCESS ============
interface SuccessStepProps {
  onFinish: () => void;
}

const SuccessStep = ({ onFinish }: SuccessStepProps) => {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.successContainer}>
        <View style={styles.successIconContainer}>
          <Feather name="check-circle" size={80} color="#5ECC63" />
        </View>
        <Text style={styles.successTitle}>Ativos Criados!</Text>
        <Text style={styles.successSubtitle}>
          Os ativos foram criados com sucesso através da análise de IA
        </Text>
        <TouchableOpacity style={styles.successButton} onPress={onFinish}>
          <Text style={styles.successButtonText}>Criar Mais Ativos</Text>
          <Feather name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============ CAMERA MODAL ============
interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (photoBase64: string) => void;
}

const CameraModal = ({ visible, onClose, onCapture }: CameraModalProps) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
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
        onCapture(photo.base64!);
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
            <CameraView
                style={styles.camera}
                facing='back'
                ref={(ref) => setCameraRef(ref)}
            >
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
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Header
  header: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
  },

  // Step Container
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Image Selection
  imageSelectionContainer: {
    flex: 1,
    gap: 16,
    justifyContent: 'center',
  },
  imageOptionCard: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageOptionIcon: {
    marginBottom: 16,
  },
  imageOptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  imageOptionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },

  // Image Preview
  imagePreviewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  imagePreviewCard: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  imagePreview: {
    width: 300,
    height: 300,
    borderRadius: 14,
  },
  imageRemoveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  imagePreviewText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F4A64E',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
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
    padding: 40,
  },
  processingIconContainer: {
    marginBottom: 24,
  },
  processingSpinner: {
    marginVertical: 24,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  processingSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  processingSteps: {
    width: '100%',
    gap: 12,
  },
  processingStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
  },
  processingStepText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  // Review
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
  },
  assetReviewCardSelected: {
    borderColor: '#F4A64E',
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
    backgroundColor: '#F4A64E',
    borderColor: '#F4A64E',
  },
  assetReviewInfo: {
    flex: 1,
  },
  assetReviewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  assetReviewDescription: {
    fontSize: 14,
    color: '#666',
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
    color: '#333',
    marginBottom: 4,
  },
  assetReviewInput: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 14,
    color: '#333',
    minHeight: 60,
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
    color: '#333',
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

  // Actions
  stepActions: {
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
    backgroundColor: '#5ECC63',
    gap: 8,
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
    padding: 40,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F4A64E',
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
    backgroundColor: '#F4A64E',
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