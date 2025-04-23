import { log } from "@main/core/utils";
import { BasePlugin } from "@main/plugin/core/base-plugin";
import FluentFfmpeg from "fluent-ffmpeg";
import { extractFrequencies, getFfmpegPath } from "./utils";
import { enjoyUrlToPath } from "@/main/core";
import path from "path";
import fs from "fs";
import { app } from "electron";
import crypto from "crypto";

export {
  log,
  BasePlugin,
  FluentFfmpeg,
  extractFrequencies,
  getFfmpegPath,
  enjoyUrlToPath,
  path,
  fs,
  app,
  crypto,
};
