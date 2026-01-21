import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, LayoutDashboard, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function UserMenu() {
  const { user, isLoading, login, logout } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (response.credential) {
      try {
        await login(response.credential);
      } catch (error) {
        console.error('Login failed:', error);
      }
    }
  };

  const handleGoogleError = () => {
    console.error('Google Sign-In failed');
  };

  if (isLoading) {
    return (
      <div className="h-10 w-10 animate-pulse bg-gray-200 rounded-full" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          size="medium"
          text="signin"
          shape="pill"
          theme="outline"
        />
      </div>
    );
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.picture} alt={user.name} />
            <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.picture} alt={user.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/dashboard')}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          My Documents
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
