import fs from "fs";
import path from "path";

export function getStorageDir(): string {
  // Use /data if mounted on Darkube, otherwise fallback to local public/results
  const darkubeDiskPath = "/data";
  const localResultsPath = path.join(process.cwd(), "public", "results");

  let targetDir = localResultsPath;

  try {
    if (fs.existsSync(darkubeDiskPath)) {
      const testDir = path.join(darkubeDiskPath, "results");
      if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
      targetDir = testDir;
    } else {
      if (!fs.existsSync(localResultsPath))
        fs.mkdirSync(localResultsPath, { recursive: true });
    }
  } catch (err) {
    targetDir = localResultsPath;
    if (!fs.existsSync(localResultsPath))
      fs.mkdirSync(localResultsPath, { recursive: true });
  }

  return targetDir;
}
