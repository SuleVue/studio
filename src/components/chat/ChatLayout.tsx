
"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { ChatSidebar } from './ChatSidebar';
import { ChatArea } from './ChatArea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export function ChatLayout() {
  const isMobile = useIsMobile();
  const { currentUser, loading: authLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile); 
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false); 
    } else {
      setMobileSheetOpen(false);
      // setIsSidebarOpen(true); // Or retain last state if preferred
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileSheetOpen(prev => !prev);
    } else {
      setIsSidebarOpen(prev => !prev);
    }
  };

  const SidebarContent = () => (
    <div className="w-full h-full" onClick={() => isMobile && setMobileSheetOpen(false)}>
      <ChatSidebar />
    </div>
  );

  if (authLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your experience...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col h-screen">
         <Header showMenuButton={false} />
        <div className="flex-1 flex flex-col items-center justify-center bg-background text-center p-4">
          <h2 className="text-2xl font-semibold mb-2">Welcome to ተመልካች</h2>
          <p className="text-muted-foreground mb-6">Please log in or register to start chatting.</p>
          <div className="space-x-4">
            <Button asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header 
        onMenuButtonClick={toggleSidebar}
        isSidebarOpen={isMobile ? mobileSheetOpen : isSidebarOpen}
        showMenuButton={true}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {isMobile ? (
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetContent side="left" className="p-0 w-[300px] sm:w-[320px] flex flex-col">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Chat Sessions</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <>
            {isSidebarOpen && (
              <aside className="w-72 md:w-80 flex-shrink-0 h-full transition-all duration-300 ease-in-out">
                <SidebarContent />
              </aside>
            )}
          </>
        )}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatArea />
        </main>
      </div>
    </div>
  );
}
