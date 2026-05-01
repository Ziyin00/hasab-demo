"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { queryKeys } from "@/lib/react-query/queryKeys";
import { useTranscriptionStore } from "@/store/transcription.store";
import { transcriptionApi } from "../api/transcription.api";
import type {
  NormalizedTranscriptionPayload,
  TranscriptGroupMode,
  TranscriptSpeakerBlock,
} from "../types/transcription.types";
import { buildSrtContent, saveTranscriptPdf, triggerFileDownload } from "../utils/exportTranscript";
import { formatSeconds } from "../utils/transcriptTimeFormat";
import {
  buildSpeakerOrderMap,
  groupSegmentsIntoSpeakerBlocks,
  groupSegmentsWithinSpeakerTurns,
  normalizeSegmentsForDiarization,
  speakerBlockTitle,
} from "../utils/transcriptGrouping";

export function useTranscriptionWorkspace(audioId: string) {
  const router = useRouter();
  const [showSpeakers, setShowSpeakers] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [groupMode, setGroupMode] = useState<TranscriptGroupMode>("time");
  const [timeLimit, setTimeLimit] = useState(11);
  const [charLimit, setCharLimit] = useState(220);
  const [currentTime, setCurrentTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [editedById, setEditedById] = useState<Record<string, string>>({});
  const copyRef = useRef<HTMLDivElement | null>(null);
  const downloadRef = useRef<HTMLDivElement | null>(null);
  const optionsRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastAutoScrolledIdRef = useRef<string | null>(null);

  const { lastResult, audioUrl: storeAudioUrl, audioId: storeAudioId } = useTranscriptionStore();
  const initialData =
    storeAudioId && String(storeAudioId) === audioId && lastResult ? lastResult : undefined;

  const query = useQuery<NormalizedTranscriptionPayload | null>({
    queryKey: queryKeys.transcription.detail(audioId),
    queryFn: () => transcriptionApi.getAudioById(audioId),
    initialData,
    staleTime: 20_000,
  });

  const result = query.data;
  const playbackSrc =
    result?.audioUrl || (storeAudioId && String(storeAudioId) === audioId ? storeAudioUrl : null);

  const groupedRows = useMemo<TranscriptSpeakerBlock[]>(() => {
    const words = result?.timestampPayload;
    if (!Array.isArray(words) || words.length === 0) return [];
    const rawSegments = words.map((word, index) => ({
      id: `seg-${index}-${Number(word.start ?? word.start_time ?? 0)}`,
      text: String(word.content ?? word.text ?? "").trim(),
      content: String(word.content ?? word.text ?? "").trim(),
      start: Number(word.start ?? word.start_time ?? 0),
      end: Number(word.end ?? word.end_time ?? word.start ?? word.start_time ?? 0),
      speaker: word.speaker,
    }));
    const normalized = normalizeSegmentsForDiarization(rawSegments);
    const grouped = groupSegmentsWithinSpeakerTurns(normalized, groupMode, charLimit, timeLimit);
    return groupSegmentsIntoSpeakerBlocks(grouped);
  }, [result?.timestampPayload, groupMode, charLimit, timeLimit]);

  const blocks = useMemo<TranscriptSpeakerBlock[]>(() => {
    return groupedRows.map((block) => ({
      ...block,
      rows: block.rows.map((row) => ({
        ...row,
        text: editedById[row.id] ?? row.text,
      })),
    }));
  }, [groupedRows, editedById]);

  const flatRows = useMemo(() => blocks.flatMap((b) => b.rows), [blocks]);
  const speakerOrder = useMemo(() => buildSpeakerOrderMap(blocks), [blocks]);

  const displayText = useMemo(() => {
    if (flatRows.length > 0) return "";
    return result?.transcriptionText?.trim() || "";
  }, [result?.transcriptionText, flatRows.length]);

  const exportFilenameBase = useMemo(() => {
    const raw = (result?.originalFilename || "transcript").replace(/\.[^.]+$/, "");
    const safe = raw.replace(/[/\\?%*:|"<>]/g, "-").trim();
    return safe || "transcript";
  }, [result?.originalFilename]);

  const activeRowId = useMemo(() => {
    const active = flatRows.find((r) => currentTime >= r.startSeconds && currentTime < r.endSeconds);
    return active?.id ?? null;
  }, [flatRows, currentTime]);

  useEffect(() => {
    if (!activeRowId) return;
    if (lastAutoScrolledIdRef.current === activeRowId) return;
    const target = rowRefs.current[activeRowId];
    const container = transcriptScrollRef.current;
    if (!target || !container) return;

    const targetTop = target.offsetTop;
    const targetBottom = targetTop + target.offsetHeight;
    const viewTop = container.scrollTop;
    const upperComfort = viewTop + container.clientHeight * 0.22;
    const lowerComfort = viewTop + container.clientHeight * 0.78;

    let nextTop: number | null = null;
    if (targetTop < upperComfort) {
      nextTop = Math.max(0, targetTop - container.clientHeight * 0.1);
    } else if (targetBottom > lowerComfort) {
      nextTop = Math.max(0, targetTop - container.clientHeight * 0.4);
    }

    if (nextTop !== null) {
      container.scrollTo({
        top: nextTop,
        behavior: "smooth",
      });
    }
    lastAutoScrolledIdRef.current = activeRowId;
  }, [activeRowId]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (copyRef.current && !copyRef.current.contains(target)) setCopyOpen(false);
      if (downloadRef.current && !downloadRef.current.contains(target)) setDownloadOpen(false);
      if (optionsRef.current && !optionsRef.current.contains(target)) setOptionsOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const copyText = async (withTime: boolean) => {
    const text = flatRows.length
      ? flatRows
          .map((r) =>
            withTime
              ? `[${formatSeconds(r.startSeconds)}-${formatSeconds(r.endSeconds)}] ${r.text}`
              : r.text
          )
          .join("\n\n")
      : displayText;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setCopyOpen(false);
    setTimeout(() => setCopied(false), 1500);
  };

  const buildExportDocumentBody = () => {
    if (flatRows.length === 0) return displayText.trim();
    return flatRows
      .map((r) => {
        let line = "";
        if (r.speaker && r.speaker !== "__none__") {
          const label = speakerBlockTitle(r.speaker, speakerOrder);
          if (label) line += `${label}: `;
        }
        line += `[${formatSeconds(r.startSeconds)}-${formatSeconds(r.endSeconds)}] ${r.text}`;
        return line;
      })
      .join("\n\n");
  };

  const downloadTxt = () => {
    const body = buildExportDocumentBody();
    if (!body) return;
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    triggerFileDownload(blob, `${exportFilenameBase}.txt`);
    setDownloadOpen(false);
  };

  const downloadSrt = () => {
    const segments = flatRows.map((r) => ({
      startSeconds: r.startSeconds,
      endSeconds: r.endSeconds,
      text: r.text,
    }));
    const srt = buildSrtContent(segments, displayText);
    if (!srt.trim()) return;
    const blob = new Blob([srt], { type: "text/plain;charset=utf-8" });
    triggerFileDownload(blob, `${exportFilenameBase}.srt`);
    setDownloadOpen(false);
  };

  const downloadPdf = () => {
    const body = buildExportDocumentBody();
    if (!body) return;
    const title =
      result?.originalFilename?.replace(/\.[^.]+$/, "").trim() ||
      exportFilenameBase.replace(/[-_]+/g, " ").trim() ||
      "Transcript";
    void saveTranscriptPdf(title, body, exportFilenameBase).finally(() => setDownloadOpen(false));
  };

  const seekAndPlay = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
    audioRef.current.play().catch(() => undefined);
  };

  const navigateBackToList = () => router.push("/dashboard/playground/transcription");

  return {
    router,
    query,
    result,
    audioId,
    playbackSrc,

    transcriptScrollRef,
    rowRefs,
    audioRef,
    copyRef,
    downloadRef,
    optionsRef,

    showSpeakers,
    setShowSpeakers,
    isEditing,
    setIsEditing,
    groupMode,
    setGroupMode,
    timeLimit,
    setTimeLimit,
    charLimit,
    setCharLimit,
    currentTime,
    setCurrentTime,
    copied,
    copyOpen,
    setCopyOpen,
    downloadOpen,
    setDownloadOpen,
    optionsOpen,
    setOptionsOpen,
    editedById,
    setEditedById,

    blocks,
    speakerOrder,
    flatRows,
    displayText,
    exportFilenameBase,
    activeRowId,

    navigateBackToList,
    copyText,
    downloadTxt,
    downloadSrt,
    downloadPdf,
    seekAndPlay,
  };
}
