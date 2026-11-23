import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "../constants/theme";

export default function Layout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.navy },
          headerTintColor: colors.white,
          tabBarActiveTintColor: colors.blue,
          tabBarInactiveTintColor: colors.muted,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Attendance", headerTitle: "Ceramic Workshop" }}
        />
        <Tabs.Screen name="wages" options={{ title: "Wages" }} />
        <Tabs.Screen name="money" options={{ title: "Money In / Out" }} />
      </Tabs>
    </>
  );
}
