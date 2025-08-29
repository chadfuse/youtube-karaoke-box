import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useKaraoke } from "@/state/karaokeStore";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { auditLogger } from "@/utils/auditLogger";

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const { settings, setSettings } = useKaraoke();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Admin Dashboard – Chado";
    const desc = "Admin dashboard for Chado karaoke app settings and configuration.";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth?mode=signin");
        return;
      }
      setUser(session.user);

      try {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (data?.role !== 'admin') {
          auditLogger.adminAccess(false, session.user.email);
          toast({ title: "Access denied", description: "Admins only" });
          navigate("/");
        } else {
          auditLogger.adminAccess(true, session.user.email);
        }
      } catch (e) {
        console.error('Admin check failed', e);
        auditLogger.adminAccess(false, session.user.email);
        toast({ title: "Access denied", description: "Admins only" });
        navigate("/");
      }
    });
  }, [navigate]);

  const handleSaveSetting = async (key: string, value: any) => {
    const oldValue = settings[key as keyof typeof settings];
    
    // For YouTube API settings, save globally to database
    if (key === 'apiKey' || key === 'regionCode') {
      try {
        const { error } = await supabase
          .from('global_settings')
          .upsert({
            key: `youtube_${key}`,
            value: { value },
            created_by: user.id
          }, {
            onConflict: 'key'
          });

        if (error) throw error;
        
        // Log the setting change
        auditLogger.settingChanged(key, value, oldValue);
        
        // Also update local settings for immediate UI feedback
        setSettings({ [key]: value });
        toast({ title: "Global setting saved", description: "This setting will be used by all users." });
      } catch (error) {
        console.error('Error saving global setting:', error);
        auditLogger.securityEvent('GLOBAL_SETTING_SAVE_FAILED', { key, error: error.message });
        toast({ title: "Error", description: "Failed to save global setting." });
      }
    } else {
      // For other settings, save locally as before
      auditLogger.settingChanged(key, value, oldValue);
      setSettings({ [key]: value });
      toast({ title: "Setting saved", description: "Your setting has been updated." });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center justify-between py-3">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Back to App
              </Link>
            </Button>
          </h1>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-2">Configure your karaoke app settings</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>YouTube API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtube-api">YouTube API Key (Global)</Label>
                <Input
                  id="youtube-api"
                  type="text"
                  value={settings.apiKey}
                  onChange={(e) => handleSaveSetting('apiKey', e.target.value)}
                  placeholder="Enter your YouTube API key (will be used by all users)"
                />
                <p className="text-sm text-muted-foreground">
                  Get your API key from Google Cloud Console. This will be used globally for all users.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="region-code">Region Code (Global)</Label>
                <Input
                  id="region-code"
                  value={settings.regionCode}
                  onChange={(e) => handleSaveSetting('regionCode', e.target.value)}
                  placeholder="US"
                />
                <p className="text-sm text-muted-foreground">
                  Two-letter country code for regional content (applies globally)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Player Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Duplicate Songs</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow the same song to be reserved multiple times
                  </p>
                </div>
                <Switch
                  checked={settings.allowDuplicates}
                  onCheckedChange={(checked) => handleSaveSetting('allowDuplicates', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Countdown Between Songs</Label>
                  <p className="text-sm text-muted-foreground">
                    Show countdown timer when songs end
                  </p>
                </div>
                <Switch
                  checked={settings.countdownEnabled}
                  onCheckedChange={(checked) => handleSaveSetting('countdownEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Player Overlay</Label>
                  <p className="text-sm text-muted-foreground">
                    Display controls overlay on the video player
                  </p>
                </div>
                <Switch
                  checked={settings.showOverlay}
                  onCheckedChange={(checked) => handleSaveSetting('showOverlay', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <Label>Email</Label>
                  <p className="text-sm">{user.email}</p>
                </div>
                <div>
                  <Label>User ID</Label>
                  <p className="text-sm font-mono text-xs break-all">{user.id}</p>
                </div>
                <div>
                  <Label>Account Created</Label>
                  <p className="text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  localStorage.clear();
                  auditLogger.cacheCleared();
                  toast({ title: "Cache cleared", description: "Local storage has been cleared." });
                }}
              >
                Clear Local Cache
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={async () => {
                  auditLogger.signOut();
                  await supabase.auth.signOut();
                  navigate("/");
                }}
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}