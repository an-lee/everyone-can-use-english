import path from "path";
import { appConfig } from "@main/core";
import fs from "fs-extra";
import crypto from "crypto";

/*
 * Convert enjoy url to file path
 *
 * @param {string} enjoyUrl - enjoy url
 * @returns {string} file path
 */
export function enjoyUrlToPath(enjoyUrl: string): string {
  let filePath = enjoyUrl;

  if (
    enjoyUrl.match(
      /enjoy:\/\/library\/(audios|videos|recordings|speeches|segments)/g
    )
  ) {
    filePath = path.posix.join(
      appConfig.userDataPath()!,
      enjoyUrl.replace("enjoy://library/", "")
    );
  } else if (enjoyUrl.startsWith("enjoy://library/")) {
    filePath = path.posix.join(
      appConfig.libraryPath(),
      filePath.replace("enjoy://library/", "")
    );
  }

  return filePath;
}

/*
 * Convert file path to enjoy url
 *
 * @param {string} filePath - file path
 * @returns {string} enjoy url
 */
export function pathToEnjoyUrl(filePath: string): string {
  let enjoyUrl = filePath;

  if (filePath.startsWith(appConfig.userDataPath()!)) {
    enjoyUrl = `enjoy://library/${filePath
      .replace(appConfig.userDataPath()!, "")
      .replace(/^\//, "")}`;
  } else if (filePath.startsWith(appConfig.libraryPath()!)) {
    enjoyUrl = `enjoy://library/${filePath
      .replace(appConfig.libraryPath()!, "")
      .replace(/^\//, "")}`;
  }

  return enjoyUrl;
}

export async function hashFile(
  filePath: string,
  options?: {
    algo?: string;
  }
): Promise<string> {
  const { algo = "md5" } = options || {};
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algo);
    const stream = fs.createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}
