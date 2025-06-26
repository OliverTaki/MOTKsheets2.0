import { generateId } from './idGenerator';

/**
 * ショットのリストをチェックし、IDが欠落しているものに新しいIDを割り当てます。
 * @param {Array<Object>} shots - ショットオブジェクトの配列
 * @returns {{shotsWithIds: Array<Object>, missingIdsFound: Array<{index: number, newId: string}>, updated: boolean}}
 */
export function missingIdHandler(shots) {
    // 元の配列を直接変更しないようにコピーを作成
    const shotsWithIds = shots.map(shot => ({...shot}));
    const missingIdsFound = [];
    let updated = false;

    shotsWithIds.forEach((shot, index) => {
        // shot.idが存在しない、または空文字列の場合
        if (!shot.id || String(shot.id).trim() === '') {
            const newId = generateId(shot, index);
            shot.id = newId;
            // どの行に新しいIDが振られたかを記録
            missingIdsFound.push({ index: index, newId: newId });
            updated = true;
        }
    });

    return { shotsWithIds, missingIdsFound, updated };
}
