import { useAuth } from '../AuthContext.jsx';

export default function LoginButton() {
  const { token, login, logout } = useAuth();

  return token ? (
    <button
      className="border px-3 py-1 text-sm rounded"
      onClick={logout}
    >
      Sign out
    </button>
  ) : (
    <button
      className="border px-3 py-1 text-sm rounded"
      onClick={() => login()}
    >
      Sign in
    </button>
  );
}
