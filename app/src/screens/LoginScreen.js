import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Banner, Button, Field } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../api";
import { colors, radius } from "../theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      setError(errorMessage(e, "Login failed"));
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.icon}>
            <Ionicons name="shield-checkmark" size={28} color={colors.white} />
          </View>
          <Text style={styles.title}>Staff sign in</Text>
          <Text style={styles.subtitle}>Sign in to see live failures and update their status.</Text>

          <Banner type="error">{error}</Banner>

          <Field
            label="Email"
            placeholder="name@bank.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          <Field
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!show}
            autoCapitalize="none"
            editable={!loading}
            onSubmitEditing={submit}
            right={
              <Pressable
                onPress={() => setShow((s) => !s)}
                hitSlop={8}
                style={{ padding: 10 }}
                accessibilityLabel={show ? "Hide password" : "Show password"}
              >
                <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={22} color={colors.muted} />
              </Pressable>
            }
          />

          <Button title="Sign in" onPress={submit} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: "800", color: colors.ink },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 20, lineHeight: 20 },
});
