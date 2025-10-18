import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
// import QRCode from 'react-native-qrcode-svg';
import { AssetService } from '../../services/asset.service';
import { OrganizationService } from '../../services/organization.service';
import { Asset } from '../../models/asset.model';
import { Organization } from '../../models/organization.model';

type Step = 'asset-selection' | 'print-selection' | 'scanning' | 'results';

interface AssetWithSelection extends Asset {
  selected: boolean;
  scanned?: boolean;
}

interface AssetSelectionStepProps {
  assets: AssetWithSelection[];
  onToggleAsset: (assetId: string) => void;
  onContinue: () => void;
  loading: boolean;
}

const AssetSelectionStep = ({ assets, onToggleAsset, onContinue, loading }: AssetSelectionStepProps) => {
  const selectedCount = assets.filter(a => a.selected).length;

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconContainer}>
          <MaterialCommunityIcons name="package-variant" size={28} color="#F4A64E" />
        </View>
        <Text style={styles.stepTitle}>Selecione os Ativos</Text>
        <Text style={styles.stepSubtitle}>
          Escolha os ativos que deseja gerenciar com QR Code
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F4A64E" />
          <Text style={styles.loadingText}>Carregando ativos...</Text>
        </View>
      ) : assets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="inbox" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Nenhum ativo disponível</Text>
          <Text style={styles.emptySubtext}>
            Cadastre ativos na organização primeiro
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.selectionInfo}>
            <Feather name="check-square" size={16} color="#F4A64E" />
            <Text style={styles.selectionInfoText}>
              {selectedCount} de {assets.length} selecionado(s)
            </Text>
          </View>

          <ScrollView style={styles.assetList} showsVerticalScrollIndicator={false}>
            {assets.map((asset) => (
              <TouchableOpacity
                key={asset.id}
                style={[styles.assetCard, asset.selected && styles.assetCardSelected]}
                onPress={() => onToggleAsset(asset.id)}
              >
                <View style={styles.checkboxContainer}>
                  <View style={[styles.checkbox, asset.selected && styles.checkboxChecked]}>
                    {asset.selected && (
                      <Feather name="check" size={16} color="white" />
                    )}
                  </View>
                </View>
                
                <View style={styles.assetInfo}>
                  <Text style={styles.assetName}>{asset.name}</Text>
                  <Text style={styles.assetDescription} numberOfLines={2}>
                    {asset.description}
                  </Text>
                  <View style={styles.assetMeta}>
                    <View style={styles.assetMetaItem}>
                      <Feather name="tag" size={12} color="#666" />
                      <Text style={styles.assetMetaText}>{asset.type}</Text>
                    </View>
                    <View style={styles.assetMetaItem}>
                      <Feather name="hash" size={12} color="#666" />
                      <Text style={styles.assetMetaText}>Qtd: {asset.quantity}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.assetArrow}>
                  <Feather 
                    name={asset.selected ? "check-circle" : "circle"} 
                    size={24} 
                    color={asset.selected ? "#5ECC63" : "#ccc"} 
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.stepActions}>
            <TouchableOpacity
              style={[styles.continueButton, selectedCount === 0 && styles.continueButtonDisabled]}
              onPress={onContinue}
              disabled={selectedCount === 0}
            >
              <Text style={styles.continueButtonText}>Continuar</Text>
              <Feather name="arrow-right" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};


interface PrintSelectionStepProps {
  organization: Organization | null;
  selectedAssets: AssetWithSelection[];
  onTogglePrint: (assetId: string) => void;
  onPrint: () => void;
  onSkip: () => void;
  onBack: () => void;
  printing: boolean;
  assetsToPrint: Set<string>;
}

const PrintSelectionStep = ({ 
  organization,
  selectedAssets, 
  onTogglePrint, 
  onPrint, 
  onSkip, 
  onBack,
  printing,
  assetsToPrint 
}: PrintSelectionStepProps) => {
  const printCount = assetsToPrint.size;

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconContainer}>
          <MaterialCommunityIcons name="printer" size={28} color="#F4A64E" />
        </View>
        <Text style={styles.stepTitle}>Imprimir QR Codes?</Text>
        <Text style={styles.stepSubtitle}>
          Selecione os ativos que deseja imprimir etiquetas
        </Text>
      </View>

      <View style={styles.selectionInfo}>
        <Feather name="printer" size={16} color="#F4A64E" />
        <Text style={styles.selectionInfoText}>
          {printCount} para impressão
        </Text>
      </View>

      <ScrollView style={styles.assetList} showsVerticalScrollIndicator={false}>
        {selectedAssets.map((asset) => {
          const willPrint = assetsToPrint.has(asset.id);
          
          return (
            <TouchableOpacity
              key={asset.id}
              style={[styles.assetCard, willPrint && styles.assetCardSelected]}
              onPress={() => onTogglePrint(asset.id)}
            >
              <View style={styles.checkboxContainer}>
                <View style={[styles.checkbox, willPrint && styles.checkboxChecked]}>
                  {willPrint && (
                    <Feather name="check" size={16} color="white" />
                  )}
                </View>
              </View>
              
              <View style={styles.assetInfo}>
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetDescription} numberOfLines={1}>
                  {asset.description}
                </Text>
              </View>

              <View style={styles.assetArrow}>
                <MaterialCommunityIcons 
                  name={willPrint ? "printer-check" : "printer-off"} 
                  size={24} 
                  color={willPrint ? "#5ECC63" : "#ccc"} 
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.stepActions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={printing}
        >
          <Feather name="arrow-left" size={20} color="#666" />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>

        {printCount > 0 ? (
          <TouchableOpacity
            style={[styles.printButton, printing && styles.printButtonDisabled]}
            onPress={onPrint}
            disabled={printing}
          >
            {printing ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.printButtonText}>Imprimindo...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="printer" size={20} color="white" />
                <Text style={styles.printButtonText}>Imprimir ({printCount})</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
          >
            <Text style={styles.skipButtonText}>Pular Impressão</Text>
            <Feather name="arrow-right" size={20} color="#F4A64E" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ============ ETAPA 3: SCANNING ============
interface ScanningStepProps {
  organization: Organization | null;
  selectedAssets: AssetWithSelection[];
  currentAsset: AssetWithSelection | null;
  onAssetScanned: (success: boolean) => void;
  onSelectAsset: (asset: AssetWithSelection) => void;
  onFinish: () => void;
  scanning: boolean;
}

const ScanningStep = ({ 
  organization,
  selectedAssets, 
  currentAsset,
  onAssetScanned,
  onSelectAsset,
  onFinish,
  scanning
}: ScanningStepProps) => {
  const scannedCount = selectedAssets.filter(a => a.scanned).length;
  const progress = (scannedCount / selectedAssets.length) * 100;

  return (
    <View style={styles.stepContainer}>
      {!scanning ? (
        <>
          <View style={styles.stepHeader}>
            <View style={styles.stepIconContainer}>
              <MaterialCommunityIcons name="qrcode-scan" size={28} color="#F4A64E" />
            </View>
            <Text style={styles.stepTitle}>Escanear QR Codes</Text>
            <Text style={styles.stepSubtitle}>
              Selecione um ativo para escanear seu QR Code
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Progresso</Text>
              <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressLabel}>
              {scannedCount} de {selectedAssets.length} escaneados
            </Text>
          </View>

          <ScrollView style={styles.assetList} showsVerticalScrollIndicator={false}>
            {selectedAssets.map((asset) => (
              <TouchableOpacity
                key={asset.id}
                style={[
                  styles.scanAssetCard,
                  asset.scanned && styles.scanAssetCardScanned
                ]}
                onPress={() => !asset.scanned && onSelectAsset(asset)}
                disabled={asset.scanned}
              >
                <View style={styles.scanAssetIcon}>
                  {asset.scanned ? (
                    <Feather name="check-circle" size={24} color="#5ECC63" />
                  ) : (
                    <MaterialCommunityIcons name="qrcode-scan" size={24} color="#F4A64E" />
                  )}
                </View>
                
                <View style={styles.assetInfo}>
                  <Text style={[
                    styles.assetName,
                    asset.scanned && styles.assetNameScanned
                  ]}>
                    {asset.name}
                  </Text>
                  <Text style={styles.assetDescription}>
                    {asset.scanned ? 'Escaneado com sucesso' : 'Toque para escanear'}
                  </Text>
                </View>

                <View style={styles.assetArrow}>
                  {!asset.scanned && (
                    <Feather name="camera" size={20} color="#F4A64E" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.stepActions}>
            <TouchableOpacity
              style={styles.finishButton}
              onPress={onFinish}
            >
              <Text style={styles.finishButtonText}>
                {scannedCount === selectedAssets.length ? 'Ver Resultados' : 'Finalizar Mesmo Assim'}
              </Text>
              <Feather name="check" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <ScannerCamera
          organization={organization}
          asset={currentAsset!}
          onScanned={onAssetScanned}
        />
      )}
    </View>
  );
};

// ============ CÂMERA DE SCAN ============
interface ScannerCameraProps {
  organization: Organization | null;
  asset: AssetWithSelection;
  onScanned: (success: boolean) => void;
}

const ScannerCamera = ({ organization, asset, onScanned }: ScannerCameraProps) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarcodeScanned = ({ data }: any) => {
    if (!scanned && organization) {
      setScanned(true);
      const expectedValue = `${organization.id}|${asset.id}`;
      
      if (data === expectedValue) {
        Alert.alert(
          'QR Code Válido! ✓',
          `O QR Code do ativo "${asset.name}" foi escaneado com sucesso.`,
          [
            {
              text: 'OK',
              onPress: () => onScanned(true),
            },
          ]
        );
      } else {
        Alert.alert(
          'QR Code Inválido',
          `Este QR Code não corresponde ao ativo "${asset.name}".\n\nEsperado: ${asset.name}\nRecebido: ${data}`,
          [
            {
              text: 'Tentar Novamente',
              onPress: () => setScanned(false),
            },
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => onScanned(false),
            },
          ]
        );
      }
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#F4A64E" />
        <Text style={styles.permissionText}>Solicitando permissão da câmera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Feather name="camera-off" size={48} color="#C62828" />
        <Text style={styles.permissionText}>
          Sem acesso à câmera. Por favor, habilite nas configurações.
        </Text>
        <TouchableOpacity style={styles.button} onPress={getCameraPermissions}>
          <Text style={styles.buttonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <View style={styles.cameraScanHeader}>
        <TouchableOpacity 
          style={styles.cameraBackButton}
          onPress={() => onScanned(false)}
        >
          <Feather name="x" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.cameraScanInfo}>
          <Text style={styles.cameraScanTitle}>{asset.name}</Text>
          <Text style={styles.cameraScanSubtitle}>Escaneie o QR Code deste ativo</Text>
        </View>
      </View>

      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.focusedContainer}>
              <View style={styles.scannerFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>
            <View style={styles.unfocusedContainer}></View>
          </View>
          <View style={styles.unfocusedContainer}></View>
        </View>
        
        <View style={styles.instructionContainer}>
          <View style={styles.instructionBox}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="white" />
            <Text style={styles.instructionText}>
              Posicione o QR Code dentro da área marcada
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

interface ResultsStepProps {
  selectedAssets: AssetWithSelection[];
  onFinish: () => void;
  onScanAgain: () => void;
}

const ResultsStep = ({ selectedAssets, onFinish, onScanAgain }: ResultsStepProps) => {
  const scannedCount = selectedAssets.filter(a => a.scanned).length;
  const totalCount = selectedAssets.length;
  const successRate = (scannedCount / totalCount) * 100;
  const allScanned = scannedCount === totalCount;

  return (
    <View style={styles.stepContainer}>
      <View style={styles.resultsHeader}>
        <View style={[
          styles.resultsIconContainer,
          { backgroundColor: allScanned ? '#E8F5E9' : '#FFF3E0' }
        ]}>
          <MaterialCommunityIcons 
            name={allScanned ? "check-circle" : "alert-circle"} 
            size={64} 
            color={allScanned ? "#5ECC63" : "#FF9800"} 
          />
        </View>
        
        <Text style={styles.resultsTitle}>
          {allScanned ? 'Scan Completo!' : 'Scan Parcial'}
        </Text>
        
        <Text style={styles.resultsSubtitle}>
          {allScanned 
            ? 'Todos os QR Codes foram escaneados com sucesso'
            : `${scannedCount} de ${totalCount} QR Codes escaneados`
          }
        </Text>

        <View style={styles.resultsPercentageContainer}>
          <Text style={styles.resultsPercentage}>{Math.round(successRate)}%</Text>
          <Text style={styles.resultsPercentageLabel}>Taxa de Conclusão</Text>
        </View>

        <View style={styles.resultsProgressBar}>
          <View style={[styles.resultsProgressFill, { width: `${successRate}%` }]} />
        </View>
      </View>

      <View style={styles.resultsSummary}>
        <View style={styles.resultsSummaryCard}>
          <Feather name="check-circle" size={24} color="#5ECC63" />
          <Text style={styles.resultsSummaryNumber}>{scannedCount}</Text>
          <Text style={styles.resultsSummaryLabel}>Escaneados</Text>
        </View>

        <View style={styles.resultsSummaryCard}>
          <Feather name="circle" size={24} color="#FF9800" />
          <Text style={styles.resultsSummaryNumber}>{totalCount - scannedCount}</Text>
          <Text style={styles.resultsSummaryLabel}>Pendentes</Text>
        </View>

        <View style={styles.resultsSummaryCard}>
          <Feather name="layers" size={24} color="#2196F3" />
          <Text style={styles.resultsSummaryNumber}>{totalCount}</Text>
          <Text style={styles.resultsSummaryLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.resultsDetails}>
        <Text style={styles.resultsDetailsTitle}>Detalhes</Text>
        <ScrollView style={styles.resultsDetailsList} showsVerticalScrollIndicator={false}>
          {selectedAssets.map((asset) => (
            <View key={asset.id} style={styles.resultsDetailItem}>
              <View style={[
                styles.resultsDetailIcon,
                asset.scanned ? styles.resultsDetailIconSuccess : styles.resultsDetailIconPending
              ]}>
                <Feather 
                  name={asset.scanned ? "check" : "minus"} 
                  size={16} 
                  color="white" 
                />
              </View>
              <View style={styles.resultsDetailInfo}>
                <Text style={styles.resultsDetailName}>{asset.name}</Text>
                <Text style={[
                  styles.resultsDetailStatus,
                  asset.scanned && styles.resultsDetailStatusSuccess
                ]}>
                  {asset.scanned ? 'Escaneado' : 'Não escaneado'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.stepActions}>
        {!allScanned && (
          <TouchableOpacity
            style={styles.scanAgainButton}
            onPress={onScanAgain}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={20} color="#F4A64E" />
            <Text style={styles.scanAgainButtonText}>Escanear Pendentes</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.finishButton}
          onPress={onFinish}
        >
          <Text style={styles.finishButtonText}>Concluir</Text>
          <Feather name="check" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const QRCodeReaderScreen = () => {
  const [currentStep, setCurrentStep] = useState<Step>('asset-selection');
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [assets, setAssets] = useState<AssetWithSelection[]>([]);
  const [assetsToPrint, setAssetsToPrint] = useState<Set<string>>(new Set());
  const [currentScanAsset, setCurrentScanAsset] = useState<AssetWithSelection | null>(null);

  const assetService = new AssetService();
  const organizationService = new OrganizationService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const orgId = await AsyncStorage.getItem('organizationId');
      
      if (!orgId) {
        Alert.alert('Erro', 'Organização não encontrada');
        return;
      }

      const [orgData, assetsData] = await Promise.all([
        organizationService.getOrganizationById(orgId),
        assetService.getOrganizationAssets(orgId)
      ]);

      setOrganization(orgData);
      setAssets(assetsData.map(asset => ({ ...asset, selected: false, scanned: false })));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAsset = (assetId: string) => {
    setAssets(prev => prev.map(asset => 
      asset.id === assetId ? { ...asset, selected: !asset.selected } : asset
    ));
  };

  const handleContinueToPrint = () => {
    setCurrentStep('print-selection');
  };

  const handleTogglePrint = (assetId: string) => {
    setAssetsToPrint(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const generateQRCodeHTML = (asset: AssetWithSelection) => {
    const qrValue = `${organization!.id}|${asset.id}`;
    
    return `
      <div style="page-break-after: always; padding: 20px; text-align: center;">
        <h2 style="margin: 10px 0; font-size: 18px;">${organization!.name}</h2>
        <h3 style="margin: 10px 0; font-size: 16px; color: #666;">${asset.name}</h3>
        <div style="margin: 20px auto; width: 200px; height: 200px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrValue)}" 
               style="width: 100%; height: 100%;" />
        </div>
        <p style="margin: 10px 0; font-size: 12px; color: #999;">${asset.type} - Qtd: ${asset.quantity}</p>
      </div>
    `;
  };

  const handlePrint = async () => {
    if (assetsToPrint.size === 0) return;

    try {
      setPrinting(true);
      
      const selectedForPrint = assets.filter(a => assetsToPrint.has(a.id));
      
      const pages: string[] = [];
      for (let i = 0; i < selectedForPrint.length; i += 2) {
        const asset1 = selectedForPrint[i];
        const asset2 = selectedForPrint[i + 1];
        
        let pageHTML = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 0; 
                  padding: 20px;
                }
              </style>
            </head>
            <body>
              ${generateQRCodeHTML(asset1)}
              ${asset2 ? generateQRCodeHTML(asset2) : ''}
            </body>
          </html>
        `;
        
        pages.push(pageHTML);
      }

      const fullHTML = pages.join('');
      const { uri } = await Print.printToFileAsync({ html: fullHTML });
      
      await Sharing.shareAsync(uri);

      Alert.alert(
        'Impressão Preparada',
        `${assetsToPrint.size} QR Code(s) preparado(s) para impressão.`,
        [
          {
            text: "Cancelar",
            onPress: () => {}
          },
          {
            text: 'Continuar para Scan',
            onPress: () => setCurrentStep('scanning'),
          },
        ]
      );
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      Alert.alert('Erro', 'Não foi possível preparar a impressão');
    } finally {
      setPrinting(false);
    }
  };

  const handleSkipPrint = () => {
    setCurrentStep('scanning');
  };

  const handleSelectAssetToScan = (asset: AssetWithSelection) => {
    setCurrentScanAsset(asset);
    setScanning(true);
  };

  const handleAssetScanned = (success: boolean) => {
    if (success && currentScanAsset) {
      setAssets(prev => prev.map(a => 
        a.id === currentScanAsset.id ? { ...a, scanned: true } : a
      ));
    }
    
    setScanning(false);
    setCurrentScanAsset(null);
  };

  const handleFinishScanning = () => {
    setCurrentStep('results');
  };

  const handleScanAgain = () => {
    setCurrentStep('scanning');
  };

  const handleFinish = () => {
    // Reset e voltar
    setCurrentStep('asset-selection');
    setAssets(prev => prev.map(a => ({ ...a, selected: false, scanned: false })));
    setAssetsToPrint(new Set());
  };

  const selectedAssets = assets.filter(a => a.selected);

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressIndicator}>
        <View style={styles.progressSteps}>
          <View style={[styles.progressStep, currentStep === 'asset-selection' && styles.progressStepActive]}>
            <Text style={styles.progressStepNumber}>1</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={[styles.progressStep, currentStep === 'print-selection' && styles.progressStepActive]}>
            <Text style={styles.progressStepNumber}>2</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={[styles.progressStep, currentStep === 'scanning' && styles.progressStepActive]}>
            <Text style={styles.progressStepNumber}>3</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={[styles.progressStep, currentStep === 'results' && styles.progressStepActive]}>
            <Text style={styles.progressStepNumber}>4</Text>
          </View>
        </View>
      </View>

      {/* Steps */}
      {currentStep === 'asset-selection' && (
        <AssetSelectionStep
          assets={assets}
          onToggleAsset={handleToggleAsset}
          onContinue={handleContinueToPrint}
          loading={loading}
        />
      )}

      {currentStep === 'print-selection' && (
        <PrintSelectionStep
          organization={organization}
          selectedAssets={selectedAssets}
          onTogglePrint={handleTogglePrint}
          onPrint={handlePrint}
          onSkip={handleSkipPrint}
          onBack={() => setCurrentStep('asset-selection')}
          printing={printing}
          assetsToPrint={assetsToPrint}
        />
      )}

      {currentStep === 'scanning' && (
        <ScanningStep
          organization={organization}
          selectedAssets={selectedAssets}
          currentAsset={currentScanAsset}
          onAssetScanned={handleAssetScanned}
          onSelectAsset={handleSelectAssetToScan}
          onFinish={handleFinishScanning}
          scanning={scanning}
        />
      )}

      {currentStep === 'results' && (
        <ResultsStep
          selectedAssets={selectedAssets}
          onFinish={handleFinish}
          onScanAgain={handleScanAgain}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  
  // Progress Indicator
  progressIndicator: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressStep: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepActive: {
    backgroundColor: '#F4A64E',
  },
  progressStepNumber: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
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

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },

  // Selection Info
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  selectionInfoText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '600',
  },

  // Asset List
  assetList: {
    flex: 1,
    marginBottom: 16,
  },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  assetCardSelected: {
    borderColor: '#F4A64E',
    backgroundColor: '#FFFBF5',
  },
  checkboxContainer: {
    marginRight: 12,
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
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  assetNameScanned: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  assetDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  assetMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  assetMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assetMetaText: {
    fontSize: 12,
    color: '#666',
  },
  assetArrow: {
    marginLeft: 8,
  },

  // Scan Asset Card
  scanAssetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  scanAssetCardScanned: {
    borderColor: '#5ECC63',
    backgroundColor: '#F1F8F4',
    opacity: 0.7,
  },
  scanAssetIcon: {
    marginRight: 12,
  },

  // Step Actions
  stepActions: {
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#F4A64E',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
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
  printButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  printButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  printButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#F4A64E',
    gap: 8,
  },
  skipButtonText: {
    color: '#F4A64E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  finishButton: {
    backgroundColor: '#5ECC63',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  finishButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Progress
  progressContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F4A64E',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F4A64E',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  // Camera
  cameraContainer: {
    flex: 1,
  },
  cameraScanHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cameraBackButton: {
    padding: 8,
  },
  cameraScanInfo: {
    flex: 1,
  },
  cameraScanTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cameraScanSubtitle: {
    color: '#ccc',
    fontSize: 14,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  middleContainer: {
    flexDirection: 'row',
    flex: 1.5,
  },
  focusedContainer: {
    flex: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#00ff00',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    color: '#666',
  },
  button: {
    backgroundColor: '#F4A64E',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Results
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultsIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  resultsPercentageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsPercentage: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#F4A64E',
  },
  resultsPercentageLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  resultsProgressBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  resultsProgressFill: {
    height: '100%',
    backgroundColor: '#5ECC63',
    borderRadius: 6,
  },
  resultsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  resultsSummaryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultsSummaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  resultsSummaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  resultsDetails: {
    flex: 1,
    marginBottom: 16,
  },
  resultsDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  resultsDetailsList: {
    flex: 1,
  },
  resultsDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  resultsDetailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultsDetailIconSuccess: {
    backgroundColor: '#5ECC63',
  },
  resultsDetailIconPending: {
    backgroundColor: '#FF9800',
  },
  resultsDetailInfo: {
    flex: 1,
  },
  resultsDetailName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  resultsDetailStatus: {
    fontSize: 12,
    color: '#FF9800',
  },
  resultsDetailStatusSuccess: {
    color: '#5ECC63',
  },
  scanAgainButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#F4A64E',
    gap: 8,
  },
  scanAgainButtonText: {
    color: '#F4A64E',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QRCodeReaderScreen;