import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { 
  Crown, 
  Shield, 
  User, 
  MoreHorizontal,
  MessageCircle,
  Phone,
  Video,
  UserPlus,
  Ban,
  Gavel,
  Settings,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Monitor,
  Gamepad2,
  Music,
  Coffee,
  Moon,
  AlertTriangle,
  Sparkles,
  Zap,
  Star
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

interface OnlineUsersProps {
  selectedServerId: string | null;
}

const getRoleIcon = (role?: string) => {
  switch (role) {
    case 'owner':
      return <Crown className="w-3 h-3 text-yellow-500" />;
    case 'admin':
      return <Shield className="w-3 h-3 text-red-500" />;
    case 'moderator':
      return <Gavel className="w-3 h-3 text-orange-500" />;
    default:
      return null;
  }
};

const getRoleColor = (role?: string) => {
  switch (role) {
    case 'owner':
      return 'text-yellow-500';
    case 'admin':
      return 'text-red-500';
    case 'moderator':
      return 'text-orange-500';
    default:
      return 'text-foreground';
  }
};

const getStatusClass = (status: string) => {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'idle':
      return 'bg-yellow-500';
    case 'dnd':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
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
    default:
      return 'Offline';
  }
};

const getActivityIcon = (activity?: string) => {
  if (!activity) return null;
  
  const activityLower = activity.toLowerCase();
  if (activityLower.includes('playing')) return <Gamepad2 className="w-3 h-3" />;
  if (activityLower.includes('listening')) return <Music className="w-3 h-3" />;
  if (activityLower.includes('streaming')) return <Monitor className="w-3 h-3" />;
  if (activityLower.includes('watching')) return <Video className="w-3 h-3" />;
  if (activityLower.includes('competing')) return <Zap className="w-3 h-3" />;
  return <Coffee className="w-3 h-3" />;
};

export function OnlineUsers({ selectedServerId }: OnlineUsersProps) {
  const { onlineUsers, loading } = useOnlineUsers(selectedServerId);
  const { user } = useAuth();
  const { profile } = useProfile();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const currentUserRole = onlineUsers.find(u => u.id === user?.id)?.role;
  const isOwner = currentUserRole === 'owner';
  const isAdmin = currentUserRole === 'admin' || isOwner;
  const isModerator = currentUserRole === 'moderator' || isAdmin;

  const canManageUser = (targetUserRole?: string) => {
    if (isOwner) return true;
    if (isAdmin && targetUserRole !== 'owner') return true;
    if (isModerator && !['owner', 'admin'].includes(targetUserRole || '')) return true;
    return false;
  };

  const handleUserAction = (action: string, targetUserId: string) => {
    // Here you would implement the actual user management actions
    console.log(`${action} user ${targetUserId}`);
  };

  const UserContextMenu = ({ user: targetUser }: { user: any }) => {
    const canManage = canManageUser(targetUser.role);
    const isCurrentUser = targetUser.id === user?.id;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {!isCurrentUser && (
            <>
              <DropdownMenuItem>
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Phone className="w-4 h-4 mr-2" />
                Start Voice Call
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Video className="w-4 h-4 mr-2" />
                Start Video Call
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Friend
              </DropdownMenuItem>
            </>
          )}
          
          {canManage && !isCurrentUser && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Shield className="w-4 h-4 mr-2" />
                  Manage Roles
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={targetUser.role}>
                    <DropdownMenuRadioItem value="member" onClick={() => handleUserAction('role', targetUser.id)}>
                      Member
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="moderator" onClick={() => handleUserAction('role', targetUser.id)}>
                      Moderator
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="admin" onClick={() => handleUserAction('role', targetUser.id)}>
                      Admin
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem>
                <Ban className="w-4 h-4 mr-2" />
                Kick from Server
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Ban className="w-4 h-4 mr-2" />
                Ban from Server
              </DropdownMenuItem>
            </>
          )}
          
          {isCurrentUser && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                User Settings
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (!selectedServerId) {
    return (
      <div className="w-60 bg-discord-gray-200 border-l border-border h-screen flex flex-col">
        <div className="h-12 px-4 flex items-center border-b border-border">
          <h3 className="font-semibold text-foreground">Members</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Select a server to view members</p>
        </div>
      </div>
    );
  }

  const onlineCount = onlineUsers.filter(u => u.status === 'online').length;
  const idleCount = onlineUsers.filter(u => u.status === 'idle').length;
  const dndCount = onlineUsers.filter(u => u.status === 'dnd').length;
  const offlineCount = onlineUsers.filter(u => u.status === 'offline').length;

  return (
    <div className="w-60 bg-discord-gray-200 border-l border-border h-screen flex flex-col">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-border">
        <h3 className="font-semibold text-foreground">Members — {onlineUsers.length}</h3>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <UserPlus className="w-4 h-4" />
        </Button>
      </div>

      {/* Users List */}
      <div className="flex-1 p-2 discord-scrollbar overflow-y-auto">
        {loading ? (
          <div className="text-center text-muted-foreground text-sm mt-8">
            Loading members...
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm mt-8">
            No members found
          </div>
        ) : (
          <div className="space-y-1">
            {/* Online Section */}
            {onlineCount > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Online — {onlineCount}</span>
                </div>
                
                {onlineUsers
                  .filter(user => user.status === 'online')
                  .map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center px-2 py-1 mx-1 rounded hover:bg-secondary/50 cursor-pointer transition-all duration-150 group"
                    >
                      <div className="relative mr-3">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.display_name || user.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                            {(user.display_name || user.username).substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-discord-gray-200 ${getStatusClass(user.status)}`}></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <span className={`text-sm font-medium truncate ${getRoleColor(user.role)}`}>
                            {user.display_name || user.username}
                          </span>
                          {getRoleIcon(user.role)}
                                                     {user.is_verified && (
                             <div className="h-3 px-1 text-xs bg-secondary text-secondary-foreground rounded flex items-center">
                               <Sparkles className="w-2 h-2" />
                             </div>
                           )}
                        </div>
                        {user.activity && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground truncate">
                            {getActivityIcon(user.activity)}
                            <span>{user.activity}</span>
                          </div>
                        )}
                      </div>
                      
                      <UserContextMenu user={user} />
                    </div>
                  ))}
              </>
            )}

            {/* Idle Section */}
            {idleCount > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4 flex items-center space-x-2">
                  <Moon className="w-3 h-3 text-yellow-500" />
                  <span>Idle — {idleCount}</span>
                </div>
                
                {onlineUsers
                  .filter(user => user.status === 'idle')
                  .map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center px-2 py-1 mx-1 rounded hover:bg-secondary/50 cursor-pointer transition-all duration-150 group opacity-60"
                    >
                      <div className="relative mr-3">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.display_name || user.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-sm font-medium">
                            {(user.display_name || user.username).substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-discord-gray-200 ${getStatusClass(user.status)}`}></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <span className={`text-sm font-medium text-muted-foreground truncate ${getRoleColor(user.role)}`}>
                            {user.display_name || user.username}
                          </span>
                          {getRoleIcon(user.role)}
                        </div>
                        {user.activity && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground truncate">
                            {getActivityIcon(user.activity)}
                            <span>{user.activity}</span>
                          </div>
                        )}
                      </div>
                      
                      <UserContextMenu user={user} />
                    </div>
                  ))}
              </>
            )}

            {/* Do Not Disturb Section */}
            {dndCount > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4 flex items-center space-x-2">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span>Do Not Disturb — {dndCount}</span>
                </div>
                
                {onlineUsers
                  .filter(user => user.status === 'dnd')
                  .map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center px-2 py-1 mx-1 rounded hover:bg-secondary/50 cursor-pointer transition-all duration-150 group opacity-80"
                    >
                      <div className="relative mr-3">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.display_name || user.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground text-sm font-medium">
                            {(user.display_name || user.username).substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-discord-gray-200 ${getStatusClass(user.status)}`}></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <span className={`text-sm font-medium text-foreground truncate ${getRoleColor(user.role)}`}>
                            {user.display_name || user.username}
                          </span>
                          {getRoleIcon(user.role)}
                        </div>
                        {user.activity && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground truncate">
                            {getActivityIcon(user.activity)}
                            <span>{user.activity}</span>
                          </div>
                        )}
                      </div>
                      
                      <UserContextMenu user={user} />
                    </div>
                  ))}
              </>
            )}

            {/* Offline Section */}
            {offlineCount > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span>Offline — {offlineCount}</span>
                </div>
                
                {onlineUsers
                  .filter(user => user.status === 'offline')
                  .map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center px-2 py-1 mx-1 rounded hover:bg-secondary/50 cursor-pointer transition-all duration-150 group opacity-40"
                    >
                      <div className="relative mr-3">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.display_name || user.username}
                            className="w-8 h-8 rounded-full object-cover grayscale"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-gray-300 text-sm font-medium">
                            {(user.display_name || user.username).substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-discord-gray-200 ${getStatusClass(user.status)}`}></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <span className={`text-sm font-medium text-muted-foreground truncate ${getRoleColor(user.role)}`}>
                            {user.display_name || user.username}
                          </span>
                          {getRoleIcon(user.role)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last seen {new Date(user.last_seen || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <UserContextMenu user={user} />
                    </div>
                  ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}