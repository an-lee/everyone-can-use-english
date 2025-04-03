import { useSettingsStore } from "@renderer/store";

export function ThemeToggle() {
  const { theme, setTheme } = useSettingsStore();

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  return (
    <button
      className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
      onClick={toggleTheme}
    >
      {theme === "light" && "Light"}
      {theme === "dark" && "Dark"}
      {theme === "system" && "System"}
    </button>
  );
}
