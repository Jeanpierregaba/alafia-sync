
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Clock, Users, Check, ChevronLeft, ChevronRight, Info, HelpCircle, ArrowRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState({
    hero: false,
    features: false,
    about: false,
    howItWorks: false,
    benefits: false,
    cta: false
  });

  // Animation trigger when section is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({
              ...prev,
              [entry.target.id]: true
            }));
          }
        });
      },
      { threshold: 0.2 }
    );

    const sections = ["hero", "features", "about", "howItWorks", "benefits", "cta"];
    sections.forEach(section => {
      const element = document.getElementById(section);
      if (element) observer.observe(element);
    });

    return () => {
      sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) observer.unobserve(element);
      });
    };
  }, []);

  // Hero slider images
  const heroImages = [
    "/placeholder.svg",
    "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&q=80&w=1200&h=700",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200&h=700",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200&h=700"
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b bg-background fixed w-full z-50">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 4C5.79 4 4 5.79 4 8C4 10.21 5.79 12 8 12C10.21 12 12 10.21 12 8C12 5.79 10.21 4 8 4ZM8.5 10H7.5V8.5H6V7.5H7.5V6H8.5V7.5H10V8.5H8.5V10Z" fill="white"/>
              </svg>
            </div>
            <span className="text-xl font-semibold">ALAFIA SYNC</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">À propos</a>
            <a href="#howItWorks" className="text-muted-foreground hover:text-foreground transition-colors">Comment ça marche</a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link to="/register">
              <Button>S'inscrire</Button>
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Hero section with Slider */}
      <section id="hero" className={`pt-28 pb-16 md:pt-36 md:pb-24 relative overflow-hidden transition-all duration-1000 ${isVisible.hero ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
        <div className="container relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col items-start text-left">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-6 animate-fade-in">
                Gestion des rendez-vous médicaux simplifiée
              </h1>
              <p className="text-lg text-muted-foreground mb-8 animate-fade-in" style={{animationDelay: "0.2s"}}>
                ALAFIA SYNC transforme l'expérience des patients et des prestataires de soins en Afrique. Planifiez, gérez et optimisez vos rendez-vous médicaux sans tracas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{animationDelay: "0.4s"}}>
                <Link to="/register">
                  <Button size="lg" className="hover-scale">Commencer maintenant</Button>
                </Link>
                <a href="#features">
                  <Button variant="outline" size="lg" className="hover-scale">
                    En savoir plus
                  </Button>
                </a>
              </div>
            </div>
            
            <div className="relative w-full max-w-lg mx-auto md:mx-0 animate-fade-in rounded-lg overflow-hidden shadow-xl">
              <Carousel className="w-full">
                <CarouselContent>
                  {heroImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="p-1">
                        <img 
                          src={image} 
                          alt={`Professional healthcare worker ${index + 1}`} 
                          className="w-full h-80 object-cover rounded-lg"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            </div>
          </div>
        </div>
      </section>

      {/* About section */}
      <section id="about" className={`py-16 md:py-24 bg-gradient-to-r from-secondary/30 to-secondary/10 transition-all duration-1000 ${isVisible.about ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
        <div className="container">
          <div className="flex items-center justify-center mb-12">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-4">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">À propos d'ALAFIA SYNC</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <h3 className="text-2xl font-semibold mb-4">Notre mission</h3>
              <p className="text-muted-foreground mb-6">
                ALAFIA SYNC est né d'une vision simple : rendre les soins de santé plus accessibles et efficaces en Afrique. Notre plateforme a été développée en collaboration avec des professionnels de la santé pour répondre aux défis uniques du système de santé africain.
              </p>
              <h3 className="text-2xl font-semibold mb-4">Notre engagement</h3>
              <p className="text-muted-foreground">
                Nous nous engageons à améliorer l'accès aux soins de santé grâce à la technologie, tout en respectant les particularités locales. Chaque fonctionnalité d'ALAFIA SYNC a été pensée pour fonctionner même dans les zones à connectivité limitée.
              </p>
            </div>
            
            <div className="order-1 md:order-2 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary/50 rounded-lg blur opacity-50"></div>
                <div className="relative bg-background rounded-lg p-8 shadow-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4">
                      <div className="text-4xl font-bold text-primary mb-2">200+</div>
                      <div className="text-sm text-muted-foreground">Établissements de santé</div>
                    </div>
                    <div className="text-center p-4">
                      <div className="text-4xl font-bold text-primary mb-2">1500+</div>
                      <div className="text-sm text-muted-foreground">Professionnels de santé</div>
                    </div>
                    <div className="text-center p-4">
                      <div className="text-4xl font-bold text-primary mb-2">12</div>
                      <div className="text-sm text-muted-foreground">Pays africains</div>
                    </div>
                    <div className="text-center p-4">
                      <div className="text-4xl font-bold text-primary mb-2">50K+</div>
                      <div className="text-sm text-muted-foreground">Patients satisfaits</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* How it works section */}
      <section id="howItWorks" className={`py-16 md:py-24 transition-all duration-1000 ${isVisible.howItWorks ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
        <div className="container">
          <div className="flex items-center justify-center mb-12">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-4">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Comment ça marche</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center group">
              <div className="relative mb-8">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/30 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-background border border-primary/20 h-24 w-24 rounded-full flex items-center justify-center">
                  <div className="text-3xl font-bold text-primary">1</div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4">Créez votre compte</h3>
              <p className="text-muted-foreground mb-4">
                Inscrivez-vous en tant que patient ou professionnel de santé en quelques minutes avec votre email.
              </p>
              <Link to="/register" className="group flex items-center text-primary hover:text-primary/80 transition-colors">
                <span className="font-medium">S'inscrire</span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="flex flex-col items-center text-center group">
              <div className="relative mb-8">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/30 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-background border border-primary/20 h-24 w-24 rounded-full flex items-center justify-center">
                  <div className="text-3xl font-bold text-primary">2</div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4">Recherchez des professionnels</h3>
              <p className="text-muted-foreground mb-4">
                Trouvez des médecins ou établissements de santé selon vos besoins et votre localisation.
              </p>
              <Link to="/app/doctors" className="group flex items-center text-primary hover:text-primary/80 transition-colors">
                <span className="font-medium">Explorer</span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="flex flex-col items-center text-center group">
              <div className="relative mb-8">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/30 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-background border border-primary/20 h-24 w-24 rounded-full flex items-center justify-center">
                  <div className="text-3xl font-bold text-primary">3</div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4">Prenez rendez-vous</h3>
              <p className="text-muted-foreground mb-4">
                Choisissez une date et une heure qui vous convient et recevez une confirmation instantanée.
              </p>
              <Link to="/app/appointments" className="group flex items-center text-primary hover:text-primary/80 transition-colors">
                <span className="font-medium">Planifier</span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features section */}
      <section id="features" className={`py-16 bg-secondary/50 transition-all duration-1000 ${isVisible.features ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Fonctionnalités principales</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-lg shadow-sm border transition-transform hover:translate-y-[-5px] duration-300">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Prise de rendez-vous en ligne</h3>
              <p className="text-muted-foreground">Planifiez facilement des rendez-vous avec les prestataires de soins de votre choix.</p>
            </div>
            
            <div className="bg-background p-6 rounded-lg shadow-sm border transition-transform hover:translate-y-[-5px] duration-300">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Rappels et notifications</h3>
              <p className="text-muted-foreground">Recevez des rappels automatiques pour vos rendez-vous et des mises à jour en temps réel.</p>
            </div>
            
            <div className="bg-background p-6 rounded-lg shadow-sm border transition-transform hover:translate-y-[-5px] duration-300">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Recherche de médecins</h3>
              <p className="text-muted-foreground">Trouvez rapidement des médecins et spécialistes qualifiés dans votre région.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Benefits section */}
      <section id="benefits" className={`py-16 transition-all duration-1000 ${isVisible.benefits ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Pourquoi choisir ALAFIA SYNC?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ul className="space-y-4">
              <li className="flex items-start gap-2 group">
                <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-medium">Réduction des temps d'attente</p>
                  <p className="text-muted-foreground">Optimisation des flux de patients pour réduire l'attente dans les établissements de santé.</p>
                </div>
              </li>
              <li className="flex items-start gap-2 group">
                <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-medium">Meilleure expérience patient</p>
                  <p className="text-muted-foreground">Interface intuitive conçue pour tous les niveaux de compétence technologique.</p>
                </div>
              </li>
              <li className="flex items-start gap-2 group">
                <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-medium">Gestion efficace pour les établissements</p>
                  <p className="text-muted-foreground">Optimisez votre agenda et réduisez les absences aux rendez-vous.</p>
                </div>
              </li>
            </ul>
            <ul className="space-y-4">
              <li className="flex items-start gap-2 group">
                <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-medium">Adapté aux réalités africaines</p>
                  <p className="text-muted-foreground">Fonctionne même avec une connectivité limitée et sur divers appareils.</p>
                </div>
              </li>
              <li className="flex items-start gap-2 group">
                <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-medium">Assistance IA intégrée</p>
                  <p className="text-muted-foreground">Recommandations personnalisées et optimisation des plannings.</p>
                </div>
              </li>
              <li className="flex items-start gap-2 group">
                <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-medium">Applications web et mobile</p>
                  <p className="text-muted-foreground">Accédez au service depuis n'importe quel appareil, n'importe où.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
      
      {/* CTA section */}
      <section id="cta" className={`py-16 bg-primary text-primary-foreground transition-all duration-1000 ${isVisible.cta ? 'opacity-100' : 'opacity-0 translate-y-10'}`}>
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à améliorer votre expérience de santé?</h2>
          <p className="max-w-[600px] mx-auto mb-8">
            Rejoignez des milliers d'utilisateurs qui transforment déjà leur expérience de soins de santé avec ALAFIA SYNC.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register">
              <Button variant="secondary" size="lg" className="hover-scale">S'inscrire maintenant</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="bg-transparent hover:bg-primary-foreground/10 hover-scale">
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 3C4.34 3 3 4.34 3 6C3 7.66 4.34 9 6 9C7.66 9 9 7.66 9 6C9 4.34 7.66 3 6 3ZM6.5 7.5H5.5V6.5H4.5V5.5H5.5V4.5H6.5V5.5H7.5V6.5H6.5V7.5Z" fill="white"/>
                </svg>
              </div>
              <span className="text-sm font-semibold">ALAFIA SYNC</span>
            </div>
            <div className="text-sm text-muted-foreground">
              &copy; 2025 ALAFIA SYNC. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
