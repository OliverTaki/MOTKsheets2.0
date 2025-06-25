/**
 * toBool
 * Google Sheets から取得した値を大小無視・空白無視で真偽判定。
 *   'TRUE'  'true'  ' True ' → true
 *   それ以外                    → false
 */
export const toBool = (v) =>
  String(v).trim().toLowerCase() === 'true';
