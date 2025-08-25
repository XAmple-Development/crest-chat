import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Loader2 } from 'lucide-react';
import chatAppLogo from "@/assets/chat-app-logo.png";

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      {/* SEO Meta tags handled by index.html */}
      <AppLayout />
      
      {/* Hidden logo for SEO */}
      <div className="hidden">
        <img src={chatAppLogo} alt="LovableChat - Modern Discord-style chat application" className="w-0 h-0" />
      </div>
    </>
  );
}
