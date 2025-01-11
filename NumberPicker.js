import React, { useRef } from 'react';
import { Modal, Pressable, View, Text, StyleSheet, TouchableWithoutFeedback, findNodeHandle } from 'react-native';

const NumberPicker = ({ visible, onSelect, onClose, position }) => {
    const modalRef = useRef(null); // Reference for the modal container

    const handleBackgroundPress = (e) => {
        const modalNode = findNodeHandle(modalRef.current);
        if (modalNode) {
            onClose(false);
        }
    };

    const numbers = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        [' ', '0', 'X'],
    ];

    return (
        <Modal transparent={true} visible={visible} animationType="fade" onRequestClose={onClose}>
            {/* Semi-Transparent Background */}
            <Pressable
                style={[styles.overlay, { pointerEvents: visible ? 'auto' : 'none' }]} // Correct pointerEvents
                onPress={handleBackgroundPress} // Close only if outside the popup
            >
                <TouchableWithoutFeedback onPress={() => {}}>
                <View
                    ref={modalRef}
                    style={[styles.popupContainer, { top: position.top, left: position.left }]}
                >
                    {numbers.map((row, rowIndex) => (
                        <View key={rowIndex} style={styles.row}>
                            {row.map((num, numIndex) => (
                                <Pressable
                                    key={numIndex}
                                    style={styles.numberButton}
                                    onPress={() => {
                                        onSelect(num);
                                        onClose(num !== 'X');
                                    }}
                                >
                                    <Text style={styles.numberText}>{num}</Text>
                                </Pressable>
                            ))}
                        </View>
                    ))}
                </View>
                </TouchableWithoutFeedback>
            </Pressable>
        </Modal>

    );
};

export default NumberPicker;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black background for overlay
        justifyContent: 'center',
        alignItems: 'center',
    },
    popupContainer: {
        position: 'absolute',
        width: 166,
        padding: 2,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.6)', // Semi-transparent white background
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10, // Shadow for Android
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 2,
    },
    numberButton: {
        width: 50,
        height: 50,
        backgroundColor: 'rgba(127, 127, 127, 0.8)', // Semi-transparent green buttons
        justifyContent: 'center',
        alignItems: 'center',
        margin: 2,
        borderRadius: 10,
    },
    numberText: {
        fontSize: 20,
        color: '#fff', // Text color
        fontWeight: 'bold',
    },
});
