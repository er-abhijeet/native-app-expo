import { Text, View } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center">
      <Text className="font-bold text-3xl text-primary">
        Abhijeet Mohapatra
      </Text>
      <Link className="m-12" href="/onboarding" >onboarding</Link>
      <Link className="mt-20" href="/tabs/search" >search</Link>

    </View> 
  );
}

