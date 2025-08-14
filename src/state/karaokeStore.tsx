import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { KaraokeVideo } from "@/types/youtube";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  setInitial: (song: KaraokeVideo) => void;
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
  const [user, setUser] = useState<any>(null);

  // Load user session and queue on mount
  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserQueue(session.user.id);
      }
    };
    
    loadData();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserQueue(session.user.id);
      } else {
        // Clear queue when user logs out
        setQueue([]);
        setNowPlaying(null);
        setIsPlaying(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const loadUserQueue = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_queue')
        .select(`
          id,
          position,
          reserver,
          karaoke_songs (
            id,
            title,
            description,
            thumbnail_url,
            duration
          )
        `)
        .eq('user_id', userId)
        .order('position');

      if (error) throw error;

      const queueData = data?.map(item => ({
        id: item.karaoke_songs.id,
        title: item.karaoke_songs.title,
        description: item.karaoke_songs.description || '',
        thumbnailUrl: item.karaoke_songs.thumbnail_url || '',
        durationSeconds: parseInt(item.karaoke_songs.duration || '0'),
        reserver: item.reserver
      })) || [];

      setQueue(queueData);
    } catch (error) {
      console.error('Error loading user queue:', error);
    }
  };

  const saveSongToDatabase = async (song: KaraokeVideo) => {
    try {
      const { error } = await supabase
        .from('karaoke_songs')
        .upsert({
          id: song.id,
          title: song.title,
          description: song.description,
          thumbnail_url: song.thumbnailUrl,
          duration: song.durationSeconds.toString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving song:', error);
    }
  };

  const saveToUserQueue = async (song: KaraokeSong, position: number) => {
    if (!user) return;

    try {
      await saveSongToDatabase(song);
      
      const { error } = await supabase
        .from('user_queue')
        .insert({
          user_id: user.id,
          song_id: song.id,
          reserver: song.reserver,
          position
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving to queue:', error);
    }
  };

  const removeFromUserQueue = async (songId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_queue')
        .delete()
        .eq('user_id', user.id)
        .eq('song_id', songId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  };

  const updateQueuePositions = async (newQueue: KaraokeSong[]) => {
    if (!user) return;

    try {
      // Delete all current queue items
      await supabase
        .from('user_queue')
        .delete()
        .eq('user_id', user.id);

      // Insert new queue with updated positions
      if (newQueue.length > 0) {
        const queueItems = newQueue.map((song, index) => ({
          user_id: user.id,
          song_id: song.id,
          reserver: song.reserver,
          position: index
        }));

        const { error } = await supabase
          .from('user_queue')
          .insert(queueItems);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating queue positions:', error);
    }
  };

  // Persist select settings
  useEffect(() => {
    localStorage.setItem("yt_api_key", settings.apiKey);
    localStorage.setItem("karaoke_allow_duplicates", JSON.stringify(settings.allowDuplicates));
    localStorage.setItem("karaoke_show_overlay", JSON.stringify(settings.showOverlay));
    localStorage.setItem("karaoke_countdown", JSON.stringify(settings.countdownEnabled));
    localStorage.setItem("karaoke_region", settings.regionCode);
  }, [settings]);

const reserve: KaraokeActions["reserve"] = async (song, reserver) => {
    // Enforce anonymous reserve limit (5) until auth is connected
    if (!user) {
      const count = parseInt(localStorage.getItem("karaoke_anon_reserve_count") || "0", 10);
      if (count >= 5) {
        toast({ title: "Limit reached", description: "Sign in to reserve unlimited songs." });
        return;
      } else {
        localStorage.setItem("karaoke_anon_reserve_count", String(count + 1));
      }
    }

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
      
      // Save song history if user is logged in
      if (user) {
        try {
          await saveSongToDatabase(song);
          await supabase
            .from('song_history')
            .insert({
              user_id: user.id,
              song_id: song.id
            });
        } catch (error) {
          console.error('Error saving to history:', error);
        }
      }
    } else {
      const newQueue = [...queue, candidate];
      setQueue(newQueue);
      
      // Save to database if user is logged in
      if (user) {
        await saveToUserQueue(candidate, queue.length);
      }
    }
    toast({ title: "Reserved", description: `${candidate.title} added to queue` });
  };

  const removeFromQueue: KaraokeActions["removeFromQueue"] = async (id) => {
    const newQueue = queue.filter((s) => s.id !== id);
    setQueue(newQueue);
    
    if (user) {
      await removeFromUserQueue(id);
      await updateQueuePositions(newQueue);
    }
  };

  const moveInQueue: KaraokeActions["moveInQueue"] = async (from, to) => {
    const newQueue = [...queue];
    const [item] = newQueue.splice(from, 1);
    newQueue.splice(to, 0, item);
    setQueue(newQueue);
    
    if (user) {
      await updateQueuePositions(newQueue);
    }
  };

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);
  const togglePlay = () => setIsPlaying((p) => !p);

  const skip = async () => {
    if (queue.length === 0) {
      setNowPlaying(null);
      setIsPlaying(false);
      return;
    }
    
    const [next, ...rest] = queue;
    setNowPlaying(next);
    setIsPlaying(true);
    setQueue(rest);
    
    // Save to history and update queue in database
    if (user) {
      try {
        // Save the new now playing song to history
        await supabase
          .from('song_history')
          .insert({
            user_id: user.id,
            song_id: next.id
          });
        
        // Remove the first item from queue and update positions
        await updateQueuePositions(rest);
      } catch (error) {
        console.error('Error updating skip in database:', error);
      }
    }
  };

const setSettings: KaraokeActions["setSettings"] = (next) => {
  setSettingsState((prev) => ({ ...prev, ...next }));
};

const setInitial: KaraokeActions["setInitial"] = (song) => {
  if (nowPlaying || queue.length > 0) return;
  setNowPlaying({ ...song });
  setIsPlaying(true);
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
    setInitial,
    setMicrophoneMuted,
  }), [nowPlaying, queue, isPlaying, microphoneMuted, settings]);

  return <KaraokeContext.Provider value={value}>{children}</KaraokeContext.Provider>;
};

export const useKaraoke = () => {
  const ctx = useContext(KaraokeContext);
  if (!ctx) throw new Error("useKaraoke must be used within KaraokeProvider");
  return ctx;
};
