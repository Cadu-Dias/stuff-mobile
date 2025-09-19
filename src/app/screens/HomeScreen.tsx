import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Platform } from 'react-native';

const themeColors = {
  background: '#F4A64E',
  mainBackground: '#FFF0E0',
  text: '#333333',
  light: '#F4A64E',
  escuro: '#333333',
  mid: '#555555',
  cardBackground: 'white',
};

const HomeScreen = () => {
  const user = {
    firstName: 'Cadu',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.main}>
          <Text style={styles.h1}>
            Seu painel{user && user.firstName ? `, ${user.firstName}!` : ""}
          </Text>
          <Text style={styles.p}>Acompanhe tudo de um lugar só</Text>

          <View style={styles.cards}>
            <View style={styles.card}>
              <Text style={styles.h3}>Ativos Cadastrados</Text>
              <Text style={styles.cardSpan}>152</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.h3}>Organizações</Text>
              <Text style={styles.cardSpan}>12</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.h3}>Últimos Acessos</Text>
              <Text style={styles.cardSpan}>09/05/2025</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export default HomeScreen

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  container: {
    flex: 1,
    padding: 12,
  },
  main: {
    backgroundColor: themeColors.mainBackground,
    flexGrow: 1,
    padding: 15,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  p: {
    fontSize: 18,
    color: '#444',
    marginTop: 4,
  },
  cards: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  card: {
    backgroundColor: themeColors.cardBackground,
    borderLeftWidth: 6,
    borderLeftColor: themeColors.light,
    padding: 20,
    borderRadius: 10,
    flex: 1,
    minWidth: '40%',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  h3: {
    fontSize: 18,
    color: themeColors.escuro,
    marginBottom: 10,
    fontWeight: '600',
  },
  cardSpan: {
    fontSize: 28,
    fontWeight: 'bold',
    color: themeColors.mid,
  },
  // Estilos para o Header de placeholder
  headerPlaceholder: {
    padding: 15,
    backgroundColor: '#FFF0E0',
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: '#555',
    fontStyle: 'italic',
  }
});