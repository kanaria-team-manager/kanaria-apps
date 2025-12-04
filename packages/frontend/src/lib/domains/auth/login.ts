import { supabase } from "$lib/supabase";
import type { LoginCredentials } from "./types.js";

export interface LoginResponse {
  message: string;
}

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { message: "Login successful" };
}
