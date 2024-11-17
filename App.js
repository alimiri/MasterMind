import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  SafeAreaView,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue  } from 'firebase/database';

import { FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_GCM_SENDER_ID, FIREBASE_APP_ID } from '@env';


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

const checkConnection = () => {
  const connectedRef = ref(db, '.info/connected');
  onValue(connectedRef, (snapshot) => {
    const isConnected = snapshot.val();
    if (isConnected) {
      console.log('Connected to Firebase Realtime Database');
    } else {
      console.log('Not connected to Firebase Realtime Database');
    }
  });
};

const writeData = async () => {
  try {
    const userRef = ref(db, 'users/1');
    await set(userRef, {
      name: 'John Doe',
      age: 30,
    });
    console.log('Data written successfully');
  } catch (error) {
    console.error('Error writing to Realtime Database:', error.message);
    console.log('Stack Trace:', error.stack);
  }
};

const readData = async () => {
  try {
    const userRef = ref(db, 'users/1');
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log(data);
    } else {
      console.log('No data available');
    }
  } catch (error) {
    console.error('Error reading from Realtime Database:', error.message);
    console.log('Stack Trace:', error.stack);
  }
};

const DismissKeyboard = ({ children }) => (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    {children}
  </TouchableWithoutFeedback>
);

const Mastermind = () => {
  const [activeRow, setActiveRow] = useState(1);
  const [grid, setGrid] = useState(Array(11).fill().map(() => Array(5).fill('')));
  const [feedback, setFeedback] = useState(Array(11).fill({ correct: undefined, exact: undefined }));
  const [target, setTarget] = useState([]);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isDigitsRevealed, setIsDigitsRevealed] = useState(false);
  const [cellBackgroundColor, setCellBackgroundColor] = useState('#FFB6C1'); // Default color

  const cellRefs = useRef(Array(11).fill().map(() => Array(5).fill().map(() => React.createRef())));

  useEffect(() => {
    if (!isGameStarted) {
      const generateTarget = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10).toString());
      setTarget(generateTarget);
      setIsGameStarted(true);
    }
  }, [isGameStarted]);
  useEffect(() => {
    //checkConnection();
    const fetchData = async () => {
      // Write and then read data sequentially
      await writeData();
      await readData();
    };

    fetchData();
  }, []); // Empty dependency array ensures this only runs once after the component mounts



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
      setTimeout(() => {
        for(let i = 0; i < 5; i++) {
          let newIndex = (index + i) % 5;
          if(newGrid[activeRow][newIndex] === '') {
            const nextCell = cellRefs.current[activeRow][newIndex].current;
            if (nextCell) {
              nextCell.focus();
            }
            break;
          }
        }
      }, 0);
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
              {
                backgroundColor: rowIndex === 0 ? '#3CB371' : cellBackgroundColor,
              },
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
            <TextInput
            key={grid[rowIndex].length}
            style={[
              styles.cell,
              {
                backgroundColor: exactBackgroundColor,
              },
            ]}
            value={feedback[rowIndex].exact !== undefined ? String(feedback[rowIndex].exact) : ''}
            editable={false}
          />
        )}

        {rowIndex > 0 && (
            <TextInput
            key={grid[rowIndex].length+1}
            style={[
              styles.cell,
              {
                backgroundColor: correctBackgroundColor,
              },
            ]}
            value={feedback[rowIndex].correct !== undefined ? String(feedback[rowIndex].correct) : ''}
            editable={false}
          />
        )}

      </View>
    );
  };


  return (
    <DismissKeyboard>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.innerContainer}>
            {grid.map((_, rowIndex) => renderRow(rowIndex))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </DismissKeyboard>
  );
};

const outerContainerBackgroundCoor = '#ff0000';
const innerContainerBackgroundCoor = '#e0f7e0';
const shouldAddShadow = true;
const exactBackgroundColor = '#00ff00';
const correctBackgroundColor = '#ffff00';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: outerContainerBackgroundCoor,
  },
  avoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 10,
    borderWidth: 8,
    borderColor: '#333',
    borderRadius: 15,
    backgroundColor: innerContainerBackgroundCoor,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  innerContainer: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space the columns evenly
    marginBottom: 10,
    alignItems: 'center',
    width: '100%', // Ensure the row takes the full width of the container
    paddingHorizontal: 5, // Adjust padding to prevent cutoff
  },
  cell: {
    borderWidth: 2,
    borderColor: '#ccc',
    padding: 10,
    flex: 1, // Distribute the columns evenly
    height: 50,
    textAlign: 'center',
    fontSize: 20,
    borderRadius: 5,
    marginHorizontal: 2, // Add space between columns
    maxWidth: 50, // Ensure max width for each cell
    // Optional shadow properties (only on iOS and Android)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5, // Android shadow
    // Conditionally add shadow (e.g., for focused state)
    ...(shouldAddShadow ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5, // Higher opacity for shadow visibility
      shadowRadius: 5,
      elevation: 10 // Stronger shadow on Android
    } : {}),

    // Font shadow properties
    textShadowColor: 'rgba(0, 0, 0, 0.5)', // Shadow color
    textShadowOffset: { width: 1, height: 1 }, // Offset in pixels
    textShadowRadius: 2, // Blur radius
  },
  feedbackContainer: {
    flexDirection: 'row',
    marginLeft: 20,
    marginTop: 5,
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
});

export default () => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <Mastermind />
    </View>
  </SafeAreaView>
);
