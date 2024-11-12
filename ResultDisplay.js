import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ResultDisplay = ({ result }) => (
  <View style={styles.resultContainer}>
    <Text style={styles.resultText}>{result.correct}</Text>
    <Text style={styles.resultText}>{result.exact}</Text>
  </View>
);

const styles = StyleSheet.create({
  resultContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 5,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ResultDisplay;
