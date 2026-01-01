import { 
  CreditCard, 
  BarChart3, 
  Smartphone, 
  ShieldCheck, 
  Users,
  TrendingUp,
  Activity,
  LucideIcon
} from 'lucide-react';

export const TRANSLATIONS = {
  pt: {
    nav: { features: 'Funcionalidades', hardware: 'Acessos', pricing: 'Planos', testimonials: 'Clientes', access: 'LOGIN' },
    hero: {
      badge: 'Software de Gestão #1 em Angola',
      title: 'O Sistema Operativo',
      titleAccent: 'Do Seu Ginásio',
      desc: 'Automatize cobranças eletrónicas, controle torniquetes por biometria e elimine a inadimplência. A plataforma completa para gerir o seu negócio fitness.',
      cta: 'COMEÇAR AGORA',
      secondary: 'VER RECURSOS'
    },
    stats: [
      { label: 'Ginásios Ativos', value: '150+' },
      { label: 'Membros Geridos', value: '12k+' },
      { label: 'Pagamentos Processados', value: '250M' },
      { label: 'Redução de Inadimplência', value: '40%' },
    ],
    features: {
      tag: 'GESTÃO 360º',
      title: 'Tudo o que precisa',
      items: [
        { title: 'Pagamentos Digitais', desc: 'Processamento seguro e imediato. O sistema valida o pagamento e liberta a entrada na hora.' },
        { title: 'Controlo de Acessos', desc: 'Integração nativa com torniquetes. Bloqueio automático de membros com mensalidade em atraso.' },
        { title: 'Relatórios Financeiros', desc: 'Saiba exatamente quanto faturou hoje. Mapas de caixa, previsões e histórico de vendas.' },
        { title: 'Gestão de Membros', desc: 'Ficha completa do aluno: histórico de pagamentos, plano de treino e dados de saúde.' },
        { title: 'Renovações Automáticas', desc: 'Alertas automáticos via SMS e WhatsApp antes da mensalidade expirar para aumentar a retenção.' },
        { title: 'Multi-Filial', desc: 'Gira várias unidades (Luanda, Talatona, Benguela) num único painel administrativo.' }
      ]
    },
    hardware: {
      tag: 'SEGURANÇA',
      title: 'Controlo de Entradas',
      desc: 'O Nzila conecta-se diretamente aos equipamentos físicos do seu ginásio para garantir segurança total.',
      items: [
        { title: 'Biometria Facial', desc: 'Compatível com Hikvision e ZKTeco para entrada sem contacto.' },
        { title: 'Sincronização Offline', desc: 'O torniquete continua a funcionar mesmo se a internet cair.' },
        { title: 'Cartões RFID', desc: 'Gestão simples de cartões de acesso para staff e membros.' }
      ]
    },
    pricing: {
      title: 'Planos Flexíveis',
      popular: 'Melhor Escolha',
      plans: [
        { name: 'Starter', price: '35.000', period: 'Kz/mês', desc: 'Para pequenos estúdios e boxes de CrossFit.', cta: 'Criar Conta' },
        { name: 'Pro', price: '75.000', period: 'Kz/mês', desc: 'Para ginásios com controlo de acesso e alto volume.', cta: 'Falar com Vendas' },
        { name: 'Enterprise', price: 'Sob Consulta', period: '', desc: 'Para redes de ginásios e grandes complexos desportivos.', cta: 'Contactar Suporte' }
      ]
    },
    testimonials: {
      title: 'Quem Confia',
      items: [
        {
          name: 'João Manuel',
          role: 'Proprietário',
          gymName: 'Luanda Elite Fit',
          content: "Antes perdíamos muito tempo a conferir comprovativos de transferência. Com o Nzila e os pagamentos digitais, é tudo automático.",
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
        },
        {
          name: 'Maria Costa',
          role: 'Gerente',
          gymName: 'The Talatona Club',
          content: "O bloqueio automático no torniquete reduziu os pagamentos em atraso em quase 90%. O sistema paga-se sozinho.",
          image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200&h=200',
        }
      ]
    },
    faq: {
      title: 'Perguntas Frequentes',
      desc: 'Tire as suas dúvidas sobre a implementação do software.',
      items: [
        {
          question: "Preciso comprar torniquetes novos?",
          answer: "O Nzila integra com as principais marcas do mercado (Hikvision, ZKTeco). Provavelmente podemos usar os seus atuais.",
        },
        {
          question: "Como recebo o dinheiro dos pagamentos?",
          answer: "Os pagamentos eletrónicos vão diretamente para a conta bancária do ginásio. Nós apenas processamos a informação.",
        }
      ]
    },
    form: {
      title: 'Digitalize o seu Ginásio',
      gymLabel: 'Nome do Ginásio',
      nameLabel: 'Seu Nome',
      emailLabel: 'Email',
      phoneLabel: 'Telemóvel / WhatsApp',
      cta: 'AGENDAR DEMONSTRAÇÃO',
      success: 'Recebido com Sucesso',
      successDesc: 'A nossa equipa comercial entrará em contacto brevemente.',
      confidential: 'Seus dados estão seguros connosco.'
    }
  },
  en: {
    nav: { features: 'Features', hardware: 'Access Control', pricing: 'Pricing', testimonials: 'Clients', access: 'LOGIN' },
    hero: {
      badge: "#1 Gym Software in Angola",
      title: 'The Operating System',
      titleAccent: 'For Your Gym',
      desc: 'Automate electronic collections, control biometric access, and eliminate defaults. The complete platform to manage your fitness business.',
      cta: 'GET STARTED',
      secondary: 'VIEW FEATURES'
    },
    stats: [
      { label: 'Active Gyms', value: '150+' },
      { label: 'Members Managed', value: '12k+' },
      { label: 'Payments Processed', value: '250M' },
      { label: 'Default Reduction', value: '40%' },
    ],
    features: {
      tag: '360º MANAGEMENT',
      title: 'Everything you need',
      items: [
        { title: 'Digital Payments', desc: 'Secure and instant processing. The system validates payment and releases entry instantly.' },
        { title: 'Access Control', desc: 'Native integration with turnstiles. Automatically locks out members with overdue fees.' },
        { title: 'Financial Reports', desc: 'Know exactly your daily revenue. Cash maps, forecasts, and sales history.' },
        { title: 'Member Management', desc: 'Complete member profiles: payment history, workout plans, and health data.' },
        { title: 'Auto-Renewals', desc: 'Automated SMS and WhatsApp alerts before memberships expire to boost retention.' },
        { title: 'Multi-Branch', desc: 'Manage multiple locations (Luanda, Talatona, Benguela) from a single admin dashboard.' }
      ]
    },
    hardware: {
      tag: 'SECURITY',
      title: 'Entry Control',
      desc: 'Nzila connects directly to your gym\'s physical hardware to ensure total security.',
      items: [
        { title: 'Facial Biometrics', desc: 'Compatible with Hikvision and ZKTeco for contactless entry.' },
        { title: 'Offline Sync', desc: 'Turnstiles continue to work even if the internet goes down.' },
        { title: 'RFID Cards', desc: 'Simple access card management for staff and members.' }
      ]
    },
    pricing: {
      title: 'Flexible Plans',
      popular: 'Best Choice',
      plans: [
        { name: 'Starter', price: '35,000', period: 'Kz/mo', desc: 'For small studios and CrossFit boxes.', cta: 'Create Account' },
        { name: 'Pro', price: '75,000', period: 'Kz/mo', desc: 'For gyms with access control and high volume.', cta: 'Talk to Sales' },
        { name: 'Enterprise', price: 'Custom', period: '', desc: 'For gym chains and large sports complexes.', cta: 'Contact Support' }
      ]
    },
    testimonials: {
      title: 'Trusted By',
      items: [
        {
          name: 'João Manuel',
          role: 'Owner',
          gymName: 'Luanda Elite Fit',
          content: "We used to waste time checking transfer slips. With Nzila and digital payments, everything is automatic.",
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
        },
        {
          name: 'Maria Costa',
          role: 'Manager',
          gymName: 'The Talatona Club',
          content: "Automatic turnstile locking reduced overdue payments by nearly 90%. The system pays for itself.",
          image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200&h=200',
        }
      ]
    },
    faq: {
      title: 'Common Questions',
      desc: 'Answers to your questions about implementation.',
      items: [
        {
          question: "Do I need new turnstiles?",
          answer: "Nzila integrates with major market brands (Hikvision, ZKTeco). We can likely use your existing ones.",
        },
        {
          question: "How do I receive payments?",
          answer: "Electronic payments go directly to the gym's bank account. We simply process the data.",
        }
      ]
    },
    form: {
      title: 'Digitize Your Gym',
      gymLabel: 'Gym Name',
      nameLabel: 'Your Name',
      emailLabel: 'Email',
      phoneLabel: 'Mobile / WhatsApp',
      cta: 'SCHEDULE DEMO',
      success: 'Successfully Received',
      successDesc: 'Our sales team will contact you shortly.',
      confidential: 'Your data is secure with us.'
    }
  }
};

export const ICONS: LucideIcon[] = [
  CreditCard,
  ShieldCheck,
  BarChart3,
  Users,
  Smartphone,
  Activity
];

export const STATS_ICONS: LucideIcon[] = [
  Users,
  Users,
  CreditCard,
  TrendingUp
];

export const FEATURE_IMAGES = [
  "https://images.unsplash.com/photo-1622557850710-859a5cb40467?auto=format&fit=crop&q=80&w=400&h=300",
  "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&q=80&w=400&h=300",
  "https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&q=80&w=400&h=300",
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400&h=300",
  "https://images.unsplash.com/photo-1616075152664-4e12e6900a6e?auto=format&fit=crop&q=80&w=400&h=300",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=400&h=300"
];

export type Language = 'pt' | 'en';
