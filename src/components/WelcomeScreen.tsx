import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Mic, Shield } from "lucide-react";
import chatAppLogo from "@/assets/chat-app-logo.png";

const features = [
  {
    icon: MessageCircle,
    title: "Real-time Messaging",
    description: "Instant messaging with support for threads, reactions, and file sharing"
  },
  {
    icon: Users,
    title: "Server Communities",
    description: "Create and join servers with custom roles and permissions"
  },
  {
    icon: Mic,
    title: "Voice & Video",
    description: "Crystal-clear voice channels with low-latency communication"
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "End-to-end encryption and advanced moderation tools"
  }
];

export function WelcomeScreen() {
  return (
    <div className="min-h-screen bg-gradient-card flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Logo and Title */}
        <div className="space-y-4 animate-fade-in">
          <img 
            src={chatAppLogo} 
            alt="LovableChat Logo" 
            className="w-32 h-20 mx-auto object-contain"
          />
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            LovableChat
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A modern, Discord-inspired chat platform built for communities. 
            Connect with friends, join servers, and communicate seamlessly.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-card p-6 rounded-xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-card group"
            >
              <feature.icon className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Button 
            size="lg" 
            className="gradient-blurple text-white px-8 py-3 text-lg font-semibold hover:shadow-glow transition-all duration-300"
          >
            Get Started
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="px-8 py-3 text-lg border-primary/50 hover:bg-primary/10"
          >
            Learn More
          </Button>
        </div>

        {/* Demo Notice */}
        <div className="mt-12 p-4 bg-secondary/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            🚀 <strong>Demo Mode:</strong> This is a beautiful frontend interface. 
            Connect to Supabase to enable real-time messaging, authentication, and all backend features.
          </p>
        </div>
      </div>
    </div>
  );
}