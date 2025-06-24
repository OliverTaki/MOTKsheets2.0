import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { useState } from 'react';

export default function LoginButton() {
  const [user, setUser] = useState(null);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => setUser(tokenResponse),
    onError: () => alert('Login failed'),
  });

  return user ? (
    <div className="flex items-center gap-2">
      <span className="text-sm">{user?.access_token?.slice(0, 12)}…</span>
      <button
        className="px-3 py-1 text-sm bg-red-500 text-white rounded"
        onClick={() => {
          googleLogout();
          setUser(null);
        }}
      >
        Sign out
      </button>
    </div>
  ) : (
    <button
      className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
      onClick={() => login()}
    >
      Sign in with Google
    </button>
  );
}
