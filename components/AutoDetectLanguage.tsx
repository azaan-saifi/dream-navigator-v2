// components/AutoDetectLanguage.tsx
import React from "react";

interface AutoDetectLanguageProps {
  text: string;
  className?: string;
}

const AutoDetectLanguage: React.FC<AutoDetectLanguageProps> = ({
  text,
  className = "",
}) => {
  // Regex pattern to match Arabic characters
  const arabicPattern =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g;

  // Split text and preserve Arabic sections
  const parts = [];
  let lastIndex = 0;

  for (const match of text.matchAll(arabicPattern)) {
    // Add non-Arabic text before the match
    if (match.index! > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, match.index),
        isArabic: false,
      });
    }

    // Add the Arabic text
    parts.push({
      text: match[0],
      isArabic: true,
    });

    lastIndex = match.index! + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      isArabic: false,
    });
  }

  return (
    <span className={className}>
      {parts.map((part, index) => (
        <span
          key={index}
          lang={part.isArabic ? "ar" : "en"}
          className={
            part.isArabic
              ? "font-uthmaniScript text-[22px]"
              : "font-rubikRegular"
          }
        >
          {part.text}
        </span>
      ))}
    </span>
  );
};

export default AutoDetectLanguage;
