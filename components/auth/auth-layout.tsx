import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left: Brand/Logo Side */}
      <motion.div 
        className="hidden lg:flex flex-col justify-between items-center w-1/2 bg-primary p-10 text-primary-foreground"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-md mx-auto flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <Image 
              src="/logo.png" 
              alt="Chaty Logo" 
              width={120} 
              height={120} 
              className="drop-shadow-lg"
            />
          </motion.div>
          
          <motion.h1 
            className="text-4xl font-bold mb-4 text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Welcome to Chaty
          </motion.h1>
          
          <motion.p 
            className="text-xl text-center text-white opacity-90"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Connect with friends and the world around you with Chaty.
          </motion.p>
        </div>
        
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <div className="rounded-lg overflow-hidden shadow-xl">
            <Image 
              src="/authbg.png" 
              alt="Chat Illustration" 
              width={500} 
              height={400} 
              className="w-full h-auto" 
            />
          </div>
        </motion.div>
        
        <motion.p 
          className="text-sm text-white opacity-80 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          © {new Date().getFullYear()} Chaty. All rights reserved.
        </motion.p>
      </motion.div>
      
      {/* Right: Auth Form Side */}
      <motion.div 
        className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-12"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex flex-col items-center">
            <Image 
              src="/logo.png" 
              alt="Chaty Logo" 
              width={80} 
              height={80} 
            />
            <h1 className="text-3xl font-bold mt-4 text-center">Chaty</h1>
          </div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-2">{title}</h2>
            <p className="text-muted-foreground mb-8">{subtitle}</p>
            {children}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

