
"use client";

import { useState } from 'react';
import { Moon, Sun, Languages as LanguagesIcon, HelpCircle, PanelLeftOpen, PanelRightOpen, LogOut, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { APP_NAME } from "@/lib/constants";
import type { Language } from "@/lib/types";
import { HelpGuideDialogAm } from './HelpGuideDialogAm';
import Link from 'next/link';

interface HeaderProps {
  onMenuButtonClick?: () => void;
  isSidebarOpen?: boolean;
  showMenuButton?: boolean;
}

export function Header({ onMenuButtonClick, isSidebarOpen, showMenuButton = false }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { currentUser, signOut, loading: authLoading } = useAuth();
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center">
            {showMenuButton && onMenuButtonClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuButtonClick}
                className="mr-2"
                aria-label="Toggle sidebar"
              >
                {isSidebarOpen ? <PanelRightOpen className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
              </Button>
            )}
            <Link href="/" className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6 fill-primary">
                <rect width="256" height="256" fill="none"/>
                <path d="M128,24A104,104,0,0,0,36.1,176.8L24.9,213.4a15.9,15.9,0,0,0,19.7,19.7l36.6-11.2A104,104,0,1,0,128,24Zm0,192a88.1,88.1,0,0,1-45.1-13.5L76,198.7a16.2,16.2,0,0,0-15.1-1.2L38.5,208.7,49.7,186.3A16,16,0,0,0,46.2,171l-3.9-6.8a88,88,0,1,1,85.7,51.8Z"/>
                <circle cx="128" cy="128" r="12"/>
                <circle cx="80" cy="128" r="12"/>
                <circle cx="176" cy="128" r="12"/>
              </svg>
              <span className="font-bold text-foreground">
                {APP_NAME}
              </span>
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <LanguagesIcon className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Select language</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage("English" as Language)}>
                    English {language === "English" && "✔"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage("Amharic" as Language)}>
                    አማርኛ {language === "Amharic" && "✔"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === "light" ? (
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                ) : (
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>

              <Button variant="ghost" size="icon" onClick={() => setIsHelpDialogOpen(true)}>
                <HelpCircle className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">How to use guide</span>
              </Button>

              {!authLoading && (
                currentUser ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <UserCircle2 className="h-[1.2rem] w-[1.2rem]" />
                        <span className="sr-only">User Menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {currentUser.displayName || "User"}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {currentUser.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={signOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button variant="default" size="sm" asChild>
                      <Link href="/register">Sign Up</Link>
                    </Button>
                  </>
                )
              )}
            </nav>
          </div>
        </div>
      </header>
      <HelpGuideDialogAm isOpen={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen} />
    </>
  );
}
