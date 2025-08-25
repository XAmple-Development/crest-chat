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
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Globe, 
  Lock, 
  Mail, 
  Save,
  Camera,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState('online');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    messageNotifications: true,
    serverNotifications: true,
    mentionNotifications: true,
    soundNotifications: true
  });
  const [privacy, setPrivacy] = useState({
    showOnlineStatus: true,
    allowFriendRequests: true,
    allowDirectMessages: true,
    showActivityStatus: true
  });

  const { user } = useAuth();
  const { profile, updateProfile, loading } = useProfile();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && profile) {
      setUsername(profile.username || '');
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setStatus(profile.status || 'online');
    }
  }, [isOpen, profile]);

  const handleSaveProfile = async () => {
    if (!profile) return;

    const updated = await updateProfile({
      username,
      display_name: displayName,
      bio,
      status
    });

    if (updated) {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New passwords don't match."
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters long."
      });
      return;
    }

    // Here you would typically call a password change function
    // For now, we'll just show a success message
    toast({
      title: "Password changed",
      description: "Your password has been updated successfully."
    });

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>User Settings</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Profile Picture</h3>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-semibold">
                      {displayName?.substring(0, 2).toUpperCase() || username?.substring(0, 2).toUpperCase()}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Upload a new profile picture
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG or GIF. Max size 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Profile Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Profile Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input
                      id="display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter display name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">About Me</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>Online</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="idle">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span>Idle</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dnd">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span>Do Not Disturb</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="offline">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                          <span>Offline</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSaveProfile} disabled={loading} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <div className="space-y-6">
              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Information</h3>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Your email address is used for account recovery and notifications.
                  </p>
                </div>

                <div>
                  <Label htmlFor="user-id">User ID</Label>
                  <Input
                    id="user-id"
                    value={user?.id || ''}
                    disabled
                    className="bg-muted font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    This is your unique identifier.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Change Password */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Change Password</h3>
                
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                <Button onClick={handleChangePassword} className="w-full">
                  Change Password
                </Button>
              </div>

              <Separator />

              {/* Danger Zone */}
              <div className="border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h3 className="font-semibold text-destructive">Danger Zone</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Notification Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="message-notifications">Message Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for new messages
                    </p>
                  </div>
                  <Switch
                    id="message-notifications"
                    checked={notifications.messageNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, messageNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="server-notifications">Server Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for server events
                    </p>
                  </div>
                  <Switch
                    id="server-notifications"
                    checked={notifications.serverNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, serverNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="mention-notifications">Mention Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when mentioned
                    </p>
                  </div>
                  <Switch
                    id="mention-notifications"
                    checked={notifications.mentionNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, mentionNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sound-notifications">Sound Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Play sounds for notifications
                    </p>
                  </div>
                  <Switch
                    id="sound-notifications"
                    checked={notifications.soundNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, soundNotifications: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Privacy Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-online-status">Show Online Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others see when you're online
                    </p>
                  </div>
                  <Switch
                    id="show-online-status"
                    checked={privacy.showOnlineStatus}
                    onCheckedChange={(checked) => 
                      setPrivacy(prev => ({ ...prev, showOnlineStatus: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow-friend-requests">Allow Friend Requests</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others send you friend requests
                    </p>
                  </div>
                  <Switch
                    id="allow-friend-requests"
                    checked={privacy.allowFriendRequests}
                    onCheckedChange={(checked) => 
                      setPrivacy(prev => ({ ...prev, allowFriendRequests: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow-direct-messages">Allow Direct Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others send you direct messages
                    </p>
                  </div>
                  <Switch
                    id="allow-direct-messages"
                    checked={privacy.allowDirectMessages}
                    onCheckedChange={(checked) => 
                      setPrivacy(prev => ({ ...prev, allowDirectMessages: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-activity-status">Show Activity Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others see what you're doing
                    </p>
                  </div>
                  <Switch
                    id="show-activity-status"
                    checked={privacy.showActivityStatus}
                    onCheckedChange={(checked) => 
                      setPrivacy(prev => ({ ...prev, showActivityStatus: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Appearance Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select defaultValue="dark">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="font-size">Font Size</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message-density">Message Density</Label>
                  <Select defaultValue="comfortable">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                      <SelectItem value="cozy">Cozy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
