import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Auth() {
  const [params] = useSearchParams();
  const modeParam = (params.get("mode") || "signin").toLowerCase();
  const mode = useMemo(() => (modeParam === "register" ? "register" : "signin"), [modeParam]);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const title = mode === "signin" ? "Sign in – Chado" : "Register – Chado";
    document.title = title;
    const desc = mode === "signin" ? "Sign in to Chado to reserve unlimited songs." : "Create your Chado account to reserve unlimited songs.";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
    const link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const canonical = window.location.href;
    if (link) link.href = canonical; else {
      const l = document.createElement("link");
      l.rel = "canonical";
      l.href = canonical;
      document.head.appendChild(l);
    }
  }, [mode]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back", description: "Signed in successfully" });
        navigate("/");
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        toast({ title: "Check your inbox", description: "Confirm your email to finish registration." });
        navigate("/");
      }
    } catch (err: any) {
      toast({ title: "Authentication error", description: err.message || "Please try again" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container py-10">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "signin" ? "Sign in" : "Create an account"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm" htmlFor="email">Email</label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
              </div>
              <div className="space-y-1">
                <label className="text-sm" htmlFor="password">Password</label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full" variant="gradient" disabled={loading}>
                {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Register"}
              </Button>
            </form>
            <div className="mt-3 text-sm text-muted-foreground">
              {mode === "signin" ? (
                <span>Don’t have an account? <Link className="underline" to="/auth?mode=register">Register</Link></span>
              ) : (
                <span>Already have an account? <Link className="underline" to="/auth?mode=signin">Sign in</Link></span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
