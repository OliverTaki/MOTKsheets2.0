import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useContext } from 'react'; // useContext をインポート
import { AuthContext } from '../AuthContext'; // AuthContext をインポート

export default function ProtectedRoutes() {
  const { token, sheetId } = useContext(AuthContext); // useAuth の代わりに useContext(AuthContext) を使用
  const { pathname } = useLocation();

  // サインインしていない場合は /signin へリダイレクト
  if (!token) { // user の代わりに token を使用
    return <Navigate to="/signin" replace />;
  }

  // sheetId が無い & 今が /select 以外なら選択ページへ
  // sheetId がある場合でも /select には直接アクセスできるようにする
  // If sheetId is present and user is on /select, redirect to /
  if (sheetId && pathname === '/select') {
    return <Navigate to="/" replace />;
  }

  // If sheetId is NOT present and user is NOT on /select, redirect to /select
  if (!sheetId && pathname !== '/select') {
    return <Navigate to="/select" replace />;
  }

  // Otherwise, allow access to the current route
  return <Outlet />;
}