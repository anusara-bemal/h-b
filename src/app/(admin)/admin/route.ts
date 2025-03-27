import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect(new URL("/admin/dashboard", process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"));
} 