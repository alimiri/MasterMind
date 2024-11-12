import React, { useState, useEffect, useRef } from 'react';
import { View, Alert, StyleSheet, Text, TextInput } from 'react-native';

const Mastermind = () => {
  const [activeRow, setActiveRow] = useState(1); // Start at row 1, row 0 contains the random digits
  const [grid, setGrid] = useState(Array(11).fill().map(() => Array(5).fill('')));
  const [feedback, setFeedback] = useState(Array(11).fill({ correct: 0, exact: 0 }));
  const [target, setTarget] = useState([]);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isDigitsRevealed, setIsDigitsRevealed] = useState(false); // To track if digits are revealed

  // Array of refs for each cell
  const cellRefs = useRef(Array(11).fill().map(() => Array(5).fill().map(() => React.createRef())));

  // Generate target only once when the game starts
  useEffect(() => {
    if (isGameStarted) return; // Only generate once
    const generateTarget = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10).toString());
    setTarget(generateTarget);
    setIsGameStarted(true);
  }, [isGameStarted]);

  const checkRow = (rowIndex) => {
    const row = grid[rowIndex];
    let exact = 0;
    let correct = 0;
    const targetUsed = Array(5).fill(false);
    const rowUsed = Array(5).fill(false);

    // Count exact matches (right number, right position)
    row.forEach((val, i) => {
      if (val === target[i]) {
        exact++;
        targetUsed[i] = true;
        rowUsed[i] = true;
      }
    });

    // Count correct matches (right number, wrong position)
    row.forEach((val, i) => {
      if (!rowUsed[i]) {
        for (let j = 0; j < 5; j++) {
          if (!targetUsed[j] && val === target[j]) {
            correct++;
            targetUsed[j] = true;
            break;
          }
        }
      }
    });

    // Update feedback for the row with both exact and correct counts
    setFeedback(prevFeedback => {
      const updatedFeedback = [...prevFeedback];
      updatedFeedback[rowIndex] = { correct, exact };
      return updatedFeedback;
    });

    // If the user has guessed the correct number
    if (exact === 5) {
      setIsDigitsRevealed(true); // Reveal the digits before the dialog
      Alert.alert("Congratulations, you won!", "Click OK to start a new game.", [
        { text: "OK", onPress: startNewGame }
      ]);
    } else if (rowIndex === 10) {
      setIsDigitsRevealed(true); // Reveal the digits before the dialog
      Alert.alert("Game over, you lost!", "Click OK to start a new game.", [
        { text: "OK", onPress: startNewGame }
      ]);
    } else {
      setActiveRow(prev => prev + 1); // Move to next row automatically
    }
  };

  const startNewGame = () => {
    const generateTarget = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10).toString());
    setTarget(generateTarget); // Generate a new target number
    setGrid(Array(11).fill().map(() => Array(5).fill(''))); // Clear the grid
    setFeedback(Array(11).fill({ correct: 0, exact: 0 })); // Reset the feedback
    setIsDigitsRevealed(false); // Hide the digits again with '*'
    setActiveRow(1); // Start from the first row
    const firstCell = cellRefs.current[1][0].current;
    if (firstCell) {
      firstCell.focus(); // Focus the first cell in the new game
    }
  };

  const handleInputChange = (index, value) => {
    if (isNaN(value) || value === '') return; // Avoid non-numeric values and empty input
    const newGrid = [...grid];
    newGrid[activeRow][index] = value;
    setGrid(newGrid);

    // If row is complete, calculate the result and move to the next row
    if (newGrid[activeRow].every(cell => cell !== '')) {
      checkRow(activeRow);

      // Move to the first cell of the next row after calculating the result
      setTimeout(() => {
        const nextRow = activeRow + 1;
        if (nextRow <= 10) {
          const nextCell = cellRefs.current[nextRow][0].current;
          if (nextCell) {
            nextCell.focus(); // Focus the first cell of the next row
          }
        }
      }, 0);
    } else {
      // Move to the next cell after entering a value
      if (index < 4 && value !== '') {
        setTimeout(() => {
          const nextCell = cellRefs.current[activeRow][index + 1].current;
          if (nextCell) {
            nextCell.focus(); // Focus the next input field
          }
        }, 0);
      }
    }
  };

  const handleKeyPress = (e, rowIndex, cellIndex) => {
    if (e.nativeEvent.key === 'Backspace') {
      const newGrid = [...grid];

      // If the current cell is not empty, delete its content
      if (newGrid[rowIndex][cellIndex] !== '') {
        newGrid[rowIndex][cellIndex] = '';
        setGrid(newGrid);
      } else if (cellIndex > 0 && newGrid[rowIndex][cellIndex - 1] !== '') {
        // If the current cell is empty and it's not the first one, move to the previous cell
        newGrid[rowIndex][cellIndex - 1] = '';
        setGrid(newGrid);

        // Focus on the previous cell
        setTimeout(() => {
          const prevCell = cellRefs.current[rowIndex][cellIndex - 1].current;
          if (prevCell) {
            prevCell.focus();
          }
        }, 0);
      }
    }
  };

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
    <View style={styles.container}>
      {/* Display the rows including row 0 */}
      {grid.map((_, rowIndex) => renderRow(rowIndex))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    alignItems: 'center', // Align cells vertically in the same row
  },
  cell: {
    borderWidth: 1,
    padding: 10,
    width: 40,
    height: 40,
    textAlign: 'center',
    fontSize: 20,
    marginRight: 10,
  },
  randomDigit: {
    backgroundColor: '#f0f0f0', // Change background for row 0 to differentiate it
  },
  feedbackContainer: {
    marginLeft: 10,
  },
});

export default Mastermind;
