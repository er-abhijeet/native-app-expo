import { Stack } from "expo-router";
import "./globals.css";
import { Auth0Provider } from "react-native-auth0";

export default function RootLayout() {
  return (
    <>
      <Auth0Provider domain="dev-rxrx468576ec84ic.us.auth0.com" clientId="zH9RSmKw0oZW55vOVDvQtDBbxO5JC5dQ">
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="tabs"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </Auth0Provider>
    </>
  );
}
