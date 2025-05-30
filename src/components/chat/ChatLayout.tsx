
"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { ChatSidebar } from './ChatSidebar';
import { ChatArea } from './ChatArea';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react'; // Keep for Header, but Button itself is removed from here
import { Button } from '@/components/ui/button'; // Keep for other potential uses, but not for sidebar toggle here
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'; // SheetTrigger removed
import { useIsMobile } from '@/hooks/use-mobile';


export function ChatLayout() {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile); 
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false); // Ensure desktop sidebar is closed on mobile
    } else {
      setMobileSheetOpen(false); // Ensure mobile sheet is closed on desktop
      // setIsSidebarOpen(true); // Re-open desktop sidebar if not mobile, or retain last state
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
            {/* SheetTrigger is now in Header, Sheet remains to host content */}
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
            {/* Desktop toggle button removed from here, it's now in Header */}
          </>
        )}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatArea />
        </main>
      </div>
    </div>
  );
}
