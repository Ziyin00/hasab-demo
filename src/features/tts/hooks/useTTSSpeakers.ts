"use client";

import { useEffect } from "react";
import { useTTSStore } from "@/store/tts.store";
import { ttsApi } from "../api/tts.api";

export const useTTSSpeakers = () => {
  const { speakersData, setSpeakersData, language, speakerName, setSpeakerName } = useTTSStore();

  useEffect(() => {
    ttsApi
      .getSpeakers()
      .then((data) => {
        setSpeakersData(data);
        const all = [...new Set(Object.values(data.languages).flat())] as string[];
        if (!speakerName || !all.includes(speakerName)) {
          setSpeakerName(all[0] ?? "");
        }
      })
      .catch(console.error);
  }, []);

  const availableLanguages = speakersData ? Object.keys(speakersData.languages) : [];
  const availableSpeakers = speakersData
    ? [...new Set(Object.values(speakersData.languages).flat())]
    : [];

  return { speakersData, availableLanguages, availableSpeakers };
};
