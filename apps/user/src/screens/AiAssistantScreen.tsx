import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { fonts } from "../theme/fonts";

// ─── Constants ───────────────────────────────────────────────────────────────

const PRIMARY = "#FF3B3B";
const LILAC = "#c4b5fd";
const LILAC_DARK = "#8b5cf6";
const TEXT_MAIN = "#1A1A1A";
const TEXT_SEC = "#6b7280";

// ─── Types ───────────────────────────────────────────────────────────────────

type MessageRole = "ai" | "user";

interface Message {
  id: string;
  role: MessageRole;
  text: string;
  time: string;
  quickReplies?: string[];
}

// ─── Initial messages ─────────────────────────────────────────────────────────

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "ai",
    text: "¡Hola! Soy Saloom AI. ¿En qué puedo ayudarte hoy? ¿Te gustaría agendar una cita para el cabello?",
    time: "10:00 AM"
  },
  {
    id: "2",
    role: "user",
    text: "Sí, me gustaría reservar un corte y tinte para este viernes.",
    time: "10:01 AM"
  },
  {
    id: "3",
    role: "ai",
    text: "¡Perfecto! Tengo disponibilidad el viernes. ¿Cuál de estos horarios prefieres?",
    time: "10:01 AM",
    quickReplies: ["10:00 AM", "3:00 PM"]
  }
];

// ─── Component ───────────────────────────────────────────────────────────────

export const AiAssistantScreen = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const listRef = useRef<FlatList>(null);

  const now = () => {
    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m} ${ampm}`;
  };

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: trimmed,
      time: now()
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isAi = item.role === "ai";

    return (
      <>
        {index === 0 && (
          <View style={styles.timestampRow}>
            <Text style={styles.timestamp}>Hoy</Text>
          </View>
        )}

        <View style={[styles.messageRow, isAi ? styles.messageRowAi : styles.messageRowUser]}>
          {/* Avatar */}
          {isAi && (
            <View style={styles.aiAvatar}>
              <MaterialCommunityIcons name="robot-happy-outline" size={18} color={LILAC_DARK} />
            </View>
          )}
          {!isAi && (
            <View style={styles.userAvatar}>
              <MaterialCommunityIcons name="account" size={18} color={PRIMARY} />
            </View>
          )}

          <View
            style={[styles.bubbleWrapper, isAi ? styles.bubbleWrapperAi : styles.bubbleWrapperUser]}
          >
            {/* Bubble */}
            <View style={[styles.bubble, isAi ? styles.bubbleAi : styles.bubbleUser]}>
              <Text style={[styles.bubbleText, isAi ? styles.bubbleTextAi : styles.bubbleTextUser]}>
                {item.text}
              </Text>
            </View>

            {/* Quick replies */}
            {item.quickReplies && item.quickReplies.length > 0 && (
              <View style={styles.quickReplies}>
                {item.quickReplies.map((qr) => (
                  <TouchableOpacity
                    key={qr}
                    style={styles.quickReplyBtn}
                    onPress={() => sendMessage(qr)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.quickReplyText}>{qr}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.messageTime, !isAi && styles.messageTimeUser]}>{item.time}</Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.aiAvatarLarge}>
          <MaterialCommunityIcons name="robot-happy-outline" size={24} color={LILAC_DARK} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Saloom AI</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="dots-vertical" size={22} color={TEXT_SEC} />
        </TouchableOpacity>
      </View>

      {/* ── Chat messages ── */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {/* ── Input area ── */}
      <View style={styles.inputArea}>
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.75}>
            <MaterialCommunityIcons name="plus-circle-outline" size={24} color={TEXT_SEC} />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={setInputText}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(inputText)}
            multiline
            {...(Platform.OS === "web" ? ({ outlineWidth: 0 } as any) : {})}
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => sendMessage(inputText)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="send" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 12
  },
  aiAvatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${LILAC}33`,
    borderWidth: 1,
    borderColor: `${LILAC}66`,
    alignItems: "center",
    justifyContent: "center"
  },
  headerInfo: {
    flex: 1,
    gap: 2
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: TEXT_MAIN
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e"
  },
  onlineText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: TEXT_SEC
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },

  /* Chat */
  chatContent: {
    padding: 16,
    paddingBottom: 12,
    gap: 0
  },
  timestampRow: {
    alignItems: "center",
    marginBottom: 20
  },
  timestamp: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
    gap: 8
  },
  messageRowAi: {
    maxWidth: "85%"
  },
  messageRowUser: {
    flexDirection: "row-reverse",
    maxWidth: "85%",
    alignSelf: "flex-end"
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${LILAC}33`,
    borderWidth: 1,
    borderColor: `${LILAC}55`,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${PRIMARY}15`,
    borderWidth: 1,
    borderColor: `${PRIMARY}30`,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  bubbleWrapper: {
    gap: 4,
    flex: 1
  },
  bubbleWrapperAi: {
    alignItems: "flex-start"
  },
  bubbleWrapperUser: {
    alignItems: "flex-end"
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18
  },
  bubbleAi: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f1f5f9"
  },
  bubbleUser: {
    backgroundColor: PRIMARY,
    borderBottomRightRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20
  },
  bubbleTextAi: {
    fontFamily: fonts.regular,
    color: TEXT_MAIN
  },
  bubbleTextUser: {
    fontFamily: fonts.medium,
    color: "#ffffff"
  },
  messageTime: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: "#94a3b8",
    marginLeft: 2
  },
  messageTimeUser: {
    marginLeft: 0,
    marginRight: 2
  },

  /* Quick replies */
  quickReplies: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4
  },
  quickReplyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: LILAC_DARK,
    backgroundColor: "#ffffff"
  },
  quickReplyText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: LILAC_DARK
  },

  /* Input */
  inputArea: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8
  },
  addBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center"
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: TEXT_MAIN,
    maxHeight: 100,
    paddingVertical: 6,
    ...Platform.select({ web: { outlineWidth: 0 } as any })
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  }
});
