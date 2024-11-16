import React, { useState, useEffect, useRef } from 'react';
import { View, SafeAreaView, Alert, StyleSheet, Text, TextInput } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase, ref, set, get, child } from 'firebase/database';

import { FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_GCM_SENDER_ID, FIREBASE_APP_ID, MEASUREMENT_ID } from '@env';

// Initialize Firebase
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_GCM_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Example: Writing to the database
const writeData = async () => {
  try {
    // Use 'ref' to specify the location in the Realtime Database
    const userRef = ref(db, 'users/1');
    await set(userRef, {
      name: 'John Doe',
      age: 30,
    });
    console.log('Data written successfully');
  } catch (error) {
    console.error('Error writing to Realtime Database: ', error);
  }
};

// Example: Reading from the database
const readData = async () => {
  try {
    // Use 'ref' to specify the location in the Realtime Database
    const userRef = ref(db, 'users/1');
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log(data);
    } else {
      console.log('No data available');
    }
  } catch (error) {
    console.error('Error reading from Realtime Database: ', error);
  }
};

const Mastermind = () => {
  writeData();
  readData();

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

    setFeedback((prevFeedback) => {
      const updatedFeedback = [...prevFeedback];
      updatedFeedback[rowIndex] = { correct, exact };
      return updatedFeedback;
    });

    if (exact === 5) {
      setIsDigitsRevealed(true);
      Alert.alert('Congratulations, you won!', 'Click OK to start a new game.', [
        { text: 'OK', onPress: startNewGame },
      ]);
    } else if (rowIndex === 10) {
      setIsDigitsRevealed(true);
      Alert.alert('Game over, you lost!', 'Click OK to start a new game.', [
        { text: 'OK', onPress: startNewGame },
      ]);
    } else {
      setActiveRow((prev) => prev + 1);
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

    if (newGrid[activeRow].every((cell) => cell !== '')) {
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
            style={[
              styles.cell,
              { backgroundColor: rowIndex === 0 ? '#3CB371' : cellBackgroundColor },
            ]}
            value={rowIndex === 0 ? (isDigitsRevealed ? target[index] : '*') : cell}
            keyboardType="numeric"
            onChangeText={(text) => handleInputChange(index, text)}
            editable={rowIndex === activeRow && rowIndex !== 0}
            maxLength={1}
            ref={cellRefs.current[rowIndex][index]}
            onKeyPress={(e) => handleKeyPress(e, rowIndex, index)}
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
    width: 50,
    height: 50,
    textAlign: 'center',
    fontSize: 20,
    borderRadius: 5,
  },
  feedbackContainer: {
    marginLeft: 20,
    marginTop: 5,
  },
});

export default () => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <Mastermind />
    </View>
  </SafeAreaView>
);
