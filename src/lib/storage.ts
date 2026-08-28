import fs from "fs";
import path from "path";

export function getStorageDir(): string {
  const possibleDirs = [
    path.join("/data", "results"),
    "/data",
    path.join(process.cwd(), "public", "results"),
    path.join("/tmp", "results"),
  ];

  for (const dir of possibleDirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Test write permission
      const testFile = path.join(dir, ".write-test");
      fs.writeFileSync(testFile, "ok");
      fs.unlinkSync(testFile);
      return dir;
    } catch {
      continue;
    }
  }

  return path.join(process.cwd(), "public", "results");
}

export function getAllStorageDirs(): string[] {
  return [
    path.join("/data", "results"),
    "/data",
    path.join(process.cwd(), "public", "results"),
    path.join("/tmp", "results"),
  ].filter((d) => fs.existsSync(d));
}
