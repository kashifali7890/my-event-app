"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ThankYouActions() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogOut = async () => {
    setIsLoggingOut(true);
    setErrorMessage("");

    try {
      localStorage.removeItem("guestToken");
      sessionStorage.removeItem("isGuest");
      sessionStorage.removeItem("currentEventId");

      const { error } = await createClient().auth.signOut();
      if (error) throw error;

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setErrorMessage("We couldn't log you out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleLogOut}
        disabled={isLoggingOut}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogOut className="h-4 w-4" />
        {isLoggingOut ? "Logging out..." : "Log out"}
      </button>
      {errorMessage && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          {errorMessage}
        </p>
      )}
    </>
  );
}
