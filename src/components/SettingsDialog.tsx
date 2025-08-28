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
          <DialogDescription>Configure YouTube API and playback options.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {settings.apiKey ? (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                <strong>YouTube API configured globally by admin.</strong><br />
                All users are using the same API key and region settings.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="apiKey">YouTube API Key</Label>
                <Input id="apiKey" type="password" value={settings.apiKey} onChange={(e) => setSettings({ apiKey: e.target.value })} placeholder="Enter your API key" />
                <p className="text-xs text-muted-foreground">No global API key configured. Enter your own.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="region">Region Code</Label>
                <Input id="region" value={settings.regionCode} onChange={(e) => setSettings({ regionCode: e.target.value.toUpperCase() })} placeholder="US" />
              </div>
            </>
          )}
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
            Note: The API key is stored locally in your browser (localStorage) and never sent to our servers.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
