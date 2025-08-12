export default function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]; // 複製陣列避免改變原始資料
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
