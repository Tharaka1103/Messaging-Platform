'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useEncryption } from '@/hooks/use-encryption';
import { fetchMessages, sendMessage, uploadVoiceMessage, uploadFile } from '@/lib/chat-api';
import { setupWebRTC } from '@/lib/call-api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Send, 
  Mic, 
  Paperclip, 
  MoreVertical, 
  Phone, 
  Video, 
  Info, 
  X, 
  Loader2, 
  Image as ImageIcon,
  File, 
  Play, 
  Pause,
  Download,
  MessageCircle
} from 'lucide-react';
import formatTimeAgo from '@/components/formatTimeAgo';

export default function ActiveChatView({ chat }: { chat: any }) {
  const { user } = useAuth();
  interface Message {
    id: string;
    text: string;
    type: 'text' | 'voice' | 'image' | 'file';
    sender: {
      id: string;
      name: string;
      image?: string;
    };
    voiceUrl?: string;
    fileUrl?: string;
    createdAt: string;
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const { toast } = useToast();
  const { encrypt, decrypt, isReady } = useEncryption();

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const { messages: fetchedMessages, nextCursor: cursor } = await fetchMessages(chat.id);
        
        // Decrypt messages if encryption is ready
        if (isReady) {
          const decryptedMessages = await Promise.all(
            fetchedMessages.map(async (message: { type: string; text: string; }) => {
              if (message.type === 'text' && message.text) {
                try {
                  const decryptedText = await decrypt(message.text);
                  return { ...message, text: decryptedText || message.text };
                } catch (error) {
                  console.error('Failed to decrypt message:', error);
                  return message;
                }
              }
              return message;
            })
          );
          setMessages(decryptedMessages.reverse());
        } else {
          setMessages(fetchedMessages.reverse());
        }
        
        setNextCursor(cursor);
      } catch (error) {
        console.log("Error loading messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (chat) {
      loadMessages();
    }
    
    return () => {
      // Clean up any recording on unmount
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [chat, isReady]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setIsSending(true);
      
      // Encrypt message if encryption is ready
      let messageToSend = newMessage;
      if (isReady) {
        const encryptedText = await encrypt(newMessage);
        if (encryptedText) {
          messageToSend = encryptedText;
        }
      }
      
      const sentMessage = await sendMessage(chat.id, {
        text: messageToSend,
        type: 'text'
      });
      
      // Add sent message to the state (with original text for display)
      setMessages([...messages, {
        ...sentMessage,
        text: newMessage // Use the original unencrypted text for display
      }]);
      
      setNewMessage('');
    } catch (error) {
      console.log("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: { key: string; shiftKey: any; preventDefault: () => void; }) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
          // Upload voice message
          const { url } = await uploadVoiceMessage(audioBlob);
          
          // Send the message with the voice URL
          const sentMessage = await sendMessage(chat.id, {
            text: `Voice message (${formatTime(recordingTime)})`,
            type: 'voice',
            voiceUrl: url
          });
          
          // Add sent message to the state
          setMessages([...messages, sentMessage]);
        } catch (error) {
          console.log("Error sending voice message:", error);
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setRecordingTime(0);
        clearInterval(recordingTimerRef.current);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer for recording duration
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.log("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        status: 'error'
      });
      return;
    }
    
    try {
      setIsSending(true);
      
      // Upload the file
      const { url } = await uploadFile(file);
      
      // Determine file type (image or other)
      const fileType = file.type.startsWith('image/') ? 'image' : 'file';
      
      // Send message with file URL
      const sentMessage = await sendMessage(chat.id, {
        text: file.name,
        type: fileType,
        fileUrl: url
      });
      
      // Add sent message to the state
      setMessages([...messages, sentMessage]);
    } catch (error) {
      console.log("Error uploading file:", error);
    } finally {
      setIsSending(false);
    }
  };

  const initiateCall = (isVideo: boolean) => {
    // In a real app, this would initiate a WebRTC call
    const call = setupWebRTC(chat.id, isVideo);
    call.startCall();
    
    toast({
      title: `${isVideo ? 'Video' : 'Audio'} call initiated`,
      description: `Calling ${chat.name}...`,
      status: 'info'
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-3 border-b flex justify-between items-center bg-card">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage
              src={chat.image || `https://api.dicebear.com/6.x/fun-emoji/svg?seed=${chat.name}`}
              alt={chat.name}
            />
            <AvatarFallback>{chat.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="font-medium">{chat.name}</h3>
            <p className="text-xs text-muted-foreground">
              {chat.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => initiateCall(false)}>
                  <Phone className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Audio Call</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => initiateCall(true)}>
                  <Video className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Video Call</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setShowInfo(!showInfo)}>
                  <Info className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chat Info</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Search in conversation</DropdownMenuItem>
              <DropdownMenuItem>Clear conversation</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Block user</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="mb-4 p-4 rounded-full bg-primary/10">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-1">No messages yet</h3>
            <p className="text-muted-foreground mb-4">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwnMessage={message.sender.id === user?.id}
              />
            ))}
            <div ref={messageEndRef} />
          </div>
        )}
      </ScrollArea>
      
      {/* Message Input */}
      <div className="p-3 border-t bg-card">
        {isRecording ? (
          <div className="flex items-center gap-2 p-2 rounded-md border border-destructive bg-destructive/10">
            <div className="animate-pulse h-3 w-3 rounded-full bg-destructive"></div>
            <span className="text-sm font-medium text-destructive">
              Recording: {formatTime(recordingTime)}
            </span>
            <div className="flex-1"></div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={stopRecording}
            >
              <X className="h-4 w-4 mr-1" />
              Stop
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
              disabled={isSending}
            />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isSending}
                  >
                    <Paperclip className="h-5 w-5" />
                    <input
                      type="file"
                      id="file-upload"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach File</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={startRecording}
                    disabled={isSending}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voice Message</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || isSending}
              className={!newMessage.trim() ? 'opacity-50' : ''}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
      
      {/* Chat Info Sidebar */}
      <AnimatePresence>
        {showInfo && (
          <motion.div 
            className="absolute top-0 right-0 h-full w-80 bg-card border-l p-4 z-10 overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Chat Information</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowInfo(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-20 w-20 mb-3">
                <AvatarImage
                  src={chat.image || `https://api.dicebear.com/6.x/fun-emoji/svg?seed=${chat.name}`}
                  alt={chat.name}
                />
                <AvatarFallback>{chat.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h4 className="text-lg font-medium">{chat.name}</h4>
              <p className="text-sm text-muted-foreground">{chat.email || 'No email available'}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Media</h4>
                <div className="grid grid-cols-3 gap-2">
                  {messages
                    .filter(msg => msg.type === 'image')
                    .slice(0, 6)
                    .map((msg, i) => (
                      <div key={i} className="aspect-square relative rounded-md overflow-hidden border">
                        <Image
                          src={msg.fileUrl || '/placeholder-image.jpg'}
                          alt="Shared media"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Files</h4>
                <div className="space-y-2">
                  {messages
                    .filter(msg => msg.type === 'file')
                    .slice(0, 3)
                    .map((msg, i) => (
                      <div key={i} className="flex items-center p-2 rounded-md border">
                        <File className="h-4 w-4 mr-2" />
                        <span className="text-sm truncate flex-1">{msg.text}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Actions</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => initiateCall(false)}>
                    <Phone className="h-4 w-4 mr-2" />
                    Audio Call
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => initiateCall(true)}>
                    <Video className="h-4 w-4 mr-2" />
                    Video Call
                  </Button>
                  <Button variant="destructive" className="w-full justify-start">
                    <X className="h-4 w-4 mr-2" />
                    Block User
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Chat Message Component
interface Message {
  id: string;
  text: string;
  type: 'text' | 'voice' | 'image' | 'file';
  sender: {
    id: string;
    name: string;
    image?: string;
  };
  voiceUrl?: string;
  fileUrl?: string;
  createdAt: string;
}

function ChatMessage({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // Format timestamp
  const messageTime = formatTimeAgo(message.createdAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[80%] ${isOwnMessage ? 'order-1' : 'order-2'}`}>
        {!isOwnMessage && (
          <div className="flex items-center mb-1">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage
                src={message.sender.image || `https://api.dicebear.com/6.x/fun-emoji/svg?seed=${message.sender.name}`}
                alt={message.sender.name}
              />
              <AvatarFallback>{message.sender.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">{message.sender.name}</span>
          </div>
        )}

        {/* Text Message */}
        {message.type === 'text' && (
          <div
            className={`rounded-lg p-3 ${
              isOwnMessage
                ? 'bg-primary text-white'
                : 'bg-muted'
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          </div>
        )}

        {/* Voice Message */}
        {message.type === 'voice' && (
          <div
            className={`rounded-lg p-3 ${
              isOwnMessage
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            <div className="flex items-center gap-2">
              <Button
                variant={isOwnMessage ? "secondary" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={toggleAudioPlayback}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <div className="flex-1 h-8 flex items-center">
                <div className="w-full h-1 bg-primary-foreground/20 rounded-full overflow-hidden">
                  <div className="h-full w-0 bg-background animate-wave"></div>
                </div>
              </div>
              <audio
                ref={audioRef}
                src={message.voiceUrl}
                onEnded={handleAudioEnded}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Image Message */}
        {message.type === 'image' && (
          <div
            className={`rounded-lg overflow-hidden ${
              isOwnMessage ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <div
              className="relative w-48 h-48 cursor-pointer"
              onClick={() => setIsImageModalOpen(true)}
            >
              <Image
                src={message.fileUrl || '/placeholder-image.jpg'}
                alt="Image"
                fill
                className="object-cover"
              />
            </div>
            {/* Image Modal would be implemented here */}
          </div>
        )}

        {/* File Message */}
        {message.type === 'file' && (
          <div
            className={`rounded-lg p-3 ${
              isOwnMessage
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            <div className="flex items-center gap-2">
              <File className="h-5 w-5" />
              <span className="text-sm truncate">{message.text}</span>
              <Button
                variant={isOwnMessage ? "secondary" : "outline"}
                size="icon"
                className="h-6 w-6 ml-2"
                asChild
              >
                <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" download>
                  <Download className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        )}

        <div className={`text-xs text-muted-foreground mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
          {messageTime}
        </div>
      </div>
    </motion.div>
  );
}
