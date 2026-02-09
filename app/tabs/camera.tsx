import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  Alert, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions({
    granularPermissions: ['photo'], // <--- Only ask for Photos
    });
  const [photo, setPhoto] = useState<any>(null); // Stores captured photo
  const cameraRef = useRef<CameraView>(null);

  // 1. Handle Permissions
  useEffect(() => {
    if (!permission?.granted) requestPermission();
    if (!mediaPermission?.granted) requestMediaPermission();
  }, []);

  if (!permission || !mediaPermission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.permissionText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Camera Actions
  const toggleCameraFacing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Physical shutter feel
      try {
        const photoData = await cameraRef.current.takePictureAsync({
          quality: 1,
          base64: false,
          exif: true,
        });
        setPhoto(photoData); // Switch to preview mode
      } catch (error) {
        console.log(error);
      }
    }
  };

  // 3. Preview & Save Actions
  const savePhoto = async () => {
    if (photo) {
      try {
        await MediaLibrary.createAssetAsync(photo.uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Saved!", "Photo saved to your gallery.");
        setPhoto(null); // Reset to camera
      } catch (e) {
        Alert.alert("Error", "Could not save photo."+String(e));
      }
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
  };

  // ---------------- Render: Photo Preview Mode ----------------
  if (photo) {
    return (
      <SafeAreaView style={styles.container}>
        <Image source={{ uri: photo.uri }} style={styles.previewImage} />
        <View style={styles.previewControls}>
          <TouchableOpacity onPress={retakePhoto} style={[styles.controlBtn, styles.retakeBtn]}>
            <Ionicons name="trash-outline" size={28} color="white" />
            <Text style={styles.controlText}>Retake</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={savePhoto} style={[styles.controlBtn, styles.saveBtn]}>
            <Ionicons name="checkmark-circle" size={28} color="black" />
            <Text style={[styles.controlText, { color: 'black' }]}>Save</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------- Render: Camera View Mode ----------------
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView 
        style={styles.camera} 
        facing={facing} 
        flash={flash} 
        ref={cameraRef}
      >
        {/* Top Controls (Flash, Settings) */}
        <SafeAreaView style={styles.topControls}>
          <TouchableOpacity onPress={toggleFlash} style={styles.iconButton}>
            <Ionicons 
              name={flash === 'on' ? "flash" : "flash-off"} 
              size={28} 
              color={flash === 'on' ? "#FFD700" : "white"} 
            />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Bottom Controls (Shutter, Flip) */}
        <View style={styles.bottomControls}>
          {/* Gallery / Placeholder */}
          <TouchableOpacity style={styles.miniBtn}>
            <View style={styles.galleryPlaceholder} />
          </TouchableOpacity>

          {/* Shutter Button */}
          <TouchableOpacity onPress={takePicture} style={styles.shutterContainer}>
            <View style={styles.shutterOuter}>
              <View style={styles.shutterInner} />
            </View>
          </TouchableOpacity>

          {/* Flip Camera */}
          <TouchableOpacity onPress={toggleCameraFacing} style={styles.miniBtn}>
            <MaterialIcons name="flip-camera-ios" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  // Top Controls
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: 'rgba(0,0,0,0.2)', // Slight gradient feel
  },
  iconButton: {
    padding: 10,
  },
  // Bottom Controls
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    paddingBottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  // Shutter Button Styles
  shutterContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: 'white',
  },
  miniBtn: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'white',
  },
  // Permission Styles
  permissionBtn: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  permissionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Preview Mode Styles
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'black',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    width: '45%',
    justifyContent: 'center',
    gap: 8,
  },
  retakeBtn: {
    backgroundColor: '#333',
  },
  saveBtn: {
    backgroundColor: 'white',
  },
  controlText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});