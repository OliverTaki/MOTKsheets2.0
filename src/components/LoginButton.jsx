import React from "react";
import { useAuth } from "../AuthContext.jsx";

export default function LoginButton() {
  const { user, signOut, signIn } = useAuth();

  if (!user) {
    return (
      <button
        onClick={signIn}
        className="px-3 py-1 rounded bg-amber-500 text-white text-sm"
      >
        Sign in
      </button>
    );
  }

  return (
    <button
      onClick={signOut}
      className="px-3 py-1 rounded border text-sm"
    >
      Sign out
    </button>
  );
}
