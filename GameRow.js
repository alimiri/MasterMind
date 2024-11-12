import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GameRow = ({ row, isActive, onRowComplete, feedback, rowIndex, grid, setGrid }) => {
  // Handle changes in input based on active row
  const handleInputChange = (index, value) => {
    const newGrid = [...grid];
    newGrid[rowIndex][index] = value;
    setGrid(newGrid);
  };

  return (
    <View style={styles.row}>
      {row.map((cell, index) => (
        <Text
          key={`cell-${rowIndex}-${index}`}  // Unique key for each cell
          style={[styles.cell, isActive && styles.activeCell]}
          onPress={() => handleInputChange(index, (parseInt(cell) + 1) % 10)}  // Increment number on press
        >
          {cell}
        </Text>
      ))}
      {/* Display feedback (correct and exact matches) */}
      {feedback && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackText}>{feedback.correct}</Text>
          <Text style={styles.feedbackText}>{feedback.exact}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  cell: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: 'black',
    textAlign: 'center',
    lineHeight: 50,
    fontSize: 20,
  },
  activeCell: {
    backgroundColor: '#f0f0f0',
  },
  feedbackContainer: {
    flexDirection: 'row',
    marginLeft: 10,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 16,
    marginRight: 5,
  },
});

export default GameRow;
