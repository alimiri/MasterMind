import React, { useState, useEffect, useRef } from 'react';
import { View, SafeAreaView, Alert, StyleSheet, Text, TextInput, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';

const Mastermind = () => {
  // Your game state and logic code here

  const renderRow = (rowIndex) => {
    return (
      <View key={rowIndex} style={styles.rowContainer}>
        {grid[rowIndex].map((cell, index) => (
          <TextInput
            key={index}
            style={[styles.cell, rowIndex === 0 && styles.randomDigit]} // Add specific style for row 0
            value={rowIndex === 0 ? (isDigitsRevealed ? target[index] : '*') : cell} // Show '*' in row 0 initially, reveal digits later
            keyboardType="numeric"
            onChangeText={(text) => handleInputChange(index, text)}
            editable={rowIndex === activeRow && rowIndex !== 0} // Only allow input for rows below row 0
            maxLength={1}
            ref={cellRefs.current[rowIndex][index]} // Assign ref to each cell for focus management
            onKeyPress={(e) => handleKeyPress(e, rowIndex, index)} // Handle backspace key press
          />
        ))}
        {rowIndex > 0 && (
          <View style={styles.feedbackContainer}>
            <Text>Correct: {feedback[rowIndex].correct}</Text>
            <Text>Exact: {feedback[rowIndex].exact}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Adjust the behavior based on the platform
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} // Adjust the offset for iOS if needed
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Display the rows including row 0 */}
          {grid.map((_, rowIndex) => renderRow(rowIndex))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e0f7e0',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  container: {
    padding: 20,
    borderWidth: 8,
    borderColor: '#333',
    borderRadius: 15,
    backgroundColor: '#e0f7e0',
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    alignItems: 'center',
  },
  cell: {
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
    padding: 10,
    width: 40,
    height: 40,
    textAlign: 'center',
    fontSize: 20,
    marginRight: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  randomDigit: {
    backgroundColor: '#eee',
    borderColor: '#bbb',
  },
  feedbackContainer: {
    marginLeft: 10,
  },
});

export default () => (
  <SafeAreaView style={styles.safeArea}>
    <Mastermind />
  </SafeAreaView>
);
