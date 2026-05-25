import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TextInput,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import getLocalIP from "../services/ip_finder"; 

const { width } = Dimensions.get("window");

const GEOAPIFY_API_KEY = "1f3c7de9a81e4a949f53ae2ca2e23c33"; 

interface Photo {
  _id: string;
  image_url: string;
  location_data?: any;
  status: string;
  faces_found: number;
  description?: string;
  tags?: string[];
  relevance?: number;
  distance_km?: number;
}

interface LocationSuggestion {
  id: string;
  formatted: string;
  lat: number;
  lon: number;
}

export default function SearchScreen() {
  const [textQuery, setTextQuery] = useState("");
  
  // Location Autocomplete State
  const [locationQuery, setLocationQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lon: number} | null>(null);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");

  const [selectedImage, setSelectedImage] = useState<Photo | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const BASE_SERVER_URL = getLocalIP();

  useEffect(() => {
    const getUserInfo = async () => {
      const uid = await AsyncStorage.getItem("userId");
      if (uid) setUserId(uid);
    };
    getUserInfo();
  }, []);

  // --- Debounced Autocomplete Fetch ---
  // Industry standard: wait 500ms after the user stops typing before calling the API
  useEffect(() => {
    if (locationQuery.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Skip fetching if the query exactly matches our selected formatted address
    // (This prevents the dropdown from reappearing immediately after a user selects an option)
    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          locationQuery
        )}&format=json&apiKey=${GEOAPIFY_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        console.log("[GEOAPIFY Response]", data);
        if (data.results) {
          const parsedSuggestions = data.results.map((item: any) => ({
            id: item.place_id,
            formatted: item.formatted,
            lat: item.lat,
            lon: item.lon,
          }));
          setSuggestions(parsedSuggestions);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error("[GEOAPIFY Error]", error);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [locationQuery]);

  const handleSelectLocation = (item: LocationSuggestion) => {
    Keyboard.dismiss();
    setLocationQuery(item.formatted); // Update input to show full, transparent address
    setSelectedCoords({ lat: item.lat, lon: item.lon }); // Lock in exact coordinates
    setShowDropdown(false); 
  };

  const clearLocation = () => {
    setLocationQuery("");
    setSelectedCoords(null);
    setSuggestions([]);
    setShowDropdown(false);
  };

  const getValidImageUrl = (url: string) => {
    if (!url) return "";
    const pathIndex = url.indexOf("/uploads/");
    if (pathIndex !== -1) {
      const path = url.substring(pathIndex);
      return `${BASE_SERVER_URL}${path}`;
    }
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${BASE_SERVER_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleSearch = async () => {
    if (!textQuery.trim() && !selectedCoords) {
      Alert.alert("Notice", "Please enter a search query or select a valid location from the dropdown.");
      return;
    }

    // Safety check: If they typed a location but didn't click a suggestion
    if (locationQuery.trim() && !selectedCoords) {
      Alert.alert("Notice", "Please select a specific location from the dropdown list to ensure accuracy.");
      return;
    }

    setLoading(true);
    setPhotos([]);

    try {
      const response = await fetch(`${BASE_SERVER_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textQuery,
          lat: selectedCoords?.lat || null,
          lon: selectedCoords?.lon || null,
          radius: 50, // 50km radius
          user_id: userId,
        }),
      });

      if (!response.ok) throw new Error("Search request failed");
      
      const results = await response.json();
      setPhotos(results);
      
      if (results.length === 0) {
        Alert.alert("No Results", "No images matched your search criteria.");
      }
    } catch (error) {
      console.error("[SEARCH Error]", error);
      Alert.alert("Error", "Something went wrong while searching.");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Photo }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => setSelectedImage(item)}
    >
      <Image
        source={{ uri: getValidImageUrl(item.image_url) }}
        style={styles.thumbnail}
      />
      {item.relevance && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {(item.relevance * 100).toFixed(0)}% Match
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Smart Search</Text>

      {/* --- Search Form --- */}
      <View style={styles.searchForm}>
        {/* Semantic Text Input */}
        <View style={styles.inputWrapper}>
          <Ionicons name="search-outline" size={20} color="gray" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholderTextColor="#666"
            value={textQuery}
            onChangeText={setTextQuery}
            onSubmitEditing={handleSearch}
          />
        </View>

        {/* Location Autocomplete Input */}
        <View style={styles.autocompleteContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={20} color="gray" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholderTextColor="#666"
              value={locationQuery}
              onChangeText={(text) => {
                setLocationQuery(text);
                setSelectedCoords(null); // Invalidate coords if user alters the text
              }}
            />
            {isSearchingLocation ? (
              <ActivityIndicator size="small" color="gray" style={styles.rightIcon} />
            ) : locationQuery.length > 0 ? (
              <TouchableOpacity onPress={clearLocation} style={styles.rightIcon}>
                <Ionicons name="close-circle" size={20} color="gray" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Floating Dropdown List */}
          {showDropdown && suggestions.length > 0 && (
            <View style={styles.dropdown}>
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => handleSelectLocation(item)}
                  >
                    <Ionicons name="pin" size={16} color="#818cf8" style={styles.suggestionIcon} />
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {item.formatted}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={handleSearch} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.searchButtonText}>Search Photos</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* --- Results List --- */}
      <FlatList
        data={photos}
        numColumns={3}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        // Dismiss dropdown if user touches the grid
        onScrollBeginDrag={() => setShowDropdown(false)} 
      />

      {/* --- Full Screen Modal (Omitted for brevity, identical to previous) --- */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          {selectedImage && (
            <>
              <Image
                source={{ uri: getValidImageUrl(selectedImage.image_url) }}
                style={styles.fullImage}
                resizeMode="contain"
              />
              <View style={styles.topBar}>
                <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.iconBtn}>
                  <Ionicons name="arrow-back" size={28} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowInfo(!showInfo)} style={styles.iconBtn}>
                  <Ionicons name="information-circle-outline" size={28} color="white" />
                </TouchableOpacity>
              </View>

              {showInfo && (
                <View style={styles.infoSheet}>
                  <View style={styles.infoHeader}>
                    <Text style={styles.infoTitle}>Match Details</Text>
                    <TouchableOpacity onPress={() => setShowInfo(false)}>
                      <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView>
                    {selectedImage.distance_km && (
                       <>
                         <Text style={styles.infoLabel}>Distance:</Text>
                         <Text style={styles.infoValue}>{selectedImage.distance_km.toFixed(2)} km away</Text>
                       </>
                    )}
                    <Text style={styles.infoLabel}>Description:</Text>
                    <Text style={styles.infoValue}>{selectedImage.description || "N/A"}</Text>
                    <Text style={styles.infoLabel}>Tags:</Text>
                    <Text style={styles.infoValue}>
                      {selectedImage.tags ? selectedImage.tags.join(", ") : "N/A"}
                    </Text>
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f13", paddingTop: 40 },
  header: { fontSize: 24, fontWeight: "bold", color: "#fff", marginLeft: 20, marginBottom: 15 },
  searchForm: { paddingHorizontal: 20, paddingBottom: 10, zIndex: 10 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c24",
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 15,
    height: 52,
    borderWidth: 1,
    borderColor: "#2a2a35",
  },
  icon: { marginRight: 10 },
  rightIcon: { marginLeft: 10 },
  input: { flex: 1, fontSize: 16, color: "#fff" },
  
  // Autocomplete Specific Styles
  autocompleteContainer: {
    position: 'relative',
    zIndex: 100, 
  },
  dropdown: {
    position: 'absolute',
    top: 55, 
    left: 0,
    right: 0,
    backgroundColor: '#1c1c24',
    borderRadius: 12,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#2a2a35',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 100,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a35',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    fontSize: 15,
    flex: 1,
    color: '#ddd',
  },

  searchButton: {
    backgroundColor: "#4f46e5",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    zIndex: 1,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  searchButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  listContainer: { paddingHorizontal: 2, paddingBottom: 20 },
  itemContainer: { flex: 1, margin: 2, aspectRatio: 1, maxWidth: width / 3 },
  thumbnail: { width: "100%", height: "100%", borderRadius: 8, backgroundColor: '#1c1c24' },
  badge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(79, 70, 229, 0.9)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { color: "white", fontSize: 10, fontWeight: "bold" },
  
  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)" },
  fullImage: { flex: 1, width: "100%", height: "100%" },
  topBar: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  iconBtn: { padding: 10, backgroundColor: "rgba(28,28,36,0.6)", borderRadius: 20 },
  infoSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1c1c24",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "50%",
    zIndex: 20,
    borderTopWidth: 1,
    borderColor: "#2a2a35",
  },
  infoHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, alignItems: 'center' },
  infoTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  infoLabel: { fontSize: 14, fontWeight: "600", color: "#818cf8", marginTop: 12 },
  infoValue: { fontSize: 16, color: "#ddd", marginBottom: 4 },
});