import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, orderBy, addDoc, onSnapshot, setDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore, auth } from '../../../firebaseConfig';
import StackHeader from '@/app/components/StackHeader';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
}

export default function ChatScreen() {
  const { userId, userName } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const chatId = [auth.currentUser.uid, userId].sort().join('_');
    const messagesRef = collection(firestore, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [userId]);

// Update the sendMessage function
const sendMessage = async () => {
  if (!newMessage.trim() || !auth.currentUser) return;

  const chatId = [auth.currentUser.uid, userId].sort().join('_');
  const messagesRef = collection(firestore, `chats/${chatId}/messages`);
  const chatRef = doc(firestore, 'chats', chatId);

  try {
    // Send the message
    await addDoc(messagesRef, {
      text: newMessage,
      senderId: auth.currentUser.uid,
      timestamp: new Date(),
    });

    // Get current unread counts or initialize
    const chatDoc = await getDoc(chatRef);
    const currentUnreadMessages = chatDoc.exists() ? 
      (chatDoc.data().unreadMessages || {}) : {};

    // Increment unread count for the recipient
    const recipientUnreadCount = (currentUnreadMessages[userId as string] || 0) + 1;
    
    // Update chat metadata
    await setDoc(chatRef, {
      participants: [auth.currentUser.uid, userId],
      lastMessage: newMessage,
      lastMessageTimestamp: new Date(),
      unreadMessages: {
        ...currentUnreadMessages,
        [userId as string]: recipientUnreadCount
      }
    }, { merge: true });

    setNewMessage('');
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// Add a function to mark messages as read
const markMessagesAsRead = async () => {
  if (!auth.currentUser || !userId) return;

  const chatId = [auth.currentUser.uid, userId].sort().join('_');
  const chatRef = doc(firestore, 'chats', chatId);

  try {
    const chatDoc = await getDoc(chatRef);
    if (chatDoc.exists()) {
      const currentUnreadMessages = chatDoc.data().unreadMessages || {};
      
      // Reset unread count for current user
      await updateDoc(chatRef, {
        unreadMessages: {
          ...currentUnreadMessages,
          [auth.currentUser.uid]: 0
        }
      });
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

// Add useEffect to mark messages as read when entering chat
useEffect(() => {
  markMessagesAsRead();
}, [userId]); // Run when entering a chat with a specific user

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === auth.currentUser?.uid;

    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        <Text style={[
          styles.messageText,
          isCurrentUser ? styles.currentUserText : styles.otherUserText
        ]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <>
    <StackHeader detail={'Chat'} />
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>{userName}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity 
          style={styles.sendButton} 
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons 
            name="send" 
            size={24} 
            color={newMessage.trim() ? "#6bb2be" : "#ccc"} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    maxWidth: '80%',
    borderRadius: 15,
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6bb2be',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 16,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    marginRight: 10,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
  },
});