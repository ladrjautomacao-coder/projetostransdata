import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, User, Signal, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import logoTransdata from "@/assets/logo-transdata.png.asset.json";
import LogoAnimation from "@/components/LogoAnimation";

function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated grid lines */}
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: 'linear-gradient(hsl(28 90% 52%) 1px, transparent 1px), linear-gradient(90deg, hsl(28 90% 52%) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      {/* Horizontal scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        animate={{ top: ["-5%", "105%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Vertical scan line */}
      <motion.div
        className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent"
        animate={{ left: ["-5%", "105%"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-primary/30"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Glowing orbs */}
      <motion.div
        className="absolute w-64 h-64 rounded-full blur-3xl bottom-[10%] right-[5%]"
        style={{ background: "hsl(28 90% 52% / 0.08)" }}
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-48 h-48 rounded-full blur-3xl top-[15%] left-[10%]"
        style={{ background: "hsl(28 90% 52% / 0.05)" }}
        animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <motion.line
          x1="10%" y1="20%" x2="40%" y2="60%"
          stroke="hsl(28 90% 52%)" strokeWidth="1"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.line
          x1="60%" y1="10%" x2="85%" y2="70%"
          stroke="hsl(28 90% 52%)" strokeWidth="1"
          animate={{ opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.line
          x1="30%" y1="80%" x2="70%" y2="30%"
          stroke="hsl(28 90% 52%)" strokeWidth="1"
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </svg>
    </div>
  );
}

export default function Login() {
  const { session, loading } = useAuth();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [cargo, setCargo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cargoOptions = [
    "Diretoria",
    "Comercial",
    "Projetos",
    "Suporte técnico",
    "Relacionamento",
    "Implantação",
    "Produtos",
    "Desenvolvimento",
  ];


  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, cargo }, emailRedirectTo: window.location.origin }
        });
        if (error) throw error;
        toast({ title: "Solicitação enviada!", description: "Seu cadastro foi recebido e será analisado por um administrador. Você receberá acesso assim que for aprovado." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message === "Email not confirmed") {
            toast({ title: "Acesso pendente", description: "Seu cadastro ainda não foi aprovado por um administrador. Aguarde a liberação do acesso.", variant: "destructive" });
            return;
          }
          throw error;
        }
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen relative overflow-hidden">
      {/* Left panel - branding with animated background */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground relative items-center justify-center">
        <AnimatedGrid />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 text-center space-y-8 px-12"
        >
          <LogoAnimation />
          <div>
            <h2 className="text-3xl font-bold text-background mb-3">Sistema de Gestão</h2>
            <p className="text-background/50 text-lg">Plataforma de gerenciamento de projetos de bilhetagem</p>
          </div>
          <motion.div
            className="flex items-center justify-center gap-2 text-primary max-w-xs mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Signal className="h-4 w-4 animate-pulse shrink-0" />
            <span className="text-sm font-medium tracking-wide">Conectado à performance que impulsiona o sucesso e acelera o crescimento</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="w-full max-w-md shadow-lg border-primary/20 glow-orange">
            <CardHeader className="text-center space-y-3">
              <div className="lg:hidden flex justify-center mb-2">
                <img src={logoTransdata.url} alt="Transdata" className="h-20 rounded-lg" />
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
                {isSignUp && (
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Select value={cargo} onValueChange={setCargo} required>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Selecione a área" />
                      </SelectTrigger>
                      <SelectContent>
                        {cargoOptions.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
        </motion.div>
      </div>
    </div>
  );
}
