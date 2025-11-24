import React from "react";
import { useLanguage } from "../../context/LanguageContext";

const LanguageSelector = () => {
  const { language, setLanguage, supported, labels, t } = useLanguage();
  return (
    <div className="fixed top-2 right-2 z-50 bg-surface-100 dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded px-2 py-1 text-xs flex items-center gap-1 shadow-sm">
      <span className="font-medium">{t("language_label")}:</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-transparent focus:outline-none"
      >
        {supported.map((code) => (
          <option key={code} value={code}>
            {labels[code]}
          </option>
        ))}
      </select>
    </div>
  );
};
export default LanguageSelector;
