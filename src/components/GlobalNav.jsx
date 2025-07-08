import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { useDriveSheets } from '../hooks/useDriveSheets'; // useDriveSheets をインポート
import { toProjectName } from '../utils/id'; // toProjectName をインポート

// shadcn/ui の DropdownMenu コンポーネントを想定
// 実際のプロジェクトに合わせてインポートパスを調整してください
// import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';

// 仮の DropdownMenu コンポーネント (shadcn/ui が設定されていない場合)
const DropdownMenu = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (child.type === DropdownMenuTrigger) {
          return React.cloneElement(child, { onClick: toggleOpen });
        } else if (child.type === DropdownMenuContent) {
          return isOpen ? child : null;
        }
        return child;
      })}
    </div>
  );
};
const DropdownMenuTrigger = ({ children, onClick }) => <button onClick={onClick} className="px-2 py-1 bg-zinc-700 rounded">{children}</button>;
const DropdownMenuContent = ({ children }) => <div className="absolute top-full left-0 bg-zinc-800 border border-zinc-700 rounded shadow-lg z-10">{children}</div>;
const DropdownMenuItem = ({ children, onSelect }) => <div onClick={onSelect} className="px-4 py-2 hover:bg-zinc-600 cursor-pointer">{children}</div>;


export default function GlobalNav() {
  const navigate = useNavigate();
  const { sheetId, setSheetId } = useContext(AuthContext);
  const { sheets, loading, error } = useDriveSheets(); // useDriveSheets を内部で呼び出す
  const [currentProjectDisplayName, setCurrentProjectDisplayName] = useState('Select Project');

  useEffect(() => {
    if (sheetId && sheets.length > 0) {
      const currentSheet = sheets.find(sheet => sheet.id === sheetId);
      if (currentSheet) {
        setCurrentProjectDisplayName(toProjectName(currentSheet));
      } else {
        setCurrentProjectDisplayName('Select Project');
      }
    } else {
      setCurrentProjectDisplayName('Select Project');
    }
  }, [sheetId, sheets]);

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
          {currentProjectDisplayName}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {loading && <DropdownMenuItem onSelect={() => {}}>Loading projects...</DropdownMenuItem>}
          {error && <DropdownMenuItem onSelect={() => {}} className="text-red-400">Error loading projects</DropdownMenuItem>}
          {!loading && !error && sheets.length === 0 && (
            <DropdownMenuItem onSelect={() => {}}>
              No projects found
            </DropdownMenuItem>
          )}
          {!loading && !error && sheets.length > 0 && (
            sheets
              .sort((a, b) => toProjectName(a).localeCompare(toProjectName(b)))
              .map((f) => (
                <DropdownMenuItem key={f.id} onSelect={() => changeProject(f.id)}>
                  {toProjectName(f)}
                </DropdownMenuItem>
              ))
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