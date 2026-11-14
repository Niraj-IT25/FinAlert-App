import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Banner, Button, ChipSelect, EmptyState, Field } from "../components/UI";
import api, { errorMessage } from "../api";
import { confirmAction, notify } from "../dialogs";
import { colors, radius, roleMeta } from "../theme";

const ROLES = ["viewer", "technician", "admin", "super_admin"];
const ROLE_HELP = {
  super_admin: "Everything: view, resolve and delete failures, manage users and settings.",
  admin: "View, resolve and delete failures. Manage users.",
  technician: "View and resolve failures. Cannot delete or manage users.",
  viewer: "View failures only.",
};
const EMPTY = { username: "", email: "", password: "", confirmPassword: "", role: "technician", department: "", phone: "" };

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const flash = (msg) => {
    setSuccess(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSuccess(""), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/auth/all-admins");
      setUsers(res.data);
      setError("");
    } catch (e) {
      setError(errorMessage(e, "Couldn't load users"));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const create = async () => {
    setError("");
    if (!form.username || !form.email || !form.password || !form.confirmPassword) {
      return setError("Username, email and both password fields are required.");
    }
    if (form.password !== form.confirmPassword) return setError("Passwords don't match.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.phone && form.phone.length !== 10) return setError("Phone must be 10 digits.");

    const body = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      role: form.role,
    };
    if (form.department) body.department = form.department;
    if (form.phone) body.phone = form.phone;

    setSaving(true);
    try {
      const res = await api.post("/admin/auth/register", body);
      setUsers((u) => [...u, { ...res.data.admin, _id: res.data.admin.id, department: form.department || "General", createdAt: new Date().toISOString() }]);
      flash(`${form.username} was added as ${roleMeta[form.role].label.toLowerCase()}.`);
      setForm(EMPTY);
      setShowForm(false);
    } catch (e) {
      setError(errorMessage(e, "Couldn't create the user"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (u) => {
    const ok = await confirmAction({
      title: "Delete user?",
      message: `${u.username} will lose access immediately.`,
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/auth/${u._id}`);
      setUsers((list) => list.filter((x) => x._id !== u._id));
      flash(`${u.username} was deleted.`);
    } catch (e) {
      notify("Couldn't delete user", errorMessage(e));
    }
  };

  const header = (
    <View>
      <Button
        title={showForm ? "Cancel" : "Add user"}
        icon={showForm ? "close" : "person-add"}
        variant={showForm ? "secondary" : "primary"}
        onPress={() => { setShowForm((s) => !s); setError(""); }}
      />
      <View style={{ height: 14 }} />
      <Banner type="success">{success}</Banner>
      <Banner type="error">{error}</Banner>

      {showForm ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New user</Text>
          <Field label="Username" placeholder="john_doe" value={form.username} onChangeText={set("username")} autoCapitalize="none" />
          <Field label="Email" placeholder="john@bank.com" value={form.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />
          <Field label="Password" placeholder="At least 6 characters" value={form.password} onChangeText={set("password")} secureTextEntry autoCapitalize="none" />
          <Field label="Confirm password" placeholder="Repeat password" value={form.confirmPassword} onChangeText={set("confirmPassword")} secureTextEntry autoCapitalize="none" />
          <ChipSelect label="Role" options={ROLES} value={form.role} onChange={set("role")} getLabel={(r) => roleMeta[r].label} />
          <Text style={styles.roleHelp}>{ROLE_HELP[form.role]}</Text>
          <Field label="Department (optional)" placeholder="ATM Support" value={form.department} onChangeText={set("department")} />
          <Field label="Phone (optional)" placeholder="10 digits" value={form.phone} onChangeText={(t) => set("phone")(t.replace(/\D/g, "").slice(0, 10))} keyboardType="phone-pad" />
          <Button title="Create user" onPress={create} loading={saving} />
        </View>
      ) : null}

      <Text style={styles.listTitle}>All users ({users.length})</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={users}
        keyExtractor={(u) => u._id}
        keyboardShouldPersistTaps="handled"
        refreshing={loading}
        onRefresh={load}
        ListHeaderComponent={header}
        ListEmptyComponent={
          !loading ? <EmptyState icon="people-outline" title="No users yet" body="Add the first user above." /> : null
        }
        renderItem={({ item }) => {
          const meta = roleMeta[item.role] || { label: item.role, color: colors.muted };
          return (
            <View style={styles.userCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{item.username}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                <View style={styles.userMeta}>
                  <View style={[styles.roleBadge, { backgroundColor: meta.color }]}>
                    <Text style={styles.roleText}>{meta.label}</Text>
                  </View>
                  <Text style={styles.dept}>{item.department || "General"}</Text>
                </View>
              </View>
              <Button title="Delete" variant="danger" onPress={() => remove(item)} style={styles.deleteBtn} />
            </View>
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16, paddingBottom: 40 },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 16,
  },
  formTitle: { fontSize: 18, fontWeight: "800", color: colors.ink, marginBottom: 14 },
  roleHelp: { fontSize: 13, color: colors.muted, marginTop: -6, marginBottom: 16, lineHeight: 18 },
  listTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 10 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  userName: { fontSize: 16, fontWeight: "700", color: colors.text },
  userEmail: { fontSize: 13, color: colors.muted, marginTop: 2 },
  userMeta: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  roleBadge: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999 },
  roleText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  dept: { fontSize: 12, color: colors.muted },
  deleteBtn: { minHeight: 40, paddingHorizontal: 12, marginLeft: 8 },
});
