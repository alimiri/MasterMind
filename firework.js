import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable'; // Import Animatable for animations

// Firework component using forwardRef to allow external control
const Firework = forwardRef((props, ref) => {
  const [showFireworks, setShowFireworks] = useState(false);

  // Expose the setShowFireworks function to parent components
  useImperativeHandle(ref, () => ({
    setShowFireworks: (visible) => setShowFireworks(visible),
  }));

  // Optional: Cleanup on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      setShowFireworks(false); // Stop fireworks if component unmounts
    };
  }, []);

  if (!showFireworks) return null; // Do not render fireworks if not visible

  const colors = ['#FF5733', '#33FF57', '#3357FF', '#F7FF33', '#FF33E7'];

  // Randomize position and animation properties
  const randomizeAnimation = () => ({
    0: { opacity: 1, scale: Math.random() * 1.5 + 0.5, rotate: `${Math.random() * 360}deg` },
    0.5: { opacity: 0.5, scale: Math.random() * 1.5 + 1.5, rotate: `${Math.random() * 360}deg` },
    1: { opacity: 0, scale: Math.random() * 2 + 2, rotate: `${Math.random() * 360}deg` },
  });

  return (
    <View style={styles.container}>
      {colors.map((color, index) => (
        <Animatable.View
          key={index}
          animation={randomizeAnimation()}  // Randomize animation
          duration={Math.random() * 1500 + 1500}  // Randomize duration between 1500ms and 3000ms
          iterationCount="infinite"  // Loop the animation indefinitely
          delay={index * 200}  // Stagger the animation starts
          style={[
            styles.circle,
            {
              backgroundColor: color,
              width: Math.random() * 50 + 30,  // Randomize size between 30px and 80px
              height: Math.random() * 50 + 30, // Randomize size between 30px and 80px
              top: Math.random() * 80 - 40, // Randomize the position from -40 to 80px
              left: Math.random() * 80 - 40, // Randomize the position from -40 to 80px
            },
          ]}
        />
      ))}
    </View>
  );
});

// Styles for fireworks (you can customize it further)
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999, // Ensure it's above other UI elements
  },
  circle: {
    borderRadius: 25, // Make it round
    margin: 10,
  },
});

export default Firework;
