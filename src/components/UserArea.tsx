import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Mic, 
  MicOff, 
  Headphones, 
  HeadphonesIcon,
  Volume2,
  VolumeX,
  Monitor,
  MonitorOff,
  MoreHorizontal,
  User,
  Moon,
  Coffee,
  AlertTriangle,
  Wifi,
  WifiOff,
  Gamepad2,
  Music,
  Video,
  Phone,
  MessageCircle,
  Crown,
  Shield,
  Zap,
  Sparkles
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';

interface UserAreaProps {
  onOpenProfileSettings: () => void;
}

export function UserArea({ onOpenProfileSettings }: UserAreaProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  
  const [status, setStatus] = useState(profile?.status || 'online');
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [customStatus, setCustomStatus] = useState(profile?.custom_status || '');
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';
  const username = profile?.username || user?.email?.split('@')[0] || 'user';
  const discriminator = profile?.discriminator || '0001';
  const avatarUrl = profile?.avatar_url;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'dnd':
        return 'bg-red-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-green-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <div className="w-3 h-3 bg-green-500 rounded-full" />;
      case 'idle':
        return <Moon className="w-3 h-3 text-yellow-500" />;
      case 'dnd':
        return <AlertTriangle className="w-3 h-3 text-red-500" />;
      case 'offline':
        return <div className="w-3 h-3 bg-gray-500 rounded-full" />;
      default:
        return <div className="w-3 h-3 bg-green-500 rounded-full" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'idle':
        return 'Idle';
      case 'dnd':
        return 'Do Not Disturb';
      case 'offline':
        return 'Offline';
      default:
        return 'Online';
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    // Here you would update the user's status in the database
    toast({
      title: "Status updated",
      description: `Your status is now ${getStatusText(newStatus)}`
    });
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? "Unmuted" : "Muted",
      description: isMuted ? "Your microphone is now active" : "Your microphone is now muted"
    });
  };

  const handleDeafenToggle = () => {
    setIsDeafened(!isDeafened);
    toast({
      title: isDeafened ? "Undeafened" : "Deafened",
      description: isDeafened ? "You can now hear audio" : "You are now deafened"
    });
  };

  const handleStreamToggle = () => {
    setIsStreaming(!isStreaming);
    toast({
      title: isStreaming ? "Stream ended" : "Stream started",
      description: isStreaming ? "Your stream has ended" : "You are now streaming"
    });
  };

  const handleVideoToggle = () => {
    setIsVideoCall(!isVideoCall);
    toast({
      title: isVideoCall ? "Video call ended" : "Video call started",
      description: isVideoCall ? "Your video call has ended" : "You are now in a video call"
    });
  };

  return (
    <div className="h-16 bg-discord-gray-300 px-2 flex items-center justify-between">
      {/* User Info Section */}
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        {/* Avatar with Status */}
        <div className="relative">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
              {displayName.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-discord-gray-300 ${getStatusColor(status)}`} />
        </div>

        {/* User Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium text-foreground truncate">
              {displayName}
            </span>
            {profile?.is_verified && (
              <Badge variant="secondary" className="h-4 px-1 text-xs">
                <Sparkles className="w-3 h-3" />
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-muted-foreground">
              {username}#{discriminator}
            </span>
            {customStatus && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground truncate">
                  {customStatus}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-1">
        {/* Status Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-secondary/50">
              {getStatusIcon(status)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <div className="text-sm font-medium">Set Status</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={status} onValueChange={handleStatusChange}>
              <DropdownMenuRadioItem value="online" className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span>Online</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="idle" className="flex items-center space-x-2">
                <Moon className="w-3 h-3 text-yellow-500" />
                <span>Idle</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dnd" className="flex items-center space-x-2">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                <span>Do Not Disturb</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="offline" className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full" />
                <span>Invisible</span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Edit Custom Status
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mute Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${isMuted ? 'text-red-500 hover:text-red-400' : 'hover:bg-secondary/50'}`}
          onClick={handleMuteToggle}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>

        {/* Deafen Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${isDeafened ? 'text-red-500 hover:text-red-400' : 'hover:bg-secondary/50'}`}
          onClick={handleDeafenToggle}
        >
          {isDeafened ? <VolumeX className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
        </Button>

        {/* Stream Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${isStreaming ? 'text-purple-500 hover:text-purple-400' : 'hover:bg-secondary/50'}`}
          onClick={handleStreamToggle}
        >
          <Monitor className="w-4 h-4" />
        </Button>

        {/* Video Call Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${isVideoCall ? 'text-blue-500 hover:text-blue-400' : 'hover:bg-secondary/50'}`}
          onClick={handleVideoToggle}
        >
          <Video className="w-4 h-4" />
        </Button>

        {/* Settings Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-secondary/50">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onOpenProfileSettings}>
              <User className="w-4 h-4 mr-2" />
              User Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              App Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Wifi className="w-4 h-4 mr-2" />
              Connection Status
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Gamepad2 className="w-4 h-4 mr-2" />
              Game Activity
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Music className="w-4 h-4 mr-2" />
              Spotify
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <MessageCircle className="w-4 h-4 mr-2" />
              Help & Support
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Zap className="w-4 h-4 mr-2" />
              What's New
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report a Bug
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Indicators */}
      {(isMuted || isDeafened || isStreaming || isVideoCall) && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20" />
      )}
    </div>
  );
}
