"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import Link from "next/link";
import type Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCw,
  AlertTriangle,
  Loader2,
  Tv,
  CheckCircle2,
  ShieldCheck,
  Layers,
  ChevronDown,
} from "lucide-react";
import { validateStreamUrl, type PlayerError } from "@/lib/player/errors";
import { PlayerStatusBadge, type PlaybackBadgeStatus } from "@/components/player/PlayerStatusBadge";
import { cn } from "@/lib/utils";
import type { TamilStream } from "@/lib/tamil/types";

export type PlaybackState =
  | "IDLE"
  | "CONNECTING"
  | "BUFFERING"
  | "PLAYING"
  | "PAUSED"
  | "FAILING_OVER"
  | "ERROR";

interface TamilPlayerProps {
  streams: Array<{
    id: string;
    stream_url: string;
    health_status?: string;
    health_score?: number;
    resolution?: string | null;
    latency_ms?: number | null;
  }>;
  title: string;
  onPlaybackStateChange?: (state: PlaybackState) => void;
}

export const TamilPlayer = memo(function TamilPlayer({
  streams,
  title,
  onPlaybackStateChange,
}: TamilPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const sessionCountRef = useRef(0);
  const streamRetryCountRef = useRef(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const [activeStreamIndex, setActiveStreamIndex] = useState(0);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("CONNECTING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showStreamPicker, setShowStreamPicker] = useState(false);

  const currentStream = streams[activeStreamIndex] || streams[0];

  const updateState = useCallback(
    (nextState: PlaybackState, err?: string | null) => {
      if (!mountedRef.current) return;
      setPlaybackState(nextState);
      if (err !== undefined) setErrorMessage(err);
      onPlaybackStateChange?.(nextState);
    },
    [onPlaybackStateChange]
  );

  const teardown = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (hlsRef.current) {
      try {
        hlsRef.current.stopLoad();
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
      } catch {
        // ignore
      }
      hlsRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      try {
        video.pause();
        video.removeAttribute("src");
        video.load();
      } catch {
        // ignore
      }
    }
  }, []);

  // Automatic Failover Trigger
  const attemptFailover = useCallback(
    (reason: string) => {
      if (!mountedRef.current) return;

      const nextIndex = activeStreamIndex + 1;
      if (nextIndex < streams.length) {
        console.warn(
          `[TamilPlayer] Stream ${activeStreamIndex + 1} failed (${reason}). Failing over to backup stream ${nextIndex + 1}...`
        );
        updateState("FAILING_OVER", "Stream temporarily unavailable. Trying backup verified stream...");
        streamRetryCountRef.current = 0;
        setActiveStreamIndex(nextIndex);
      } else {
        // All streams exhausted
        updateState(
          "ERROR",
          "All verified stream sources are currently unavailable. Please try again later."
        );
      }
    },
    [activeStreamIndex, streams.length, updateState]
  );

  const attemptAutoplay = useCallback(
    (video: HTMLVideoElement, sessionId: number) => {
      if (!mountedRef.current || sessionId !== sessionCountRef.current) return;
      video.muted = true;
      setIsMuted(true);

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (!mountedRef.current || sessionId !== sessionCountRef.current) return;
            setAutoplayBlocked(false);
            setIsPlaying(true);
            updateState("PLAYING", null);
          })
          .catch((err: unknown) => {
            if (!mountedRef.current || sessionId !== sessionCountRef.current) return;
            const isNotAllowed = err instanceof Error && err.name === "NotAllowedError";
            if (isNotAllowed) {
              setAutoplayBlocked(true);
              setIsPlaying(false);
              updateState("PAUSED");
            } else {
              setIsPlaying(false);
              updateState("PAUSED");
            }
          });
      }
    },
    [updateState]
  );

  const initStream = useCallback(
    async (url: string, currentSessionId: number) => {
      const video = videoRef.current;
      if (!video || !mountedRef.current || !url) return;

      const validationErr = validateStreamUrl(url);
      if (validationErr) {
        attemptFailover(validationErr.message);
        return;
      }

      updateState("CONNECTING", null);
      setAutoplayBlocked(false);

      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch {
          // ignore
        }
        hlsRef.current = null;
      }

      let HlsModule: typeof Hls | null = null;
      try {
        const mod = await import("hls.js");
        HlsModule = mod.default;
      } catch {
        // Dynamic import fallback
      }

      if (currentSessionId !== sessionCountRef.current || !mountedRef.current) return;

      const isHls = url.toLowerCase().includes(".m3u8") || !url.includes(".mp4");
      const canUseHlsJs = Boolean(HlsModule && HlsModule.isSupported() && isHls);
      const canUseNativeHls = Boolean(video.canPlayType("application/vnd.apple.mpegurl") && isHls);

      // Strategy A: Hls.js
      if (canUseHlsJs && HlsModule) {
        const hls = new HlsModule({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 60,
          maxBufferLength: 30,
          manifestLoadingTimeOut: 12000,
          manifestLoadingMaxRetry: 2,
          levelLoadingTimeOut: 12000,
          fragLoadingTimeOut: 15000,
        });

        hlsRef.current = hls;

        const selectTamilAudio = () => {
          if (!hls.audioTracks || hls.audioTracks.length === 0) return true;
          const tracks = hls.audioTracks;
          const tamilIdx = tracks.findIndex((t) => {
            const lang = (t.lang || "").toLowerCase();
            const name = (t.name || "").toLowerCase();
            return lang === "tam" || lang === "ta" || lang.includes("tamil") || name.includes("tamil");
          });
          if (tamilIdx !== -1) {
            if (hls.audioTrack !== tamilIdx) {
              hls.audioTrack = tamilIdx;
            }
            return true;
          }
          if (tracks.length > 1) {
            attemptFailover(`Multi-audio stream does not contain Tamil track: [${tracks.map(t => t.lang || t.name).join(", ")}]`);
            return false;
          }
          return true;
        };

        hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
          if (currentSessionId !== sessionCountRef.current || !mountedRef.current) return;
          if (!selectTamilAudio()) return;
          attemptAutoplay(video, currentSessionId);
        });

        hls.on(HlsModule.Events.AUDIO_TRACKS_UPDATED, () => {
          if (currentSessionId !== sessionCountRef.current || !mountedRef.current) return;
          selectTamilAudio();
        });

        hls.on(HlsModule.Events.ERROR, (_event, data) => {
          if (currentSessionId !== sessionCountRef.current || !mountedRef.current) return;

          if (!data.fatal) {
            if (data.details === "bufferStalledError") {
              updateState("BUFFERING");
            }
            return;
          }

          // Handle fatal error with 1 retry before failover
          if (streamRetryCountRef.current === 0 && data.type === HlsModule.ErrorTypes.NETWORK_ERROR) {
            streamRetryCountRef.current += 1;
            updateState("BUFFERING");
            retryTimerRef.current = setTimeout(() => {
              if (currentSessionId === sessionCountRef.current && mountedRef.current) {
                hls.startLoad();
              }
            }, 1500);
          } else if (streamRetryCountRef.current === 0 && data.type === HlsModule.ErrorTypes.MEDIA_ERROR) {
            streamRetryCountRef.current += 1;
            updateState("BUFFERING");
            hls.recoverMediaError();
          } else {
            // Failover to next verified stream
            attemptFailover(data.details);
          }
        });

        hls.loadSource(url);
        hls.attachMedia(video);
        return;
      }

      // Strategy B: Native HLS (Safari / iOS)
      if (canUseNativeHls) {
        video.src = url;

        const checkNativeAudio = () => {
          const nativeTracks = (video as unknown as { audioTracks?: Array<{ language: string; label: string; enabled: boolean }> }).audioTracks;
          if (nativeTracks && nativeTracks.length > 0) {
            let foundTamil = false;
            for (let i = 0; i < nativeTracks.length; i++) {
              const t = nativeTracks[i];
              if (!t) continue;
              const l = (t.language || "").toLowerCase();
              const n = (t.label || "").toLowerCase();
              if (l === "tam" || l === "ta" || l.includes("tamil") || n.includes("tamil")) {
                t.enabled = true;
                foundTamil = true;
              } else if (nativeTracks.length > 1) {
                t.enabled = false;
              }
            }
            if (nativeTracks.length > 1 && !foundTamil) {
              attemptFailover("Tamil audio track unavailable in native stream");
              return false;
            }
          }
          return true;
        };

        const onLoaded = () => {
          if (currentSessionId !== sessionCountRef.current || !mountedRef.current) return;
          if (!checkNativeAudio()) return;
          attemptAutoplay(video, currentSessionId);
        };

        const onError = () => {
          if (currentSessionId !== sessionCountRef.current || !mountedRef.current) return;
          if (video.error?.code === 1) return; // aborted

          if (streamRetryCountRef.current === 0) {
            streamRetryCountRef.current += 1;
            updateState("BUFFERING");
            retryTimerRef.current = setTimeout(() => {
              if (currentSessionId === sessionCountRef.current && mountedRef.current) {
                video.src = url;
                video.load();
              }
            }, 1500);
          } else {
            attemptFailover("Native media error");
          }
        };

        video.addEventListener("loadedmetadata", onLoaded, { once: true });
        video.addEventListener("error", onError, { once: true });
        video.load();
        return;
      }

      // Strategy C: Direct HTML5
      video.src = url;
      video.addEventListener(
        "canplay",
        () => {
          if (currentSessionId !== sessionCountRef.current || !mountedRef.current) return;
          attemptAutoplay(video, currentSessionId);
        },
        { once: true }
      );
      video.load();
    },
    [attemptAutoplay, attemptFailover, updateState]
  );

  useEffect(() => {
    mountedRef.current = true;
    const currentSessionId = ++sessionCountRef.current;
    streamRetryCountRef.current = 0;

    if (currentStream?.stream_url) {
      void initStream(currentStream.stream_url, currentSessionId);
    }

    return () => {
      teardown();
    };
  }, [activeStreamIndex, currentStream?.stream_url, initStream, teardown]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      teardown();
    };
  }, [teardown]);

  // Controls Actions
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => {
          setAutoplayBlocked(false);
          setIsPlaying(true);
          updateState("PLAYING");
        })
        .catch(() => updateState("PAUSED"));
    } else {
      video.pause();
      setIsPlaying(false);
      updateState("PAUSED");
    }
  }, [updateState]);

  const handleMuteToggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && video.volume === 0) {
      video.volume = 0.5;
      setVolume(0.5);
    }
  }, []);

  const handleFullscreen = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (container.requestFullscreen) {
      void container.requestFullscreen();
    } else if ((video as unknown as { webkitEnterFullscreen?: () => void })?.webkitEnterFullscreen) {
      (video as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
    }
  }, []);

  const handleManualReconnect = useCallback(() => {
    const currentSessionId = ++sessionCountRef.current;
    streamRetryCountRef.current = 0;
    teardown();
    if (currentStream?.stream_url) {
      void initStream(currentStream.stream_url, currentSessionId);
    }
  }, [currentStream?.stream_url, initStream, teardown]);

  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 3500);
  }, [isPlaying]);

  // Keyboard accessibility
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName || "")) return;
      if (e.code === "Space") {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        handleMuteToggle();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        handleFullscreen();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePlayPause, handleMuteToggle, handleFullscreen]);

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
      className="group relative aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl select-none"
    >
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        playsInline
        muted={isMuted}
        onPlay={() => {
          setIsPlaying(true);
          updateState("PLAYING");
        }}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => updateState("BUFFERING")}
        onPlaying={() => {
          setAutoplayBlocked(false);
          updateState("PLAYING");
        }}
      />

      {/* Loading / Failover Overlay */}
      {(playbackState === "CONNECTING" ||
        playbackState === "BUFFERING" ||
        playbackState === "FAILING_OVER") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 backdrop-blur-md">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs sm:text-sm font-semibold text-white/90">
            {playbackState === "FAILING_OVER"
              ? "Connecting to verified backup stream…"
              : playbackState === "BUFFERING"
              ? "Buffering live stream…"
              : `Connecting to ${title} (Source ${activeStreamIndex + 1}/${streams.length})…`}
          </p>
        </div>
      )}

      {/* Playback Error Overlay */}
      {playbackState === "ERROR" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 p-6 text-center backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
          </div>
          <p className="text-base font-bold text-white">Broadcast Temporarily Unavailable</p>
          <p className="max-w-md text-xs text-white/70">
            {errorMessage || "The live broadcast stream is currently offline."}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveStreamIndex(0);
                handleManualReconnect();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-bold text-black hover:bg-primary-hover transition"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Retry Stream</span>
            </button>
            <Link
              href="/tamil"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              <Tv className="h-3.5 w-3.5" />
              <span>Explore Tamil TV</span>
            </Link>
          </div>
        </div>
      )}

      {/* Autoplay muted quick unmute banner */}
      {isPlaying && isMuted && (
        <div className="absolute top-3 left-3 z-20">
          <button
            type="button"
            onClick={handleMuteToggle}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/75 px-3 py-1.5 text-xs font-semibold text-white shadow-xl backdrop-blur-md hover:bg-black/90 active:scale-95 transition"
          >
            <VolumeX className="h-3.5 w-3.5 text-amber-400" />
            <span>Tap to unmute</span>
          </button>
        </div>
      )}

      {/* Autoplay blocked tap to play */}
      {playbackState === "PAUSED" && autoplayBlocked && !isPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm">
          <button
            type="button"
            onClick={handlePlayPause}
            className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-orange-400 text-black shadow-2xl shadow-primary/40 transition hover:scale-110 active:scale-95"
            aria-label="Tap to start live stream"
          >
            <Play className="h-7 w-7 sm:h-9 sm:w-9 translate-x-0.5 fill-current" />
          </button>
          <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] sm:text-xs font-semibold text-white/80 border border-white/10">
            Tap to start live broadcast
          </span>
        </div>
      )}

      {/* Liquid Glass HUD Controls */}
      {playbackState !== "CONNECTING" && playbackState !== "ERROR" && (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 p-2 sm:p-4 lg:p-5 transition-opacity duration-300",
            controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <div className="flex items-center justify-between gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-white/10 bg-[#060709]/90 px-2.5 py-2 sm:px-4 sm:py-3 shadow-2xl backdrop-blur-2xl">
            {/* Left Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handlePlayPause}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-white/10 text-white hover:bg-white/20 transition active:scale-95"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />}
              </button>

              <button
                type="button"
                onClick={handleMuteToggle}
                aria-label={isMuted ? "Unmute" : "Mute"}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-white/10 text-white hover:bg-white/20 transition active:scale-95"
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              </button>

              {/* Status indicator */}
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE</span>
              </div>

              {/* Stream Switcher if multiple streams exist */}
              {streams.length > 1 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowStreamPicker(!showStreamPicker)}
                    className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-[11px] font-semibold text-white/80 hover:bg-white/10 transition"
                  >
                    <Layers className="h-3 w-3 text-primary" />
                    <span>Source {activeStreamIndex + 1}</span>
                    <ChevronDown className="h-3 w-3 text-white/40" />
                  </button>

                  {showStreamPicker && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl border border-white/10 bg-[#0e1017]/95 p-1.5 shadow-2xl backdrop-blur-xl z-30">
                      <p className="px-2 py-1 text-[10px] font-bold text-white/40 uppercase">Verified Sources</p>
                      {streams.map((s, idx) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setActiveStreamIndex(idx);
                            setShowStreamPicker(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs transition",
                            idx === activeStreamIndex
                              ? "bg-primary/20 text-primary font-bold"
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <span>{idx === 0 ? "Primary Stream" : `Backup ${idx}`}</span>
                          {s.resolution && <span className="font-mono text-[10px] text-white/40">{s.resolution}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualReconnect}
                title="Reconnect broadcast"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={handleFullscreen}
                title="Fullscreen (F)"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
              >
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
