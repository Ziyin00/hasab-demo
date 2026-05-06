"use client";

import Link from "next/link";
import { Mic, Video, Users, FileText, Clock, Languages, Volume2, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "../hooks/useAnalytics";
import { useAuthStore } from "@/store/auth.store";

function fmt(n: number, decimals = 0) {
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border bg-card px-5 py-4 flex items-start gap-4">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${accent ?? "bg-primary/10"}`}>
        <Icon className={`h-4 w-4 ${accent ? "text-white" : "text-primary"}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-xl font-semibold tabular-nums mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${color}`} />
      <span className="text-sm flex-1">{label}</span>
      <span className="text-sm font-medium tabular-nums">{fmt(value, 1)} min</span>
      <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
    </div>
  );
}

export function OverviewPage() {
  const { data, isLoading } = useAnalytics();
  const user = useAuthStore((s) => s.user);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
      </div>

      {/* Top section: big card + stat grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Total minutes — big card */}
        <div className="lg:col-span-2 rounded-xl border bg-card px-6 py-6 flex flex-col justify-between min-h-[160px]">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Minutes Processed
            </p>
            {isLoading ? (
              <Skeleton className="h-12 w-36 mt-3" />
            ) : (
              <p className="text-5xl font-bold tabular-nums mt-3">
                {fmt(data?.total_minutes ?? 0, 1)}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2">minutes across all services</p>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Last updated{" "}
              {data?.last_updated
                ? new Date(data.last_updated).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "—"}
            </span>
          </div>
        </div>

        {/* 4 stat cards */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : (
            <>
              <StatCard
                icon={Mic}
                label="Audio Minutes"
                value={fmt(data?.audio_minutes ?? 0, 1)}
                sub="transcription"
              />
              <StatCard
                icon={Video}
                label="Video Minutes"
                value={fmt(data?.video_minutes ?? 0, 1)}
                sub="video processing"
              />
              <StatCard
                icon={Users}
                label="Meeting Minutes"
                value={fmt(data?.meeting_minutes ?? 0, 1)}
                sub="meeting analysis"
              />
              <StatCard
                icon={FileText}
                label="Words Processed"
                value={fmt(data?.words_processed.total ?? 0)}
                sub="translation & summary"
              />
            </>
          )}
        </div>
      </div>

      {/* Action items */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
        <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${user?.organization ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {[
            {
              href: "/dashboard/playground/transcription",
              icon: Mic,
              title: "Transcription",
              desc: "Convert audio & video to text with speaker diarization",
              color: "bg-blue-500/10 text-blue-500",
            },
            {
              href: "/dashboard/playground/translation",
              icon: Languages,
              title: "Translation",
              desc: "Translate documents and text between languages",
              color: "bg-violet-500/10 text-violet-500",
            },
            {
              href: "/dashboard/playground/tts",
              icon: Volume2,
              title: "Text to Speech",
              desc: "Generate natural-sounding speech from text",
              color: "bg-amber-500/10 text-amber-500",
            },
            ...(user?.organization
              ? [
                  {
                    href: "/dashboard/playground/meeting-minutes",
                    icon: Users,
                    title: "Meeting Minutes",
                    desc: "Summarize meetings and extract action items",
                    color: "bg-emerald-500/10 text-emerald-500",
                  },
                ]
              : []),
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border bg-card px-5 py-5 flex flex-col gap-4 hover:border-primary/40 hover:bg-muted/30 transition-colors"
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                Open
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom section: breakdown + videos */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Minutes breakdown */}
        <div className="lg:col-span-3 rounded-xl border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-sm font-semibold">Minutes Breakdown</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Distribution across service types
            </p>
          </div>
          <div className="px-6 py-2">
            {isLoading ? (
              <div className="space-y-3 py-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <>
                <BreakdownRow
                  label="Audio (Transcription)"
                  value={data?.audio_minutes ?? 0}
                  total={data?.total_minutes ?? 1}
                  color="bg-blue-500"
                />
                <BreakdownRow
                  label="Video Processing"
                  value={data?.video_minutes ?? 0}
                  total={data?.total_minutes ?? 1}
                  color="bg-violet-500"
                />
                <BreakdownRow
                  label="Meeting Analysis"
                  value={data?.meeting_minutes ?? 0}
                  total={data?.total_minutes ?? 1}
                  color="bg-emerald-500"
                />
              </>
            )}
          </div>
        </div>

        {/* Right column: videos processed + words breakdown */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="rounded-xl border bg-card px-6 py-5 flex items-center gap-4 flex-1">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <Video className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Videos Processed</p>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-1" />
              ) : (
                <p className="text-3xl font-bold tabular-nums">
                  {fmt(data?.videos_processed ?? 0)}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card px-6 py-5 flex-1">
            <p className="text-xs text-muted-foreground mb-3">Words Breakdown</p>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-sm">Translation</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {fmt(data?.words_processed.breakdown.translation ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-sm">Summary</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {fmt(data?.words_processed.breakdown.summary ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="text-sm font-bold tabular-nums">
                    {fmt(data?.words_processed.total ?? 0)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
