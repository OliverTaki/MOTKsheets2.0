import { useContext, useEffect } from 'react';
import { AuthContext } from '../AuthContext';
import { useSheetsData } from '../hooks/useSheetsData';

export default function ShotsPage() {
  const { needsReAuth } = useContext(AuthContext);
  const { sheetsData, refresh } = useSheetsData();

  useEffect(() => {
    if (needsReAuth) return; // 認証が必要なら表示しない
    refresh();               // プロジェクト change 時に副次 state をリセット
  }, [refresh]);

  // ... rest of the component (assuming it's already there or will be added later)
  return (
    <div>
      <h1>Shots Page</h1>
      {/* Render your shots data here */}
      {sheetsData && (
        <pre>{JSON.stringify(sheetsData, null, 2)}</pre>
      )}
    </div>
  );
}