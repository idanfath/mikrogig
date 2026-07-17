export default function asset(path: string) {
  return `${import.meta.env.VITE_ASSETS_URL}/${path}`;
}
