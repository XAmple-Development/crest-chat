import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Mic, Shield, Sparkles, ArrowRight, Star, Zap, Globe, Lock } from "lucide-react";
import chatAppLogo from "@/assets/chat-app-logo.png";
import { useState, useEffect } from "react";

const features = [
  {
    icon: MessageCircle,
    title: "Real-time Messaging",
    description: "Instant messaging with support for threads, reactions, and file sharing",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Users,
    title: "Server Communities",
    description: "Create and join servers with custom roles and permissions",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Mic,
    title: "Voice & Video",
    description: "Crystal-clear voice channels with low-latency communication",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "End-to-end encryption and advanced moderation tools",
    color: "from-red-500 to-orange-500"
  }
];

const stats = [
  { number: "10K+", label: "Active Users" },
  { number: "500+", label: "Servers Created" },
  { number: "1M+", label: "Messages Sent" },
  { number: "99.9%", label: "Uptime" }
];

const testimonials = [
  {
    name: "Alex Chen",
    role: "Community Manager",
    content: "LovableChat has transformed how our community interacts. The real-time features are incredible!",
    avatar: "AC"
  },
  {
    name: "Sarah Johnson",
    role: "Gaming Team Lead",
    content: "Perfect for our gaming community. Voice channels work flawlessly and the UI is intuitive.",
    avatar: "SJ"
  },
  {
    name: "Mike Rodriguez",
    role: "Developer",
    content: "As a developer, I appreciate the clean API and robust features. Highly recommended!",
    avatar: "MR"
  }
];

export function WelcomeScreen() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <img src={chatAppLogo} alt="LovableChat" className="w-8 h-8" />
          <span className="text-xl font-bold text-foreground">LovableChat</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" className="hidden md:flex">
            Features
          </Button>
          <Button variant="ghost" className="hidden md:flex">
            Pricing
          </Button>
          <Button variant="ghost" className="hidden md:flex">
            Support
          </Button>
          <Button className="gradient-blurple text-white">
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary">
              <Sparkles className="w-4 h-4 mr-2" />
              Now with AI-powered features
            </div>
          </div>

          {/* Main Title */}
          <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Where Communities
              </span>
              <br />
              <span className="text-foreground">Come Alive</span>
            </h1>
          </div>

          {/* Subtitle */}
          <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Experience the next generation of community chat. Real-time messaging, 
              voice channels, and powerful moderation tools all in one beautiful platform.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Button 
              size="lg" 
              className="gradient-blurple text-white px-8 py-4 text-lg font-semibold hover:shadow-glow transition-all duration-300 group"
            >
              Start Your Community
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-4 text-lg border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
            >
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Everything you need to build amazing communities
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From small groups to massive communities, LovableChat provides all the tools 
              you need to create engaging, interactive spaces.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-card/50 backdrop-blur-sm p-8 rounded-2xl border border-border hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-16">
            Loved by communities worldwide
          </h2>
          
          <div className="relative">
            <div className="flex justify-center mb-8">
              {testimonials.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full mx-1 transition-all duration-300 ${
                    index === currentTestimonial ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            
            <div className="relative h-48">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-500 ${
                    index === currentTestimonial ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                >
                  <div className="bg-card p-8 rounded-2xl border border-border shadow-lg">
                    <div className="flex items-center justify-center mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    <p className="text-lg text-muted-foreground mb-6 italic">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                        {testimonial.avatar}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-foreground">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-12 rounded-3xl border border-primary/20">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Ready to build your community?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of communities already using LovableChat to connect, 
              collaborate, and create amazing experiences together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="gradient-blurple text-white px-8 py-4 text-lg font-semibold hover:shadow-glow transition-all duration-300"
              >
                Get Started Free
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-4 text-lg border-2 border-border hover:border-primary/50"
              >
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={chatAppLogo} alt="LovableChat" className="w-8 h-8" />
                <span className="text-xl font-bold text-foreground">LovableChat</span>
              </div>
              <p className="text-muted-foreground">
                Building the future of community communication.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Features</li>
                <li>Pricing</li>
                <li>API</li>
                <li>Documentation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Help Center</li>
                <li>Community</li>
                <li>Status</li>
                <li>Security</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 LovableChat. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}