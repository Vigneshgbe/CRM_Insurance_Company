import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(async () => {
      const success = await login(email, password);
      if (success) {
        const stored = sessionStorage.getItem("crm_user");
        const user = stored ? JSON.parse(stored) : null;
        toast({ title: "Welcome back!", description: "Logged in successfully." });
        if (user?.role === "client") {
          navigate("/portal");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError("Invalid credentials. Try: admin@hypernova.com / password (employee) or james.morrison@email.com / password (client)");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <h1 className="text-xl font-bold text-foreground">Hypernova CRM</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@hypernova.com" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 border-t pt-3">
            <p className="text-xs text-muted-foreground text-center mb-1">Demo Accounts:</p>
            <p className="text-xs text-muted-foreground text-center">Employee: admin@hypernova.com</p>
            <p className="text-xs text-muted-foreground text-center">Client: james.morrison@email.com</p>
            <p className="text-xs text-muted-foreground text-center">Password: password</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
