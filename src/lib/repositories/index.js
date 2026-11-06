import { localRepository } from "./local-repository";
import { supabaseRepository } from "./supabase-repository";

/**
 * The one place the app picks its data backend. Switch with
 * NEXT_PUBLIC_DATA_PROVIDER=supabase (defaults to browser localStorage).
 */
export const repository =
  process.env.NEXT_PUBLIC_DATA_PROVIDER === "supabase"
    ? supabaseRepository
    : localRepository;
