import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Image, TouchableOpacity, Alert, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { setCurrentUserEmail, getCurrentUserEmail } from "./services/sync";
import { registerUserBackend } from "./services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginComp({ setEmail1 }: { setEmail1: Function }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      setIsLoading(true);
      try {
        // console.log("dsf")
        // const uu=await AsyncStorage.removeItem('userData');
        // console.log("donneee");
        // return;
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          if (userData.email && userData.password) {
            setEmail1(userData.email, userData.password);
            setReady(true);
            return;
          }
        }
        // fallback to just email if present
        const storedEmail = await getCurrentUserEmail();
        if (storedEmail) {
          setEmail(storedEmail);
        }
      } catch (e) {
        // handle error
      }
      setIsLoading(false);
    };
    checkLogin();
  }, []);

  // Image picker functions
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takeSelfie = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "We need camera access to take your selfie.");
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      cameraType: ImagePicker.CameraType.front,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Handle Login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setIsLoading(true);
    const response = await registerUserBackend(email, imageUri);
    if (response) {
      setCurrentUserEmail(email);
      const userData = { email, password, imageUri, userId: response.user_id };
      try {
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        await AsyncStorage.setItem('userEmail', email);
        await AsyncStorage.setItem('userId', response.user_id);
      } catch (e) {}
      setEmail1(email, password);
      setReady(true);
    } else {
      Alert.alert("Login Failed", "Could not verify/register with the server.");
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center' }}><Text>Loading...</Text></View>;
  }
  if (ready) {
    // User is logged in, exit component
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      {/* Image Picker Section */}
      <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={{ color: "#888" }}>No Photo</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.buttonRow}>
        <Button title="Choose from Gallery" onPress={pickImage} />
        <View style={{ width: 10 }} />
        <Button title="Take Selfie" onPress={takeSelfie} />
      </View>
      {/* Input Section */}
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <View style={styles.loginBtn}>
        <Button
          title={isLoading ? "Verifying..." : "Log In & Sync"}
          onPress={handleLogin}
          disabled={isLoading}
        />
      </View>
      <View style={styles.skipBtn}>
        <Button
          title="Continue without Photo (Add Later)"
          onPress={() => {
            if (!email || !password) {
              Alert.alert("Error", "Please enter email and password");
              return;
            }
            setIsLoading(true);
            handleLogin();
          }}
          color="#666"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 30, color: '#333' },
  input: { width: '100%', height: 50, backgroundColor: 'white', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  imageContainer: { marginBottom: 20, alignItems: 'center' },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  placeholderImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e1e1e1', justifyContent: 'center', alignItems: 'center' },
  buttonRow: { flexDirection: 'row', marginBottom: 20 },
  loginBtn: { width: '100%', marginTop: 10 },
  skipBtn: { width: '100%', marginTop: 15, opacity: 0.7 }
});