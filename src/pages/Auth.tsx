import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mountain, Loader2 } from "lucide-react";
import loginHero from "@/assets/login-hero.jpg";

type AuthView = "login" | "signup" | "forgot";

const Auth = () => {
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    navigate("/dashboard");
  };

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
    toast.success("Cadastro realizado! Verifique seu e-mail para confirmar.");
    setView("login");
  };

  const handleForgot = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
    setView("login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === "login") await handleLogin();
      else if (view === "signup") await handleSignup();
      else await handleForgot();
    } catch (err: any) {
      toast.error(err.message || "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<AuthView, string> = {
    login: "Acessar Plataforma",
    signup: "Criar Conta",
    forgot: "Recuperar Senha",
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Hero visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={loginHero}
          alt="Jovens praticando esporte"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/70 to-sidebar/90" />
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16 animate-fade-in-left">
          <h1 className="font-display text-5xl leading-tight text-primary-foreground drop-shadow-lg max-w-md">
            O Futuro do Esporte Começa Aqui
          </h1>
          <p className="mt-4 text-primary-foreground/80 text-lg max-w-sm">
            Plataforma oficial dos Jogos Escolares de Roraima 2026
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-12 animate-fade-in-right">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo */}
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <span className="font-display text-2xl font-bold text-primary-foreground">JER</span>
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-wider text-foreground">JER 2026</h2>
              <p className="text-sm text-muted-foreground mt-1">Jogos Escolares de Roraima</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {view === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-muted-foreground">
                  Nome completo
                </Label>
                <Input
                  id="fullName"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  maxLength={100}
                  className="bg-card"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.gov.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                className="bg-card"
              />
            </div>
            {view !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-card"
                />
              </div>
            )}

            {view === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setView("forgot")}
                  className="text-xs text-primary hover:underline underline-offset-4"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full shadow-lg" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : titles[view]}
            </Button>
          </form>

          {/* Toggle views */}
          <div className="text-center text-sm text-muted-foreground">
            {view === "login" ? (
              <>
                Não tem conta?{" "}
                <button type="button" onClick={() => setView("signup")} className="text-primary font-medium hover:underline underline-offset-4">
                  Cadastre-se
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button type="button" onClick={() => setView("login")} className="text-primary font-medium hover:underline underline-offset-4">
                  Fazer login
                </button>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="text-center space-y-2 pt-4 border-t border-border">
            <div className="flex items-center justify-center gap-1.5">
              <Mountain className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground/60">
                Desenvolvido por <span className="font-semibold">Zenith Compete</span>
              </span>
            </div>
            <button type="button" className="text-xs text-primary hover:underline underline-offset-4">
              Suporte Técnico
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
