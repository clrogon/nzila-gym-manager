import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dumbbell, Users, UserCheck, CreditCard, ArrowRight, CheckCircle, Shield } from 'lucide-react';
import { Helmet } from 'react-helmet';

const features = [
  {
    icon: Users,
    title: 'Gestão de Membros',
    description: 'Registe e gira facilmente todos os membros do seu ginásio num único lugar.',
  },
  {
    icon: UserCheck,
    title: 'Sistema de Entradas',
    description: 'Controle a frequência dos membros com entradas rápidas e fáceis.',
  },
  {
    icon: CreditCard,
    title: 'Controlo de Pagamentos',
    description: 'Registe pagamentos via Multicaixa Express, numerário ou transferência bancária.',
  },
];

const benefits = [
  'SaaS multi-inquilino para vários ginásios',
  'Controlo de frequência em tempo real',
  'Focado no mercado angolano (moeda AOA)',
  'Design responsivo para dispositivos móveis',
  'Autenticação segura',
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Nzila - Gestão de Ginásio para Angola</title>
        <meta
          name="description"
          content="Solução completa de gestão de ginásio desenvolvida para o mercado angolano. Gerir membros, entradas e pagamentos numa única plataforma."
        />
      </Helmet>

      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>

        <nav aria-label="Principal" className="relative container mx-auto px-4 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold">Nzila</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth?mode=login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button className="gradient-primary">Começar</Button>
            </Link>
          </div>
        </nav>

        <div className="relative container mx-auto px-4 py-24 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight">
              Gira o Seu Ginásio
              <span className="block text-primary">Com Facilidade</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A solução completa de gestão de ginásio desenvolvida para o mercado angolano. Gerir membros, entradas e pagamentos tudo numa única plataforma.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="gradient-primary text-lg px-8" aria-label="Iniciar teste gratuito">
                  Iniciar Teste Gratuito
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Tudo o Que Precisa</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Funcionalidades poderosas para ajudá-lo a gerir o seu ginásio com eficiência
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow animate-fade-in"
                style={{ ['--delay' as any]: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Desenvolvido para Ginásios Angolanos</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Nzila foi desenhado especificamente para o mercado angolano, com suporte para métodos de pagamento locais como Multicaixa Express e moeda AOA.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <img
                src="https://placehold.co/600x600/png?text=Dashboard+Nzila"
                alt="Exemplo de painel de controlo do ginásio"
                className="aspect-square rounded-3xl shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
            Segurança e Credibilidade
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Nzila protege os dados do seu ginásio com autenticação segura e práticas recomendadas de segurança.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="gradient-primary text-lg px-8" aria-label="Saiba mais sobre segurança">
              Saiba Mais
              <Shield className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
            Pronto para Transformar o Seu Ginásio?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Junte-se ao Nzila hoje e eleve a gestão do seu ginásio para o próximo nível.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="gradient-primary text-lg px-8" aria-label="Começar agora">
              Começar Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Nzila. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
