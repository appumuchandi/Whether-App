
'use client';

import { useUser, useFirebase } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AuthButton() {
  const { user, loading } = useUser();
  const { auth } = useFirebase();

  const handleLogin = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  if (loading) return <div className="h-10 w-10 animate-pulse bg-white/10 rounded-full" />;

  if (!user) {
    return (
      <Button 
        variant="ghost" 
        onClick={handleLogin} 
        className="text-white hover:bg-white/10 gap-2 border border-white/10 rounded-xl"
      >
        <LogIn size={18} />
        Sign In
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <Avatar className="h-10 w-10 border border-white/20">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
            <AvatarFallback><UserIcon /></AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-background/95 backdrop-blur-xl border-white/10" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-white">{user.displayName}</p>
            <p className="text-xs leading-none text-white/50">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive gap-2">
          <LogOut size={16} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
