import { Text, View ,StyleSheet} from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center">
      <Text className="font-bold text-3xl text-primary">
        Abhijeet Mohapatra
      </Text>
      <Link className="m-12 bg-blue-400 p-4 rounded-full" href="/onboarding" >Location</Link>
      <Link className="mt-2 bg-blue-400 p-4 rounded-full" href="/tabs/saved" >Vibrator/Image</Link>
      <Link className="m-12 bg-blue-400 p-4 rounded-full" href="/tabs/camera" >Camera</Link>
    </View> 
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    // ❌ gap: "14px" (Causes crash or ignored style on native)
    // ✅ gap: 14 (Correct)
    gap: 14, 
    flexDirection: "row", // Changed to row to match your original flex-row intent? Or keep column if you prefer vertical stack.
    padding: 16,
  },
})

