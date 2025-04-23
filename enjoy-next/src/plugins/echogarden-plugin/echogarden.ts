import {
  log,
  align,
  recognize,
  setGlobalOption,
  type AlignmentOptions,
  type RecognitionOptions,
  ffmpegPath,
  path,
} from "./plugin-deps";

const __dirname = import.meta.dirname.replace("app.asar", "app.asar.unpacked");

export class EchoGarden {
  private logger = log.scope("echogarden-plugin");
  public recognize: typeof recognize;
  public align: typeof align;

  constructor() {
    setGlobalOption(
      "ffmpegPath",
      ffmpegPath!.replace("app.asar", "app.asar.unpacked")
    );
    setGlobalOption(
      "packageBaseURL",
      "https://hf-mirror.com/echogarden/echogarden-packages/resolve/main/"
    );

    this.recognize = (input: any, options: RecognitionOptions) => {
      if (!options) {
        throw new Error("No config options provided");
      }
      this.logger.debug("recognize", { input, options });

      return new Promise((resolve, reject) => {
        const handler = (reason: any) => {
          // Remove the handler after it's triggered
          process.removeListener("unhandledRejection", handler);
          reject(reason);
        };

        if (process.platform === "darwin") {
          options.whisperCpp = options.whisperCpp || {};
          options.whisperCpp.executablePath = path.join(
            __dirname,
            "lib",
            "whisper",
            "main"
          );
        }
        recognize(input, options)
          .then((result) => {
            // Remove the handler if successful
            process.removeListener("unhandledRejection", handler);
            resolve(result);
          })
          .catch(reject);
      });
    };

    this.align = (
      input: any,
      transcript: string,
      options: AlignmentOptions
    ) => {
      if (!options) {
        throw new Error("No config options provided");
      }
      this.logger.debug("align", { input, transcript, options });

      return new Promise((resolve, reject) => {
        align(input, transcript, options).then(resolve).catch(reject);
      });
    };
  }
}

const echogarden = new EchoGarden();

export const commands = [
  {
    name: "recognize",
    function: (url: string, options: RecognitionOptions) =>
      echogarden.recognize(url, options),
  },
  {
    name: "align",
    function: (input: any, transcript: string, options: AlignmentOptions) =>
      echogarden.align(input, transcript, options),
  },
];
