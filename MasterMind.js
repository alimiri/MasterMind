import React, { useState, useEffect, useRef } from 'react';
import { Dimensions, Pressable } from 'react-native';

import {
  View,
  SafeAreaView,
  Alert,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import Firework from './firework';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const BASE_FONT_SIZE = 12;
const MIN_FONT_SIZE = 4;

let dimension = { width: 0, height: 0 };
const Mastermind = ({ columns }) => {
  const totalRows = 11;
  const getCellWidth = () => {
    const numCells = columns + 2; // main cells + 'exact' + 'correct'

    const marginPerCell = 8; // marginHorizontal: 4 on each side
    const borderPerCell = 4; // borderWidth: 2 on each side
    const extraPerCell = marginPerCell + borderPerCell;

    const totalExtra = numCells * extraPerCell;
    const safetyBuffer = 40; // padding on both sides of screen

    const availableWidth = screenWidth - totalExtra - safetyBuffer;

    return Math.min(availableWidth / numCells, 50); // max 50px width per cell
  };

  const cellWidth = getCellWidth();
  const [exactCorrectFontSize, setExactCorrectFontSize] = useState(10);
  const textSize = (text, width, height) => {
    if (text === "Exact" || text === "Correct") {
      const textLength = text.length || 1;
      const marginFactor = 0.9; // Allow 90% of width to be used for text
      const widthAvailable = width * marginFactor;
      const heightAvailable = height * marginFactor;

      const availableWidthPerChar = widthAvailable / textLength;

      let tentativeFontSize = Math.min(BASE_FONT_SIZE, availableWidthPerChar / 0.6);

      // Adjust based on height too (font height ~ 1.2x font size)
      tentativeFontSize = Math.min(tentativeFontSize, heightAvailable / 1.2);

      if (tentativeFontSize < MIN_FONT_SIZE) {
        tentativeFontSize = MIN_FONT_SIZE;
      }

      console.log('final new font size:', tentativeFontSize);
      setExactCorrectFontSize(tentativeFontSize);
    }
  };


  const currentAreaRef = useRef(null);
  useEffect(() => {
    if (currentAreaRef.current) {
      currentAreaRef.current.measure((x, y, width, height, pageX, pageY) => {
        dimension = { width, height };
      });
    }
  }, []);
  const fireworkRef = useRef(); // Create a ref to control the Firework component
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      // Adjust contentContainerStyle or state if needed
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Reset adjustments
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const [activeRow, setActiveRow] = useState(1);
  const [grid, setGrid] = useState(Array(totalRows).fill().map(() => Array(columns).fill('')));
  const [feedback, setFeedback] = useState(Array(totalRows).fill({ correct: undefined, exact: undefined }));
  const [target, setTarget] = useState([]);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isDigitsRevealed, setIsDigitsRevealed] = useState(false);
  const [cellBackgroundColor, setCellBackgroundColor] = useState('#FFB6C1'); // Default color

  const cellRefs = useRef(Array(totalRows).fill().map(() => Array(columns).fill().map(() => React.createRef())));
  useEffect(() => {
    cellRefs.current = Array(totalRows).fill().map(() => Array(columns).fill().map(() => React.createRef()));
  }, [columns]);

  useEffect(() => {
    if (isGameStarted) return;

    const generateTarget = Array.from({ length: columns }, () => Math.floor(Math.random() * (totalRows - 1)).toString());
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
    } else if (rowIndex === totalRows - 1) {
      setIsDigitsRevealed(true);
      Alert.alert('Game over, you lost!', 'Click OK to start a new game.', [
        { text: 'OK', onPress: startNewGame },
      ]);
    } else {
      setActiveRow((prev) => prev + 1);
    }
  };

  useEffect(() => {
    setExactCorrectFontSize(BASE_FONT_SIZE); // Reset when columns change
    startNewGame(); // you already call startNewGame()
  }, [columns]);

  const startNewGame = () => {
    fireworkRef.current.setShowFireworks(false);
    const generateTarget = Array.from({ length: columns }, () => Math.floor(Math.random() * (totalRows - 1)).toString());
    setTarget(generateTarget);
    setGrid(Array(totalRows).fill().map(() => Array(columns).fill('')));
    setFeedback(Array(totalRows).fill({ correct: undefined, exact: undefined }));
    setIsDigitsRevealed(false);
    setActiveRow(1);
    setTimeout(() => {
      const nextCell = cellRefs.current[1][0].current;
      nextCell?.focus();
    }, 0);
  };

  const handleInputChange = (index, value) => {
    if (isNaN(value) || value.trim() === '') return;
    const newGrid = [...grid];
    newGrid[activeRow][index] = value;
    setGrid(newGrid);

    if (newGrid[activeRow].every((cell) => cell !== '')) {
      checkRow(activeRow);

      setTimeout(() => {
        const nextRow = activeRow + 1;
        if (nextRow < totalRows) {
          const nextCell = cellRefs.current[nextRow][0].current;
          if (nextCell) {
            nextCell?.focus();
          }
        }
      }, 0);
    } else {
      setTimeout(() => {
        for (let i = 0; i < columns; i++) {
          let newIndex = (index + i) % columns;
          if (newGrid[activeRow][newIndex] === '') {
            const nextCell = cellRefs.current[activeRow][newIndex].current;
            if (nextCell) {
              nextCell?.focus();
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
    const cellHeight = dimension.height / 14;
    const isHeader = rowIndex === 0;

    return (
      <View key={rowIndex} style={styles.rowContainer}>
        {grid[rowIndex].map((cell, index) => (
          <TextInput
            key={index}
            style={[
              styles.cell,
              {
                width: cellWidth,
                height: cellHeight,
                backgroundColor:
                  isHeader
                    ? '#3CB371'
                    : cellBackgroundColor,
              },
            ]}
            value={
              isHeader
                ? isDigitsRevealed
                  ? target[index]
                  : '*'
                : cell
            }
            keyboardType="numeric"
            onChangeText={(text) => handleInputChange(index, text)}
            editable={!isHeader && rowIndex === activeRow}
            maxLength={1}
            ref={cellRefs.current[rowIndex][index]}
            onKeyPress={(e) => handleKeyPress(e, rowIndex, index)}
          />
        ))}

        {/* Extra columns */}
        <TextInput
          key="exact"
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[
            styles.cell,
            {
              fontSize: isHeader ? exactCorrectFontSize : 20,
              width: cellWidth,
              height: cellHeight,
              backgroundColor: isHeader ? '#90EE90' : exactBackgroundColor,
            },
          ]}
          value={isHeader ? 'Exact' : feedback[rowIndex].exact !== undefined ? String(feedback[rowIndex].exact) : ''}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            textSize(isHeader ? 'Exact' : feedback[rowIndex].exact !== undefined ? String(feedback[rowIndex].exact) : '', width, height);
          }}
          editable={false}
        />

        <TextInput
          key="correct"
          style={[
            styles.cell,
            {
              fontSize: isHeader ? exactCorrectFontSize : 20,
              width: cellWidth,
              height: cellHeight,
              backgroundColor: isHeader ? '#FFFF99' : correctBackgroundColor,
            },
          ]}
          value={isHeader ? 'Correct' : feedback[rowIndex].correct !== undefined ? String(feedback[rowIndex].correct) : ''}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            textSize(isHeader ? 'Correct' : feedback[rowIndex].correct !== undefined ? String(feedback[rowIndex].correct) : '', width, height);
          }}
          editable={false}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={[styles.scrollContainer, { flexGrow: 1 }]}
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ flex: 1 }} ref={currentAreaRef}>
                <Firework ref={fireworkRef} />
                <View style={styles.innerContainer}>
                  {grid.map((_, rowIndex) => renderRow(rowIndex))}
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const outerContainerBackgroundColor = '#ffcccc'; // Light red-pink
const innerContainerBackgroundColor = '#e0f7e0'; // Soft green
const exactBackgroundColor = '#00ff00';
const correctBackgroundColor = '#ffff00';
const shouldAddCellShadow = true;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: outerContainerBackgroundColor,
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
    backgroundColor: innerContainerBackgroundColor,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'nowrap',
  },
  cell: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: '#ccc',
    textAlign: 'center',
    fontSize: 20,
    borderRadius: 5,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    ...(
      shouldAddCellShadow && {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
      }
    ),
  },
  resultText: {
    fontSize: 14, // starting font size
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Mastermind;