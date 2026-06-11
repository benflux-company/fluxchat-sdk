import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, FlatList } from 'react-native';
import { useFluxChat } from './useFluxChat';

interface Props {
  apiKey: string;
}

export const FluxChatWidget: React.FC<Props> = ({ apiKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{id: string, text: string, isUser: boolean}[]>([]);
  const { ask } = useFluxChat(apiKey);

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    const userMsg = { id: Date.now().toString(), text: message, isUser: true };
    setMessages(prev => [...prev, userMsg]);
    setMessage('');
    
    try {
      const response: any = await ask(message);
      const botMsg = { id: (Date.now() + 1).toString(), text: response.text, isUser: false };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.bubble} onPress={() => setIsOpen(true)}>
        <Text style={styles.bubbleText}>💬</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.chatBox}>
            <View style={styles.header}>
              <Text style={styles.headerText}>FluxChat</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text style={styles.closeText}>X</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={messages}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={[styles.messageWrapper, item.isUser ? styles.userMessage : styles.botMessage]}>
                  <Text style={[styles.messageText, item.isUser ? styles.userText : styles.botText]}>{item.text}</Text>
                </View>
              )}
            />
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                placeholder="Écrivez un message..."
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                <Text style={styles.sendText}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  bubbleText: {
    fontSize: 24,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  chatBox: {
    height: '70%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeText: {
    fontSize: 18,
    color: '#888',
    padding: 5,
  },
  messageWrapper: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#007bff',
    alignSelf: 'flex-end',
  },
  botMessage: {
    backgroundColor: '#e9ecef',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
    marginRight: 10,
    color: '#333',
  },
  sendBtn: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 40,
    justifyContent: 'center',
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
