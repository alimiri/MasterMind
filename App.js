import React, { useState, useEffect, useRef } from 'react';
import { View, SafeAreaView, Alert, StyleSheet, Text, TextInput } from 'react-native';
import { FirebaseRemoteConfig } from '@react-native-firebase/remote-config';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import { API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID, MEASUREMENT_ID } from '@env';

const fetchConfig = async (setCellBackgroundColor) => {
  try {
    await FirebaseRemoteConfig().fetchAndActivate();
    const cellBackgroundColor = FirebaseRemoteConfig().getValue('cellBackgroundColor').asString();
    console.log('Cell Background Color:', cellBackgroundColor);
    setCellBackgroundColor(cellBackgroundColor);
  } catch (error) {
    console.error('Error fetching remote config:', error);
  }
};

// Initialize Firebase
const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGING_SENDER_ID,
  appId: APP_ID,
  measurementId: MEASUREMENT_ID
};

// Initialize Firebase App
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app(); // If already initialized
}

const Mastermind = () => {
  const [activeRow, setActiveRow] = useState(1);
  const [grid, setGrid] = useState(Array(11).fill().map(() => Array(5).fill('')));
  const [feedback, setFeedback] = useState(Array(11).fill({ correct: 0, exact: 0 }));
  const [target, setTarget] = useState([]);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isDigitsRevealed, setIsDigitsRevealed] = useState(false);
  const [cellBackgroundColor, setCellBackgroundColor] = useState('#FFB6C1'); // Default color

  const cellRefs = useRef(Array(11).fill().map(() => Array(5).fill().map(() => React.createRef())));

  useEffect(() => {
    if (isGameStarted) return;
    const generateTarget = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10).toString());
    setTarget(generateTarget);
    setIsGameStarted(true);
    fetchConfig(setCellBackgroundColor); // Fetch the config when the game starts
  }, [isGameStarted]);

  const checkRow = (rowIndex) => {
    const row = grid[rowIndex];
    let exact = 0;
    let correct = 0;
    const targetUsed = Array(5).fill(false);
    const rowUsed = Array(5).fill(false);

    row.forEach((val, i) => {
      if (val === target[i]) {
        exact++;
        targetUsed[i] = true;
        rowUsed[i] = true;
      }
    });

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

    setFeedback(prevFeedback => {
      const updatedFeedback = [...prevFeedback];
      updatedFeedback[rowIndex] = { correct, exact };
      return updatedFeedback;
    });

    if (exact === 5) {
      setIsDigitsRevealed(true);
      Alert.alert("Congratulations, you won!", "Click OK to start a new game.", [
        { text: "OK", onPress: startNewGame }
      ]);
    } else if (rowIndex === 10) {
      setIsDigitsRevealed(true);
      Alert.alert("Game over, you lost!", "Click OK to start a new game.", [
        { text: "OK", onPress: startNewGame }
      ]);
    } else {
      setActiveRow(prev => prev + 1);
    }
  };

  const startNewGame = () => {
    const generateTarget = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10).toString());
    setTarget(generateTarget);
    setGrid(Array(11).fill().map(() => Array(5).fill('')));
    setFeedback(Array(11).fill({ correct: 0, exact: 0 }));
    setIsDigitsRevealed(false);
    setActiveRow(1);
    const firstCell = cellRefs.current[1][0].current;
    if (firstCell) {
      firstCell.focus();
    }
  };

  const handleInputChange = (index, value) => {
    if (isNaN(value) || value === '') return;
    const newGrid = [...grid];
    newGrid[activeRow][index] = value;
    setGrid(newGrid);

    if (newGrid[activeRow].every(cell => cell !== '')) {
      checkRow(activeRow);

      setTimeout(() => {
        const nextRow = activeRow + 1;
        if (nextRow <= 10) {
          const nextCell = cellRefs.current[nextRow][0].current;
          if (nextCell) {
            nextCell.focus();
          }
        }
      }, 0);
    } else {
      if (index < 4 && value !== '') {
        setTimeout(() => {
          const nextCell = cellRefs.current[activeRow][index + 1].current;
          if (nextCell) {
            nextCell.focus();
          }
        }, 0);
      }
    }
  };

  const handleKeyPress = (e, rowIndex, cellIndex) => {
    if (e.nativeEvent.key === 'Backspace') {
      const newGrid = [...grid];
      if (newGrid[rowIndex][cellIndex] !== '') {
        newGrid[rowIndex][cellIndex] = '';
        setGrid(newGrid);
      } else if (cellIndex > 0 && newGrid[rowIndex][cellIndex - 1] !== '') {
        newGrid[rowIndex][cellIndex - 1] = '';
        setGrid(newGrid);

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
          style={[styles.cell, { backgroundColor: rowIndex === 0 ? '#3CB371' : cellBackgroundColor }]} // Apply remote config color
          value={rowIndex === 0 ? (isDigitsRevealed ? target[index] : '*') : cell} // Show '*' in row 0 initially, reveal digits later
          keyboardType="numeric"
          onChangeText={(text) => handleInputChange(index, text)}
          editable={rowIndex === activeRow && rowIndex !== 0} // Only allow input for rows below row 0
          maxLength={1}
          ref={cellRefs.current[rowIndex][index]} // Assign ref to each cell for focus management
          onKeyPress={(e) => handleKeyPress(e, rowIndex, index)} // Handle backspace key press
        />))}

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
    <View style={styles.innerContainer}>
      {grid.map((_, rowIndex) => renderRow(rowIndex))}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e0f7e0',
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
  innerContainer: {
    padding: 10,
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
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  feedbackContainer: {
    marginLeft: 10,
  },
});

export default () => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <Mastermind />
    </View>
  </SafeAreaView>
);
