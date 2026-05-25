import { StyleSheet } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const _layout = () => {
  return (
    <Tabs 
      backBehavior="none"
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#0f0f13',
          borderTopWidth: 0,
          elevation: 10,
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
        },
        tabBarActiveTintColor: '#818cf8',
        tabBarInactiveTintColor: '#666',
        headerStyle: {
          backgroundColor: '#0f0f13',
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          headerShown: false,
          href: null,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Capture",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="camera-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: "Gallery",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="images-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="SearchScreen"
        options={{
          title: "Search",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />
        }}
      />
    </Tabs>
  );
};

export default _layout;

