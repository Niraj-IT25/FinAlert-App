import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config";
import { colors, radius, roleMeta } from "../theme";

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const meta = roleMeta[user?.role] || { label: user?.role, color: colors.muted };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={[styles.avatar, { backgroundColor: meta.color }]}>
          <Text style={styles.avatarText}>{(user?.username || "?").charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.badge, { backgroundColor: meta.color }]}>
          <Text style={styles.badgeText}>{meta.label}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Connected to</Text>
        <Text style={styles.value}>{API_URL}</Text>
      </View>

      <Button title="Sign out" icon="log-out-outline" variant="danger" onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, gap: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
  },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.white, fontSize: 28, fontWeight: "800" },
  name: { fontSize: 20, fontWeight: "800", color: colors.ink, marginTop: 12 },
  email: { fontSize: 14, color: colors.muted, marginTop: 2 },
  badge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999, marginTop: 12 },
  badgeText: { color: colors.white, fontSize: 13, fontWeight: "700" },
  label: { fontSize: 13, color: colors.muted },
  value: { fontSize: 14, color: colors.text, marginTop: 4, textAlign: "center" },
});
