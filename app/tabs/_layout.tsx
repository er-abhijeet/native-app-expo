import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Tabs } from "expo-router";

const _layout = () => {
  return (
      <Tabs backBehavior="none">
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
            title: "Camera",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="gallery"
          options={{
            title: "Gallery",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="onboarding"
          options={{
            title: "Onboarding",
            headerShown: false,
          }}
        />
      {/* <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          headerShown: false,
        }}
      /> */}
    </Tabs>
  );
};

export default _layout;

const styles = StyleSheet.create({});
