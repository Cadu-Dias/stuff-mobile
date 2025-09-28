import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../../models/stackType';
import { RfidStatusItem } from '../../models/rfids/rfidStatusItem';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

// Nova paleta de cores
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

interface SelectedAssets {
  organization: string;
  assets: Array<{
    asset_name: string;
    rfid_tag: string;
  }>;
}

const getProgressColor = (percentage: number): string => {
  if (percentage >= 75) return colors.successLight;
  if (percentage >= 35) return colors.warningBase;
  return colors.dangerLight; 
};

const getStatusInfo = (percentage: number) => {
  if (percentage >= 75) {
    return { 
      status: 'Excelente', 
      color: colors.successLight,
      icon: 'check-circle',
      background: colors.successLight + '20'
    };
  }
  if (percentage >= 35) {
    return { 
      status: 'Parcial', 
      color: colors.warningBase,
      icon: 'alert-circle',
      background: colors.warningBase + '20'
    };
  }
  return { 
    status: 'Crítico', 
    color: colors.dangerLight,
    icon: 'x-circle',
    background: colors.dangerLight + '20'
  };
};

const ProgressCircle = ({ percentage, found, total, color }: { 
  percentage: number, 
  found: number, 
  total: number, 
  color: string
}) => {
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <View style={styles.progressContainer}>
      <Svg width={radius * 2 + 20} height={radius * 2 + 20}>
        <Circle
          stroke={colors.gray100}
          fill="none"
          cx={radius + 10}
          cy={radius + 10}
          r={radius - strokeWidth / 2}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={color}
          fill="none"
          cx={radius + 10}
          cy={radius + 10}
          r={radius - strokeWidth / 2}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${radius + 10} ${radius + 10})`}
        />
        <SvgText
          x={radius - 30}
          y={radius}
          
          alignmentBaseline="middle"
          fontSize="36"
          fontWeight="bold"
          fill={color}
        >
          {Math.round(percentage)}%
        </SvgText>
        <SvgText
          x={radius - 10}
          y={radius + 35}
          alignmentBaseline="middle"
          fontSize="16"
          fill={colors.gray400}
          
        >
          {found} de {total}
        </SvgText>
      </Svg>
    </View>
  );
};

const StatCard = ({ icon, title, value, color, subtitle }: {
  icon: string;
  title: string;
  value: string | number;
  color: string;
  subtitle?: string;
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <MaterialCommunityIcons name={icon as any} size={24} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

const ResultItem = ({ item, index }: { item: RfidStatusItem; index: number }) => {
  const isFound = item.scanned;
  
  return (
    <View style={[
      styles.resultItem, 
      isFound ? styles.resultItemFound : styles.resultItemNotFound
    ]}>
      <View style={styles.resultHeader}>
        <View style={[
          styles.resultIcon,
          { backgroundColor: isFound ? colors.successLight : colors.dangerLight }
        ]}>
          <Feather 
            name={isFound ? "check" : "x"} 
            size={16} 
            color="white" 
          />
        </View>
        <View style={styles.resultInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemRfid}>RFID: {item.rfid}</Text>
        </View>
        <View style={styles.resultStatus}>
          <Text style={[
            styles.statusText, 
            { color: isFound ? colors.successLight : colors.dangerLight }
          ]}>
            {isFound ? 'Encontrado' : 'Não Encontrado'}
          </Text>
          <Text style={styles.itemIndex}>#{index + 1}</Text>
        </View>
      </View>
    </View>
  );
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

  const { totalItems, totalfoundItems, totalnotFoundItems, percentage, progressColor, statusInfo } = useMemo(() => {
    const total = results.length;
    const found = results.filter(item => item.scanned).length;
    const notFound = total - found;
    const perc = total > 0 ? (found / total) * 100 : 0;
    
    return {
      totalItems: total,
      totalfoundItems: found,
      totalnotFoundItems: notFound,
      percentage: perc,
      progressColor: getProgressColor(perc),
      statusInfo: getStatusInfo(perc),
    };
  }, [results]);

  const handleRestartScan = () => {
    if (deviceAddress && selectedAssets) {
      // ✅ Passa selectedAssets de volta para StorageScan
      navigation.navigate('StorageScan', { 
        deviceAddress,
        selectedAssets 
      });
    }
  };

  const handleExportResults = () => {
    console.log('Exportar resultados');
  };

  const foundItems = results.filter(item => item.scanned);
  const notFoundItems = results.filter(item => !item.scanned);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="radar" size={32} color={colors.stuffLight} />
          </View>
          <Text style={styles.title}>Verificação Concluída</Text>
          <Text style={styles.subtitle}>
            {selectedAssets?.organization || 'Resultado da verificação RFID'}
          </Text>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <ProgressCircle
            percentage={percentage}
            found={totalfoundItems}
            total={totalItems}
            color={progressColor}
          />
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.background }]}>
            <Feather name={statusInfo.icon as any} size={16} color={statusInfo.color} />
            <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
              {statusInfo.status}
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Estatísticas</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="package-variant"
              title="Total de Itens"
              value={totalItems}
              color={colors.newBase}
            />
            <StatCard
              icon="check-circle"
              title="Encontrados"
              value={totalfoundItems}
              color={colors.successLight}
              subtitle={`${Math.round((totalfoundItems / totalItems) * 100)}%`}
            />
            <StatCard
              icon="alert-circle"
              title="Não Encontrados"
              value={totalnotFoundItems}
              color={colors.dangerLight}
              subtitle={`${Math.round((totalnotFoundItems / totalItems) * 100)}%`}
            />
          </View>
        </View>

        {/* Results Section */}
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionTitle}>Resultados Detalhados</Text>
            <TouchableOpacity style={styles.exportButton} onPress={handleExportResults}>
              <Feather name="share" size={16} color={colors.stuffLight} />
            </TouchableOpacity>
          </View>

          {foundItems.length > 0 && (
            <View style={styles.categorySection}>
              <Text style={[styles.categoryTitle, { color: colors.successBase }]}>
                Encontrados ({foundItems.length})
              </Text>
              {foundItems.map((item, index) => (
                <ResultItem key={item.rfid} item={item} index={index} />
              ))}
            </View>
          )}

          {notFoundItems.length > 0 && (
            <View style={styles.categorySection}>
              <Text style={[styles.categoryTitle, { color: colors.dangerBase }]}>
                Não Encontrados ({notFoundItems.length})
              </Text>
              {notFoundItems.map((item, index) => (
                <ResultItem key={item.rfid} item={item} index={foundItems.length + index} />
              ))}
            </View>
          )}
        </View>

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleExportResults}
          >
            <Feather name="download" size={18} color={colors.gray400} />
            <Text style={styles.secondaryButtonText}>Exportar</Text>
          </TouchableOpacity>

          {deviceAddress && selectedAssets && (
            <TouchableOpacity style={styles.restartButton} onPress={handleRestartScan}>
              <Feather name="refresh-cw" size={18} color={colors.stuffLight} />
              <Text style={styles.restartButtonText}>Refazer</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.finishButton} 
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Feather name="check" size={20} color="white" />
            <Text style={styles.finishButtonText}>Finalizar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: colors.stuffLight 
  },
  main: { 
    flex: 1, 
    backgroundColor: colors.stuffWhite, 
    margin: 12, 
    borderRadius: 8,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.stuffBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: colors.stuffBlack,
    marginBottom: 4,
  },
  subtitle: { 
    fontSize: 16, 
    color: colors.gray400, 
    textAlign: 'center',
  },

  // Progress Section
  progressSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressContainer: { 
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.stuffBlack,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.stuffBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.stuffBlack,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: colors.gray400,
    textAlign: 'center',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.stuffBlack,
  },

  // Results Section
  resultsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  exportButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.stuffBlack,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  // Result Items
  resultItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: colors.stuffBlack,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultItemFound: {
    borderLeftWidth: 4,
    borderLeftColor: colors.successLight,
  },
  resultItemNotFound: {
    borderLeftWidth: 4,
    borderLeftColor: colors.dangerLight,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.stuffBlack,
    marginBottom: 4,
  },
  itemRfid: {
    fontSize: 12,
    color: colors.gray300,
    fontFamily: 'monospace',
  },
  resultStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemIndex: {
    fontSize: 10,
    color: colors.gray200,
  },

  // Actions Section
  actionsSection: {
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray100,
    gap: 6,
  },
  secondaryButtonText: {
    color: colors.gray400,
    fontSize: 16,
    fontWeight: '600',
  },
  restartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.stuffLight,
    gap: 8,
  },
  restartButtonText: {
    color: colors.stuffLight,
    fontSize: 16,
    fontWeight: '600',
  },
  finishButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.stuffLight,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: colors.stuffBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  finishButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResultsScreen;