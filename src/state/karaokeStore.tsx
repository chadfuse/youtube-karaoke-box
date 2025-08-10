import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { KaraokeVideo } from "@/types/youtube";
import { toast } from "@/hooks/use-toast";

export interface KaraokeSong extends KaraokeVideo {
  reserver?: string;
}

interface KaraokeSettings {
  apiKey: string;
  allowDuplicates: boolean;
  showOverlay: boolean;
  countdownEnabled: boolean;
  regionCode: string;
}

interface KaraokeState {
  nowPlaying: KaraokeSong | null;
  queue: KaraokeSong[];
  isPlaying: boolean;
  microphoneMuted: boolean;
  settings: KaraokeSettings;
}

interface KaraokeActions {
  reserve: (song: KaraokeVideo, reserver?: string) => void;
  removeFromQueue: (id: string) => void;
  moveInQueue: (from: number, to: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  skip: () => void;
  setSettings: (next: Partial<KaraokeSettings>) => void;
  setMicrophoneMuted: (muted: boolean) => void;
}

const DEFAULT_SETTINGS: KaraokeSettings = {
  apiKey: localStorage.getItem("yt_api_key") || "",
  allowDuplicates: JSON.parse(localStorage.getItem("karaoke_allow_duplicates") || "false"),
  showOverlay: JSON.parse(localStorage.getItem("karaoke_show_overlay") || "true"),
  countdownEnabled: JSON.parse(localStorage.getItem("karaoke_countdown") || "true"),
  regionCode: localStorage.getItem("karaoke_region") || "US",
};

const KaraokeContext = createContext<(KaraokeState & KaraokeActions) | null>(null);

export const KaraokeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nowPlaying, setNowPlaying] = useState<KaraokeSong | null>(null);
  const [queue, setQueue] = useState<KaraokeSong[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [microphoneMuted, setMicrophoneMuted] = useState(false);
  const [settings, setSettingsState] = useState<KaraokeSettings>(DEFAULT_SETTINGS);

  // Persist select settings
  useEffect(() => {
    localStorage.setItem("yt_api_key", settings.apiKey);
    localStorage.setItem("karaoke_allow_duplicates", JSON.stringify(settings.allowDuplicates));
    localStorage.setItem("karaoke_show_overlay", JSON.stringify(settings.showOverlay));
    localStorage.setItem("karaoke_countdown", JSON.stringify(settings.countdownEnabled));
    localStorage.setItem("karaoke_region", settings.regionCode);
  }, [settings]);

  const reserve: KaraokeActions["reserve"] = (song, reserver) => {
    const candidate: KaraokeSong = { ...song, reserver };
    if (!settings.allowDuplicates) {
      const duplicate = (nowPlaying && nowPlaying.id === candidate.id) || queue.some((s) => s.id === candidate.id);
      if (duplicate) {
        toast({ title: "Already reserved", description: "This song is already in the queue." });
        return;
      }
    }

    if (!nowPlaying) {
      setNowPlaying(candidate);
      setIsPlaying(true);
    } else {
      setQueue((q) => [...q, candidate]);
    }
    toast({ title: "Reserved", description: `${candidate.title} added to queue` });
  };

  const removeFromQueue: KaraokeActions["removeFromQueue"] = (id) => {
    setQueue((q) => q.filter((s) => s.id !== id));
  };

  const moveInQueue: KaraokeActions["moveInQueue"] = (from, to) => {
    setQueue((q) => {
      const copy = [...q];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  };

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);
  const togglePlay = () => setIsPlaying((p) => !p);

  const skip = () => {
    setQueue((q) => {
      if (q.length === 0) {
        setNowPlaying(null);
        setIsPlaying(false);
        return q;
      }
      const [next, ...rest] = q;
      setNowPlaying(next);
      setIsPlaying(true);
      return rest;
    });
  };

  const setSettings: KaraokeActions["setSettings"] = (next) => {
    setSettingsState((prev) => ({ ...prev, ...next }));
  };

  const value = useMemo(() => ({
    nowPlaying,
    queue,
    isPlaying,
    microphoneMuted,
    settings,
    reserve,
    removeFromQueue,
    moveInQueue,
    play,
    pause,
    togglePlay,
    skip,
    setSettings,
    setMicrophoneMuted,
  }), [nowPlaying, queue, isPlaying, microphoneMuted, settings]);

  return <KaraokeContext.Provider value={value}>{children}</KaraokeContext.Provider>;
};

export const useKaraoke = () => {
  const ctx = useContext(KaraokeContext);
  if (!ctx) throw new Error("useKaraoke must be used within KaraokeProvider");
  return ctx;
};
