import { useEffect, useMemo, useRef, useState } from "react";
import YouTube from "react-youtube";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useKaraoke } from "@/state/karaokeStore";
import { Maximize2, Minimize2, Pause, Play, SkipForward, Mic, MicOff, PlayCircle } from "lucide-react";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export default function KaraokePlayer() {
  const { nowPlaying, isPlaying, togglePlay, skip, settings, setSettings, microphoneMuted, setMicrophoneMuted, queue } = useKaraoke();
  const [countdown, setCountdown] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    if (!nowPlaying) return;
    if (playerRef.current) {
      if (isPlaying) playerRef.current.playVideo();
      else playerRef.current.pauseVideo();
    }
  }, [isPlaying, nowPlaying?.id]);

  const onReady = (e: any) => {
    playerRef.current = e.target;
    if (isPlaying) e.target.playVideo();
  };

  const onEnd = () => {
    if (!settings.countdownEnabled) {
      skip();
      return;
    }
    setCountdown(3);
    let n = 3;
    const iv = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(iv);
        setCountdown(null);
        skip();
      } else {
        setCountdown(n);
      }
    }, 1000);
  };

  const opts = useMemo(() => ({
    width: "100%",
    height: "480",
    playerVars: {
      autoplay: isPlaying ? 1 : 0,
      modestbranding: 1,
      controls: 0,
      rel: 0,
      iv_load_policy: 3,
      cc_load_policy: 0,
    },
  }), [isPlaying]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) await containerRef.current.requestFullscreen();
    else await document.exitFullscreen();
  };

return (
    <section aria-label="Now Playing" className="mb-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Now Playing</span>
            <div className="text-sm text-muted-foreground">{queue.length} in queue</div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!nowPlaying ? (
            <div className="aspect-video w-full rounded-md bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">Reserve a song to start</p>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="relative"
              onMouseMove={() => {
                setShowControls(true);
                if (hideTimer.current) window.clearTimeout(hideTimer.current);
                hideTimer.current = window.setTimeout(() => setShowControls(false), 7000);
              }}
              onTouchStart={() => {
                setShowControls(true);
                if (hideTimer.current) window.clearTimeout(hideTimer.current);
                hideTimer.current = window.setTimeout(() => setShowControls(false), 7000);
              }}
            >
              <YouTube videoId={nowPlaying.id} opts={opts} onReady={onReady} onEnd={onEnd} key={nowPlaying.id} />

              {settings.showOverlay && showControls && (
                <div className="absolute left-3 right-3 bottom-3 md:left-6 md:right-6 md:bottom-6 bg-background/70 backdrop-blur-md border rounded-md p-3 md:p-4 shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="font-semibold line-clamp-2">{nowPlaying.title}</div>
                      <div className="text-sm text-muted-foreground">Unreserved</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={togglePlay} variant="secondary" aria-label={isPlaying ? "Pause" : "Play"}>
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" onClick={skip} variant="secondary" aria-label="Skip">
                        <SkipForward className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={() => setMicrophoneMuted(!microphoneMuted)} variant="secondary" aria-label={microphoneMuted ? "Unmute mic" : "Mute mic"}>
                        {microphoneMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" onClick={toggleFullscreen} variant="secondary" aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
                        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                  <div className="text-6xl md:text-8xl font-bold text-primary animate-pulse">{countdown}</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {nowPlaying && !settings.showOverlay && (
        <Button
          className="fixed bottom-6 right-6 rounded-full shadow-lg"
          variant="gradient"
          size="icon"
          aria-label="Open player controls"
          onClick={() => setSettings({ showOverlay: true })}
        >
          <PlayCircle className="h-6 w-6" />
        </Button>
      )}
    </section>
  );
}
