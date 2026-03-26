"use client";

import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

import styles from "@/components/language-toggle.module.css";

type LanguageToggleProps = {
  locale: Locale;
  dictionary: Dictionary;
  onChange: (locale: Locale) => void;
};

export function LanguageToggle({
  locale,
  dictionary,
  onChange,
}: LanguageToggleProps) {
  return (
    <div className={styles.wrapper} role="group" aria-label="Language">
      <button
        type="button"
        className={locale === "zh-TW" ? styles.active : styles.button}
        onClick={() => onChange("zh-TW")}
      >
        {dictionary.language.traditionalChinese}
      </button>
      <button
        type="button"
        className={locale === "en" ? styles.active : styles.button}
        onClick={() => onChange("en")}
      >
        {dictionary.language.english}
      </button>
    </div>
  );
}
