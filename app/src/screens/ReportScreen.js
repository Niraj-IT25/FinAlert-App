import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Banner, Button, ChipSelect, Field } from "../components/UI";
import api, { errorMessage } from "../api";
import { colors, ISSUE_TYPES } from "../theme";

export default function ReportScreen() {
  const [atmId, setAtmId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [issueType, setIssueType] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const submit = async () => {
    setError("");
    setSuccess("");

    if (!atmId.trim() || !name.trim() || !phone.trim() || !issueType) {
      setError("Fill in every field and choose an issue type.");
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a 10-digit phone number.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/failures", {
        atmId: atmId.trim(),
        customerName: name.trim(),
        customerPhone: phone.trim(),
        issueType,
      });
      setSuccess("Report sent. Our team has been alerted and will fix it soon.");
      setAtmId("");
      setName("");
      setPhone("");
      setIssueType("");
      timer.current = setTimeout(() => setSuccess(""), 6000);
    } catch (e) {
      setError(errorMessage(e, "Couldn't send the report"));
    } finally {
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
        <Text style={styles.title}>Report an ATM failure</Text>
        <Text style={styles.subtitle}>No account needed. Tell us which machine is down and how to reach you.</Text>

        <Banner type="success">{success}</Banner>
        <Banner type="error">{error}</Banner>

        <Field
          label="ATM ID"
          placeholder="e.g. ATM-001"
          value={atmId}
          onChangeText={setAtmId}
          autoCapitalize="characters"
          editable={!loading}
        />
        <Field
          label="Your name"
          placeholder="Full name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={!loading}
        />
        <Field
          label="Phone number"
          placeholder="10 digits"
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 10))}
          keyboardType="phone-pad"
          maxLength={10}
          editable={!loading}
        />
        <ChipSelect label="What's wrong?" options={ISSUE_TYPES} value={issueType} onChange={setIssueType} />

        <View style={{ marginTop: 8 }}>
          <Button title="Send report" icon="send" onPress={submit} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: colors.ink },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 20, lineHeight: 20 },
});
