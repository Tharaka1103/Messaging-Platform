'use client';

import { useState, useEffect, useCallback } from 'react';

export function useEncryption() {
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  
  // Initialize encryption on component mount
  useEffect(() => {
    const initializeEncryption = async () => {
      // In a real app, you would either:
      // 1. Generate a key pair and exchange public keys with the server
      // 2. Or use a service like Signal Protocol for true E2EE
      
      // For demo purposes, we'll use the Web Crypto API to generate a symmetric key
      try {
        const key = await window.crypto.subtle.generateKey(
          {
            name: "AES-GCM",
            length: 256,
          },
          true,
          ["encrypt", "decrypt"]
        );
        
        setEncryptionKey(key);
      } catch (error) {
        console.error("Failed to initialize encryption:", error);
      }
    };
    
    initializeEncryption();
  }, []);
  
  // Encrypt message
  const encrypt = useCallback(async (message: string | undefined) => {
    if (!encryptionKey) return null;
    
    try {
      // Create an initialization vector
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Convert message to ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      
      // Encrypt the data
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv,
        },
        encryptionKey,
        data
      );
      
      // Combine IV and encrypted data for transmission
      const encryptedArray = new Uint8Array(iv.byteLength + encryptedData.byteLength);
      encryptedArray.set(iv, 0);
      encryptedArray.set(new Uint8Array(encryptedData), iv.byteLength);
      
      // Convert to base64 for easy transmission
      return btoa(String.fromCharCode.apply(null, Array.from(encryptedArray)));
    } catch (error) {
      console.error("Encryption failed:", error);
      return null;
    }
  }, [encryptionKey]);
  
  // Decrypt message
  const decrypt = useCallback(async (encryptedMessage: string) => {
    if (!encryptionKey) return null;
    
    try {
      // Convert base64 to array
      const encryptedArray = new Uint8Array(
        atob(encryptedMessage).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract IV and encrypted data
      const iv = encryptedArray.slice(0, 12);
      const encryptedData = encryptedArray.slice(12);
      
      // Decrypt the data
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv,
        },
        encryptionKey,
        encryptedData
      );
      
      // Convert decrypted data to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error("Decryption failed:", error);
      return null;
    }
  }, [encryptionKey]);
  
  return { encrypt, decrypt, isReady: !!encryptionKey };
}
