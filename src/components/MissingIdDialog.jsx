import React from 'react';

/**
 * IDが欠落している行が見つかった場合に表示される確認ダイアログ
 */
const MissingIdDialog = ({ isOpen, onConfirm, onCancel, missingCount }) => {
  // isOpenがfalseの場合は何も表示しない
  if (!isOpen) {
    return null;
  }

  return (
    // ダイアログの背景（画面全体を覆うオーバーレイ）
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      {/* ダイアログ本体 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          IDの自動採番の確認
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          IDが設定されていない行が {missingCount} 件見つかりました。
          これらの行に新しいIDを自動的に割り当てて、Googleスプレッドシートを更新しますか？
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            更新を適用
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissingIdDialog;
