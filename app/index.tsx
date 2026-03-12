import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  SafeAreaView,
} from "react-native";
import { Link } from "expo-router";
import { useAuth0 } from "react-native-auth0";
import { useState } from "react";
import LoginComp from "./login_register";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from "expo-image-picker";
import { updateUserPhotoBackend } from "./services/api";

export default function Index() {
  const { authorize, clearSession, user, error, isLoading } = useAuth0();
  const [localUser, setLocalUser] = useState({ email: "", password: "" });
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!localUser?.email) {
    return <LoginComp setEmail1={(e, p) => setLocalUser({ email: e, password: p })} />;
  }

  const takeSelfie = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "We need camera access to take your photo.");
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      cameraType: ImagePicker.CameraType.front,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleUpdatePhoto = async () => {
    if (!photoUri) {
      Alert.alert("Error", "Please select a photo first");
      return;
    }

    setUploadingPhoto(true);
    try {
      const response = await updateUserPhotoBackend(localUser.email, photoUri);
      if (response) {
        Alert.alert("Success", "Your photo has been updated! It's being processed.");
        setPhotoUri(null);
        setShowPhotoModal(false);
      } else {
        Alert.alert("Error", "Could not update photo. Please try again.");
      }
    } catch (e) {
      Alert.alert("Error", `Failed to update photo: ${e}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(['userData', 'userEmail', 'userId']);
            
            // Push the unmount to the end of the event loop to prevent Fabric crashes
            setTimeout(() => {
              setLocalUser({ email: "", password: "" });
            }, 100);

          } catch (e) {
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-6 pt-10">
        
        {/* Profile Header */}
        <View className="items-center mb-10">
          <View className="w-24 h-24 bg-indigo-100 rounded-full items-center justify-center mb-4 shadow-sm">
            <Text className="text-4xl">👋</Text>
          </View>
          <Text className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome Back, 
            {" "+localUser.email}
          </Text>
          <Text className="text-base text-gray-500 mt-1 font-medium">
          </Text>
        </View>

        {/* Navigation Dashboard Grid */}
        <View className="flex-row flex-wrap justify-between w-full mb-10">
          <Link href="/tabs/onboarding" asChild>
            <TouchableOpacity style={styles.card} className="w-[48%] bg-white p-6 rounded-3xl mb-4 items-center">
              <Text className="text-3xl mb-3">📍</Text>
              <Text className="font-semibold text-gray-800 text-base">Location</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/tabs/camera" asChild>
            <TouchableOpacity style={styles.card} className="w-[48%] bg-white p-6 rounded-3xl mb-4 items-center">
              <Text className="text-3xl mb-3">📸</Text>
              <Text className="font-semibold text-gray-800 text-base">Camera</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/tabs/gallery" asChild>
            <TouchableOpacity style={styles.card} className="w-[100%] bg-white p-6 rounded-3xl mb-4 items-center flex-row justify-center gap-x-3">
              <Text className="text-3xl">🖼️</Text>
              <Text className="font-semibold text-gray-800 text-base">Photo Gallery</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Action Buttons */}
        <View className="w-full mt-auto mb-6 gap-y-4">
          <TouchableOpacity
            style={styles.shadowSm}
            className="bg-indigo-600 py-4 rounded-2xl items-center"
            onPress={() => setShowPhotoModal(true)}
          >
            <Text className="text-white font-bold text-lg">Update Profile Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-rose-50 border border-rose-200 py-4 rounded-2xl items-center"
            onPress={handleLogout}
          >
            <Text className="text-rose-600 font-bold text-lg">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Photo Modal */}
        {showPhotoModal && (
          <View style={styles.modalOverlay}>
            <View className="bg-white w-11/12 rounded-3xl p-6 items-center" style={styles.modalShadow}>
              <Text className="text-xl font-extrabold text-gray-800 mb-6">Profile Photo</Text>

              {photoUri ? (
                <Image source={{ uri: photoUri }} className="w-36 h-36 rounded-full mb-6" />
              ) : (
                <View className="w-36 h-36 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 items-center justify-center mb-6">
                  <Text className="text-gray-400 text-4xl">👤</Text>
                </View>
              )}

              <View className="flex-row gap-x-3 mb-6 w-full">
                <TouchableOpacity
                  className="flex-1 bg-indigo-50 py-3 rounded-xl items-center border border-indigo-100"
                  onPress={takeSelfie}
                >
                  <Text className="text-indigo-600 font-semibold">Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-indigo-50 py-3 rounded-xl items-center border border-indigo-100"
                  onPress={pickImage}
                >
                  <Text className="text-indigo-600 font-semibold">Gallery</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-x-3 w-full border-t border-gray-100 pt-6">
                <TouchableOpacity
                  className="flex-1 bg-gray-100 py-4 rounded-xl items-center"
                  onPress={() => {
                    setShowPhotoModal(false);
                    setPhotoUri(null);
                  }}
                >
                  <Text className="text-gray-600 font-bold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-4 rounded-xl items-center ${uploadingPhoto || !photoUri ? 'bg-indigo-300' : 'bg-indigo-600'}`}
                  onPress={handleUpdatePhoto}
                  disabled={uploadingPhoto || !photoUri}
                >
                  <Text className="text-white font-bold">
                    {uploadingPhoto ? "Saving..." : "Save Photo"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  shadowSm: {
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Darker, cleaner backdrop
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  modalShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
});