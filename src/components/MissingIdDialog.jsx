// src/components/MissingIdDialog.jsx – v1
//--------------------------------------------------
import React from "react";
import { v4 as uuidv4 } from "uuid";

/**
 * 行に shot_uuid が無い場合に表示されるモーダル
 * rows: 欠落行 [{ __rowNum, ... }]
 * onGenerate(rowsWithId): ID 生成して保存する
 * onDelete(rows): 行削除リクエスト実行
 */
export default function MissingIdDialog({ rows, onGenerate, onDelete }) {
  if (!rows.length) return null;

  const generate = () => {
    const patched = rows.map((r) => ({ ...r, shot_uuid: uuidv4() }));
    onGenerate(patched);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded p-6 w-96 shadow-xl space-y-4">
        <h3 className="text-lg font-medium">Shots without ID</h3>
        <p className="text-sm text-gray-600">
          {rows.length} 行に <code>shot_uuid</code> がありません。どうしますか？
        </p>
        <ul className="text-xs max-h-32 overflow-auto border rounded p-2 bg-gray-50">
          {rows.map((r) => (
            <li key={r.__rowNum}>{`row ${r.__rowNum}: ${r.shot_code || "(no code)"}`}</li>
          ))}
        </ul>
        <div className="flex justify-end gap-3 pt-2 text-sm">
          <button
            className="px-3 py-1 rounded border"
            onClick={() => onDelete(rows)}
          >
            Delete rows
          </button>
          <button
            className="px-3 py-1 rounded bg-amber-500 text-white"
            onClick={generate}
          >
            Generate IDs
          </button>
        </div>
      </div>
    </div>
  );
}
