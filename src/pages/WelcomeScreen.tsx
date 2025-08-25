import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MessageCircle, Users, Shield, ArrowRight } from 'lucide-react'

export function WelcomeScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-8 h-8 text-white" />
          <span className="text-xl font-bold text-white">CrestChat</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/auth">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              Sign In
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="gradient-blurple text-white">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-6 animate-fade-in">
            Your Place to Talk
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto animate-fade-in">
            Whether you're part of a school club, gaming group, worldwide art community, 
            or just a handful of friends that want to spend time together, CrestChat makes 
            it easy to talk every day and hang out more often.
          </p>
          <div className="flex items-center justify-center space-x-4 mb-12 animate-fade-in">
            <Link to="/auth">
              <Button size="lg" className="gradient-blurple text-white text-lg px-8 py-4">
                Open CrestChat in your browser
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center animate-fade-in">
            <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Create Communities</h3>
            <p className="text-gray-300">
              Create servers for your friends, gaming groups, or any community you can imagine.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center animate-fade-in">
            <MessageCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Real-time Chat</h3>
            <p className="text-gray-300">
              Send messages, share files, and stay connected with your community in real-time.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center animate-fade-in">
            <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
            <p className="text-gray-300">
              Your conversations are secure with end-to-end encryption and privacy controls.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="text-center mt-20">
          <h2 className="text-3xl font-bold text-white mb-8">Trusted by millions</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="animate-fade-in">
              <div className="text-4xl font-bold text-white mb-2">100M+</div>
              <div className="text-gray-300">Active Users</div>
            </div>
            <div className="animate-fade-in">
              <div className="text-4xl font-bold text-white mb-2">19M+</div>
              <div className="text-gray-300">Servers Created</div>
            </div>
            <div className="animate-fade-in">
              <div className="text-4xl font-bold text-white mb-2">4B+</div>
              <div className="text-gray-300">Messages Sent</div>
            </div>
            <div className="animate-fade-in">
              <div className="text-4xl font-bold text-white mb-2">99.9%</div>
              <div className="text-gray-300">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/20 mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-6 h-6 text-white" />
              <span className="text-white font-semibold">CrestChat</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 CrestChat. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
