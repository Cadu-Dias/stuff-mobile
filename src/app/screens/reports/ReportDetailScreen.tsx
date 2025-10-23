import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Report } from '../../models/reports.model';
import { ReportService } from '../../services/reports.service';
import Papa from 'papaparse';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';

type RouteParams = {
  report: Report;
};

type ViewMode = 'cards' | 'table';

const DataField = ({ label, value, icon }: { label: string; value: string; icon?: string }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = value?.length > 50;
  const displayValue = expanded || !isLong ? value : `${value.substring(0, 50)}...`;

  return (
    <View style={styles.dataField}>
      <View style={styles.dataFieldHeader}>
        {icon && <MaterialCommunityIcons name={icon as any} size={16} color="#F4A64E" />}
        <Text style={styles.dataFieldLabel}>{label}</Text>
      </View>
      <TouchableOpacity
        onPress={() => isLong && setExpanded(!expanded)}
        disabled={!isLong}
        activeOpacity={isLong ? 0.7 : 1}
      >
        <Text style={styles.dataFieldValue}>
          {displayValue || '-'}
        </Text>
        {isLong && (
          <Text style={styles.expandText}>
            {expanded ? 'Ver menos' : 'Ver mais'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const DataCard = ({ data, index }: { data: any; index: number }) => {
  const [collapsed, setCollapsed] = useState(false);
  const fields = Object.entries(data);

  const getIconForField = (fieldName: string): string => {
    const lowerField = fieldName.toLowerCase();
    if (lowerField.includes('nome') || lowerField.includes('name')) return 'tag';
    if (lowerField.includes('data') || lowerField.includes('date')) return 'calendar';
    if (lowerField.includes('rfid') || lowerField.includes('tag')) return 'chip';
    if (lowerField.includes('status')) return 'check-circle';
    if (lowerField.includes('local') || lowerField.includes('location')) return 'map-marker';
    if (lowerField.includes('qtd') || lowerField.includes('quantity')) return 'counter';
    return 'circle-small';
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString || !dateString.trim()) return '';
      if (!dateString.includes("T")) return dateString;

      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.warn('Data inválida:', dateString);
        return dateString;
      }

      return date.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateString;
    }
  }

  const fieldsFormatted: [string, unknown][] = fields.map(([key, value]) => {
    if (key.toLowerCase().includes("date")) {
      return [key as string, formatDate(value as string) as unknown]
    }

    return [key as string, value]
  });

  return (
    <View style={styles.dataCard}>
      <TouchableOpacity
        style={styles.dataCardHeader}
        onPress={() => setCollapsed(!collapsed)}
        activeOpacity={0.7}
      >
        <View style={styles.dataCardHeaderLeft}>
          <View style={styles.dataCardIndex}>
            <Text style={styles.dataCardIndexText}>#{index + 1}</Text>
          </View>
          <Text style={styles.dataCardTitle}>Registro {index + 1}</Text>
        </View>
        <Feather
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={20}
          color="#666"
        />
      </TouchableOpacity>

      {!collapsed && (
        <View style={styles.dataCardContent}>
          {fieldsFormatted.map(([key, value], idx) => (
            <DataField
              key={idx}
              label={key}
              value={String(value)}
              icon={getIconForField(key)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const CompactTableRow = ({ data, headers }: { data: any; headers: string[] }) => {
  const [expanded, setExpanded] = useState(false);

  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text) return '-';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <TouchableOpacity
      style={styles.compactRow}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      {!expanded ? (
        <>
          <View style={styles.compactRowPreview}>
            {headers.slice(0, 3).map((header, idx) => (
              <View key={idx} style={styles.compactCell}>
                <Text style={styles.compactCellLabel}>{header}:</Text>
                <Text style={styles.compactCellValue} numberOfLines={1}>
                  {truncateText(data[header], 25)}
                </Text>
              </View>
            ))}
          </View>
          <Feather name="chevron-right" size={16} color="#999" />
        </>
      ) : (
        <View style={styles.expandedRowContent}>
          <View style={styles.expandedRowHeader}>
            <Text style={styles.expandedRowTitle}>Detalhes Completos</Text>
            <Feather name="chevron-down" size={16} color="#666" />
          </View>
          {headers.map((header, idx) => (
            <View key={idx} style={styles.expandedField}>
              <Text style={styles.expandedFieldLabel}>{header}</Text>
              <Text style={styles.expandedFieldValue}>{data[header] || '-'}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function ReportDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { report } = route.params as RouteParams;

  const [loading, setLoading] = useState(true);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const reportService = new ReportService();

  useEffect(() => {
    downloadAndParseReport();
  }, []);

  const downloadAndParseReport = async () => {
    setLoading(true);
    setError('');

    try {
      const urlParts = report.file_url.split('/');
      const key = urlParts.slice(-2).join('/');
      
      console.log('📥 Baixando relatório com key:', key);

      const csvText = await reportService.downloadReport(key);
      console.log('✅ CSV baixado, parseando dados...');

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results: { data: Report[] }) => {
          console.log('✅ CSV parseado:', results.data.length, 'linhas');
          
          if (results.data.length > 0) {
            setCsvHeaders(Object.keys(results.data[0]));
            setCsvData(results.data);
          } else {
            setError('O relatório está vazio');
          }
          setLoading(false);
        },
        error: (error: any) => {
          console.error('❌ Erro ao parsear CSV:', error);
          setError('Erro ao processar o arquivo CSV');
          setLoading(false);
        },
      });
    } catch (err) {
      console.error('❌ Erro ao baixar relatório:', err);
      setError('Falha ao carregar o relatório');
      setLoading(false);
      Alert.alert('Erro', 'Não foi possível carregar o relatório');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString || !dateString.trim()) return '';
      if (!dateString.includes("T")) return dateString;

      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.warn('Data inválida:', dateString);
        return dateString;
      }

      return date.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateString;
    }
  }

  const formatReportDateTitle = (title: string): string => {
    try {
      if (!title || !title.trim()) return '';

      const scanType = title.includes("RFID Scan") 
        ? "RFID Scan" 
        : title.includes("QR Code Scan")
        ? "QR Code Scan"
        : null;

      if (!scanType) {
        console.warn('Tipo de scan não encontrado no título:', title);
        return title;
      }

      const parts = title.split(scanType);
      const textTitle = parts[0]?.trim() || '';
      const dateStr = parts[1]?.trim() || '';

      console.log('Text Title:', textTitle);
      console.log('Date String:', dateStr);
      
      const formattedDate = formatDate(dateStr);
      return `${textTitle} ${scanType} ${formattedDate}`.trim();
      
    } catch (error) {
      console.error('Erro ao formatar título do relatório:', error);
      return title;
    }
  }

  const generateHTMLContent = () => {
    const formattedTitle = formatReportDateTitle(report.title);
    const creationDate = formatDate(report.createdAt);

    // Gera as linhas da tabela
    const tableRows = csvData.map((row, index) => {
      const cells = csvHeaders.map(header => {
        const value = row[header] || '-';
        return `<td style="padding: 12px; border: 1px solid #e0e0e0; font-size: 11px;">${value}</td>`;
      }).join('');
      
      return `
        <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
          <td style="padding: 12px; border: 1px solid #e0e0e0; font-weight: 600; text-align: center; font-size: 11px;">${index + 1}</td>
          ${cells}
        </tr>
      `;
    }).join('');

    // Gera os headers da tabela
    const tableHeaders = csvHeaders.map(header => 
      `<th style="padding: 12px; background-color: #F4A64E; color: white; border: 1px solid #e0e0e0; font-size: 12px; font-weight: 600;">${header}</th>`
    ).join('');

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${formattedTitle}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            padding: 40px;
            background-color: #ffffff;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #F4A64E;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #F4A64E;
            margin-bottom: 10px;
          }
          .report-title {
            font-size: 20px;
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
          }
          .report-date {
            font-size: 14px;
            color: #666;
            margin-bottom: 20px;
          }
          .stats {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-top: 20px;
          }
          .stat-item {
            text-align: center;
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #F4A64E;
          }
          .stat-label {
            font-size: 12px;
            color: #888;
            text-transform: uppercase;
            margin-top: 4px;
          }
          .table-container {
            margin-top: 30px;
            overflow-x: auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            font-size: 12px;
            color: #888;
          }
          .page-break {
            page-break-after: always;
          }
          @media print {
            body {
              padding: 20px;
            }
            .header {
              margin-bottom: 30px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Stuff.</div>
          <div class="report-title">${formattedTitle}</div>
          <div class="report-date">📅 Gerado em: ${creationDate}</div>
          
          <div class="stats">
            <div class="stat-item">
              <div class="stat-value">${csvData.length}</div>
              <div class="stat-label">Registros</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${csvHeaders.length}</div>
              <div class="stat-label">Colunas</div>
            </div>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="padding: 12px; background-color: #F4A64E; color: white; border: 1px solid #e0e0e0; font-size: 12px; font-weight: 600;">#</th>
                ${tableHeaders}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Relatório gerado pelo sistema Stuff.</p>
          <p>Total de ${csvData.length} registros processados</p>
        </div>
      </body>
      </html>
    `;
  };

  const generatePDFFileName = () => {
    const cleanTitle = report.title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    
    const timestamp = new Date().getTime();
    return `${cleanTitle}_${timestamp}.pdf`;
  };

  const handleShare = async () => {
    if (csvData.length === 0) {
      Alert.alert('Aviso', 'Não há dados para compartilhar');
      return;
    }

    try {
      setIsGeneratingPDF(true);

      console.log('📄 Gerando PDF...');
      const htmlContent = generateHTMLContent();
      
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      console.log('✅ PDF gerado:', uri);

      // Renomear o arquivo
      const fileName = generatePDFFileName();
      const newUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      console.log('📁 PDF salvo em:', newUri);

      setIsGeneratingPDF(false);

      // Verificar se o compartilhamento está disponível
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert(
          'PDF Gerado',
          `O PDF foi salvo em: ${newUri}`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Compartilhar o arquivo
      await Sharing.shareAsync(newUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartilhar Relatório',
        UTI: 'com.adobe.pdf',
      });

      console.log('✅ PDF compartilhado com sucesso');

    } catch (error) {
      console.error('❌ Erro ao gerar/compartilhar PDF:', error);
      setIsGeneratingPDF(false);
      Alert.alert(
        'Erro',
        'Não foi possível gerar o PDF. Tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'cards' ? 'table' : 'cards');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F4A64E" />
          <Text style={styles.loadingText}>Carregando relatório...</Text>
          <Text style={styles.loadingSubtext}>Fazendo download e processando dados</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={64} color="#C62828" />
          <Text style={styles.errorTitle}>Erro ao Carregar</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={downloadAndParseReport}>
            <Feather name="refresh-cw" size={20} color="white" />
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Loading Overlay para geração de PDF */}
      {isGeneratingPDF && (
        <View style={styles.pdfLoadingOverlay}>
          <View style={styles.pdfLoadingContent}>
            <ActivityIndicator size="large" color="#F4A64E" />
            <Text style={styles.pdfLoadingText}>Gerando PDF...</Text>
            <Text style={styles.pdfLoadingSubtext}>
              Processando {csvData.length} registros
            </Text>
          </View>
        </View>
      )}

      <View style={styles.main}>
        <View style={styles.reportHeader}>
          <View style={styles.reportHeaderTop}>
            <View style={styles.reportIconLarge}>
              <Feather name="file-text" size={32} color="#F4A64E" />
            </View>
            <View style={styles.reportHeaderInfo}>
              <Text style={styles.reportTitle}>{formatReportDateTitle(report.title)}</Text>
              <View style={styles.reportMeta}>
                <Feather name="calendar" size={14} color="#888" />
                <Text style={styles.reportMetaText}>{formatDate(report.createdAt)}</Text>
              </View>
            </View>
          </View>

          {/* Estatísticas */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Feather name="layers" size={20} color="#F4A64E" />
              <Text style={styles.statValue}>{csvData.length}</Text>
              <Text style={styles.statLabel}>Registros</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Feather name="columns" size={20} color="#F4A64E" />
              <Text style={styles.statValue}>{csvHeaders.length}</Text>
              <Text style={styles.statLabel}>Colunas</Text>
            </View>
          </View>

          {/* Controles */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={styles.viewModeButton} 
              onPress={toggleViewMode}
              disabled={isGeneratingPDF}
            >
              <Feather 
                name={viewMode === 'cards' ? 'list' : 'grid'} 
                size={18} 
                color="#F4A64E" 
              />
              <Text style={styles.viewModeButtonText}>
                {viewMode === 'cards' ? 'Modo Compacto' : 'Modo Cards'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.shareButton,
                isGeneratingPDF && styles.shareButtonDisabled
              ]} 
              onPress={handleShare}
              disabled={isGeneratingPDF}
            >
              <Feather name="share-2" size={18} color={isGeneratingPDF ? "#999" : "#2196F3"} />
              <Text style={[
                styles.shareButtonText,
                isGeneratingPDF && styles.shareButtonTextDisabled
              ]}>
                {isGeneratingPDF ? 'Gerando...' : 'Compartilhar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dataContainer}>
          <View style={styles.dataHeader}>
            <Text style={styles.dataTitle}>
              {viewMode === 'cards' ? 'Registro Detalhado' : 'Registro Compactado'}
            </Text>
            <View style={styles.viewModeBadge}>
              <Feather 
                name={viewMode === 'cards' ? 'grid' : 'list'} 
                size={14} 
                color="#F4A64E" 
              />
              <Text style={styles.viewModeBadgeText}>
                {viewMode === 'cards' ? 'Cards' : 'Compacto'}
              </Text>
            </View>
          </View>

          {csvData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum dado encontrado</Text>
            </View>
          ) : viewMode === 'cards' ? (
            <FlatList
              data={csvData}
              renderItem={({ item, index }) => <DataCard data={item} index={index} />}
              keyExtractor={(_, index) => index.toString()}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.dataList}
            />
          ) : (
            <FlatList
              data={csvData}
              renderItem={({ item }) => (
                <CompactTableRow data={item} headers={csvHeaders} />
              )}
              keyExtractor={(_, index) => index.toString()}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.dataList}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4A64E',
  },
  main: {
    flex: 1,
    backgroundColor: '#FFF0E0',
    margin: 12,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    backgroundColor: "#FFF0E0"
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C62828',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4A64E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#F4A64E',
    fontSize: 16,
    fontWeight: '600',
  },
  reportHeader: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  reportHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  reportIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reportHeaderInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportMetaText: {
    fontSize: 14,
    color: '#888',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0E0',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F4A64E',
  },
  viewModeButtonText: {
    color: '#F4A64E',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  shareButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  shareButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButtonTextDisabled: {
    color: '#999',
  },
  pdfLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  pdfLoadingContent: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  pdfLoadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  pdfLoadingSubtext: {
    fontSize: 14,
    color: '#666',
  },
  dataContainer: {
    flex: 1,
    backgroundColor: 'white',
    margin: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#F4A64E',
  },
  dataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  viewModeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F4A64E',
  },
  dataList: {
    padding: 16,
  },
  dataCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  dataCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dataCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dataCardIndex: {
    backgroundColor: '#F4A64E',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataCardIndexText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dataCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dataCardContent: {
    padding: 16,
    gap: 12,
  },
  dataField: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F4A64E',
  },
  dataFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dataFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
  },
  dataFieldValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  expandText: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 6,
    fontWeight: '600',
  },
  compactRow: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  compactRowPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  compactCell: {
    flex: 1,
  },
  compactCellLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    marginBottom: 2,
  },
  compactCellValue: {
    fontSize: 13,
    color: '#333',
  },
  expandedRowContent: {
    gap: 12,
  },
  expandedRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  expandedRowTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  expandedField: {
    gap: 4,
  },
  expandedFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
  },
  expandedFieldValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});