import translatePkg from "@vitalets/google-translate-api";
import { readFile, writeFile } from "fs/promises";

// Lấy đúng hàm translate từ package (ESM + CJS)
// @ts-ignore
const translate = (translatePkg as any).translate as (
  text: string,
  options: { to: string }
) => Promise<{ text: string }>;

// ===== CONFIG =====
const INPUT_FILE = "./GameJsonCfg.json";
const OUTPUT_FILE = "./GameJsonCfg.en.json";
const CACHE_FILE = "./cache.json";
const TARGET_LANG = "en";

// regex phát hiện tiếng Trung
const chineseRegex = /[\u4E00-\u9FFF]/;

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type Cache = Record<string, string>;

function isChinese(text: string): boolean {
  return chineseRegex.test(text);
}

// đọc JSON an toàn
async function readJson<T>(path: string, defaultValue: T): Promise<T> {
  try {
    const data = await readFile(path, "utf8");
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
}

// ghi JSON
async function writeJson(path: string, data: unknown) {
  await writeFile(path, JSON.stringify(data, null, 2), "utf8");
}

// dịch có cache
async function translateText(text: string, cache: Cache): Promise<string> {
  if (cache[text]) {
    console.log("⚡ Cache:", text);
    return cache[text];
  }

  console.log("🔄 Translating:", text);
  const res = await translate(text, { to: TARGET_LANG });

  cache[text] = res.text;
  await writeJson(CACHE_FILE, cache);

  return res.text;
}

// duyệt JSON đệ quy
async function translateJson(
  data: JsonValue,
  cache: Cache
): Promise<JsonValue> {
  if (typeof data === "string") {
    if (isChinese(data)) {
      return await translateText(data, cache);
    }
    return data;
  }

  if (Array.isArray(data)) {
    const result: JsonValue[] = [];
    for (const item of data) {
      result.push(await translateJson(item, cache));
    }
    return result;
  }

  if (typeof data === "object" && data !== null) {
    const obj: Record<string, JsonValue> = {};
    for (const key in data) {
      obj[key] = await translateJson(data[key], cache);
    }
    return obj;
  }

  return data;
}

// ===== MAIN =====
async function main() {
  const input = await readJson<JsonValue>(INPUT_FILE, {});
  const cache = await readJson<Cache>(CACHE_FILE, {});

  const output = await translateJson(input, cache);

  await writeJson(OUTPUT_FILE, output);

  console.log("✅ DONE");
  console.log("📁 Output:", OUTPUT_FILE);
  console.log("🧠 Cache:", CACHE_FILE);
}

main().catch(console.error);
