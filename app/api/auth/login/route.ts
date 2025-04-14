import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '@/lib/db';

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  console.log("Login API called");
  
  try {
    const body = await req.json();
    console.log("Login attempt for:", body.email);
    
    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }
    
    const { email, password } = body;
    
    // Find user
    const user = await db.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      console.log("User not found:", email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log("Invalid password for user:", email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );
    }
    
    // Verify JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in environment variables");
      return NextResponse.json(
        { error: "Server configuration error: Missing JWT_SECRET" },
        { status: 500 }
      );
    }
    
    // Generate JWT token
    let token;
    try {
      const payload = {
        id: String(user.id),
        email: String(user.email)
      };
      
      token = jwt.sign(
        payload,
        String(process.env.JWT_SECRET),
        { expiresIn: '7d' }
      );
    } catch (jwtError) {
      console.error("JWT signing error:", jwtError);
      return NextResponse.json(
        { error: "Authentication error", 
          details: jwtError instanceof Error ? jwtError.message : String(jwtError) },
        { status: 500 }
      );
    }
    
    console.log("Login successful for:", email);
    
    return NextResponse.json({ 
      user: { id: user.id, name: user.name, email: user.email, image: user.image },
      token 
    });
    
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
