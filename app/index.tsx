import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  SafeAreaView,
  StatusBar
} from "react-native";
import { Link } from "expo-router";
import { useAuth0 } from "react-native-auth0";
import { useState } from "react";
import LoginComp from "./login_register";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from "expo-image-picker";
import { updateUserPhotoBackend } from "./services/api";
import { Ionicons } from "@expo/vector-icons";

export default function Index() {
  const { authorize, clearSession, user, error, isLoading } = useAuth0();
  const [localUser, setLocalUser] = useState({ email: "", password: "" });
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0f0f13]">
        <ActivityIndicator size="large" color="#818cf8" />
      </View>
    );
  }

  if (!localUser?.email) {
    return <LoginComp setEmail1={(e: string, p: string) => setLocalUser({ email: e, password: p })} />;
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
    <SafeAreaView className="flex-1 bg-[#0f0f13]">
      <StatusBar barStyle="light-content" backgroundColor="#0f0f13" />
      <View className="flex-1 px-6 pt-10">
        
        {/* Profile Header */}
        <View className="items-center mb-10">
          <View className="w-24 h-24 bg-[#1c1c24] border border-[#2a2a35] rounded-full items-center justify-center mb-4 shadow-sm">
            <Ionicons name="person" size={40} color="#818cf8" />
          </View>
          <Text className="text-3xl font-extrabold text-white tracking-tight text-center">
            Welcome Back
          </Text>
          <Text className="text-base text-gray-400 mt-2 font-medium text-center">
            {localUser.email}
          </Text>
        </View>

        {/* Navigation Dashboard Grid */}
        <View className="flex-row flex-wrap justify-between w-full mb-10">
          <Link href="/tabs/SearchScreen" asChild>
            <TouchableOpacity style={styles.card} className="w-[48%] bg-[#1c1c24] border border-[#2a2a35] p-6 rounded-3xl mb-4 items-center">
              <View className="w-12 h-12 bg-[#2a2a35] rounded-full items-center justify-center mb-3">
                <Ionicons name="search" size={24} color="#818cf8" />
              </View>
              <Text className="font-semibold text-white text-base">Search</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/tabs/camera" asChild>
            <TouchableOpacity style={styles.card} className="w-[48%] bg-[#1c1c24] border border-[#2a2a35] p-6 rounded-3xl mb-4 items-center">
              <View className="w-12 h-12 bg-[#2a2a35] rounded-full items-center justify-center mb-3">
                <Ionicons name="camera" size={24} color="#34d399" />
              </View>
              <Text className="font-semibold text-white text-base">Camera</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/tabs/gallery" asChild>
            <TouchableOpacity style={styles.card} className="w-[100%] bg-[#1c1c24] border border-[#2a2a35] p-6 rounded-3xl mb-4 items-center flex-row justify-center gap-x-4">
              <View className="w-12 h-12 bg-[#2a2a35] rounded-full items-center justify-center">
                <Ionicons name="images" size={24} color="#60a5fa" />
              </View>
              <Text className="font-semibold text-white text-lg">Photo Gallery</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Action Buttons */}
        <View className="w-full mt-auto mb-6 gap-y-4">
          <TouchableOpacity
            style={styles.shadowSm}
            className="bg-[#4f46e5] py-4 rounded-2xl items-center flex-row justify-center gap-x-2"
            onPress={() => setShowPhotoModal(true)}
          >
            <Ionicons name="camera-reverse" size={20} color="white" />
            <Text className="text-white font-bold text-lg">Update Profile Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#1c1c24] border border-rose-500/30 py-4 rounded-2xl items-center flex-row justify-center gap-x-2"
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#f43f5e" />
            <Text className="text-rose-500 font-bold text-lg">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Photo Modal */}
        {showPhotoModal && (
          <View style={styles.modalOverlay}>
            <View className="bg-[#1c1c24] border border-[#2a2a35] w-11/12 rounded-3xl p-6 items-center" style={styles.modalShadow}>
              <Text className="text-xl font-extrabold text-white mb-6">Profile Photo</Text>

              {photoUri ? (
                <Image source={{ uri: photoUri }} className="w-36 h-36 rounded-full mb-6 border-2 border-[#4f46e5]" />
              ) : (
                <View className="w-36 h-36 rounded-full bg-[#2a2a35] border-2 border-dashed border-[#4f46e5] items-center justify-center mb-6">
                  <Ionicons name="person-outline" size={50} color="#818cf8" />
                </View>
              )}

              <View className="flex-row gap-x-3 mb-6 w-full">
                <TouchableOpacity
                  className="flex-1 bg-[#2a2a35] py-3 rounded-xl items-center border border-[#3a3a45] flex-row justify-center gap-x-2"
                  onPress={takeSelfie}
                >
                  <Ionicons name="camera" size={18} color="#818cf8" />
                  <Text className="text-[#818cf8] font-semibold">Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-[#2a2a35] py-3 rounded-xl items-center border border-[#3a3a45] flex-row justify-center gap-x-2"
                  onPress={pickImage}
                >
                  <Ionicons name="image" size={18} color="#818cf8" />
                  <Text className="text-[#818cf8] font-semibold">Gallery</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-x-3 w-full border-t border-[#2a2a35] pt-6">
                <TouchableOpacity
                  className="flex-1 bg-[#2a2a35] py-4 rounded-xl items-center"
                  onPress={() => {
                    setShowPhotoModal(false);
                    setPhotoUri(null);
                  }}
                >
                  <Text className="text-gray-300 font-bold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-4 rounded-xl items-center ${uploadingPhoto || !photoUri ? 'bg-[#4f46e5]/50' : 'bg-[#4f46e5]'}`}
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  shadowSm: {
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)", 
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  modalShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
});