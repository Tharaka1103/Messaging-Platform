'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { 
  User, Mail, Phone, Lock, LogOut, 
  Edit, Check, X, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Form, FormControl, FormDescription, 
  FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, updateUserPassword } from '@/lib/user-api';

interface User {
    name: string;
    email: string;
    bio?: string;
    phoneNumber?: string;
    image?: string;
  }
  
  interface ProfilePanelProps {
    user: User;
    logout: () => void;
  }
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  bio: z.string().optional(),
  phoneNumber: z.string().optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ProfilePanel({ user, logout }: ProfilePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const profileForm = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio || '',
      phoneNumber: user.phoneNumber || '',
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (data: any) => {
    try {
      await updateUserProfile(data);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
        status: "success"
      });
    } catch (error) {
      console.log("Error updating profile:", error);
    }
  };

  const onPasswordSubmit = async (data: any) => {
    try {
      await updateUserPassword(data);
      passwordForm.reset();
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
        status: "success"
      });
    } catch (error) {
      console.log("Error updating password:", error);
    }
  };

  const handleImageUpload = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    // File validation
    if (!file.type.includes('image')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file.",
        status: "error"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Image should be less than 5MB.",
        status: "error"
      });
      return;
    }

    try {
      setIsUploading(true);
      // Here you would upload the file to your server or a service like Cloudinary
      // const uploadedImage = await uploadProfileImage(file);
      
      // For now, we'll simulate a successful upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Image uploaded",
        description: "Your profile image has been updated.",
        status: "success"
      });
    } catch (error) {
      console.log("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Tabs defaultValue="profile" className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
      
      <div className="flex-1 overflow-auto mt-4">
        <TabsContent value="profile" className="h-full">
          <Card className="border-0 shadow-none h-full">
            <CardHeader className="pb-2">
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                View and update your profile details
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                {/* Profile Image */}
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-4">
                    <Image 
                      src={user.image || `https://api.dicebear.com/6.x/fun-emoji/svg?seed=${user.name}`} 
                      alt={user.name}
                      fill
                      className="rounded-full object-cover border-4 border-primary/20"
                    />
                    
                    <label 
                      htmlFor="profile-image" 
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer shadow-md border-2 border-background"
                    >
                      <Upload className="h-4 w-4" />
                      <input 
                        type="file" 
                        id="profile-image" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                  
                  {isUploading && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-primary mr-2"></div>
                      Uploading...
                    </div>
                  )}
                </div>
                
                {/* Profile Form */}
                {isEditing ? (
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input className="pl-9" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us about yourself"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              This will be visible to other users.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input className="pl-9" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Only visible to your contacts.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button type="submit">
                          <Check className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Name</span>
                      </div>
                      <p className="text-foreground pl-6">{user.name}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Email</span>
                      </div>
                      <p className="text-foreground pl-6">{user.email}</p>
                      <p className="text-xs text-muted-foreground pl-6 mt-1">Email address cannot be changed</p>
                    </div>
                    
                    {user.bio && (
                      <div>
                        <div className="flex items-start gap-2 mb-1">
                          <span className="text-sm font-medium">Bio</span>
                        </div>
                        <p className="text-foreground pl-6">{user.bio}</p>
                      </div>
                    )}
                    
                    {user.phoneNumber && (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Phone</span>
                        </div>
                        <p className="text-foreground pl-6">{user.phoneNumber}</p>
                        </div>
                    )}
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="pt-2"
                    >
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    </motion.div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="h-full">
          <Card className="border-0 shadow-none h-full">
            <CardHeader className="pb-2">
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your account security
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input 
                              type="password" 
                              className="pl-9" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input 
                              type="password" 
                              className="pl-9" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Password must be at least 6 characters long.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input 
                              type="password" 
                              className="pl-9" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">
                    Update Password
                  </Button>
                </form>
              </Form>

              <div className="mt-8 pt-6 border-t">
                <h3 className="font-medium mb-3">Account Actions</h3>
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </div>
    </Tabs>
  );
}
