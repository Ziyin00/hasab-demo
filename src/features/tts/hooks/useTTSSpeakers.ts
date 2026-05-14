"use client";

import { useEffect } from "react";
import { useTTSStore } from "@/store/tts.store";
import { ttsApi } from "../api/tts.api";

const FALLBACK_SPEAKERS: Record<string, string[]> = {
  am: ["Selam", "Aster", "Hanna", "Yared", "Haile", "Tigist"],
  om: ["Lemlem"],
};

export const useTTSSpeakers = () => {
  const { speakersData, setSpeakersData, language, speakerName, setSpeakerName } =
    useTTSStore();

  useEffect(() => {
    if (speakersData) return;
    ttsApi
      .getSpeakers()
      .then((data) => {
        setSpeakersData(data);
      })
      .catch(console.error);
  }, []);

  // When language changes, reset speaker to first available for that language
  useEffect(() => {
    const speakersForLang = speakersData
      ? (speakersData.languages[language] ?? FALLBACK_SPEAKERS[language] ?? [])
      : (FALLBACK_SPEAKERS[language] ?? []);
    if (!speakerName || !speakersForLang.includes(speakerName)) {
      setSpeakerName(speakersForLang[0] ?? "");
    }
  }, [language, speakersData]);

  const availableLanguages = speakersData
    ? Object.keys(speakersData.languages)
    : Object.keys(FALLBACK_SPEAKERS);

  const availableSpeakers = speakersData
    ? (speakersData.languages[language] ?? FALLBACK_SPEAKERS[language] ?? [])
    : (FALLBACK_SPEAKERS[language] ?? []);

  return { speakersData, availableLanguages, availableSpeakers };
};
