import { Text, View, Pressable, StyleSheet } from "react-native";
import * as Location from "expo-location";
import { useState } from "react";

export default function LocationScreen() {
  const [location, setLocation] = useState<Location.LocationObject[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [counter, setCounter] = useState(0);
  const [status1, setStatus1] = useState("free");
  const [address, setAddress] = useState("not found");

  const getLocation = async () => {
    // 1️⃣ Ask permission
    if(status1!=="free")return;
    setCounter(counter + 1);
    setStatus1("loading")
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      setErrorMsg("Permission denied");
      return;
    }

    // 2️⃣ Get location
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    setLocation(prev=>[...prev,loc]);
    const address1 = await Location.reverseGeocodeAsync({
            latitude:loc.coords.latitude,
            longitude:loc.coords.longitude,
            });
            let tp="";
            for(let i in address1[0])tp+=i+" : "+ String(address1[0][i])+"\n";
        setAddress(tp);

    setStatus1("free");
  };

  return (
    <View className="flex-1 justify-center items-center gap-4">
      <Text>{counter}</Text>
      <Text>Status: {status1}</Text>
      <Text>Address: {address}</Text>
      <Pressable
        style={[styles.buttonBase, styles.blueButton]}
        // className="bg-blue-500 px-4 py-2 rounded-lg"
        onPress={getLocation}
      >
        <Text className="text-white">Get Location</Text>
      </Pressable>

      {errorMsg && <Text>{errorMsg}</Text>}

      {location && (
        location.map((e,i)=>(
            <Text key={i}>
          Lat: {e.coords.latitude}
          {"\n"}
          Lon: {e.coords.longitude}
        </Text>
        ))
      )}
    </View>
  );
}

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
    paddingVertical: 12, // Adds height
    paddingHorizontal: 20, // Adds width
    borderRadius: 8, // Rounded corners
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 5, // Space between buttons
  },

  // 2. The "Colors" (Specific to each button)
  blueButton: {
    backgroundColor: "#3b82f6",
  },
  redButton: {
    backgroundColor: "#ef4444",
  },
  greenButton: {
    backgroundColor: "#22c55e",
  },

  // 3. The Text
  textBase: {
    color: "white", // Text color
    fontSize: 16,
    fontWeight: "600",
    // ❌ REMOVE backgroundColor: 'red' from here,
    // otherwise it covers the button color!
  },
  // Text styling
  buttonText: {
    backgroundColor: "red",
    color: "black",
    fontSize: 16,
    fontWeight: "600",
  },
});
