export function genId(prefix = "sh", len = 10) {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let id = "";
  crypto.getRandomValues(new Uint8Array(len)).forEach((v) => {
    id += chars[v % chars.length];
  });
  return `${prefix}_${id}`;
}
