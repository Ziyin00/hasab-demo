"use client";

import { Loader2 } from "lucide-react";
import { useTranscriptionWorkspace } from "../hooks/useTranscriptionWorkspace";
import { TranscriptionFloatingPlayer } from "./workspace/TranscriptionFloatingPlayer";
import { TranscriptionWorkspaceContentTabs } from "./workspace/TranscriptionWorkspaceContentTabs";
import { TranscriptionWorkspaceToolbar } from "./workspace/TranscriptionWorkspaceToolbar";

export function TranscriptionWorkspace({ audioId }: { audioId: string }) {
  const {
    query,
    result,
    audioId: id,
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
    copied,
    copyOpen,
    setCopyOpen,
    downloadOpen,
    setDownloadOpen,
    optionsOpen,
    setOptionsOpen,
    setEditedById,

    blocks,
    speakerOrder,
    displayText,
    activeRowId,
    currentTime,

    navigateBackToList,
    copyText,
    downloadTxt,
    downloadSrt,
    downloadPdf,
    seekAndPlay,
    setCurrentTime,
  } = useTranscriptionWorkspace(audioId);

  if (query.isLoading) {
    return (
      <div className="flex min-h-[45vh] w-full flex-1 items-center justify-center px-4 text-muted-foreground sm:min-h-[55vh]">
        <Loader2 className="mr-2 size-5 shrink-0 animate-spin" />
        Loading transcript...
      </div>
    );
  }

  if (query.isError || !result) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Unable to load transcription result for this recording.
        </div>
      </div>
    );
  }

  return (
    <div className="relative -mt-7 flex h-[calc(100dvh-11rem)] min-h-0 w-full flex-1 flex-col overflow-hidden sm:h-[calc(100dvh-10.5rem)] md:h-[calc(100dvh-10rem)]">
      <TranscriptionWorkspaceToolbar
        audioId={id}
        filename={result.originalFilename}
        onBack={navigateBackToList}
        isEditing={isEditing}
        onIsEditingChange={setIsEditing}
        copyRef={copyRef}
        copied={copied}
        copyOpen={copyOpen}
        onCopyToggle={() => setCopyOpen((p) => !p)}
        onCopyTextOnly={() => void copyText(false)}
        onCopyWithTimestamps={() => void copyText(true)}
        downloadRef={downloadRef}
        downloadOpen={downloadOpen}
        onDownloadToggle={() => setDownloadOpen((p) => !p)}
        onDownloadTxt={downloadTxt}
        onDownloadSrt={downloadSrt}
        onDownloadPdf={downloadPdf}
        optionsRef={optionsRef}
        optionsOpen={optionsOpen}
        onOptionsToggle={() => setOptionsOpen((p) => !p)}
        groupMode={groupMode}
        onGroupModeChange={setGroupMode}
        timeLimit={timeLimit}
        onTimeLimitChange={setTimeLimit}
        charLimit={charLimit}
        onCharLimitChange={setCharLimit}
        showSpeakers={showSpeakers}
        onShowSpeakersChange={setShowSpeakers}
      />

      <div
        ref={transcriptScrollRef}
        className="min-h-0 flex-1 scroll-smooth overflow-y-auto px-3 -mt-3 pt-0 pb-[calc(10.75rem+env(safe-area-inset-bottom,0px))] sm:pt-0 sm:pb-[calc(10.5rem+env(safe-area-inset-bottom,0px))] md:px-4 md:pt-0 md:pb-[calc(11rem+env(safe-area-inset-bottom,0px))] lg:px-6 lg:pb-[calc(10rem+env(safe-area-inset-bottom,0px))]"
      >
        <div className="mx-auto w-full max-w-[min(100%,64rem)] xl:max-w-6xl">
          <TranscriptionWorkspaceContentTabs
            result={result}
            blocks={blocks}
            speakerOrder={speakerOrder}
            showSpeakers={showSpeakers}
            isEditing={isEditing}
            activeRowId={activeRowId}
            currentTime={currentTime}
            displayText={displayText}
            rowRefs={rowRefs}
            setEditedById={setEditedById}
            seekAndPlay={seekAndPlay}
          />
        </div>
      </div>

      <TranscriptionFloatingPlayer src={playbackSrc || ""} audioRef={audioRef} onTimeUpdate={setCurrentTime} />
    </div>
  );
}
