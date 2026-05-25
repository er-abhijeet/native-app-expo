import { StyleSheet, Text, View, Image, Pressable, Vibration } from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

const Saved = () => {
  const [intervalId, setIntervalId] = useState<any>(null);
  const [counter, setCounter] = useState(1);
  const [show, setShow] = useState("Loading...");
  const [imageUrl, setImageUrl] = useState("https://picsum.photos/400");

  const handleVibrate = () => {
    if (intervalId) return;
    const intv = setInterval(() => {
      Vibration.vibrate(1000);
    }, 1000);
    setIntervalId(intv);
  };

  const handleStop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    Vibration.cancel();
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setShow("Loading...");
        const res = await fetch("https://dog.ceo/api/breeds/image/random");
        const data = await res.json();
        setShow(data.status);
        setImageUrl(data.message);
      } catch (e) {
        console.log(e);
        setShow("Error");
      }
    };
    loadData();
  }, [counter]);

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Saved Inspiration</Text>
      
      <View style={styles.card}>
        <Image
          source={{
            uri: imageUrl,
          }}
          style={styles.image}
        />
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>Status: <Text style={styles.highlight}>{show}</Text></Text>
          <Text style={styles.infoText}>Item: <Text style={styles.highlight}>#{counter}</Text></Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable 
          style={[styles.buttonBase, styles.blueButton]} 
          onPress={handleVibrate}
        >
          <Ionicons name="radio-outline" size={20} color="white" />
          <Text style={styles.textBase}>Vibrate</Text>
        </Pressable>

        <Pressable 
          style={[styles.buttonBase, styles.redButton]} 
          onPress={handleStop}
        >
          <Ionicons name="stop-circle-outline" size={20} color="white" />
          <Text style={styles.textBase}>Stop</Text>
        </Pressable>

        <Pressable
          onPress={() => setCounter(counter + 1)}
          style={[styles.buttonBase, styles.greenButton]} 
        >
          <Ionicons name="play-skip-forward-outline" size={20} color="white" />
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
    alignItems: "center",
    backgroundColor: "#0f0f13",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  card: {
    backgroundColor: "#1c1c24",
    borderRadius: 20,
    padding: 16,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a35",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 30,
  },
  image: {
    width: "100%",
    height: 250,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "#2a2a35",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  infoText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "500",
  },
  highlight: {
    color: "#818cf8",
    fontWeight: "bold",
  },
  buttonContainer: {
    gap: 16, 
    flexDirection: "column",
    width: "100%",
  },
  buttonBase: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  blueButton: {
    backgroundColor: '#4f46e5',
  },
  redButton: {
    backgroundColor: '#e11d48', 
  },
  greenButton: {
    backgroundColor: '#10b981', 
  },
  textBase: {
    color: 'white',
    fontSize: 18,
    fontWeight: "600",
  },
});