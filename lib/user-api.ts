// Utility functions for user profile management

export async function updateUserProfile(profileData: any) {
  try {
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

export async function updateUserPassword(passwordData: any) {
  try {
    const response = await fetch('/api/user/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passwordData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update password');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
}

export async function uploadProfileImage(file: string | Blob) {
  try {
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/user/image', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload profile image');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
}
