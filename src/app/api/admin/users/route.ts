import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/utils";
import { RowDataPacket } from "mysql2";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasAdminAccess((session.user as any).role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!session?.user || !hasAdminAccess((session.user as any).role as string, session.user.email as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build the base query
    let query = "SELECT SQL_CALC_FOUND_ROWS id, name, email, role, createdAt, updatedAt FROM users";
    const params: any[] = [];
    
    // Add WHERE clauses
    const conditions: string[] = [];
    
    if (role && role !== "all") {
      conditions.push("role = ?");
      params.push(role);
    }
    
    if (search) {
      conditions.push("(id LIKE ? OR name LIKE ? OR email LIKE ?)");
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    
    // Add ORDER BY clause
    const validColumns = ["id", "name", "email", "role", "createdAt", "updatedAt"];
    const validSortBy = validColumns.includes(sortBy) ? sortBy : "createdAt";
    const validSortOrder = sortOrder === "asc" ? "ASC" : "DESC";
    query += ` ORDER BY ${validSortBy} ${validSortOrder}`;
    
    // Add LIMIT and OFFSET directly to the query
    const offset = (page - 1) * limit;
    query += ` LIMIT ${parseInt(String(limit))} OFFSET ${parseInt(String(offset))}`;

    // Execute the queries
    const [rows] = await pool.execute(query, params);
    const [totalRows] = await pool.execute("SELECT FOUND_ROWS() as total");
    const total = (totalRows as RowDataPacket[])[0].total;

    return NextResponse.json({
      users: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasAdminAccess((session.user as any).role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!session?.user || !hasAdminAccess((session.user as any).role as string, session.user.email as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, role } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!role || !["admin", "user"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Update user role in database
    await pool.execute(
      "UPDATE users SET role = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [role, id]
    );

    return NextResponse.json({ 
      message: "User role updated successfully"
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
} 