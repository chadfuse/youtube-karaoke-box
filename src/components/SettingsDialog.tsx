import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useKaraoke } from "@/state/karaokeStore";
import { Settings } from "lucide-react";

export default function SettingsDialog() {
  const { settings, setSettings } = useKaraoke();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" aria-label="Open settings"><Settings className="h-4 w-4 mr-2" />Settings</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Karaoke Settings</DialogTitle>
          <DialogDescription>Configure playback and user preferences.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              <strong>YouTube API configured globally.</strong><br />
              All users can search and access trending videos via our secure API proxy.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Allow duplicates</Label>
              <p className="text-xs text-muted-foreground">Allow the same song to be reserved multiple times.</p>
            </div>
            <Switch checked={settings.allowDuplicates} onCheckedChange={(v) => setSettings({ allowDuplicates: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Countdown between songs</Label>
              <p className="text-xs text-muted-foreground">Show 3-2-1 before the next song starts.</p>
            </div>
            <Switch checked={settings.countdownEnabled} onCheckedChange={(v) => setSettings({ countdownEnabled: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Show overlay</Label>
              <p className="text-xs text-muted-foreground">Display Now Playing info on the video.</p>
            </div>
            <Switch checked={settings.showOverlay} onCheckedChange={(v) => setSettings({ showOverlay: v })} />
          </div>
          <div className="pt-2 text-xs text-muted-foreground">
            Note: All YouTube API calls are handled securely through our server. Your preferences are stored locally in your browser.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
