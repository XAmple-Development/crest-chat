import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useServerManagement, ServerMember } from '@/hooks/useServerManagement';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { 
  Settings, 
  Hash, 
  Volume2, 
  Users, 
  Crown, 
  Shield, 
  User, 
  Trash2, 
  Edit, 
  Plus,
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: any;
  onServerUpdate?: () => void;
}

export function ServerSettingsModal({ isOpen, onClose, server, onServerUpdate }: ServerSettingsModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [serverName, setServerName] = useState(server?.name || '');
  const [serverDescription, setServerDescription] = useState(server?.description || '');
  const [isPublic, setIsPublic] = useState(server?.is_public || false);
  const [members, setMembers] = useState<ServerMember[]>([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice'>('text');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { user } = useAuth();
  const { profile } = useProfile();
  const { 
    loading, 
    updateServer, 
    createChannel, 
    updateChannel, 
    deleteChannel, 
    getServerMembers, 
    updateMemberRole, 
    removeMember, 
    deleteServer 
  } = useServerManagement();

  const isOwner = user?.id === server?.owner_id;
  const isAdmin = members.find(m => m.user_id === user?.id)?.role === 'admin';

  useEffect(() => {
    if (isOpen && server) {
      setServerName(server.name || '');
      setServerDescription(server.description || '');
      setIsPublic(server.is_public || false);
      loadMembers();
    }
  }, [isOpen, server]);

  const loadMembers = async () => {
    if (server) {
      const serverMembers = await getServerMembers(server.id);
      setMembers(serverMembers);
    }
  };

  const handleSaveServer = async () => {
    if (!server) return;

    const updated = await updateServer(server.id, {
      name: serverName,
      description: serverDescription,
      is_public: isPublic
    });

    if (updated) {
      onServerUpdate?.();
    }
  };

  const handleCreateChannel = async () => {
    if (!server || !newChannelName.trim()) return;

    const created = await createChannel(server.id, {
      name: newChannelName.trim(),
      type: newChannelType
    });

    if (created) {
      setNewChannelName('');
      onServerUpdate?.();
    }
  };

  const handleUpdateMemberRole = async (userId: string, role: 'admin' | 'moderator' | 'member') => {
    if (!server) return;

    const updated = await updateMemberRole(server.id, userId, role);
    if (updated) {
      loadMembers();
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!server) return;

    const removed = await removeMember(server.id, userId);
    if (removed) {
      loadMembers();
    }
  };

  const handleDeleteServer = async () => {
    if (!server) return;

    const deleted = await deleteServer(server.id);
    if (deleted) {
      onClose();
      onServerUpdate?.();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-orange-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Server Settings</span>
            {isOwner && <Badge variant="secondary">Owner</Badge>}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="server-name">Server Name</Label>
                <Input
                  id="server-name"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="Enter server name"
                  disabled={!isOwner}
                />
              </div>

              <div>
                <Label htmlFor="server-description">Server Description</Label>
                <Textarea
                  id="server-description"
                  value={serverDescription}
                  onChange={(e) => setServerDescription(e.target.value)}
                  placeholder="Describe your server"
                  disabled={!isOwner}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="public-server">Public Server</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow anyone to join with an invite link
                  </p>
                </div>
                <Switch
                  id="public-server"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  disabled={!isOwner}
                />
              </div>

              {isOwner && (
                <Button onClick={handleSaveServer} disabled={loading} className="w-full">
                  Save Changes
                </Button>
              )}
            </div>

            {/* Danger Zone */}
            {isOwner && (
              <div className="border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h3 className="font-semibold text-destructive">Danger Zone</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete a server, there is no going back. Please be certain.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Server
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Server Roles</h3>
                <Button size="sm" disabled={!isOwner}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Role
                </Button>
              </div>

              <div className="space-y-2">
                {['owner', 'admin', 'moderator', 'member'].map((role) => (
                  <div key={role} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getRoleIcon(role)}
                      <div>
                        <div className="font-medium capitalize">{role}</div>
                        <div className="text-sm text-muted-foreground">
                          {role === 'owner' && 'Full server control'}
                          {role === 'admin' && 'Manage server and members'}
                          {role === 'moderator' && 'Moderate channels and members'}
                          {role === 'member' && 'Basic server access'}
                        </div>
                      </div>
                    </div>
                    <Badge className={getRoleColor(role)}>
                      {members.filter(m => m.role === role).length} members
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Channels Tab */}
          <TabsContent value="channels" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Server Channels</h3>
                <Button size="sm" onClick={() => setNewChannelName('')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Channel
                </Button>
              </div>

              {/* Create New Channel */}
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-medium">Create New Channel</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="channel-name">Channel Name</Label>
                    <Input
                      id="channel-name"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="new-channel"
                    />
                  </div>
                  <div>
                    <Label htmlFor="channel-type">Channel Type</Label>
                    <Select value={newChannelType} onValueChange={(value: 'text' | 'voice') => setNewChannelType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">
                          <div className="flex items-center space-x-2">
                            <Hash className="w-4 h-4" />
                            <span>Text Channel</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="voice">
                          <div className="flex items-center space-x-2">
                            <Volume2 className="w-4 h-4" />
                            <span>Voice Channel</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleCreateChannel} disabled={!newChannelName.trim() || loading}>
                  Create Channel
                </Button>
              </div>

              {/* Existing Channels */}
              <div className="space-y-2">
                <h4 className="font-medium">Existing Channels</h4>
                {server?.channels?.map((channel: any) => (
                  <div key={channel.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {channel.type === 'text' ? (
                        <Hash className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium">#{channel.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {channel.description || 'No description'}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Channel
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Channel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Server Members</h3>
                <Badge variant="secondary">{members.length} members</Badge>
              </div>

              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                        {member.profiles.display_name?.substring(0, 2).toUpperCase() || 
                         member.profiles.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">
                          {member.profiles.display_name || member.profiles.username}
                          {member.nickname && (
                            <span className="text-sm text-muted-foreground ml-2">
                              ({member.nickname})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRoleColor(member.role)}>
                        {getRoleIcon(member.role)}
                        <span className="ml-1 capitalize">{member.role}</span>
                      </Badge>
                      {(isOwner || isAdmin) && member.role !== 'owner' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleUpdateMemberRole(member.user_id, 'admin')}>
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateMemberRole(member.user_id, 'moderator')}>
                              Make Moderator
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateMemberRole(member.user_id, 'member')}>
                              Make Member
                            </DropdownMenuItem>
                            <Separator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleRemoveMember(member.user_id)}
                            >
                              Remove from Server
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Delete Server</h3>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to delete "{server?.name}"? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteServer} className="flex-1">
                  Delete Server
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
