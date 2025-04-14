import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '@/lib/db';

// Validation schema
const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export async function POST(req: Request) {
  console.log("Register API called");
  
  try {
    console.log("JWT_SECRET exists:", Boolean(process.env.JWT_SECRET));
    
    const body = await req.json();
    console.log("Request body received:", { ...body, password: "[REDACTED]" });
    
    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      console.log("Validation failed:", result.error.issues);
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }
    
    const { name, email, password } = body;
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      console.log("User already exists:", email);
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user with explicit try/catch
    let user;
    try {
      console.log("Creating user in database...");
      user = await db.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          image: `https://api.dicebear.com/6.x/fun-emoji/svg?seed=${name}`,
        },
      });
      console.log("User created:", { id: user.id, email: user.email });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Database error", details: dbError instanceof Error ? dbError.message : String(dbError) },
        { status: 500 }
      );
    }
    
    // Switch to using jose instead of jsonwebtoken
    try {
      // First ensure user exists and has required properties
      if (!user || !user.id) {
        console.error("User object is invalid:", user);
        return NextResponse.json(
          { error: "User creation failed" },
          { status: 500 }
        );
      }
      
      console.log("Creating token with user:", { id: user.id, email: user.email });
      
      // Create a simple string-based payload (avoid any complex objects)
      const payload = {
        userId: String(user.id),
        userEmail: String(user.email)
      };
      
      console.log("JWT payload:", payload);
      
      // Generate the token with string constants to avoid type issues
      const jwtSecret = String(process.env.JWT_SECRET);
      const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
      
      console.log("Token created successfully");
      
      // Return the successful response
      return NextResponse.json({ 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          image: user.image 
        },
        token 
      }, { status: 201 });
      
    } catch (tokenError) {
      console.error("Token creation error:", tokenError);
      return NextResponse.json(
        { error: "Failed to create authentication token", details: tokenError instanceof Error ? tokenError.message : String(tokenError) },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("REGISTRATION ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
