"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PlayerStatusBadge, type PlaybackBadgeStatus } from "./PlayerStatusBadge";
import { validateStreamUrl, type PlayerError } from "@/lib/player/errors";
import { cn } from "@/lib/utils";

export type PlayerStatus = "idle" | "loading" | "buffering" | "playing" | "paused" | "error";

const MAX_AUTO_RETRIES = 3;
const RETRY_DELAYS = [1000, 2500, 4000]; // Exponential backoff in ms
const isDev = process.env.NODE_ENV === "development";

function statusToBadge(status: PlayerStatus): PlaybackBadgeStatus {
  if (status === "error") return "error";
  if (status === "loading" || status === "buffering") return "connecting";
  if (status === "playing") return "live";
  return "paused";
}

interface DiagnosticInfo {
  engine: "hls.js" | "native-hls" | "html5-video" | "none";
  streamUrl: string;
  retries: number;
  lastHlsError?: string;
  nativeErrorCode?: number;
  duration?: number;
  bufferedEnd?: number;
}

interface VideoPlayerProps {
  streamUrl: string;
  title: string;
  channelId?: string;
  isTamilOnlyChannel?: boolean;
  onStatusChange?: (status: PlayerStatus) => void;
}

function selectTamilAudioTrack(
  hls: Hls,
  strictTamilOnly: boolean
): { success: boolean; reason?: string } {
  if (!hls.audioTracks || hls.audioTracks.length === 0) {
    return { success: true };
  }

  const tracks = hls.audioTracks;
  const tamilIndex = tracks.findIndex((t) => {
    const lang = (t.lang || "").toLowerCase();
    const name = (t.name || "").toLowerCase();
    return lang === "tam" || lang === "ta" || lang.includes("tamil") || name.includes("tamil");
  });

  if (tamilIndex !== -1) {
    if (hls.audioTrack !== tamilIndex) {
      hls.audioTrack = tamilIndex;
    }
    return { success: true };
  }

  // If there are multiple audio tracks and this channel strictly requires Tamil audio:
  if (strictTamilOnly && tracks.length > 1) {
    return {
      success: false,
      reason: `Available audio tracks [${tracks.map((t) => t.lang || t.name).join(", ")}] do not include Tamil.`,
    };
  }

  return { success: true };
}

export const VideoPlayer = memo(function VideoPlayer({
  streamUrl,
  title,
  channelId,
  isTamilOnlyChannel,
  onStatusChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const sessionCountRef = useRef(0);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const [status, setStatus] = useState<PlayerStatus>("loading");
  const [playerError, setPlayerError] = useState<PlayerError | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo>({
    engine: "none",
    streamUrl,
    retries: 0,
  });

  const safeSetStatus = useCallback(
    (next: PlayerStatus, error?: PlayerError | null) => {
      if (!mountedRef.current) return;
      setStatus(next);
      setPlayerError(error ?? null);
      onStatusChange?.(next);
    },
    [onStatusChange]
  );

  // Safely attempts autoplay with muted audio (broadly allowed by all browsers)
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
            safeSetStatus("playing");
          })
          .catch((err: unknown) => {
            if (!mountedRef.current || sessionId !== sessionCountRef.current) return;
            // NotAllowedError is standard browser autoplay restriction — show friendly Tap to Play
            const isNotAllowed = err instanceof Error && err.name === "NotAllowedError";
            if (isNotAllowed) {
              setAutoplayBlocked(true);
              setIsPlaying(false);
              safeSetStatus("paused");
            } else {
              // Other playback error
              setIsPlaying(false);
              safeSetStatus("paused");
            }
          });
      }
    },
    [safeSetStatus]
  );

  // Teardown the current HLS and video instance cleanly
  const teardownPlayer = useCallback(() => {
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
        // Safe ignore
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
        // Safe ignore
      }
    }
  }, []);

  // Main setup effect with per-session token tracking and cleanup
  const initStream = useCallback(
    async (url: string, currentSessionId: number) => {
      const video = videoRef.current;
      if (!video || !mountedRef.current) return;

      const isTargetStrictTamil = Boolean(
        isTamilOnlyChannel ||
        title.toLowerCase().includes("chutti") ||
        title.toLowerCase().includes("pogo") ||
        (channelId && (channelId.toLowerCase().includes("chutti") || channelId.toLowerCase().includes("pogo")))
      );

      // 1. Initial validation
      const validationError = validateStreamUrl(url);
      if (validationError) {
        safeSetStatus("error", validationError);
        setDiagnosticInfo((prev) => ({ ...prev, engine: "none", lastHlsError: validationError.diagnostic }));
        return;
      }

      safeSetStatus("loading");
      setAutoplayBlocked(false);

      // Clean prior instances before mounting new stream
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch {
          // ignore
        }
        hlsRef.current = null;
      }

      // Check if HLS.js is supported in this browser
      let HlsModule: typeof Hls | null = null;
      try {
        const mod = await import("hls.js");
        HlsModule = mod.default;
      } catch {
        // Dynamic import failed or SSR
      }

      if (currentSessionId !== sessionCountRef.current || !mountedRef.current) return;

      const isHlsUrl = url.toLowerCase().includes(".m3u8") || url.includes("hls") || !url.includes(".mp4");
      const canUseHlsJs = Boolean(HlsModule && HlsModule.isSupported() && isHlsUrl);
      const canUseNativeHls = Boolean(video.canPlayType("application/vnd.apple.mpegurl") && isHlsUrl);

      // Strategy A: Hls.js (MSE supported — Chrome, Edge, Firefox, Android)
      if (canUseHlsJs && HlsModule) {
        setDiagnosticInfo((prev) => ({ ...prev, engine: "hls.js", streamUrl: url }));

        const hls = new HlsModule({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 60,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 30 * 1000 * 1000, // 30MB
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10,
          manifestLoadingTimeOut: 15000,
          manifestLoadingMaxRetry: 3,
          levelLoadingTimeOut: 15000,
          fragLoadingTimeOut: 20000,
        });

        hlsRef.current = hls;

        const applyAudioSelection = () => {
          const audioCheck = selectTamilAudioTrack(hls, isTargetStrictTamil);
          if (!audioCheck.success) {
            try {
              hls.stopLoad();
              video.pause();
            } catch {
              // ignore
            }
            safeSetStatus("error", {
              code: "AUDIO_LANGUAGE_UNAVAILABLE",
              message: "Tamil audio track is unavailable for this broadcast. Silent playback of non-Tamil audio is disabled.",
              diagnostic: audioCheck.reason,
            });
            return false;
          }
          return true;
        };

        hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
          if (currentSessionId !== sessionCountRef.current || !mountedRef.current) return;
          if (!applyAudioSelection()) return;
          setIsReconnecting(false);
          attemptAutoplay(video, currentSessionId);
        });

        hls.on(HlsModule.Events.AUDIO_TRACKS_UPDATED, () => {
          if (currentSessionId !== sessionCountRef.current || !mountedRef.current) return;
          applyAudioSelection();
        });

        hls.on(HlsModule.Events.ERROR, (_event, data) => {
          if (currentSessionId !== sessionCountRef.current || !mountedRef.current) return;

          setDiagnosticInfo((prev) => ({
            ...prev,
            lastHlsError: `${data.type} (${data.details})${data.response ? ` HTTP ${data.response.code}` : ""}`,
          }));

          // Non-fatal errors (e.g. buffer stall)
          if (!data.fatal) {
            if (data.details === "bufferStalledError") {
              safeSetStatus("buffering");
            }
            return;
          }

          // Fatal errors
          switch (data.type) {
            case HlsModule.ErrorTypes.NETWORK_ERROR:
              if (retryCountRef.current < MAX_AUTO_RETRIES) {
                const delay = RETRY_DELAYS[retryCountRef.current] || 3000;
                retryCountRef.current += 1;
                setIsReconnecting(true);
                safeSetStatus("buffering");
                setDiagnosticInfo((prev) => ({ ...prev, retries: retryCountRef.current }));

                if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
                retryTimerRef.current = setTimeout(() => {
                  if (currentSessionId === sessionCountRef.current && mountedRef.current) {
                    hls.startLoad();
                  }
                }, delay);
              } else {
                setIsReconnecting(false);
                const isCorsOr403 = data.response?.code === 403 || data.response?.code === 0;
                safeSetStatus("error", {
                  code: isCorsOr403 ? "CORS_ERROR" : "NETWORK_ERROR",
                  message: "The broadcast server could not be reached. The channel stream may be offline or access restricted.",
                  diagnostic: `hls.js NETWORK_ERROR: ${data.details}${data.response?.code ? ` (HTTP ${data.response.code})` : ""}`,
                });
              }
              break;

            case HlsModule.ErrorTypes.MEDIA_ERROR:
              if (retryCountRef.current === 0) {
                retryCountRef.current += 1;
                safeSetStatus("buffering");
                hls.recoverMediaError();
              } else if (retryCountRef.current === 1) {
                retryCountRef.current += 1;
                safeSetStatus("buffering");
                hls.swapAudioCodec();
                hls.recoverMediaError();
              } else {
                safeSetStatus("error", {
                  code: "MEDIA_ERROR",
                  message: "The video stream audio/video format could not be decoded.",
                  diagnostic: `hls.js fatal MEDIA_ERROR: ${data.details}`,
                });
              }
              break;

            default:
              safeSetStatus("error", {
                code: "PLAYBACK_ERROR",
                message: "Playback was interrupted by a stream error.",
                diagnostic: `hls.js fatal ${data.type}: ${data.details}`,
              });
              try {
                hls.destroy();
                hlsRef.current = null;
              } catch {
                // ignore
              }
              break;
          }
        });

        hls.loadSource(url);
        hls.attachMedia(video);
        return;
      }

      // Strategy B: Native HLS (Safari / iOS)
      if (canUseNativeHls) {
        setDiagnosticInfo((prev) => ({ ...prev, engine: "native-hls", streamUrl: url }));
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
            if (isTargetStrictTamil && nativeTracks.length > 1 && !foundTamil) {
              video.pause();
              safeSetStatus("error", {
                code: "AUDIO_LANGUAGE_UNAVAILABLE",
                message: "Tamil audio track is unavailable for this broadcast. Silent playback of non-Tamil audio is disabled.",
              });
              return false;
            }
          }
          return true;
        };

        const onLoaded = () => {
          if (currentSessionId !== sessionCountRef.current || !mountedRef.current) return;
          if (!checkNativeAudio()) return;
          setIsReconnecting(false);
          attemptAutoplay(video, currentSessionId);
        };

        const onNativeError = () => {
          if (currentSessionId !== sessionCountRef.current || !mountedRef.current) return;
          const code = video.error ? video.error.code : undefined;
          // Code 1 is MEDIA_ERR_ABORTED which happens on teardown; ignore it
          if (code === 1) return;

          setDiagnosticInfo((prev) => ({ ...prev, nativeErrorCode: code }));

          if (retryCountRef.current < MAX_AUTO_RETRIES) {
            const delay = RETRY_DELAYS[retryCountRef.current] || 3000;
            retryCountRef.current += 1;
            setIsReconnecting(true);
            safeSetStatus("buffering");

            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
            retryTimerRef.current = setTimeout(() => {
              if (currentSessionId === sessionCountRef.current && mountedRef.current) {
                video.src = url;
                video.load();
              }
            }, delay);
          } else {
            setIsReconnecting(false);
            safeSetStatus("error", {
              code: "PLAYBACK_ERROR",
              message: "The live broadcast could not be loaded on this device.",
              diagnostic: code ? `Native MediaError code ${code}` : "Unknown native error",
            });
          }
        };

        video.addEventListener("loadedmetadata", onLoaded, { once: true });
        video.addEventListener("error", onNativeError);
        video.load();
        return;
      }

      // Strategy C: Direct HTML5 Video (.mp4 / standard video container)
      setDiagnosticInfo((prev) => ({ ...prev, engine: "html5-video", streamUrl: url }));
      video.src = url;
      video.addEventListener(
        "canplay",
        () => {
          if (currentSessionId !== sessionCountRef.current || !mountedRef.current) return;
          setIsReconnecting(false);
          attemptAutoplay(video, currentSessionId);
        },
        { once: true }
      );
      video.load();
    },
    [safeSetStatus, attemptAutoplay, isTamilOnlyChannel, channelId, title]
  );

  // Stream loading manager with strict session synchronization
  useEffect(() => {
    mountedRef.current = true;
    const currentSessionId = ++sessionCountRef.current;
    retryCountRef.current = 0;
    setIsReconnecting(false);

    void initStream(streamUrl, currentSessionId);

    return () => {
      // Synchronous cleanup when streamUrl changes or component unmounts
      teardownPlayer();
    };
  }, [streamUrl, initStream, teardownPlayer]);

  // Overall component unmount flag
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      teardownPlayer();
    };
  }, [teardownPlayer]);

  // Handle Play/Pause toggle
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (!mountedRef.current) return;
            setAutoplayBlocked(false);
            setIsPlaying(true);
            safeSetStatus("playing");
          })
          .catch(() => {
            if (!mountedRef.current) return;
            safeSetStatus("paused");
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
      safeSetStatus("paused");
    }
  }, [safeSetStatus]);

  // Handle Mute/Unmute
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

  // Handle Fullscreen
  const handleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void container.requestFullscreen?.();
    }
  }, []);

  // Handle Picture-in-Picture
  const handlePip = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      // PiP unsupported or blocked — safe to ignore
    }
  }, []);

  // User-triggered manual reconnect
  const handleManualReconnect = useCallback(() => {
    retryCountRef.current = 0;
    const currentSessionId = ++sessionCountRef.current;
    teardownPlayer();
    void initStream(streamUrl, currentSessionId);
  }, [streamUrl, initStream, teardownPlayer]);

  // Controls visibility management
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 3500);
  }, [isPlaying]);

  // Volume slider change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const video = videoRef.current;
    if (video) {
      video.volume = val;
      const isMute = val === 0;
      video.muted = isMute;
      setIsMuted(isMute);
    }
  }, []);

  // Global keyboard accessibility: Space (Play/Pause), M (Mute), F (Fullscreen)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        return;
      }
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

  const badgeStatus = statusToBadge(status);
  const supportsPip = typeof document !== "undefined" && "pictureInPictureEnabled" in document;

  return (
    <div
      ref={containerRef}
      data-player-container
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
          safeSetStatus("playing");
        }}
        onPause={() => {
          setIsPlaying(false);
        }}
        onWaiting={() => safeSetStatus("buffering")}
        onPlaying={() => {
          setAutoplayBlocked(false);
          safeSetStatus("playing");
        }}
      />

      {/* Loading & Buffering State */}
      {(status === "loading" || status === "buffering") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 backdrop-blur-md transition-opacity">
          <div className="relative flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
            <div className="absolute h-16 w-16 rounded-full bg-primary/20 blur-xl animate-pulse" />
          </div>
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-white/90">
            {isReconnecting
              ? `Reconnecting to broadcast (Attempt ${retryCountRef.current}/${MAX_AUTO_RETRIES})…`
              : status === "loading"
              ? "Connecting to Live Stream…"
              : "Buffering Broadcast…"}
          </p>
        </div>
      )}

      {/* Clean, Friendly Playback Error UI */}
      {status === "error" && playerError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 bg-black/90 px-6 py-4 text-center backdrop-blur-xl animate-in fade-in">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30">
            <AlertTriangle className="h-6 w-6 text-amber-400" aria-hidden="true" />
          </div>

          <p className="text-base font-bold text-white">Stream Currently Unavailable</p>
          <p className="max-w-md text-xs text-white/70 leading-relaxed">
            {playerError.message || "The broadcast could not be played right now."}
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={handleManualReconnect}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-black shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-95"
            >
              <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reconnect Stream</span>
            </button>

            <a
              href="/live"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              <Tv className="h-3.5 w-3.5 text-white/70" />
              <span>Explore Live TV</span>
            </a>
          </div>

          {/* Development Diagnostics Box */}
          {isDev && (
            <div className="mt-3 w-full max-w-lg rounded-2xl border border-white/10 bg-black/60 p-3 text-left">
              <button
                type="button"
                onClick={() => setShowDiagnostics((prev) => !prev)}
                className="flex w-full items-center justify-between text-[11px] font-mono text-white/50 hover:text-white"
              >
                <span>Diagnostics (Development Mode)</span>
                {showDiagnostics ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {showDiagnostics && (
                <div className="mt-2 space-y-1 text-[10px] font-mono text-white/60">
                  <p><span className="text-primary">Engine:</span> {diagnosticInfo.engine}</p>
                  <p className="break-all"><span className="text-primary">URL:</span> {streamUrl}</p>
                  <p><span className="text-primary">Error Code:</span> {playerError.code}</p>
                  {playerError.diagnostic && (
                    <p className="break-all"><span className="text-primary">Diagnostic:</span> {playerError.diagnostic}</p>
                  )}
                  {diagnosticInfo.lastHlsError && (
                    <p><span className="text-primary">HLS Event:</span> {diagnosticInfo.lastHlsError}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Autoplay Blocked / Tap to Play Overlay */}
      {status === "paused" && autoplayBlocked && !isPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <button
            type="button"
            onClick={handlePlayPause}
            aria-label="Tap to play broadcast"
            className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-orange-400 text-black shadow-2xl shadow-primary/40 transition hover:scale-110 active:scale-95"
          >
            <Play className="h-9 w-9 translate-x-0.5" fill="currentColor" aria-hidden="true" />
          </button>
          <span className="rounded-full bg-black/60 px-3.5 py-1 text-xs font-semibold text-white/80 border border-white/10">
            Tap to start live broadcast
          </span>
        </div>
      )}

      {/* Liquid Glass HUD Player Controls */}
      {status !== "loading" && status !== "error" && (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 p-3 sm:p-5 transition-opacity duration-300",
            controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#060709]/80 px-3 py-2.5 sm:px-4 sm:py-3 shadow-2xl backdrop-blur-2xl">
            {/* Left Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePlayPause}
                aria-label={isPlaying ? "Pause stream" : "Play stream"}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
              </button>

              {/* Volume & Mute */}
              <div className="flex items-center gap-1.5 group/vol">
                <button
                  type="button"
                  onClick={handleMuteToggle}
                  aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  aria-label="Volume slider"
                  className="hidden w-16 sm:w-20 accent-primary cursor-pointer sm:block"
                />
              </div>

              <PlayerStatusBadge status={badgeStatus} className="shrink-0 ml-1" />
              <span className="hidden truncate text-xs font-semibold text-white/80 max-w-[180px] lg:inline ml-2">
                {title}
              </span>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualReconnect}
                title="Reconnect broadcast"
                aria-label="Reconnect broadcast"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>

              {supportsPip && (
                <button
                  type="button"
                  onClick={handlePip}
                  aria-label="Picture in picture"
                  title="Picture in Picture"
                  className="hidden h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 sm:flex"
                >
                  <span className="block h-3.5 w-3.5 rounded-[3px] border-2 border-current" />
                </button>
              )}

              <button
                type="button"
                onClick={handleFullscreen}
                aria-label="Toggle fullscreen"
                title="Fullscreen (F)"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
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
