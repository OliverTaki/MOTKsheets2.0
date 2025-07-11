import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { SheetsContext } from '../contexts/SheetsContext';

export default function ProtectedRoutes() {
  const { token } = useContext(AuthContext);
  const { sheetId } = useContext(SheetsContext);
  const { pathname } = useLocation();

  // サインインしていない場合は /signin へリダイレクト
  if (!token) { // user の代わりに token を使用
    return <Navigate to="/signin" replace />;
  }

  // sheetId が無い & 今が /select 以外なら選択ページへ
  // sheetId がある場合でも /select には直接アクセスできるようにする
  // If sheetId is present and user is on /select, redirect to /
  // This logic is now handled in AppContainer.jsx

  // Otherwise, allow access to the current route
  return <Outlet />;
}