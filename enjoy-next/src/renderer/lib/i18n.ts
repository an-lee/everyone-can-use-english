// In src/renderer/i18n.ts
import * as i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend"; // Need to add this dependency

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: "/locales/{{ns}}/{{lng}}.json",
      addPath: "/locales/{{ns}}/{{lng}}.missing.json",
    },
    ns: ["common", "components"], // Default namespaces
    defaultNS: "common",
    lng: "zh-CN",
    fallbackLng: "zh-CN",
    supportedLngs: ["en", "zh-CN"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
    },
  });

export default i18n;
