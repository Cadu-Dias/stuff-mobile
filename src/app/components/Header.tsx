import React from 'react';
import { Text, StyleSheet } from 'react-native';

const HeaderTitle = () => {
  return <Text style={styles.headerTitle}>stuff.</Text>;
};

const styles = StyleSheet.create({
  headerTitle: {
    color: "#f89f3c",
    fontWeight: "bold",
    fontSize: 24,
  },
});

export default HeaderTitle;
