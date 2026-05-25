import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Alert,
  ScrollView,
  BackHandler,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { fetchUserPhotos, deletePhotoFromBackend } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import getLocalIP from "../services/ip_finder";

const { width, height } = Dimensions.get("window");

interface Photo {
  _id: string;
  image_url: string;
  location_data?: any;
  ai_info?: any;
  status: string;
  faces_found: number;
  created_at?: string;
  processed_at?: string;
  owner_email?: string;
}

export default function GalleryScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedImage, setSelectedImage] = useState<Photo | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  const [showBBoxes, setShowBBoxes] = useState(false);
  const [imgLayout, setImgLayout] = useState({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });
  const [originalImgSize, setOriginalImgSize] = useState({
    width: 1,
    height: 1,
  });

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.5, savedScale.value * e.scale);
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      if (scale.value > 1) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      }
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const BASE_SERVER_URL = getLocalIP();

  const getValidImageUrl = (url: string) => {
    if (!url) return "";

    // 1. Target the consistent part of the path, regardless of stored IP/Port
    const pathIndex = url.indexOf("/uploads/");
    if (pathIndex !== -1) {
      const path = url.substring(pathIndex); // Extracts '/uploads/filename.jpg'
      return `${BASE_SERVER_URL}${path}`;
    }

    // 2. Pass through already valid absolute URLs (e.g., external links)
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    // 3. Fallback for other relative paths
    return `${BASE_SERVER_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // Get user info from AsyncStorage
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const email = await AsyncStorage.getItem("userEmail");
        const uid = await AsyncStorage.getItem("userId");

        if (email && uid) {
          setUserEmail(email);
          setUserId(uid);
          console.log(`[GALLERY] Loaded user: ${email}, userId: ${uid}`);
        } else {
          console.warn("[GALLERY] Missing email or userId from AsyncStorage");
        }
      } catch (e) {
        console.error("[GALLERY] Error getting user info:", e);
      }
    };
    getUserInfo();
  }, []);

  // Log for debugging
  useEffect(() => {
    if (userEmail && userId) {
      console.log(
        `[GALLERY] Gallery loaded for user: ${userEmail}, userId: ${userId}`,
      );
    }
  }, [userEmail, userId]);

  const renderBoundingBoxes = () => {
    if (
      !imgLayout.width ||
      !selectedImage?.ai_info ||
      selectedImage.ai_info.length === 0
    )
      return null;

    // Extract the exact grid dimensions used by the backend
    const backendImgWidth =
      selectedImage.ai_info[0].img_w || selectedImage.ai_info[0].bbox?.img_w;
    const backendImgHeight =
      selectedImage.ai_info[0].img_h || selectedImage.ai_info[0].bbox?.img_h;

    if (!backendImgWidth || !backendImgHeight) {
      console.log("Missing backend dimensions");
      return null;
    }

    // Calculate scale using the true backend physical pixels
    const scale = Math.min(
      imgLayout.width / backendImgWidth,
      imgLayout.height / backendImgHeight,
    );

    const displayedWidth = backendImgWidth * scale;
    const displayedHeight = backendImgHeight * scale;
    const offsetX = (imgLayout.width - displayedWidth) / 2;
    const offsetY = (imgLayout.height - displayedHeight) / 2;

    return selectedImage.ai_info.map((face, index) => {
      const boxData = face.bbox ? face.bbox : face;

      const trueLeftEdge = boxData.x - boxData.w;
      const trueTopEdge = boxData.y;

      const boxLeft = trueLeftEdge * scale + offsetX;
      const boxTop = trueTopEdge * scale + offsetY;
      const boxWidth = boxData.w * scale;
      const boxHeight = boxData.h * scale;

      return (
        <View
          key={index}
          style={[
            styles.boundingBox,
            { left: boxLeft, top: boxTop, width: boxWidth, height: boxHeight },
          ]}
        >
          <View style={styles.bboxLabel}>
            <Text style={styles.bboxLabelText}>
              {face.email || "Stranger" || face.id}
            </Text>
          </View>
        </View>
      );
    });
  };

  // Fetch photos for logged-in user
  const loadPhotos = useCallback(async () => {
    if (!userEmail || !userId) {
      console.log("Not enough user info to load photos");
      return;
    }

    try {
      setLoading(true);
      const data = await fetchUserPhotos(userEmail, userId);
      setPhotos(data);
      console.log(`Loaded ${data.length} photos for user`);
    } catch (e) {
      console.error("Error loading photos:", e);
      Alert.alert("Error", "Failed to load photos from server");
    } finally {
      setLoading(false);
    }
  }, [userEmail, userId]);

  useEffect(() => {
    if (selectedImage && selectedImage.image_url) {
      const uri = getValidImageUrl(selectedImage.image_url);

      Image.getSize(
        uri,
        (width, height) => {
          setOriginalImgSize({ width, height });
        },
        (error) => {
          console.error("[BBOX] Failed to get true image size:", error);
        },
      );
    }
  }, [selectedImage]);

  useFocusEffect(
    useCallback(() => {
      // Call the async function inside the synchronous effect
      loadPhotos();

      // Handle system back button when image modal is open
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (selectedImage) {
            // If modal is open, close it instead of going back
            closeImage();
            return true; // Prevent default back behavior
          }
          return false; // Allow default back behavior to navigate
        },
      );

      // Cleanup listener when screen loses focus
      return () => backHandler.remove();
    }, [loadPhotos, selectedImage]),
  );

  // --- Handlers ---

  const openImage = (image: Photo) => {
    setSelectedImage(image);
    setShowOptions(false);
    setShowInfo(false);
  };

  const closeImage = () => {
    setShowBBoxes(false);
    setSelectedImage(null);
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const handleDelete = async () => {
    if (!selectedImage) return;

    Alert.alert("Delete Photo", "Are you sure you want to delete this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const success = await deletePhotoFromBackend(selectedImage._id);
            if (success) {
              // Refresh the gallery
              loadPhotos();
              closeImage();
            } else {
              Alert.alert("Error", "Could not delete photo");
            }
          } catch (e) {
            Alert.alert(
              "Error",
              `Could not delete photo: ${e instanceof Error ? e.message : "Unknown error"}`,
            );
          }
        },
      },
    ]);
  };

  // --- Render Components ---

  const renderItem = ({ item }: { item: Photo }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => openImage(item)}
    >
      {/* <Image source={{ uri: getValidImageUrl(item.image_url) }} style={styles.thumbnail} /> */}
      <Image
        source={{ uri: getValidImageUrl(item.image_url) }}
        style={styles.thumbnail}
        onError={(e) =>
          console.log(`[Image Error] ID ${item._id}:`, e.nativeEvent.error)
        }
      />

      {item.status === "done" && item.faces_found > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.faces_found} face(s)</Text>
        </View>
      )}
      {item.status === "processing" && (
        <View style={[styles.badge, { backgroundColor: "orange" }]}>
          <Text style={styles.badgeText}>Processing...</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading && photos.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>AI Gallery</Text>
        <View style={styles.loadingContainer}>
          <Text>Loading photos...</Text>
        </View>
      </View>
    );
  }
  //   console.log("here",photos);
  //   for (const photo of photos) {
  //     console.log("photo url:", photo.image_url);
  //     console.log("photo url1:", getValidImageUrl(photo.image_url));
  //   }
  return (
    <View style={styles.container}>
      <Text style={styles.header}>AI Gallery</Text>

      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No photos yet. Take a picture to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          numColumns={3}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          refreshing={loading}
          onRefresh={loadPhotos}
          // --- Throttling Props ---
          initialNumToRender={4} // Only load the first 6 items initially
          maxToRenderPerBatch={3} // Only load 3 more at a time while scrolling
          windowSize={3} // Reduces the number of off-screen images kept in memory
          removeClippedSubviews={true} // Unmounts off-screen images to free network/memory
        />
      )}

      {/* --- Full Screen Modal --- */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImage}
      >
        <GestureHandlerRootView style={styles.modalContainer}>
          {selectedImage && selectedImage !== null && (
            <>
              <GestureDetector gesture={composedGesture}>
                <Animated.View
                  style={[styles.fullImageContainer, animatedStyle]}
                  onLayout={(event) => {
                    const { width, height, x, y } = event.nativeEvent.layout;
                    setImgLayout({ width, height, x, y });
                  }}
                >
                  <Image
                    source={{
                      uri: getValidImageUrl(selectedImage?.image_url) || "",
                    }}
                    style={styles.fullImage}
                    resizeMode="contain"
                    // onLoad={(e) => {
                    //   // Get the original pixel dimensions of the image when it loads
                    //   const { width, height } = e.nativeEvent.source;
                    //   setOriginalImgSize({ width, height });
                    // }}
                  />

                  {/* Bounding Box Overlay */}
                  {showBBoxes && selectedImage?.ai_info && renderBoundingBoxes()}
                </Animated.View>
              </GestureDetector>

              {/* Top Bar */}
              <View style={styles.topBar}>
                <TouchableOpacity onPress={closeImage} style={styles.iconBtn}>
                  <Ionicons name="arrow-back" size={28} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowOptions(!showOptions)}
                  style={styles.iconBtn}
                >
                  <Ionicons name="ellipsis-vertical" size={28} color="white" />
                </TouchableOpacity>
              </View>

              {/* Options Menu (Overlay) */}
              {showOptions && (
                <View style={styles.optionsMenu}>
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => {
                      setShowInfo(true);
                      setShowOptions(false);
                    }}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={24}
                      color="#fff"
                    />
                    <Text style={styles.optionText}>Image Info</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={handleDelete}
                  >
                    <Ionicons name="trash-outline" size={24} color="red" />
                    <Text style={[styles.optionText, { color: "red" }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => {
                      setShowBBoxes(true);
                      setShowOptions(false);
                      setShowInfo(false);
                    }}
                  >
                    <Ionicons name="scan-outline" size={24} color="#fff" />
                    <Text style={styles.optionText}>Show Faces</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Exit BBox Mode Button */}
              {showBBoxes && (
                <View style={styles.bboxExitContainer}>
                  <TouchableOpacity
                    style={styles.bboxExitBtn}
                    onPress={() => setShowBBoxes(false)}
                  >
                    <Ionicons name="close-circle" size={20} color="white" />
                    <Text style={styles.bboxExitText}>Exit Face View</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Info Sheet (Overlay) */}
              {showInfo && (
                <View style={styles.infoSheet}>
                  <View style={styles.infoHeader}>
                    <Text style={styles.infoTitle}>Image Details</Text>
                    <TouchableOpacity onPress={() => setShowInfo(false)}>
                      <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <Text style={styles.infoValue}>{selectedImage.status}</Text>

                    <Text style={styles.infoLabel}>Faces Found:</Text>
                    <Text style={styles.infoValue}>
                      {selectedImage.faces_found}
                    </Text>
                    {/* <Text style={styles.infoValue} selectable>{getValidImageUrl(selectedImage.image_url)}</Text> */}

                    <Text style={styles.infoLabel}>Uploaded by:</Text>
                    <Text style={styles.infoValue}>
                      {selectedImage.owner_email || "Unknown"}
                    </Text>

                    <Text style={styles.infoLabel}>Location:</Text>
                    <Text style={styles.infoValue}>
                      {selectedImage.location_data
                        ? JSON.stringify(selectedImage.location_data, null, 2)
                        : "No location data"}
                    </Text>

                    <Text style={styles.infoLabel}>Description:</Text>
                    <Text style={styles.infoValue}>
                      {selectedImage.description
                        ? JSON.stringify(selectedImage.description, null, 2)
                        : "No description available"}
                    </Text>

                    <Text style={styles.infoLabel}>Tags:</Text>
                    <Text style={styles.infoValue}>
                      {selectedImage.tags
                        ? JSON.stringify(selectedImage.tags, null, 2)
                        : "No Tags available"}
                    </Text>

                    <Text style={styles.infoLabel}>AI Analysis:</Text>
                    <Text style={styles.infoValue}>
                      {selectedImage.ai_info && selectedImage.ai_info.length > 0
                        ? JSON.stringify(selectedImage.ai_info, null, 2)
                        : "No AI data yet"}
                    </Text>

                    <Text style={styles.infoLabel}>Uploaded:</Text>
                    <Text style={styles.infoValue}>
                      {selectedImage.created_at
                        ? new Date(selectedImage.created_at).toLocaleString()
                        : "Unknown"}
                    </Text>
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, backgroundColor: "#0f0f13" },
  header: { fontSize: 24, fontWeight: "bold", padding: 15, color: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#888", textAlign: "center" },

  // Grid Styles
  itemContainer: { width: width / 3, height: width / 3, padding: 1 },
  thumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1c1c24",
    resizeMode: "cover",
  },
  badge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(79, 70, 229, 0.9)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { color: "white", fontSize: 10, fontWeight: "600" },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
  },
  fullImage: { width: "100%", height: "100%" },
  topBar: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  iconBtn: {
    padding: 10,
    backgroundColor: "rgba(28,28,36,0.6)",
    borderRadius: 20,
  },

  // Options Menu
  optionsMenu: {
    position: "absolute",
    top: 100,
    right: 20,
    backgroundColor: "#1c1c24",
    borderRadius: 12,
    padding: 8,
    elevation: 5,
    width: 160,
    borderWidth: 1,
    borderColor: "#2a2a35",
  },
  optionItem: { flexDirection: "row", alignItems: "center", padding: 10 },
  optionText: { marginLeft: 10, fontSize: 16, color: "#fff" },

  // Info Sheet
  infoSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.45,
    backgroundColor: "#1c1c24",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: "#2a2a35",
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    alignItems: "center",
  },
  infoTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  infoLabel: { fontWeight: "600", marginTop: 12, color: "#818cf8", fontSize: 14 },
  infoValue: { marginTop: 4, color: "#ddd", fontSize: 16 },
  // BBox Rendering Styles
  fullImageContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "relative",
  },
  boundingBox: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#34d399", 
    backgroundColor: "rgba(52, 211, 153, 0.15)", 
  },
  bboxLabel: {
    position: "absolute",
    top: -24, 
    left: -2,
    backgroundColor: "#34d399",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bboxLabelText: { color: "#0f0f13", fontSize: 12, fontWeight: "bold" },

  // BBox Exit Button Styles
  bboxExitContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },
  bboxExitBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(244, 63, 94, 0.9)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
  },
  bboxExitText: { color: "white", fontWeight: "bold", marginLeft: 8 },
});
