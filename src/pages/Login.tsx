import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, User, Signal } from "lucide-react";
import logoTransmobile from "@/assets/logo-transmobile.png";

export default function Login() {
  const { session, loading } = useAuth();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin }
        });
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar o cadastro." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen relative overflow-hidden">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground relative items-center justify-center">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(hsl(28 90% 52% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(28 90% 52% / 0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-20 left-10 w-48 h-48 bg-primary/5 rounded-full blur-2xl" />
        <div className="relative z-10 text-center space-y-8 px-12">
          <img src={logoTransmobile} alt="TransMobile" className="h-16 mx-auto" />
          <div>
            <h2 className="text-3xl font-bold text-background mb-3">Sistema de Gestão</h2>
            <p className="text-background/50 text-lg">Plataforma de gerenciamento de projetos de telemetria</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-primary">
            <Signal className="h-4 w-4 animate-pulse" />
            <span className="text-sm uppercase tracking-[0.15em] font-semibold">Conectado</span>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg border-primary/20 glow-orange">
          <CardHeader className="text-center space-y-3">
            <div className="lg:hidden flex justify-center mb-2">
              <img src={logoTransmobile} alt="TransMobile" className="h-10" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isSignUp ? "Criar Conta" : "Acessar Sistema"}
            </CardTitle>
            <CardDescription>
              {isSignUp ? "Preencha os dados para criar sua conta" : "Entre com suas credenciais"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Nome completo" value={fullName} onChange={e => setFullName(e.target.value)} className="pl-10" required />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="pl-10" required minLength={6} />
              </div>
              <Button type="submit" className="w-full font-semibold" disabled={submitting}>
                {submitting ? "Aguarde..." : isSignUp ? "Criar Conta" : "Entrar"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm space-y-2">
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline font-medium">
                {isSignUp ? "Já tem conta? Faça login" : "Não tem conta? Cadastre-se"}
              </button>
              {!isSignUp && (
                <div><Link to="/forgot-password" className="text-muted-foreground hover:text-primary transition-colors">Esqueci minha senha</Link></div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
