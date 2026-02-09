import { StyleSheet, Text, View, Image, Pressable, Vibration } from "react-native";
import React, { useEffect, useState } from "react";

const Saved = () => {
  const [intervalId, setIntervalId] = useState(0);
  const [counter, setCounter] = useState(1);
  const [show, setShow] = useState("hellow");
  const [imageUrl, setImageUrl] = useState("hellow");

  const handleVibrate = () => {
    // Vibrate immediately
    // Vibration.vibrate(1000);
    if(intervalId)return;
    // Then loop
    const intv = setInterval(() => {
      Vibration.vibrate(1000);
    }, 1000);
    setIntervalId(intv);
  };

  const handleStop = () => {
    clearInterval(intervalId);
    setIntervalId(0);
    Vibration.cancel(); // Good practice to stop active vibration
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("https://dog.ceo/api/breeds/image/random");
        const data = await res.json();
        setShow(data.status);
        setImageUrl(data.message);
      } catch (e) {
        console.log(e);
      }
    };
    loadData();
  }, [counter]);

  return (
    <View style={styles.container}>
      <Text>saved</Text>
      <Text>{counter}</Text>
      <Text>{show}</Text>
      
      <Image
        source={{
          uri: imageUrl || "https://picsum.photos/200",
        }}
        style={styles.image}
      />

      <View style={styles.buttonContainer}>
        {/* Vibrate Button */}
<Pressable 
  // 👇 KEY FIX: Use an array to combine styles
  style={[styles.buttonBase, styles.blueButton]} 
  onPress={handleVibrate}
>
  <Text style={styles.textBase}>Vibrate</Text>
</Pressable>

<Pressable 
  style={[styles.buttonBase, styles.redButton]} 
  onPress={handleStop}
>
  <Text style={styles.textBase}>Stop</Text>
</Pressable>

<Pressable
          onPress={() => setCounter(counter + 1)}
          style={[styles.buttonBase, styles.greenButton]} 
        >
          <Text style={styles.textBase}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Saved;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 200,
    height: 200,
    margin: 12,
    borderRadius: 10, // Optional: makes image look nicer
  },
  buttonContainer: {
    // ❌ gap: "14px" (Causes crash or ignored style on native)
    // ✅ gap: 14 (Correct)
    gap: 14, 
    flexDirection: "row", // Changed to row to match your original flex-row intent? Or keep column if you prefer vertical stack.
    padding: 16,
  },
  // Shared styles for all buttons
  buttonBase: {
    paddingVertical: 12,    // Adds height
    paddingHorizontal: 20,  // Adds width
    borderRadius: 8,        // Rounded corners
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,      // Space between buttons
  },
  
  // 2. The "Colors" (Specific to each button)
  blueButton: {
    backgroundColor: '#3b82f6',
  },
  redButton: {
    backgroundColor: '#ef4444', 
  },
  greenButton: {
    backgroundColor: '#22c55e', 
  },

  // 3. The Text
  textBase: {
    color: 'white',        // Text color
    fontSize: 16,
    fontWeight: "600",
    // ❌ REMOVE backgroundColor: 'red' from here, 
    // otherwise it covers the button color!
  },
  // Text styling
  buttonText: {
    backgroundColor:"red",
    color: 'black',
    fontSize: 16,
    fontWeight: "600",
  },
});