import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, statusStyle } from "../theme";

export function Button({ title, onPress, loading, disabled, variant = "primary", icon, style }) {
  const isDisabled = disabled || loading;
  const v = buttonVariants[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && { opacity: 0.85 },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.btnInner}>
          {icon ? <Ionicons name={icon} size={18} color={v.fg} style={{ marginRight: 8 }} /> : null}
          <Text style={[styles.btnText, { color: v.fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const buttonVariants = {
  primary: { bg: colors.ink, fg: colors.white, border: colors.ink },
  success: { bg: colors.ok, fg: colors.white, border: colors.ok },
  secondary: { bg: colors.card, fg: colors.ink, border: colors.line },
  danger: { bg: colors.card, fg: colors.alert, border: colors.alertBg },
};

export function Field({ label, error, style, right, ...inputProps }) {
  return (
    <View style={[styles.field, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrap}>
        <TextInput
          placeholderTextColor={colors.muted}
          style={[styles.input, right && { paddingRight: 44 }]}
          {...inputProps}
        />
        {right ? <View style={styles.inputRight}>{right}</View> : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

// Tap-to-select chips (replaces <select> on the web)
export function ChipSelect({ label, options, value, onChange, getLabel }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.chips}>
        {options.map((opt) => {
          const selected = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {getLabel ? getLabel(opt) : opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Banner({ type = "error", children }) {
  if (!children) return null;
  const palette =
    type === "success"
      ? { bg: colors.okBg, fg: colors.ok, icon: "checkmark-circle" }
      : { bg: colors.alertBg, fg: colors.alert, icon: "alert-circle" };
  return (
    <View style={[styles.banner, { backgroundColor: palette.bg }]} accessibilityLiveRegion="polite">
      <Ionicons name={palette.icon} size={18} color={palette.fg} style={{ marginRight: 8, marginTop: 1 }} />
      <Text style={[styles.bannerText, { color: palette.fg }]}>{children}</Text>
    </View>
  );
}

export function StatusBadge({ status }) {
  const s = statusStyle[status] || { fg: colors.muted, bg: colors.line, icon: "ellipse" };
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Ionicons name={s.icon} size={13} color={s.fg} style={{ marginRight: 4 }} />
      <Text style={[styles.badgeText, { color: s.fg }]}>{status}</Text>
    </View>
  );
}

export function EmptyState({ icon = "checkmark-done-circle", title, body }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={44} color={colors.muted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  btnInner: { flexDirection: "row", alignItems: "center" },
  btnText: { fontSize: 16, fontWeight: "700" },

  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6 },
  inputWrap: { justifyContent: "center" },
  input: {
    minHeight: 48,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
  },
  inputRight: { position: "absolute", right: 4 },
  fieldError: { color: colors.alert, fontSize: 12, marginTop: 4 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { color: colors.white, fontWeight: "600" },

  banner: {
    flexDirection: "row",
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 16,
  },
  bannerText: { flex: 1, fontSize: 14, lineHeight: 20 },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },

  empty: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginTop: 12, textAlign: "center" },
  emptyBody: { fontSize: 14, color: colors.muted, marginTop: 6, textAlign: "center", lineHeight: 20 },
});
