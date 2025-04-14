// Utility functions for interacting with chat API

export async function fetchChats() {
  try {
    const response = await fetch('/api/chat');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch chats');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw error;
  }
}

// Add these functions to your existing lib/chat-api.ts file

export async function searchUsers(query: string) {
    try {
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search users');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
  
  export async function startChat(userId: string) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start chat');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error starting chat:', error);
      throw error;
    }
  }
  

export async function fetchMessages(chatId: any, limit = 50, cursor = null) {
  try {
    let url = `/api/chat/${chatId}/messages?limit=${limit}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch messages');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

export async function sendMessage(chatId: any, message: any) {
  try {
    const response = await fetch(`/api/chat/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export async function uploadVoiceMessage(audioBlob: Blob) {
  try {
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice-message.webm');
    
    const response = await fetch('/api/upload/voice', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload voice message');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading voice message:', error);
    throw error;
  }
}

export async function uploadFile(file: string | Blob) {
  try {
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload/file', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload file');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}
