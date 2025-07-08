import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { toProjectName } from '../utils/id'; // toProjectName をインポート

// shadcn/ui の DropdownMenu コンポーネントを想定
// 実際のプロジェクトに合わせてインポートパスを調整してください
// import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';

// 仮の DropdownMenu コンポーネント (shadcn/ui が設定されていない場合)
const DropdownMenu = ({ children }) => <div className="relative">{children}</div>;
const DropdownMenuTrigger = ({ children, onClick }) => <button onClick={onClick} className="px-2 py-1 bg-zinc-700 rounded">{children}</button>;
const DropdownMenuContent = ({ children }) => <div className="absolute top-full left-0 bg-zinc-800 border border-zinc-700 rounded shadow-lg z-10">{children}</div>;
const DropdownMenuItem = ({ children, onSelect }) => <div onClick={onSelect} className="px-4 py-2 hover:bg-zinc-600 cursor-pointer">{children}</div>;


export default function GlobalNav() {
  const navigate = useNavigate();
  const { sheetId, setSheetId, displayName, sheets } = useContext(AuthContext);

  const changeProject = (id) => {
    setSheetId(id);
    localStorage.setItem('motk:lastSheetId', id);
    navigate('/');
  };

  return (
    <header className="flex items-center h-12 bg-zinc-800 text-white px-4">
      {/* LOGO -> /select */}
      <button onClick={() => navigate('/select')} className="font-bold mr-8">
        MOTK
      </button>

      {/* Project Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          {displayName ?? 'Select Project'}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {sheets.length > 0 ? (
            sheets
              .sort((a, b) => toProjectName(a).localeCompare(toProjectName(b)))
              .map((f) => (
                <DropdownMenuItem key={f.id} onSelect={() => changeProject(f.id)}>
                  {toProjectName(f)}
                </DropdownMenuItem>
              ))
          ) : (
            <DropdownMenuItem onSelect={() => {}}>
              No projects found
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sign-out 等は右端 */}
      <div className="ml-auto">
        {/* ここに既存の Sign-out ボタンなどを配置 */}
      </div>
    </header>
  );
}
