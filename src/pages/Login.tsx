import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEFAULT_ROUTE } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import logoImage from '@/assets/logo-concrem-preta.png';
import backgroundImage from '@/assets/background-hub.png';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const { error, profile } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({ title: error, variant: 'destructive' });
      return;
    }

    if (profile) {
      navigate(DEFAULT_ROUTE[profile.perfil], { replace: true });
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})`, filter: 'blur(3px)' }}
      />
      <div className="fixed inset-0 bg-black/40" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm px-4">
        <Card className="shadow-2xl border-0">
          <CardHeader className="pb-2 flex flex-col items-center gap-3 pt-8">
            <img src={logoImage} alt="Concrem" className="h-16 object-contain" />
            <div className="text-center">
              <h1 className="text-xl font-bold text-foreground">Sistema de Gestão</h1>
              <p className="text-sm text-muted-foreground mt-1">Faça login para continuar</p>
            </div>
          </CardHeader>
          <CardContent className="pt-4 pb-8 px-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 text-white mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-white/60 mt-6">
          {new Date().getFullYear()} — Desenvolvido por Infinity Inteligência e Inovação
        </p>
      </div>
    </div>
  );
}
