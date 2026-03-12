import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { uploadPhotoToBackend } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CameraScreen() {
  const [photo, setPhoto] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  // Get user email from AsyncStorage
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const email = await AsyncStorage.getItem('userEmail');
        if (email) {
          setUserEmail(email);
          console.log(`[CAMERA] Loaded user email: ${email}`);
        } else {
          console.warn('[CAMERA] No email found in AsyncStorage');
        }
      } catch (e) {
        console.error("[CAMERA] Error getting user email:", e);
      }
    };
    getUserEmail();
  }, []);

  // Open system camera
  const takePicture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "We need camera access to take photos.");
      return;
    }

    try {
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        cameraType: ImagePicker.CameraType.back,
      });

      if (!result.canceled) {
        const photoData = result.assets[0];
        setPhoto(photoData);
        fetchLocation();
      }
    } catch (e) {
      Alert.alert("Error", "Failed to open camera");
    }
  };

  // Open gallery picker
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        const photoData = result.assets[0];
        setPhoto(photoData);
        fetchLocation();
      }
    } catch (e) {
      Alert.alert("Error", "Failed to open gallery");
    }
  };

  const fetchLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation(null);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      let address = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
      setLocation({ coords: loc.coords, address: address[0] });
    } catch (e) {
      console.log("Error fetching location:", e);
      setLocation(null);
    }
  };

  // Upload to MongoDB
  const savePhoto = async () => {
    if (!photo) return;
    
    try {
      setUploading(true);
      
      const locationData = location || { error: "Location not found" };
      
      // Upload directly to backend (MongoDB) with user email
      const result = await uploadPhotoToBackend(photo.uri, locationData, userEmail);
      
      Alert.alert("Success", "Photo uploaded! It's now in processing queue.");
      setPhoto(null);
      setLocation(null);
    } catch (e) {
      Alert.alert("Error", `Failed to upload photo: ${e}`);
    } finally {
      setUploading(false);
    }
  };

  if (photo) {
    return (
      <SafeAreaView style={styles.container}>
        <Image source={{ uri: photo.uri }} style={styles.preview} />
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => setPhoto(null)} style={styles.btn} disabled={uploading}>
            <Text>Discard</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={savePhoto} style={styles.btn} disabled={uploading}>
            <Text>{uploading ? "Uploading..." : "Keep & Process"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.largeBtn} onPress={takePicture}>
          <Ionicons name="camera" size={40} color="#fff" />
          <Text style={styles.btnText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.largeBtn} onPress={pickImage}>
          <Ionicons name="images" size={40} color="#fff" />
          <Text style={styles.btnText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  buttonContainer: { gap: 20, paddingHorizontal: 20 },
  largeBtn: { backgroundColor: '#007AFF', paddingVertical: 20, paddingHorizontal: 30, borderRadius: 12, alignItems: 'center', flexDirection: 'row', gap: 15 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  preview: { flex: 1 },
  controls: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, backgroundColor: 'black' },
  btn: { padding: 12, backgroundColor: 'white', borderRadius: 8, minWidth: 100, alignItems: 'center' }
});