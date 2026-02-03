import { readFile } from "fs/promises";
import * as XLSX from "xlsx";

type SoldierCfgEntry = {
  ID: number;
  Name: string;
  prefab: string;
  loadIcon: string;
  AttackType: number;
  Health: number;
  AttackDamage: number;
  AttackInterval: number;
  AttackRange: number;
  SearchRange: number;
  Speed: number;
  BuildingCross: number;
  Suppressed?: number;
  DeathAni?: number;
  AttackPriority?: number[];
  [key: string]: unknown;
};

type GameJsonRoot = {
  SoldierCfg: Record<string, SoldierCfgEntry>;
  [key: string]: unknown;
};

async function main() {
  const INPUT_FILE = "./GameJsonCfg.en.json";
  const OUTPUT_XLSX = "./SoldierCfg.xlsx";

  const content = await readFile(INPUT_FILE, "utf8");
  const json = JSON.parse(content) as GameJsonRoot;

  if (!json.SoldierCfg) {
    throw new Error("Không tìm thấy SoldierCfg trong GameJsonCfg.json");
  }

  const soldiers = Object.values(json.SoldierCfg);

  const rows = soldiers.map((s) => ({
    ID: s.ID,
    Name: s.Name,
    prefab: s.prefab,
    loadIcon: s.loadIcon,
    AttackType: s.AttackType,
    Health: s.Health,
    AttackDamage: s.AttackDamage,
    AttackInterval: s.AttackInterval,
    AttackRange: s.AttackRange,
    SearchRange: s.SearchRange,
    Speed: s.Speed,
    BuildingCross: s.BuildingCross,
    Suppressed: s.Suppressed ?? "",
    DeathAni: s.DeathAni ?? "",
    AttackPriority1: s.AttackPriority?.[0] ?? "",
    AttackPriority2: s.AttackPriority?.[1] ?? "",
    AttackPriority3: s.AttackPriority?.[2] ?? "",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "SoldierCfg");

  XLSX.writeFile(wb, OUTPUT_XLSX);

  console.log("✅ Đã xuất SoldierCfg ra file", OUTPUT_XLSX);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

