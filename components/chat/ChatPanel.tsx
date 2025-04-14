'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import formatTimeAgo from '@/components/formatTimeAgo';
import { fetchChats } from '@/lib/chat-api';

interface Chat {
  id: string;
  name: string;
  image?: string;
  isOnline?: boolean;
  lastMessage: {
    type: string;
    text?: string;
  };
  lastMessageAt: string;
  unreadCount: number;
}

export default function ChatPanel({ setSelectedChat }: { setSelectedChat: React.Dispatch<React.SetStateAction<Chat | null>> }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadChats() {
      try {
        setIsLoading(true);
        const chatData = await fetchChats();
        setChats(chatData);
        setFilteredChats(chatData);
      } catch (error) {
        console.log("Error loading chats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadChats();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter(chat => 
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [searchQuery, chats]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredChats.length > 0 ? (
          <div className="space-y-1">
            {filteredChats.map((chat) => (
              <ChatListItem 
                key={chat.id} 
                chat={chat} 
                onClick={() => setSelectedChat(chat)} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery.trim() !== '' ? 'No conversations match your search' : 'No conversations yet'}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function ChatListItem({ chat, onClick }: { chat: Chat; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="flex items-center p-3 rounded-md hover:bg-accent/50 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative w-12 h-12 mr-3">
        <Image 
          src={chat.image || `https://api.dicebear.com/6.x/fun-emoji/svg?seed=${chat.name}`} 
          alt={chat.name}
          fill
          className="rounded-full object-cover"
        />
        {chat.isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background"></span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          <h3 className="font-medium truncate">{chat.name}</h3>
          <span className="text-xs text-muted-foreground">{formatTimeAgo(chat.lastMessageAt)}</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground truncate">
            {chat.lastMessage.type === 'voice' ? '🎤 Voice message' : chat.lastMessage.text}
          </p>
          {chat.unreadCount > 0 && (
            <span className="ml-2 flex-shrink-0 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
