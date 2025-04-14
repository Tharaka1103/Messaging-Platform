'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import formatTimeAgo from '@/components/formatTimeAgo';
import { useToast } from '@/hooks/use-toast';
import { fetchCallHistory, initiateCall } from '@/lib/call-api';

export default function CallHistoryPanel() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadCallHistory() {
      try {
        setIsLoading(true);
        const historyData = await fetchCallHistory();
        setCalls(historyData);
      } catch (error) {
        console.log("Error loading call history:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCallHistory();
  }, []);

  const initiateNewCall = async (userId: any, isVideo: boolean | undefined) => {
    try {
      await initiateCall(userId, isVideo);
      // Call would be handled by a real-time service
    } catch (error) {
      console.log("Error initiating call:", error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="missed">Missed</TabsTrigger>
          <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1 h-[calc(100%-40px)] mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : calls.length > 0 ? (
            <TabsContent value="all" className="m-0">
              <div className="space-y-2">
                {calls.map((call) => (
                  <CallHistoryItem 
                    key={call.id} 
                    call={call} 
                    onCall={(isVideo: any) => initiateNewCall(call.userId, isVideo)} 
                  />
                ))}
              </div>
            </TabsContent>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No call history available
            </div>
          )}
        </ScrollArea>
      </Tabs>
    </div>
  );
}

interface Call {
  id: string;
  type: 'incoming' | 'outgoing' | 'missed';
  name: string;
  image?: string;
  userId: string;
  timestamp: string;
  duration?: string;
  isVideo: boolean;
}

function CallHistoryItem({ call, onCall }: { call: Call; onCall: (isVideo: boolean) => void }) {
  const getCallIcon = () => {
    switch (call.type) {
      case 'incoming':
        return <PhoneIncoming className="h-4 w-4 text-green-500" />;
      case 'outgoing':
        return <PhoneOutgoing className="h-4 w-4 text-blue-500" />;
      case 'missed':
        return <PhoneMissed className="h-4 w-4 text-red-500" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="flex items-center p-3 rounded-md border bg-card"
    >
      <div className="relative w-10 h-10 mr-3">
        <Image 
          src={call.image || `https://api.dicebear.com/6.x/fun-emoji/svg?seed=${call.name}`} 
          alt={call.name}
          fill
          className="rounded-full object-cover"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <h3 className="font-medium">{call.name}</h3>
          <div className="flex items-center ml-2">
            {getCallIcon()}
            {call.isVideo && <Video className="h-4 w-4 ml-1" />}
          </div>
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <span>{formatTimeAgo(call.timestamp)}</span>
          <span className="mx-1">•</span>
          <span>{call.duration || 'Missed'}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCall(false)}
          className="text-primary h-8 w-8"
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCall(true)}
          className="text-primary h-8 w-8"
        >
          <Video className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
