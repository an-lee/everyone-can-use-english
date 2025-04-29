import {
  IPA_CONSONANTS,
  IPA_MAPPINGS,
  IPA_VOWELS,
} from "@shared/constants/ipa";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "./dayjs";
import i18next, { t } from "i18next";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function secondsToTimestamp(
  seconds: number,
  options?: {
    includeMs?: boolean;
  }
) {
  const { includeMs = false } = options || {};
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const milliseconds = includeMs ? Math.floor((seconds % 1) * 1000) : 0;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toFixed(0)
    .padStart(
      2,
      "0"
    )}${includeMs ? `.${milliseconds.toString().padStart(3, "0")}` : ""}`;
}

export const convertWordIpaToNormal = (
  ipas: string[],
  options?: { mappings?: any }
): string[] => {
  const { mappings = IPA_MAPPINGS } = options || {};
  const consonants = Object.keys(IPA_CONSONANTS)
    .map((key) => IPA_CONSONANTS[key])
    .reduce((acc, val) => acc.concat(val), []);
  const consonantsRegex = new RegExp(`^(\ˈ|ˌ)?` + consonants.join("|"));
  const vowels = Object.keys(IPA_VOWELS)
    .map((key) => IPA_VOWELS[key])
    .reduce((acc, val) => acc.concat(val), []);
  const vowelsRegex = new RegExp(`^(\ˈ|ˌ)?` + vowels.join("|"));

  const converted: string[] = [];

  // convert each ipa to normal
  // if ipa is a vowel and marked, check if the previous ipa is a consonant,
  // if so, mark the consonant instead
  for (let i = 0; i < ipas.length; i++) {
    const ipa = ipas[i];
    converted.push(convertIpaToNormal(ipa, { mappings, marked: false }));

    const isVowel = vowelsRegex.test(ipa);
    const mark = ipa.match(/(\ˈ|ˌ)/);

    let j = i - 1;
    for (; j > 0 && j > i - 2; j--) {
      if (
        consonantsRegex.test(converted[j]) &&
        !IPA_CONSONANTS.trill.includes(converted[j]) &&
        !IPA_CONSONANTS.approximant.includes(converted[j]) &&
        !IPA_CONSONANTS.lateralApproximant.includes(converted[j])
      )
        break;
      if (
        consonantsRegex.test(converted[j]) &&
        !consonantsRegex.test(converted[j - 1])
      ) {
        break;
      }
    }

    if (isVowel && mark) {
      if (converted[j] && consonantsRegex.test(converted[j])) {
        converted[j] = mark[0] + converted[j];
      } else {
        converted[i] = mark[0] + converted[i];
      }
    }
  }

  return converted;
};

export const convertIpaToNormal = (
  ipa: string,
  options?: { mappings?: any; marked?: boolean }
): string => {
  const { mappings = IPA_MAPPINGS, marked = false } = options || {};

  const mark = ipa.match(/(\ˈ|ˌ)/);
  const cleanIpa = ipa.replace(mark ? mark[0] : "", "");

  const converted = mappings[cleanIpa] || cleanIpa;
  if (mark && marked) {
    return `${mark[0]}${converted}`;
  } else {
    return converted;
  }
};

export function formatDateTime(date: Date | string) {
  dayjs.locale(i18next.resolvedLanguage?.toLowerCase() || "en");
  const now = dayjs();
  const then = dayjs(date);

  if (now.diff(then, "hour") === 0) {
    return then.fromNow();
  } else if (now.isSame(then, "day")) {
    return then.format("HH:mm");
  } else if (now.diff(then, "year") === 0) {
    return then.format("MM/DD HH:mm");
  } else {
    return then.format("YYYY/MM/DD HH:mm");
  }
}

export function formatDate(date: string | Date) {
  dayjs.locale(i18next.resolvedLanguage?.toLowerCase() || "en");
  const now = dayjs();
  const then = dayjs(date);

  if (now.diff(then, "day") === 0) {
    return t("today", { ns: "common" });
  } else if (now.diff(then, "day") === 1) {
    return t("yesterday", { ns: "common" });
  } else {
    return then.fromNow();
  }
}
