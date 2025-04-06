import { useTranslation } from "react-i18next";
import { useState } from "react";
import { cn } from "@renderer/lib/utils";
import {
  PaletteIcon,
  UserIcon,
  ShieldIcon,
  BellIcon,
  SaudiRiyal,
} from "lucide-react";
import { AppearanceSettings } from "./appearance-settings";
import { Separator } from "@renderer/components/ui/separator";
import { ScrollArea } from "../ui/scroll-area";

type SettingsTab = "appearance" | "account" | "security" | "notifications";

interface SettingsNavItemProps {
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
  onClick: () => void;
}

const SettingsNavItem = ({
  icon,
  title,
  isActive,
  onClick,
}: SettingsNavItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-2 py-2 text-sm font-medium rounded-md w-full transition-colors",
      isActive
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}
  >
    {icon}
    <span>{title}</span>
  </button>
);

export function Settings() {
  const { t } = useTranslation("components/settings");
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");

  return (
    <div className="grid grid-cols-5 overflow-hidden h-full">
      {/* Sidebar */}
      <ScrollArea className="h-full col-span-1 bg-muted/50 p-4">
        <div className="space-y-1 sticky top-0">
          <SettingsNavItem
            icon={<PaletteIcon className="h-4 w-4" />}
            title={t("appearance")}
            isActive={activeTab === "appearance"}
            onClick={() => setActiveTab("appearance")}
          />
          <SettingsNavItem
            icon={<UserIcon className="h-4 w-4" />}
            title={t("account")}
            isActive={activeTab === "account"}
            onClick={() => setActiveTab("account")}
          />
          <SettingsNavItem
            icon={<ShieldIcon className="h-4 w-4" />}
            title={t("security")}
            isActive={activeTab === "security"}
            onClick={() => setActiveTab("security")}
          />
          <SettingsNavItem
            icon={<BellIcon className="h-4 w-4" />}
            title={t("notifications")}
            isActive={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
          />
        </div>
      </ScrollArea>

      {/* Content */}
      <ScrollArea className="h-full col-span-4 py-6 px-10">
        {activeTab === "appearance" && <AppearanceSettings />}

        {activeTab === "account" && (
          <div className="text-center text-muted-foreground py-12">
            {t("accountSettingsComing")}
          </div>
        )}

        {activeTab === "security" && (
          <div className="text-center text-muted-foreground py-12">
            {t("securitySettingsComing")}
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="text-center text-muted-foreground py-12">
            {t("notificationSettingsComing")}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
