import React, { useState, useEffect, useRef } from 'react';
import NumberPicker from './NumberPicker';
import { Dimensions, Pressable } from 'react-native';

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
import { getDatabase, ref, set, get, onValue } from 'firebase/database';
import Firework from './firework';

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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
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

let dimension = { width: 0, height: 0 };
const Mastermind = ({ columns, autoPopup }) => {
  const currentAreaRef = useRef(null);
  useEffect(() => {
    if (currentAreaRef.current) {
      currentAreaRef.current.measure((x, y, width, height, pageX, pageY) => {
        dimension = { width, height };
      });
    }
  }, []);
  const fireworkRef = useRef(); // Create a ref to control the Firework component

  const [activeRow, setActiveRow] = useState(1);
  const [grid, setGrid] = useState(Array(11).fill().map(() => Array(columns).fill('')));
  const [feedback, setFeedback] = useState(Array(11).fill({ correct: undefined, exact: undefined }));
  const [target, setTarget] = useState([]);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isDigitsRevealed, setIsDigitsRevealed] = useState(false);
  const [cellBackgroundColor, setCellBackgroundColor] = useState('#FFB6C1'); // Default color

  const cellRefs = useRef(Array(11).fill().map(() => Array(columns).fill().map(() => React.createRef())));

  useEffect(() => {
    if (!isGameStarted) {
      const generateTarget = Array.from({ length: columns }, () => Math.floor(Math.random() * 10).toString());
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

    //fetchData();
  }, []);

  useEffect(() => {
    if (isGameStarted) return;

    const generateTarget = Array.from({ length: columns }, () => Math.floor(Math.random() * 10).toString());
    setTarget(generateTarget);
    setIsGameStarted(true);
  }, [isGameStarted]);

  const checkRow = (rowIndex) => {
    const row = grid[rowIndex];
    let exact = 0;
    let correct = 0;
    const targetUsed = Array(columns).fill(false);
    const rowUsed = Array(columns).fill(false);

    row.forEach((val, i) => {
      if (val === target[i]) {
        exact++;
        targetUsed[i] = true;
        rowUsed[i] = true;
      }
    });

    row.forEach((val, i) => {
      if (!rowUsed[i]) {
        for (let j = 0; j < columns; j++) {
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

    if (exact === columns) {
      setIsDigitsRevealed(true);
      fireworkRef.current.setShowFireworks(true);
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

  useEffect(() => {
    startNewGame();
  }, [columns]);

  const startNewGame = () => {
    fireworkRef.current.setShowFireworks(false);
    const generateTarget = Array.from({ length: columns }, () => Math.floor(Math.random() * 10).toString());
    setTarget(generateTarget);
    setGrid(Array(11).fill().map(() => Array(columns).fill('')));
    setFeedback(Array(11).fill({ correct: undefined, exact: undefined }));
    setIsDigitsRevealed(false);
    setActiveRow(1);
    setSelectedCell({ rowIndex: null, cellIndex: null });
  };

  const [isPickerVisible, setPickerVisible] = useState(false);
  const [selectedCell, setSelectedCell] = useState({ rowIndex: null, cellIndex: null });
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  const handleCellPress = (rowIndex, cellIndex) => {
    console.log('Cell pressed:', rowIndex, cellIndex);
    setSelectedCell({ rowIndex, cellIndex });
    const cellRef = cellRefs.current[rowIndex][cellIndex]; // Access the correct cell ref
    if (cellRef && cellRef.measure) {
      cellRef.measure((fx, fy, width, height, px, py) => {
        let popupLeft = px + width / 2 - 110; // Center popup horizontally
        let popupTop = py + height; // Position popup below the cell

        // Adjust if popup goes off-screen horizontally
        if (popupLeft < 0) {
          popupLeft = 10; // Add padding from the left edge
        } else if (popupLeft + 220 > screenWidth) { // 220 is the popup width
          popupLeft = screenWidth - 220 - 10; // Add padding from the right edge
        }

        // Adjust if popup goes off-screen vertically
        if (popupTop + 180 > screenHeight) { // 180 is the popup height
          popupTop = py - 180 - 10; // Position above the cell with padding
        }

        setPopupPosition({ top: popupTop, left: popupLeft });
        setPickerVisible(true);
      });
    }
  };

  const handleNumberSelect = (number) => {
    if (number === 'X') {
      return;
    }
    const { rowIndex, cellIndex } = selectedCell;
    if (number === ' ') {
      // Clear the cell if 'b' is selected
      grid[rowIndex][cellIndex] = '';
    } else {
      // Update the cell with the selected number
      grid[rowIndex][cellIndex] = number;
    }
    setGrid([...grid]); // Update the state to reflect changes

    if (grid[activeRow].every((cell) => cell !== '')) {
      checkRow(activeRow);
    }
  };

  const renderRow = (rowIndex) => {
    const cellHeight = dimension.height / 14;
    return (
      <View key={rowIndex} style={styles.rowContainer}>
        {grid[rowIndex].map((cell, index) => (
          <TextInput
            key={index}
            style={[
              styles.cell,
              {
                height: cellHeight,
                backgroundColor:
                  rowIndex === selectedCell.rowIndex && index === selectedCell.cellIndex
                    ? 'rgba(127, 127, 127, 0.5)' // Set to gray with transparency
                    : rowIndex === 0
                      ? '#3CB371'
                      : cellBackgroundColor,
              },
            ]}
            value={rowIndex === 0 ? (isDigitsRevealed ? target[index] : '*') : cell}
            keyboardType="numeric"
            onPress={() => { console.log('1'); return (rowIndex === activeRow && rowIndex !== 0) ? handleCellPress(rowIndex, index) : {} }}
            editable={false}
            ref={(ref) => (cellRefs.current[rowIndex][index] = ref)}
          />
        ))}

        {rowIndex > 0 && (
          <TextInput
            key={grid[rowIndex].length}
            style={[
              styles.cell,
              {
                height: cellHeight,
                backgroundColor: exactBackgroundColor,
              },
            ]}
            value={feedback[rowIndex].exact !== undefined ? String(feedback[rowIndex].exact) : ''}
            editable={false}
          />
        )}

        {rowIndex > 0 && (
          <TextInput
            key={grid[rowIndex].length + 1}
            style={[
              styles.cell,
              {
                height: cellHeight,
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

  const closeNumberPicker = (reOpen) => {
    console.log('Closing number picker', reOpen);
    setPickerVisible(false);
    if (autoPopup && reOpen) {
      const startIndex = (selectedCell.cellIndex + 1) % columns; // Start from the next cell, wrap around at the end
      for (let i = 0; i < columns; i++) {
        const index = (startIndex + i) % columns; // Calculate the circular index
        if (grid[activeRow][index] === '') {
          setTimeout(() => {
            setSelectedCell({ rowIndex: activeRow, cellIndex: index });
            setPickerVisible(true);
          }, 100);
          break;
        }
      }
    }
  };

  return (
    <DismissKeyboard>
      <Pressable
        style={{ flex: 1, pointerEvents: 'auto' }}
        onPress={(e) => {
          console.log('Touch detected in MasterMind:', e.nativeEvent);
        }}
      >
        <View style={{ flex: 1 }} ref={currentAreaRef}>
          <Firework ref={fireworkRef} />
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
          {/* Adjust NumberPicker */}
          <NumberPicker
            visible={isPickerVisible}
            onClose={closeNumberPicker}
            onSelect={handleNumberSelect}
            position={popupPosition}
          />
        </View>
      </Pressable>
    </DismissKeyboard>
  );
};

const outerContainerBackgroundCoor = '#ff0000';
const innerContainerBackgroundCoor = '#e0f7e0';
const exactBackgroundColor = '#00ff00';
const correctBackgroundColor = '#ffff00';
const shouldAddCellShadow = true;
const shouldAddFontShadow = true;

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
    ...(shouldAddCellShadow ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5, // Higher opacity for shadow visibility
      shadowRadius: 5,
      elevation: 10 // Stronger shadow on Android
    } : {}),

    // Font shadow properties
    ...(shouldAddFontShadow ? {
      textShadowColor: 'rgba(0, 0, 0, 0.5)', // Shadow color
      textShadowOffset: { width: 1, height: 1 }, // Offset in pixels
      textShadowRadius: 2, // Blur radius
    } : {}),
  },
});

export default ({ columns, autoPopup }) => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <Mastermind columns={columns} autoPopup={autoPopup} />
    </View>
  </SafeAreaView>
);