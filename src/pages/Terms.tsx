import { Link } from 'react-router-dom';
import { ArrowLeft, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b border-border py-4">
        <div className="max-w-4xl mx-auto px-8 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/" className="flex items-center gap-3">
            <Dumbbell className="w-6 h-6 text-primary" />
            <span className="font-display text-lg">Nzila</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-8 pt-32 pb-16">
        <h1 className="text-4xl font-display font-light mb-8">Termos de Serviço</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-lg">Última atualização: Janeiro 2025</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-foreground">1. Aceitação dos Termos</h2>
            <p>
              Ao utilizar a plataforma Nzila, concorda com estes Termos de Serviço. Se não concordar com qualquer parte dos termos, não poderá utilizar os nossos serviços.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-foreground">2. Descrição do Serviço</h2>
            <p>
              A Nzila fornece uma plataforma de gestão de ginásio que inclui:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Gestão de membros e controlo de acessos</li>
              <li>Processamento de pagamentos</li>
              <li>Integração com hardware de controlo de acesso</li>
              <li>Relatórios e análises</li>
              <li>Agendamento de aulas e treinos</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-foreground">3. Responsabilidades do Utilizador</h2>
            <p>
              O utilizador compromete-se a:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer informações precisas e atualizadas</li>
              <li>Manter a confidencialidade das suas credenciais de acesso</li>
              <li>Utilizar o serviço de acordo com a legislação aplicável</li>
              <li>Não tentar comprometer a segurança da plataforma</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-foreground">4. Pagamentos e Faturação</h2>
            <p>
              Os planos de subscrição são faturados mensalmente. O não pagamento pode resultar na suspensão do serviço. Todas as taxas são apresentadas em Kwanzas (AOA).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-foreground">5. Limitação de Responsabilidade</h2>
            <p>
              A Nzila não será responsável por danos indiretos, incidentais ou consequentes resultantes da utilização ou incapacidade de utilizar os nossos serviços.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-foreground">6. Alterações aos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações serão comunicadas com antecedência razoável.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-foreground">7. Contacto</h2>
            <p>
              Para questões relacionadas com os termos de serviço, contacte-nos através de:
            </p>
            <p>
              Email: <a href="mailto:legal@nzila.ao" className="text-primary hover:underline">legal@nzila.ao</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
