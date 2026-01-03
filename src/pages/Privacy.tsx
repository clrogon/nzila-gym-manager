import { Link } from 'react-router-dom';
import { ArrowLeft, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Privacy() {
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
        <h1 className="text-4xl font-display font-light mb-8">Política de Privacidade</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-lg">Última atualização: Janeiro 2025</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-foreground">1. Informações que Recolhemos</h2>
            <p>
              A Nzila recolhe informações necessárias para fornecer os nossos serviços de gestão de ginásio, incluindo:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Dados de identificação pessoal (nome, email, telefone)</li>
              <li>Informações de pagamento e faturação</li>
              <li>Registos de entrada e atividade no ginásio</li>
              <li>Dados biométricos (quando autorizado pelo utilizador)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-foreground">2. Como Utilizamos os Dados</h2>
            <p>
              Os dados recolhidos são utilizados exclusivamente para:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Gestão de membros e controlo de acessos</li>
              <li>Processamento de pagamentos</li>
              <li>Comunicações relacionadas com o serviço</li>
              <li>Melhoria dos nossos serviços</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-foreground">3. Segurança dos Dados</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger os seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-foreground">4. Os Seus Direitos</h2>
            <p>
              Ao abrigo da legislação de proteção de dados, tem o direito de:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Aceder aos seus dados pessoais</li>
              <li>Solicitar a correção de dados incorretos</li>
              <li>Solicitar a eliminação dos seus dados</li>
              <li>Opor-se ao processamento dos seus dados</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-foreground">5. Contacto</h2>
            <p>
              Para questões relacionadas com a privacidade, contacte-nos através de:
            </p>
            <p>
              Email: <a href="mailto:privacidade@nzila.ao" className="text-primary hover:underline">privacidade@nzila.ao</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
