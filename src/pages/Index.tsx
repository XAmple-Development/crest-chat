import { AppLayout } from "@/components/AppLayout";
import chatAppLogo from "@/assets/chat-app-logo.png";

const Index = () => {
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
};

export default Index;
