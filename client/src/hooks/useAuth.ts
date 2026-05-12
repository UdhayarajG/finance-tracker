import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";

export function useAuth() {
  const { data: user, isLoading, error } = trpc.auth.me.useQuery();

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}
