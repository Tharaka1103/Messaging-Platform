'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { MessageCircle, User, Phone, PanelLeft, PanelRight, UserPlus } from 'lucide-react';
import { ThemeSwitch } from '@/components/ThemeSwitch';
import ChatPanel from '@/components/chat/ChatPanel';
import UserSearchPanel from '@/components/chat/UserSearchPanel';
import ProfilePanel from '@/components/profile/ProfilePanel';
import CallHistoryPanel from '@/components/call/CallHistoryPanel';
import ActiveChatView from '@/components/chat/ActiveChatView';
import Image from 'next/image';

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

export default function ChatPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [activeTab, setActiveTab] = useState('chats');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);
  
  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // This function ensures the sidebar is expanded when switching tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card py-3 px-4">
        <div className="flex justify-between items-center">
          <motion.div 
            className="flex items-center"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-xl font-bold text-primary">Chaty</h1>
          </motion.div>
          
          <div className="flex items-center gap-2">
            <ThemeSwitch />
            <Button variant="ghost" onClick={logout} size="sm">Logout</Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar */}
          <ResizablePanel
            defaultSize={25}
            minSize={15}
            maxSize={40}
            collapsible
            collapsedSize={5}
            onCollapse={() => setSidebarCollapsed(true)}
            onExpand={() => setSidebarCollapsed(false)}
            className="bg-card"
          >
            {sidebarCollapsed ? (
              <div className="h-full flex flex-col items-center py-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(false)}
                  className="mb-6"
                >
                  <PanelRight className="h-5 w-5" />
                </Button>
                
                <div className="flex flex-col items-center gap-4">
                  <Button
                    variant={activeTab === 'chats' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setActiveTab('chats')}
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                  
                  <Button
                    variant={activeTab === 'users' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setActiveTab('users')}
                  >
                    <UserPlus className="h-5 w-5" />
                  </Button>
                  
                  <Button
                    variant={activeTab === 'calls' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setActiveTab('calls')}
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                  
                  <Button
                    variant={activeTab === 'profile' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setActiveTab('profile')}
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="p-4 flex justify-between items-center border-b">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-4 w-full">
                      <TabsTrigger value="chats">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chats
                      </TabsTrigger>
                      <TabsTrigger value="users">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Users
                      </TabsTrigger>
                      <TabsTrigger value="calls">
                        <Phone className="h-4 w-4 mr-2" />
                        Calls
                      </TabsTrigger>
                      <TabsTrigger value="profile">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarCollapsed(true)}
                    className="ml-2"
                  >
                    <PanelLeft className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="flex-1 overflow-hidden p-4">
                  {activeTab === 'chats' && (
                    <ChatPanel setSelectedChat={setSelectedChat} />
                  )}
                  
                  {activeTab === 'users' && (
                    <UserSearchPanel 
                      setSelectedChat={setSelectedChat} 
                      setActiveTab={setActiveTab}
                    />
                  )}
                  
                  {activeTab === 'calls' && (
                    <CallHistoryPanel />
                  )}
                  
                  {activeTab === 'profile' && (
                    <ProfilePanel user={user} logout={logout} />
                  )}
                </div>
              </div>
            )}
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Main Chat Area */}
          <ResizablePanel defaultSize={75}>
            {selectedChat ? (
              <ActiveChatView chat={selectedChat} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-4 bg-card/50">
                <div className="max-w-md text-center">
                <div className="mb-4 mx-auto bg-primary/10 p-6 rounded-full w-24 h-24 flex items-center justify-center">
                    <MessageCircle className="h-12 w-12 text-primary/60" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Welcome to Chaty</h2>
                  <p className="text-muted-foreground mb-6">
                    Select a conversation from the sidebar or start a new chat by searching for users.
                  </p>
                  <Button onClick={() => handleTabChange('users')}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Find Users
                  </Button>
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
