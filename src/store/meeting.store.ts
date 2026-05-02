import { create } from "zustand";

const STORAGE_KEY = "playground.meetingMinutes.v1";

export type MeetingFileMeta = {
  name: string;
  size: string;
  type: string;
  url: string | null;
  s3Url: string | null;
  audioId: string | null;
};

export type MeetingPlaygroundPersisted = {
  language: string;
  activeTab: "summary" | "json";
  responseFetched: boolean;
  rawResponse: unknown;
  summaryText: string;
  successMessage: string | null;
  file: MeetingFileMeta | null;
};

type MeetingState = MeetingPlaygroundPersisted & {
  reset: () => void;
  hydrateFromStorage: () => void;
  setLanguage: (language: string) => void;
  setActiveTab: (tab: "summary" | "json") => void;
  setFromUploadResult: (payload: {
    rawResponse: unknown;
    summaryText: string;
    successMessage: string | null;
    file: MeetingFileMeta;
  }) => void;
  setFilePreview: (file: MeetingFileMeta | null) => void;
  /** Refresh playable URL after signed link expired (uses stored `audioId`). */
  patchFile: (partial: Partial<MeetingFileMeta>) => void;
};

function readStored(): Partial<MeetingPlaygroundPersisted> | null {
  if (typeof window === "undefined") return null;
  try {
    const s = window.localStorage.getItem(STORAGE_KEY);
    if (!s) return null;
    return JSON.parse(s) as Partial<MeetingPlaygroundPersisted>;
  } catch {
    return null;
  }
}

function persistableFile(f: MeetingFileMeta | null): MeetingFileMeta | null {
  if (!f) return null;
  return {
    ...f,
    url: f.url && !f.url.startsWith("blob:") ? f.url : null,
  };
}

function writeStored(partial: MeetingPlaygroundPersisted) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...partial, file: persistableFile(partial.file) })
    );
  } catch {
    /* quota / disabled */
  }
}

function signedUrlMayBeExpired(url: string): boolean {
  if (!url.includes("X-Amz-Expires=") && !url.includes("x-amz-signature")) return false;
  const expMatch = url.match(/X-Amz-Expires=(\d+)/);
  const expiresSeconds = expMatch ? parseInt(expMatch[1], 10) : null;
  if (expiresSeconds !== 300) return false;
  const dateMatch = url.match(/X-Amz-Date=(\d{8}T\d{6})Z/);
  if (!dateMatch) return false;
  const dateStr = dateMatch[1];
  const urlDate = new Date(
    `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T${dateStr.slice(9, 11)}:${dateStr.slice(11, 13)}:${dateStr.slice(13, 15)}Z`
  );
  const elapsed = Math.floor((Date.now() - urlDate.getTime()) / 1000);
  return elapsed > 280;
}

const defaultPersisted: MeetingPlaygroundPersisted = {
  language: "amh",
  activeTab: "summary",
  responseFetched: false,
  rawResponse: null,
  summaryText: "",
  successMessage: null,
  file: null,
};

export const useMeetingStore = create<MeetingState>((set, get) => ({
  ...defaultPersisted,

  hydrateFromStorage: () => {
    const stored = readStored();
    if (!stored) return;
    const next: MeetingPlaygroundPersisted = {
      language: typeof stored.language === "string" ? stored.language : defaultPersisted.language,
      activeTab: stored.activeTab === "json" ? "json" : "summary",
      responseFetched: Boolean(stored.responseFetched),
      rawResponse: stored.rawResponse ?? null,
      summaryText: typeof stored.summaryText === "string" ? stored.summaryText : "",
      successMessage: stored.successMessage ?? null,
      file: stored.file ?? null,
    };
    if (next.file?.url && signedUrlMayBeExpired(next.file.url)) {
      next.file = { ...next.file, url: null };
    }
    set(next);
  },

  reset: () => {
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    set({ ...defaultPersisted });
  },

  setLanguage: (language) => {
    set({ language });
    const s = get();
    writeStored({
      language,
      activeTab: s.activeTab,
      responseFetched: s.responseFetched,
      rawResponse: s.rawResponse,
      summaryText: s.summaryText,
      successMessage: s.successMessage,
      file: s.file,
    });
  },

  setActiveTab: (activeTab) => {
    set({ activeTab });
    const s = get();
    writeStored({
      language: s.language,
      activeTab,
      responseFetched: s.responseFetched,
      rawResponse: s.rawResponse,
      summaryText: s.summaryText,
      successMessage: s.successMessage,
      file: s.file,
    });
  },

  setFilePreview: (file) => {
    set({ file, responseFetched: false, rawResponse: null, summaryText: "", successMessage: null });
    const s = get();
    writeStored({
      language: s.language,
      activeTab: s.activeTab,
      responseFetched: false,
      rawResponse: null,
      summaryText: "",
      successMessage: null,
      file,
    });
  },

  patchFile: (partial) => {
    const prev = get().file;
    if (!prev) return;
    const next = { ...prev, ...partial };
    set({ file: next });
    const s = get();
    writeStored({
      language: s.language,
      activeTab: s.activeTab,
      responseFetched: s.responseFetched,
      rawResponse: s.rawResponse,
      summaryText: s.summaryText,
      successMessage: s.successMessage,
      file: next,
    });
  },

  setFromUploadResult: ({ rawResponse, summaryText, successMessage, file }) => {
    set({
      rawResponse,
      summaryText,
      successMessage,
      file,
      responseFetched: true,
    });
    const s = get();
    writeStored({
      language: s.language,
      activeTab: s.activeTab,
      responseFetched: true,
      rawResponse,
      summaryText,
      successMessage,
      file,
    });
  },
}));
