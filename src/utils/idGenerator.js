export const PREFIX = {
  shot: 'sh',
  field: 'fd',
  page: 'pg',
  projectMember: 'pm',
  task: 'tk',
  project: 'pr',
  file: 'fl',
  version: 'vr',
};

/**
 * 軽量で衝突しにくい ID を生成する。
 * 形式: <prefix>_<timeBase36><rand4>
 *   ‑ prefix: エンティティ 2 文字コード
 *   ‑ timeBase36: 1970‑epoch ミリ秒を 36 進 (≈8–9 桁)
 *   ‑ rand4: ランダム 36 進 4 桁
 *
 * @param {'shot'|'field'|'page'|'projectMember'|'task'|'project'|'file'|'version'} kind
 * @param {{parentId?: string}} [opts]
 * @returns {string}
 */
export function generateId(kind, opts = {}) {
  if (kind === 'version' && opts.parentId) {
    // version は親 ID にぶら下げる (<parentId>-vXX)。連番管理は呼び出し側で。
    const suffix = Date.now().toString(36).slice(-2);
    return `${opts.parentId}-v${suffix}`;
  }
  const timePart = Date.now().toString(36);
  const randPart = Math.random().toString(36).slice(2, 6); // 4 桁
  return `${PREFIX[kind]}_${timePart}${randPart}`;
}
