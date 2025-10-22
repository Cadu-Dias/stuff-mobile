import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../../models/stackType';
import { RfidStatusItem } from '../../models/rfids/rfidStatusItem';
import { ReportService } from '../../services/reports.service';
import { ReportCreation, ReportCsvModel } from '../../models/reports.model';
import { SelectedAssets } from '../../models/asset.model';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

// Paleta de cores original mantida
const colors = {
  // Primary brand colors
  stuffHigh: '#FFC685',
  stuffLight: '#F89F3C',
  stuffMid: '#DA8627',
  stuffDark: '#9C580C',
  stuffLow: '#362007',
  // Contrast brand colors
  stuffWhite: '#FFF0E0',
  stuffBlack: '#0E0700',
  // Gray scale colors
  gray100: '#C7BCB2',
  gray200: '#ADA298',
  gray300: '#847B74',
  gray400: '#5B5450',
  gray500: '#322D2C',
  // Success colors
  successLight: '#5ECC63',
  successBase: '#24AB2B',
  successDark: '#004804',
  // Danger colors
  dangerLight: '#F65757',
  dangerBase: '#C62828',
  dangerDark: '#770909',
  // Warning colors
  warningLight: '#FFD34F',
  warningBase: '#EDB714',
  warningDark: '#674F08',
  // New colors
  newLight: '#5EEEE3',
  newBase: '#00C7B7',
  newDark: '#0E5B56',
};

const ResultsScreen = ({ route }: { 
  route: { 
    params: { 
      results: RfidStatusItem[], 
      deviceAddress: string,
      selectedAssets?: SelectedAssets
    } 
  } 
}) => {
  const { results, deviceAddress, selectedAssets } = route.params;
  const navigation = useNavigation<RootStackNavigationProp>();
  const reportService = new ReportService();

  const { totalItems, totalFoundItems, totalNotFoundItems, successRate, allScanned } = useMemo(() => {
    const total = results.length;
    const found = results.filter(item => item.scanned).length;
    const notFound = total - found;
    const rate = total > 0 ? (found / total) * 100 : 0;
    
    return {
      totalItems: total,
      totalFoundItems: found,
      totalNotFoundItems: notFound,
      successRate: rate,
      allScanned: found === total,
    };
  }, [results]);

  const uploadScanResult = async () => {
    try {
      const scanDate = new Date();
      const userInfo = JSON.parse(await AsyncStorage.getItem("userData") as string) as { id: string };
      const generatedUUID = uuid.v4();

      const { key, url } = await reportService.generatePresignedUrl(
        `${selectedAssets?.organizationName}-scan-${generatedUUID}.csv`
      );

      const reportPerAsset: ReportCsvModel[] = results.map((value) => {
        const asset = selectedAssets?.assets!.find((selectAsset) => value.name === selectAsset.assetName);
        return { 
          assetId: asset!.assetId, 
          assetName: value.name, 
          scanDate: value.scanDate,
          found: value.scanned, 
          creationDate: scanDate.toISOString(), 
          updateDate: scanDate.toISOString()
        };
      });
      
      await reportService.uploadFileAsCSV(url, reportPerAsset);

      const report: ReportCreation = {
        authorId: userInfo.id,
        organizationId: selectedAssets!.organizationId,
        title: `${selectedAssets?.organizationName} RFID Scan ${scanDate.toISOString()}`,
        key: key
      };

      await reportService.createReport(report);
    } catch (error) {
      console.log('Erro ao fazer upload:', error);
    }
  };

  const handleRestartScan = () => {
    if (deviceAddress && selectedAssets) {
      navigation.navigate('StorageScan', { 
        deviceAddress,
        selectedAssets 
      });
    }
  };

  const handleScanNotFound = () => {
    if (deviceAddress && selectedAssets) {
      const notFoundAssets = {
        ...selectedAssets,
        assets: selectedAssets.assets.filter(asset => {
          const result = results.find(r => r.name === asset.assetName);
          return result && !result.scanned;
        })
      };

      navigation.navigate('StorageScan', { 
        deviceAddress,
        selectedAssets: notFoundAssets 
      });
    }
  };

  useEffect(() => {
    uploadScanResult();
  }, []);

  const foundItems = results.filter(item => item.scanned);
  const notFoundItems = results.filter(item => !item.scanned);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
        {/* Header com ícone de status */}
        <View style={styles.resultsHeader}>
          <View style={[
            styles.resultsIconContainer,
            { backgroundColor: allScanned ? colors.successLight + '30' : colors.warningBase + '30' }
          ]}>
            <MaterialCommunityIcons 
              name={allScanned ? "check-circle" : "alert-circle"} 
              size={64} 
              color={allScanned ? colors.successLight : colors.warningBase} 
            />
          </View>
          
          <Text style={styles.resultsTitle}>
            {allScanned ? 'Scan Completo!' : 'Scan Parcial'}
          </Text>
          
          <Text style={styles.resultsSubtitle}>
            {allScanned 
              ? 'Todos os itens RFID foram encontrados'
              : `${totalFoundItems} de ${totalItems} itens encontrados`
            }
          </Text>

          {/* Porcentagem grande */}
          <View style={styles.resultsPercentageContainer}>
            <Text style={styles.resultsPercentage}>{Math.round(successRate)}%</Text>
            <Text style={styles.resultsPercentageLabel}>Taxa de Sucesso</Text>
          </View>

          {/* Barra de progresso */}
          <View style={styles.resultsProgressBar}>
            <View style={[
              styles.resultsProgressFill, 
              { 
                width: `${successRate}%`,
                backgroundColor: allScanned ? colors.successLight : successRate >= 50 ? colors.warningBase : colors.dangerLight
              }
            ]} />
          </View>
        </View>

        {/* Cards de resumo */}
        <View style={styles.resultsSummary}>
          <View style={styles.resultsSummaryCard}>
            <MaterialCommunityIcons name="radar" size={24} color={colors.newBase} />
            <Text style={styles.resultsSummaryNumber}>{totalItems}</Text>
            <Text style={styles.resultsSummaryLabel}>Total</Text>
          </View>

          <View style={styles.resultsSummaryCard}>
            <Feather name="check-circle" size={24} color={colors.successLight} />
            <Text style={styles.resultsSummaryNumber}>{totalFoundItems}</Text>
            <Text style={styles.resultsSummaryLabel}>Encontrados</Text>
          </View>

          <View style={styles.resultsSummaryCard}>
            <Feather name="alert-circle" size={24} color={colors.warningBase} />
            <Text style={styles.resultsSummaryNumber}>{totalNotFoundItems}</Text>
            <Text style={styles.resultsSummaryLabel}>Pendentes</Text>
          </View>
        </View>

        {/* Detalhes dos itens */}
        <View style={styles.resultsDetails}>
          <Text style={styles.resultsDetailsTitle}>Detalhes</Text>
          
          <ScrollView style={styles.resultsDetailsList} showsVerticalScrollIndicator={false}>
            {/* Itens encontrados */}
            {foundItems.length > 0 && (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Feather name="check-circle" size={16} color={colors.successLight} />
                  <Text style={[styles.categoryTitle, { color: colors.successBase }]}>
                    Encontrados ({foundItems.length})
                  </Text>
                </View>
                {foundItems.map((item, index) => (
                  <View key={item.rfid} style={styles.resultsDetailItem}>
                    <View style={[styles.resultsDetailIcon, styles.resultsDetailIconSuccess]}>
                      <Feather name="check" size={16} color="white" />
                    </View>
                    <View style={styles.resultsDetailInfo}>
                      <Text style={styles.resultsDetailName}>{item.name}</Text>
                      <Text style={styles.resultsDetailStatus}>
                        RFID: {item.rfid}
                      </Text>
                    </View>
                    <View style={styles.resultsDetailBadge}>
                      <Text style={styles.resultsDetailNumber}>#{index + 1}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Itens não encontrados */}
            {notFoundItems.length > 0 && (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Feather name="alert-circle" size={16} color={colors.warningBase} />
                  <Text style={[styles.categoryTitle, { color: colors.warningDark }]}>
                    Não Encontrados ({notFoundItems.length})
                  </Text>
                </View>
                {notFoundItems.map((item, index) => (
                  <View key={item.rfid} style={styles.resultsDetailItem}>
                    <View style={[styles.resultsDetailIcon, styles.resultsDetailIconPending]}>
                      <Feather name="minus" size={16} color="white" />
                    </View>
                    <View style={styles.resultsDetailInfo}>
                      <Text style={styles.resultsDetailName}>{item.name}</Text>
                      <Text style={styles.resultsDetailStatus}>
                        RFID: {item.rfid}
                      </Text>
                    </View>
                    <View style={styles.resultsDetailBadge}>
                      <Text style={styles.resultsDetailNumber}>#{foundItems.length + index + 1}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>

        {/* Informações adicionais */}
        {selectedAssets && (
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="office-building" size={16} color={colors.gray400} />
              <Text style={styles.infoLabel}>Organização:</Text>
              <Text style={styles.infoValue}>{selectedAssets.organizationName}</Text>
            </View>
            {deviceAddress && (
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="bluetooth" size={16} color={colors.gray400} />
                <Text style={styles.infoLabel}>Dispositivo:</Text>
                <Text style={styles.infoValue}>{deviceAddress}</Text>
              </View>
            )}
          </View>
        )}

        {/* Botões de ação */}
        <View style={styles.stepActions}>
          {!allScanned && totalNotFoundItems > 0 && (
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={handleScanNotFound}
            >
              <MaterialCommunityIcons name="radar" size={20} color={colors.stuffLight} />
              <Text style={styles.scanAgainButtonText}>Escanear Pendentes</Text>
            </TouchableOpacity>
          )}

          {deviceAddress && selectedAssets && (
            <TouchableOpacity
              style={styles.restartButton}
              onPress={handleRestartScan}
            >
              <Feather name="refresh-cw" size={20} color={colors.gray400} />
              <Text style={styles.restartButtonText}>Refazer Completo</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.finishButtonText}>Concluir</Text>
            <Feather name="check" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stuffLight, // Mantido background laranja
  },
  main: {
    flex: 1,
    backgroundColor: colors.stuffWhite, // Mantido background bege claro
    margin: 12,
    borderRadius: 8,
  },

  // Header com ícone de status
  resultsHeader: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  resultsIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.stuffBlack,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.stuffBlack,
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 15,
    color: colors.gray400,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },

  // Porcentagem
  resultsPercentageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultsPercentage: {
    fontSize: 56,
    fontWeight: 'bold',
    color: colors.stuffLight,
    letterSpacing: -2,
  },
  resultsPercentageLabel: {
    fontSize: 14,
    color: colors.gray400,
    marginTop: 4,
    fontWeight: '500',
  },

  // Barra de progresso
  resultsProgressBar: {
    width: '100%',
    height: 12,
    backgroundColor: colors.gray100,
    borderRadius: 6,
    overflow: 'hidden',
  },
  resultsProgressFill: {
    height: '100%',
    borderRadius: 6,
  },

  // Cards de resumo
  resultsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  resultsSummaryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    shadowColor: colors.stuffBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsSummaryNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.stuffBlack,
    marginTop: 12,
    marginBottom: 4,
  },
  resultsSummaryLabel: {
    fontSize: 12,
    color: colors.gray400,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Detalhes
  resultsDetails: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  resultsDetailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.stuffBlack,
    marginBottom: 16,
  },
  resultsDetailsList: {
    maxHeight: 400,
  },

  // Categorias
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  // Item de detalhe
  resultsDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: colors.stuffBlack,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  resultsDetailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultsDetailIconSuccess: {
    backgroundColor: colors.successLight,
  },
  resultsDetailIconPending: {
    backgroundColor: colors.warningBase,
  },
  resultsDetailInfo: {
    flex: 1,
  },
  resultsDetailName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.stuffBlack,
    marginBottom: 4,
  },
  resultsDetailStatus: {
    fontSize: 12,
    color: colors.gray400,
    fontFamily: 'monospace',
  },
  resultsDetailBadge: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultsDetailNumber: {
    fontSize: 11,
    color: colors.gray400,
    fontWeight: '600',
  },

  // Informações adicionais
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.gray400,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: colors.stuffBlack,
    flex: 1,
  },

  // Botões de ação
  stepActions: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    gap: 12,
  },
  scanAgainButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: colors.stuffLight,
    gap: 8,
    shadowColor: colors.stuffBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  scanAgainButtonText: {
    color: colors.stuffLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  restartButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.gray100,
    gap: 8,
  },
  restartButtonText: {
    color: colors.gray400,
    fontSize: 16,
    fontWeight: '600',
  },
  finishButton: {
    backgroundColor: colors.stuffLight,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: colors.stuffBlack,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  finishButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ResultsScreen;