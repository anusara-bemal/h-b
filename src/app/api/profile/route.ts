import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

// GET: Fetch user profile
export async function GET(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log("Profile API: No authenticated user session found");
      return NextResponse.json(
        { error: "You must be logged in to view your profile" },
        { status: 401 }
      );
    }
    
    console.log("Profile API: User authenticated, session user:", session.user);
    
    // Get user ID from session
    const userId = session.user.id;
    
    if (!userId) {
      console.log("Profile API: No user ID in session");
      return NextResponse.json(
        { error: "Invalid user session" },
        { status: 400 }
      );
    }
    
    // Query to fetch user profile
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        IFNULL(u.phone, '') as phone,
        IFNULL(u.address, '') as address
      FROM users u
      WHERE u.id = ?
    `;
    
    console.log("Profile API: Executing query for user ID:", userId);
    
    try {
      // Execute query
      const [rows] = await db.query(query, [userId]);
      
      // Check if user exists
      if (!rows || (Array.isArray(rows) && rows.length === 0)) {
        console.log("Profile API: No user found for ID:", userId);
        
        // Return a default profile if user exists in auth but not in database
        return NextResponse.json({
          name: session.user.name || '',
          email: session.user.email || '',
          phone: '',
          address: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: ''
          }
        });
      }
      
      // Get the user from result
      const user = Array.isArray(rows) ? rows[0] : rows;
      console.log("Profile API: User data retrieved:", { 
        id: user.id, 
        name: user.name, 
        email: user.email 
      });
      
      // Parse address JSON if it exists
      let address = null;
      try {
        address = user.address ? JSON.parse(user.address) : null;
      } catch (error) {
        console.error("Error parsing address JSON:", error);
        address = null;
      }
      
      // Return formatted profile
      return NextResponse.json({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: address || {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: ''
        }
      });
    } catch (dbError) {
      console.error("Database error in profile API:", dbError);
      return NextResponse.json(
        { error: "Database error: " + (dbError instanceof Error ? dbError.message : String(dbError)) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// PATCH: Update user profile
export async function PATCH(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to update your profile" },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }
    
    // Format address as JSON string
    const address = body.address ? JSON.stringify(body.address) : null;
    
    // Query to update user profile
    const query = `
      UPDATE users 
      SET name = ?, 
          email = ?, 
          phone = ?,
          address = ?
      WHERE id = ?
    `;
    
    // Execute query
    await db.query(query, [
      body.name,
      body.email,
      body.phone || null,
      address,
      userId
    ]);
    
    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 