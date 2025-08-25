import { Crown, Shield, User } from "lucide-react";

interface OnlineUser {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  role?: 'owner' | 'admin' | 'member';
  activity?: string;
}

const onlineUsers: OnlineUser[] = [
  {
    id: '1',
    username: 'ServerOwner',
    avatar: 'SO',
    status: 'online',
    role: 'owner',
    activity: 'Managing server'
  },
  {
    id: '2',
    username: 'AdminUser',
    avatar: 'AU',
    status: 'online',
    role: 'admin',
    activity: 'Playing Valorant'
  },
  {
    id: '3',
    username: 'AliceCooper',
    avatar: 'AC',
    status: 'online',
    role: 'member'
  },
  {
    id: '4',
    username: 'BobWilson',
    avatar: 'BW',
    status: 'idle',
    role: 'member',
    activity: 'Away'
  },
  {
    id: '5',
    username: 'SarahChen',
    avatar: 'SC',
    status: 'dnd',
    role: 'member',
    activity: 'In a meeting'
  },
  {
    id: '6',
    username: 'DevUser',
    avatar: 'DU',
    status: 'online',
    role: 'member',
    activity: 'Visual Studio Code'
  }
];

const getRoleIcon = (role?: string) => {
  switch (role) {
    case 'owner':
      return <Crown className="w-3 h-3 text-discord-yellow" />;
    case 'admin':
      return <Shield className="w-3 h-3 text-discord-red" />;
    default:
      return null;
  }
};

const getStatusClass = (status: string) => {
  switch (status) {
    case 'online':
      return 'status-online';
    case 'idle':
      return 'status-idle';
    case 'dnd':
      return 'status-dnd';
    default:
      return 'status-offline';
  }
};

export function OnlineUsers() {
  return (
    <div className="w-60 bg-discord-gray-200 border-l border-border h-screen flex flex-col">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-border">
        <h3 className="font-semibold text-foreground">Members — {onlineUsers.length}</h3>
      </div>

      {/* Users List */}
      <div className="flex-1 p-2 discord-scrollbar overflow-y-auto">
        <div className="space-y-1">
          {/* Online Section */}
          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Online — {onlineUsers.filter(u => u.status === 'online').length}
          </div>
          
          {onlineUsers
            .filter(user => user.status === 'online')
            .map((user) => (
              <div
                key={user.id}
                className="flex items-center px-2 py-1 mx-1 rounded hover:bg-secondary/50 cursor-pointer transition-all duration-150 group"
              >
                <div className="relative mr-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {user.avatar}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStatusClass(user.status)}`}></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {user.username}
                    </span>
                    {getRoleIcon(user.role)}
                  </div>
                  {user.activity && (
                    <div className="text-xs text-muted-foreground truncate">
                      {user.activity}
                    </div>
                  )}
                </div>
              </div>
            ))}

          {/* Idle/Away Section */}
          {onlineUsers.filter(u => u.status === 'idle').length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4">
                Idle — {onlineUsers.filter(u => u.status === 'idle').length}
              </div>
              
              {onlineUsers
                .filter(user => user.status === 'idle')
                .map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center px-2 py-1 mx-1 rounded hover:bg-secondary/50 cursor-pointer transition-all duration-150 group opacity-60"
                  >
                    <div className="relative mr-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-sm font-medium">
                        {user.avatar}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStatusClass(user.status)}`}></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium text-muted-foreground truncate">
                          {user.username}
                        </span>
                        {getRoleIcon(user.role)}
                      </div>
                      {user.activity && (
                        <div className="text-xs text-muted-foreground truncate">
                          {user.activity}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </>
          )}

          {/* Do Not Disturb Section */}
          {onlineUsers.filter(u => u.status === 'dnd').length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4">
                Do Not Disturb — {onlineUsers.filter(u => u.status === 'dnd').length}
              </div>
              
              {onlineUsers
                .filter(user => user.status === 'dnd')
                .map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center px-2 py-1 mx-1 rounded hover:bg-secondary/50 cursor-pointer transition-all duration-150 group opacity-80"
                  >
                    <div className="relative mr-3">
                      <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground text-sm font-medium">
                        {user.avatar}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStatusClass(user.status)}`}></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium text-foreground truncate">
                          {user.username}
                        </span>
                        {getRoleIcon(user.role)}
                      </div>
                      {user.activity && (
                        <div className="text-xs text-muted-foreground truncate">
                          {user.activity}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}