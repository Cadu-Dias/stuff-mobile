import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../models/stackType';
import { RfidStatusItem } from '../models/rfids/rfidStatusItem';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

const getProgressColor = (percentage: number): string => {
  if (percentage >= 75) {
    return '#4CAF50';
  }
  if (percentage >= 35) {
    return '#FFC107';
  }
  return '#D32F2F'; 
};

const ProgressCircle = ({ percentage, found, total, color } : { percentage: number, found: number, total: number, color: string}) => {
  const radius = 70;
  const strokeWidth = 15;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <View style={styles.progressContainer}>
      <Svg width={radius * 2} height={radius * 2}>
        <Circle
          stroke="#E0D2C2"
          fill="none"
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          strokeWidth={strokeWidth}
        />

        <Circle
          stroke={color}
          fill="none"
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${radius} ${radius})`}
        />
        <SvgText
          x={radius}
          y={radius - 5}
          textAnchor="middle"
          alignmentBaseline="middle"
          fontSize="30"
          fontWeight="bold"
          fill={color}
        >
          {found}
        </SvgText>
        <SvgText
          x={radius}
          y={radius + 20}
          textAnchor="middle"
          alignmentBaseline="middle"
          fontSize="14"
          fill="#666"
        >
          de {total}
        </SvgText>
      </Svg>
    </View>
  );
};


const ResultsScreen = ({ route }: { route: { params: { results: RfidStatusItem[], deviceAddress: string } } }) => {
    const { results, deviceAddress } = route.params;
    const navigation = useNavigation<RootStackNavigationProp>();

    const { totalItems, foundItems, percentage, progressColor } = useMemo(() => {
        const total = results.length;
        const found = results.filter(item => item.scanned).length;
        const perc = total > 0 ? (found / total) * 100 : 0;
        
        return {
            totalItems: total,
            foundItems: found,
            percentage: perc,
            progressColor: getProgressColor(perc),
        };
    }, [results]);

    const handleRestartScan = () => {
        if (deviceAddress) {
            console.log('Re-começando o scan com o dispositivo:', deviceAddress);
            navigation.navigate('StorageScan', { deviceAddress });
        }
    };

    const renderItem = ({ item }: { item: RfidStatusItem }) => {
        const isFound = item.scanned;
        return (
            <View style={[styles.resultItem, isFound ? styles.resultItemFound : styles.resultItemNotFound]}>
                <Feather name={isFound ? "check-circle" : "x-circle"} size={24} color={isFound ? "#4CAF50" : "#C62828"} />
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={[styles.statusText, { color: isFound ? "#4CAF50" : "#C62828" }]}>
                    {isFound ? 'Encontrado' : 'Não Encontrado'}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.main}>
                <View style={styles.headerContainer}>
                    <ProgressCircle
                        percentage={percentage}
                        found={foundItems}
                        total={totalItems}
                        color={progressColor}
                    />
                    <Text style={styles.title}>Verificação Concluída</Text>
                    <Text style={styles.subtitle}>
                        {foundItems} de {totalItems} itens foram localizados com sucesso.
                    </Text>
                </View>

                <View style={styles.divider} />
                <FlatList
                    data={results}
                    keyExtractor={item => item.rfid}
                    renderItem={renderItem}
                    style={styles.list}
                    contentContainerStyle={{ paddingBottom: 10 }}
                />
                <View style={styles.actionButtonsContainer}>
                   
                    {deviceAddress && (
                        <TouchableOpacity style={styles.restartButton} onPress={handleRestartScan}>
                            <Feather name="refresh-cw" size={18} color="#F89F3C" />
                            <Text style={styles.restartButtonText}>Tentar Novamente</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity 
                        style={[styles.finishButton, !deviceAddress && {flex: 1}]} 
                        onPress={() => navigation.navigate('MainTabs')}
                    >
                        <Feather name="check" size={20} color="white" />
                        <Text style={styles.finishButtonText}>Finalizar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#F4A64E' 
    },
    main: { 
        flex: 1, 
        backgroundColor: '#FFF0E0', 
        margin: 12, 
        borderRadius: 8, 
        padding: 20 
    },
    headerContainer: { 
        alignItems: 'center', 
        marginBottom: 20 
    },
    progressContainer: { 
        marginBottom: 15 
    },
    title: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: '#333' 
    },
    subtitle: { 
        fontSize: 16, 
        color: '#666', 
        textAlign: 'center', 
        marginTop: 5 
    },
    divider: { 
        height: 1, 
        backgroundColor: '#E0D2C2', 
        marginBottom: 20 
    },
    list: { 
        flex: 1 
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
    },
    resultItemFound: {
        backgroundColor: '#E8F5E9',
        borderColor: '#A5D6A7',
    },
    resultItemNotFound: {
        backgroundColor: '#FFEBEE',
        borderColor: '#EF9A9A',
    },
    itemName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginLeft: 15,
    },
    statusText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 10,
    },
    restartButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        paddingVertical: 15,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#F89F3C',
        gap: 10,
    },
    restartButtonText: {
        color: '#F89F3C',
        fontSize: 16,
        fontWeight: 'bold',
    },
    finishButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F89F3C',
        paddingVertical: 15,
        borderRadius: 12,
        gap: 10,
    },
    finishButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ResultsScreen;
