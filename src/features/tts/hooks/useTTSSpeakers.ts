"use client";

import { useEffect } from "react";
import { useTTSStore } from "@/store/tts.store";
import { ttsApi } from "../api/tts.api";

export const useTTSSpeakers = () => {
  const { speakersData, setSpeakersData, language, speakerName, setSpeakerName } = useTTSStore();

  useEffect(() => {
    if (speakersData) return;
    ttsApi
      .getSpeakers()
      .then((data) => {
        setSpeakersData(data);
        if (!speakerName) {
          const firstLang = Object.keys(data.languages)[0];
          const firstSpeaker = firstLang ? data.languages[firstLang]?.[0] : undefined;
          if (firstSpeaker) setSpeakerName(firstSpeaker);
        }
      })
      .catch(console.error);
  }, []);

  const availableLanguages = speakersData ? Object.keys(speakersData.languages) : [];
  const availableSpeakers = speakersData?.languages[language] ?? [];

  return { speakersData, availableLanguages, availableSpeakers };
};
