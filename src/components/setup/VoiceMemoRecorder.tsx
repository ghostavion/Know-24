"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Play, Pause, Upload, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceMemoRecorderProps {
  businessId: string;
  onUploaded?: (voiceMemoId: string) => void;
  className?: string;
}

type RecorderState = "idle" | "recording" | "recorded" | "uploading";

const MAX_RECORDING_SECONDS = 300; // 5 minutes

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const VoiceMemoRecorder = ({ businessId, onUploaded, className }: VoiceMemoRecorderProps) => {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio context and analyser for waveform
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        audioBlobRef.current = blob;

        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;

        const audio = new Audio(url);
        audioElementRef.current = audio;

        audio.addEventListener("loadedmetadata", () => {
          // Handle Infinity duration (common with MediaRecorder blobs)
          if (audio.duration === Infinity) {
            audio.currentTime = 1e101;
            audio.addEventListener(
              "timeupdate",
              function handler() {
                audio.removeEventListener("timeupdate", handler);
                audio.currentTime = 0;
                setDuration(Math.round(audio.duration));
              },
              { once: true }
            );
          } else {
            setDuration(Math.round(audio.duration));
          }
        });

        audio.addEventListener("timeupdate", () => {
          setPlaybackTime(Math.round(audio.currentTime));
        });

        audio.addEventListener("ended", () => {
          setIsPlaying(false);
          setPlaybackTime(0);
        });

        // Stop stream tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        // Close audio context
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
          audioContextRef.current.close();
        }

        setState("recorded");
      };

      mediaRecorder.start(250); // Collect data every 250ms
      setState("recording");
      setElapsed(0);

      // Start elapsed timer
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            stopRecording();
          }
          return next;
        });
      }, 1000);

    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Microphone access denied. Please allow microphone permissions and try again.");
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setError("No microphone found. Please connect a microphone and try again.");
      } else {
        setError("Could not start recording. Please check your microphone.");
      }
    }
  };

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Draw waveform when recording starts
  useEffect(() => {
    if (state === "recording" && analyserRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let frameId: number;

      const draw = () => {
        frameId = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);

        const barCount = 40;
        const barWidth = width / barCount - 2;
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i * step] || 0;
          const barHeight = Math.max((value / 255) * height * 0.85, 2);
          const x = i * (barWidth + 2);
          const y = (height - barHeight) / 2;

          ctx.fillStyle = "#0891b2";
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
      };

      draw();
      animationFrameRef.current = frameId!;

      return () => {
        cancelAnimationFrame(frameId);
      };
    }
  }, [state]);

  const togglePlayback = () => {
    const audio = audioElementRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleDiscard = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    audioBlobRef.current = null;
    setIsPlaying(false);
    setPlaybackTime(0);
    setDuration(0);
    setElapsed(0);
    setState("idle");
  };

  const handleUpload = async () => {
    const blob = audioBlobRef.current;
    if (!blob) return;

    setState("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", blob, "voice-memo.webm");
      formData.append("businessId", businessId);

      const res = await fetch("/api/setup/voice-memo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      onUploaded?.(data.voiceMemoId);

      // Reset after successful upload
      handleDiscard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setState("recorded");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Idle state */}
      {state === "idle" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <button
            type="button"
            onClick={startRecording}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0891b2]/10 transition-colors hover:bg-[#0891b2]/20"
          >
            <Mic className="h-7 w-7 text-[#0891b2]" />
          </button>
          <p className="text-sm text-muted-foreground">
            Tap to start recording (max {MAX_RECORDING_SECONDS / 60} min)
          </p>
        </div>
      )}

      {/* Recording state */}
      {state === "recording" && (
        <div className="flex flex-col items-center gap-4 py-4">
          {/* Pulsing indicator + timer */}
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </span>
            <span className="font-mono text-lg font-semibold tabular-nums">
              {formatTime(elapsed)}
            </span>
          </div>

          {/* Waveform canvas */}
          <canvas
            ref={canvasRef}
            width={320}
            height={64}
            className="w-full max-w-xs rounded-lg"
          />

          {/* Stop button */}
          <button
            type="button"
            onClick={stopRecording}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 transition-colors hover:bg-red-600"
          >
            <Square className="h-5 w-5 fill-white text-white" />
          </button>
          <p className="text-xs text-muted-foreground">
            {MAX_RECORDING_SECONDS - elapsed}s remaining
          </p>
        </div>
      )}

      {/* Recorded state — playback preview */}
      {state === "recorded" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <button
              type="button"
              onClick={togglePlayback}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0891b2]/10 transition-colors hover:bg-[#0891b2]/20"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 text-[#0891b2]" />
              ) : (
                <Play className="h-4 w-4 text-[#0891b2]" />
              )}
            </button>

            {/* Progress bar */}
            <div className="flex flex-1 flex-col gap-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[#0891b2] transition-all"
                  style={{
                    width: duration > 0 ? `${(playbackTime / duration) * 100}%` : "0%",
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(playbackTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDiscard}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4" />
              Discard
            </Button>
            <Button
              onClick={handleUpload}
              className="flex-1 bg-[#0891b2] text-white hover:bg-[#0891b2]/90"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>
      )}

      {/* Uploading state */}
      {state === "uploading" && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="h-8 w-8 animate-spin text-[#0891b2]" />
          <p className="text-sm text-muted-foreground">Uploading voice memo...</p>
        </div>
      )}
    </div>
  );
};

export default VoiceMemoRecorder;
