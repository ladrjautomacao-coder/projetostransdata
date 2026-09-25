import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2 } from "lucide-react";
import { apexHostname } from "@/contexts/TenantBrandingContext";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PublicSignup() {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("public-signup", {
        body: {
          company_name: companyName.trim(),
          slug: slug.trim() || undefined,
          full_name: fullName.trim(),
          email: email.trim(),
          password,
        },
      });
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message || "Erro ao criar sua conta");
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInErr) throw signInErr;

      const newSlug = (data as any).slug as string;
      const host = apexHostname(window.location.hostname);
      const port = window.location.port ? `:${window.location.port}` : "";
      window.location.href = `${window.location.protocol}//${newSlug}.${host}${port}`;
    } catch (err: any) {
      toast({ title: "Erro ao criar sua conta", description: err.message, variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <CardTitle>Teste gratuito por 7 dias</CardTitle>
          <CardDescription>Crie a conta da sua empresa para começar a usar agora</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da empresa *</Label>
              <Input
                value={companyName}
                onChange={(e) => { setCompanyName(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }}
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Endereço da sua empresa</Label>
              <div className="flex items-center gap-1 text-sm">
                <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} maxLength={60} className="flex-1" />
                <span className="whitespace-nowrap text-muted-foreground">.{apexHostname(window.location.hostname)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Seu nome *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Seu e-mail *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Criando..." : "Começar meu teste grátis"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
