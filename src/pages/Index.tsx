import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dumbbell, Users, UserCheck, CreditCard, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  {
    id: 'member-management',
    icon: Users,
    title: 'Gestão Eficiente de Membros',
    description: 'Perfis, subscrições e faturação centralizados para controlar seu ginásio com eficiência.',
  },
  {
    id: 'scheduling-attendance',
    icon: UserCheck,
    title: 'Agendamento & Presenças Inteligente',
    description: 'Reservas, check-ins e relatórios de presença para gestão simplificada.',
  },
  {
    id: 'security-compliance',
    icon: CreditCard,
    title: 'Segurança desde o Início',
    description: 'Concebido com RBAC e conformidade GDPR para proteger seus dados.',
  },
];

const dashboardFeatures = [
  'Painel de controlo com métricas em tempo real',
  'Relatórios de frequência e receitas',
  'Gestão de pagamentos via Multicaixa Express',
  'Agendamento de aulas e sessões',
  'Controlo de acessos e entradas',
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>

        {/* Navigation */}
        <nav className="relative container mx-auto px-4 py-6 flex items-center justify-between" aria-label="Principal">
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

        {/* Hero Content */}
        <div className="relative container mx-auto px-4 py-24 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight">
              Nzila Gym Manager
              <span className="block text-primary">Gestão de ginásios modular e segura</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Para proprietários, administradores e treinadores que querem menos burocracia e mais crescimento. 
              Membros, pagamentos e agendamentos — tudo num único lugar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="gradient-primary text-lg px-8">
                  Iniciar Teste Gratuito
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/auth?mode=login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Entrar
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
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Tudo o Que Precisa
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Funcionalidades poderosas para ajudá-lo a gerir o seu ginásio com eficiência
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow animate-fade-in"
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

      {/* Dashboard Preview Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Visualize o Dashboard
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Veja como o Nzila simplifica o controlo de membros, pagamentos e agendamentos.
            </p>
            <ul className="space-y-4">
              {dashboardFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl p-8 flex items-center justify-center">
              <img
                src="https://placehold.co/600x600/e2e8f0/64748b?text=Dashboard+Preview"
                alt="Screenshot do dashboard do Nzila mostrando gestão de membros e relatórios"
                className="rounded-xl shadow-lg w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              Pronto para transformar a gestão do seu ginásio?
            </h2>
            <p className="text-muted-foreground text-lg">
              Junte-se ao Nzila hoje e eleve a gestão do seu ginásio para o próximo nível.
            </p>
            <Link to="/auth?mode=signup">
              <Button size="lg" className="gradient-primary text-lg px-8">
                Iniciar Teste Gratuito
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
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
