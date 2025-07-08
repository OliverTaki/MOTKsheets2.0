export function genId(prefix = "sh", len = 10) {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let id = "";
  crypto.getRandomValues(new Uint8Array(len)).forEach((v) => {
    id += chars[v % chars.length];
  });
  return `${prefix}_${id}`;
}

export function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export const toProjectName = (file) => {
  const m = file.name.match(/^MOTK\[Project:([^\]]+)\]/i);
  return m ? m[1].trim() : file.name;
};