import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, statusStyle } from "../theme";
import { Button, StatusBadge } from "./UI";

function Row({ icon, label, children }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={colors.muted} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export default function FailureCard({ failure, canResolve, canDelete, busy, onStart, onResolve, onDelete }) {
  const accent = (statusStyle[failure.status] || {}).fg || colors.line;
  const isResolved = failure.status === "Resolved";
  const showActions = (canResolve && !isResolved) || canDelete;

  return (
    <View style={[styles.card, { borderLeftColor: accent }]}>
      <View style={styles.header}>
        <Text style={styles.atmId}>{failure.atmId}</Text>
        <StatusBadge status={failure.status} />
      </View>

      <Text style={styles.issue}>{failure.issueType}</Text>

      <Row icon="person-outline" label="Reporter">
        <Text style={styles.value}>{failure.customerName}</Text>
      </Row>
      <Row icon="call-outline" label="Phone">
        <Pressable onPress={() => Linking.openURL(`tel:${failure.customerPhone}`)} accessibilityRole="link">
          <Text style={[styles.value, styles.link]}>{failure.customerPhone}</Text>
        </Pressable>
      </Row>
      <Row icon="time-outline" label="Reported">
        <Text style={styles.value}>{new Date(failure.timestamp).toLocaleString()}</Text>
      </Row>
      {failure.resolutionNotes ? (
        <Row icon="document-text-outline" label="Notes">
          <Text style={styles.value}>{failure.resolutionNotes}</Text>
        </Row>
      ) : null}

      {showActions ? (
        <View style={styles.actions}>
          {canResolve && failure.status === "Pending" ? (
            <Button
              title="Start work"
              icon="construct-outline"
              variant="secondary"
              disabled={busy}
              onPress={() => onStart(failure)}
              style={styles.action}
            />
          ) : null}
          {canResolve && !isResolved ? (
            <Button
              title="Mark resolved"
              icon="checkmark"
              variant="success"
              disabled={busy}
              onPress={() => onResolve(failure)}
              style={styles.action}
            />
          ) : null}
          {canDelete ? (
            <Button
              title="Delete"
              icon="trash-outline"
              variant="danger"
              disabled={busy}
              onPress={() => onDelete(failure)}
              style={styles.action}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderLeftWidth: 5,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  atmId: { fontSize: 20, fontWeight: "800", color: colors.ink },
  issue: { fontSize: 15, color: colors.text, marginTop: 4, marginBottom: 12, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  rowIcon: { marginTop: 2, marginRight: 6 },
  rowLabel: { width: 72, fontSize: 13, color: colors.muted },
  value: { fontSize: 14, color: colors.text },
  link: { color: colors.inkSoft, textDecorationLine: "underline" },
  actions: { marginTop: 12, gap: 8 },
  action: { minHeight: 44 },
});
