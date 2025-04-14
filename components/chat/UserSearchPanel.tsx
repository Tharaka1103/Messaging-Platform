'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Search, UserPlus, CheckCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { searchUsers, startChat } from '@/lib/chat-api';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  hasChat?: boolean;
}

export default function UserSearchPanel({ 
  setSelectedChat, 
  setActiveTab 
}: { 
  setSelectedChat: React.Dispatch<React.SetStateAction<any>>, 
  setActiveTab: React.Dispatch<React.SetStateAction<string>> 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (searchQuery.trim().length < 3) {
      toast({
        title: "Invalid search",
        description: "Please enter at least 3 characters to search",
        status: "warning"
      });
      return;
    }

    try {
      setIsLoading(true);
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
      
      if (results.length === 0) {
        toast({
          title: "No users found",
          description: "Try a different search term",
          status: "info"
        });
      }
    } catch (error: any) {
      console.error("Error searching users:", error);
      toast({
        title: "Search failed",
        description: error.message || "Failed to search users",
        status: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async (userId: string) => {
    try {
      setIsLoading(true);
      const chat = await startChat(userId);
      setSelectedChat(chat);
      setActiveTab('chats');
      
      toast({
        title: "Chat started",
        description: `You can now message with ${chat.name}`,
        status: "success"
      });
    } catch (error: any) {
      console.error("Error starting chat:", error);
      toast({
        title: "Failed to start chat",
        description: error.message || "An error occurred",
        status: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-2">
            {searchResults.map((user) => (
              <UserSearchResult 
                key={user.id} 
                user={user} 
                onStartChat={() => handleStartChat(user.id)} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery.trim() !== '' ? 'No users found matching your search' : 'Search for users by email or name to start a conversation'}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function UserSearchResult({ user, onStartChat }: { user: User; onStartChat: () => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="flex items-center p-3 rounded-md border bg-card cursor-pointer"
      onClick={onStartChat}
    >
      <div className="relative w-12 h-12 mr-3">
        <Image 
          src={user.image || `https://api.dicebear.com/6.x/fun-emoji/svg?seed=${user.name}`} 
          alt={user.name}
          fill
          className="rounded-full object-cover"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium">{user.name}</h3>
        <p className="text-sm text-muted-foreground truncate">
          {user.email}
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onStartChat();
        }}
        className="ml-2 text-primary"
        title={user.hasChat ? "Already chatting" : "Start chat"}
      >
        {user.hasChat ? (
          <CheckCircle className="h-5 w-5" />
        ) : (
          <UserPlus className="h-5 w-5" />
        )}
      </Button>
    </motion.div>
  );
}