import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dumbbell, Users, UserCheck, CreditCard, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Member Management',
    description: 'Easily register and manage all your gym members in one place.',
  },
  {
    icon: UserCheck,
    title: 'Check-in System',
    description: 'Track member attendance with quick and easy check-ins.',
  },
  {
    icon: CreditCard,
    title: 'Payment Tracking',
    description: 'Record payments with Multicaixa Express, cash, or bank transfer.',
  },
];

const benefits = [
  'Multi-tenant SaaS for multiple gyms',
  'Real-time attendance tracking',
  'Angolan market focused (AOA currency)',
  'Mobile-responsive design',
  'Secure authentication',
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

        <nav className="relative container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold">Nzila</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button className="gradient-primary">Get Started</Button>
            </Link>
          </div>
        </nav>

        <div className="relative container mx-auto px-4 py-24 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight">
              Manage Your Gym
              <span className="block text-primary">With Ease</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The complete gym management solution built for the Angolan market. 
              Track members, check-ins, and payments all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/auth">
                <Button size="lg" className="gradient-primary text-lg px-8">
                  Start Free Trial
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
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features to help you run your gym efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
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
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                Built for Angolan Gyms
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
              Nzila is designed specifically for the Angolan market, with support for 
              local payment methods like Multicaixa Express and AOA currency.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl p-8 flex items-center justify-center">
                <div className="w-full max-w-sm space-y-4">
                  <div className="h-12 bg-card rounded-lg shadow-sm animate-pulse-soft" />
                  <div className="h-32 bg-card rounded-lg shadow-sm" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-card rounded-lg shadow-sm" />
                    <div className="h-20 bg-card rounded-lg shadow-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              Ready to Transform Your Gym?
            </h2>
            <p className="text-muted-foreground text-lg">
              Join Nzila today and take your gym management to the next level.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gradient-primary text-lg px-8">
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Nzila. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}