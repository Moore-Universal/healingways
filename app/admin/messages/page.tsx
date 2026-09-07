'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import {
  getAdminConversations,
  sendChatMessage,
  subscribeToCaseMessages,
  ChatMessage,
} from '@/app/lib/firebase/services';

interface ConversationItem {
  id: string;
  caseRecordId: string;
  name: string;
  caseId: string;
  avatarLetter: string;
  unread?: boolean;
  lastMessage: string;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [showMobileChat, setShowMobileChat] = useState<boolean>(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load real conversations from Firestore / cases
  useEffect(() => {
    let isMounted = true;
    async function loadConversations() {
      setLoading(true);
      try {
        const list = await getAdminConversations();
        if (!isMounted) return;
        setConversations(list || []);
        if (list && list.length > 0) {
          setSelectedId((prev) => (prev && list.some((c) => c.id === prev) ? prev : list[0].id));
        }
      } catch (err) {
        console.error('Error loading conversations for admin messages:', err);
        if (isMounted) setConversations([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadConversations();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeConversation = conversations.find((c) => c.id === selectedId) || (conversations.length > 0 ? conversations[0] : null);

  // Subscribe to real-time messages for currently active conversation
  useEffect(() => {
    if (!activeConversation) return;

    let isMounted = true;
    const primaryKey = activeConversation.caseRecordId || activeConversation.id;
    const altKey = activeConversation.caseId;

    const unsubscribe = subscribeToCaseMessages(
      primaryKey,
      (msgs) => {
        if (isMounted) {
          setMessages(msgs);
        }
      },
      altKey,
      activeConversation.lastMessage
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activeConversation]);

  // Scroll to bottom of message stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setShowMobileChat(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending || !activeConversation) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const primaryKey = activeConversation.caseRecordId || activeConversation.id;
      const altKey = activeConversation.caseId;

      await sendChatMessage({
        caseId: primaryKey,
        altCaseId: altKey,
        sender: 'agent',
        senderName: 'Sarah James (Coordinator)',
        senderRole: 'coordinator',
        text: textToSend,
      });

      // Update last message in conversation sidebar immediately
      setConversations((prev) =>
        prev.map((conv) => (conv.id === selectedId ? { ...conv, lastMessage: textToSend } : conv))
      );
    } catch (err) {
      console.error('Error sending message as admin:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 h-[calc(100vh-80px)] sm:h-[calc(100vh-100px)] flex flex-col font-sans max-w-7xl mx-auto w-full min-w-0">
      <h2 className="text-xl sm:text-2xl font-bold text-[#1E3A8A] mb-4 sm:mb-6 shrink-0">
        Messages
      </h2>

      {/* Main Container Card */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex min-h-0 shadow-sm relative">
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Patient Messages Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Direct communication channels are created automatically when patient consultation cases are received in the database.
            </p>
          </div>
        ) : (
          <>
            {/* Left Sidebar - Conversation List */}
            <div
              className={`w-full md:w-80 border-r border-slate-200 flex flex-col bg-white shrink-0 ${
                showMobileChat ? 'hidden md:flex' : 'flex'
              }`}
            >
              <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                {conversations.map((conv) => {
                  const isSelected = conv.id === selectedId;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`w-full text-left p-4 transition-colors relative block cursor-pointer ${
                        isSelected
                          ? 'bg-[#ECFDF5] border-l-4 border-[#10B981]'
                          : 'hover:bg-slate-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 text-xs sm:text-sm truncate pr-2">
                          {conv.name}
                        </span>
                        {conv.unread && (
                          <span className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0 inline-block" />
                        )}
                      </div>
                      <p
                        className={`text-xs line-clamp-2 leading-relaxed ${
                          isSelected ? 'text-slate-600' : 'text-slate-500'
                        }`}
                      >
                        {conv.lastMessage}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Pane - Chat Window */}
            {activeConversation ? (
              <div
                className={`flex-1 flex flex-col min-w-0 bg-white ${
                  !showMobileChat ? 'hidden md:flex' : 'flex'
                }`}
              >
                {/* Active Chat Header */}
                <div className="p-3 sm:p-4 px-4 sm:px-6 border-b border-slate-100 flex items-center gap-3 shrink-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                    aria-label="Back to messages"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                    {activeConversation.avatarLetter}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight truncate">
                      {activeConversation.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 font-medium truncate">
                      {activeConversation.caseId}
                    </p>
                  </div>
                </div>

                {/* Messages Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      No messages yet. Send a message to start conversation with {activeConversation.name}.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isAgent = msg.sender === 'agent';

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[80%] rounded-xl p-3 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                              isAgent
                                ? 'bg-[#34A853] text-white rounded-tr-none'
                                : 'bg-slate-50 border border-slate-200 text-slate-700 rounded-tl-none min-w-[80px]'
                            }`}
                          >
                            <p className="break-words">{msg.text}</p>
                            <span
                              className={`text-[10px] block mt-1 ${
                                isAgent ? 'text-emerald-100' : 'text-slate-400'
                              }`}
                            >
                              {msg.timestamp || 'Just now'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Bar */}
                <div className="p-3 sm:p-4 border-t border-slate-100 shrink-0">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-3">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type a reply..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-slate-300 placeholder:text-slate-400 min-w-0"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || sending}
                      className="bg-[#34A853] hover:bg-[#2e9649] disabled:opacity-50 text-white font-medium text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span className="hidden sm:inline">Send</span>
                          <Send className="w-4 h-4 sm:hidden" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      </div>
    </div>
  );
}