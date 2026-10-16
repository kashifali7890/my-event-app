import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  
  // 1. Sign out the user
  await supabase.auth.signOut();
  
  // 2. Magic Fix: Get the current website address (localhost or vercel.app)
  const url = new URL(request.url);
  const loginUrl = `${url.origin}/login`;
  
  // 3. Redirect to the login page on that same address
  return NextResponse.redirect(loginUrl);
}