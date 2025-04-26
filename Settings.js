import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import Slider from '@react-native-community/slider';

const Settings = ({ onColumnsChange, columns }) => {
  const handleColumnsChange = (value) => {
    onColumnsChange(value); // Notify parent about the change
  };

  return (
    <View style={styles.container}>
      {/* Number of Columns */}
      <View style={styles.settingItem}>
        <Text style={styles.label}>Number of Columns to Guess:</Text>
        <Slider
          style={styles.slider}
          minimumValue={4}
          maximumValue={8}
          step={1}
          value={columns}
          onValueChange={handleColumnsChange}
        />
        <Text style={styles.value}>{columns}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingItem: {
    marginVertical: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  value: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 10,
  },
});

export default Settings;
