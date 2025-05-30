"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { ChatSidebar } from './ChatSidebar';
import { ChatArea } from './ChatArea';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';


export function ChatLayout() {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile); // Sidebar open by default on desktop
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  useEffect(() => {
    // Adjust sidebar visibility based on screen size changes
    setIsSidebarOpen(!isMobile);
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


  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        {isMobile ? (
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-3 left-3 z-10"
                aria-label="Open chat sessions"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[300px] sm:w-[320px]">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        ) : (
          <>
            {isSidebarOpen && (
              <aside className="w-72 md:w-80 flex-shrink-0 h-full transition-all duration-300 ease-in-out">
                <SidebarContent />
              </aside>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="absolute top-3 left-3 z-10"
              aria-label={isSidebarOpen ? "Close chat sessions" : "Open chat sessions"}
            >
              {isSidebarOpen ? <PanelRightOpen className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </Button>
          </>
        )}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatArea />
        </main>
      </div>
    </div>
  );
}
