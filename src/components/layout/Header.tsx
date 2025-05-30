
"use client";

import { useState } from 'react';
import { Moon, Sun, Languages as LanguagesIcon, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { APP_NAME } from "@/lib/constants";
import type { Language } from "@/lib/types";
import { HelpGuideDialogAm } from './HelpGuideDialogAm';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <a href="/" className="mr-6 flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6 fill-primary">
                <rect width="256" height="256" fill="none"/>
                <path d="M128,24A104,104,0,0,0,36.1,176.8L24.9,213.4a15.9,15.9,0,0,0,19.7,19.7l36.6-11.2A104,104,0,1,0,128,24Zm0,192a88.1,88.1,0,0,1-45.1-13.5L76,198.7a16.2,16.2,0,0,0-15.1-1.2L38.5,208.7,49.7,186.3A16,16,0,0,0,46.2,171l-3.9-6.8a88,88,0,1,1,85.7,51.8Z"/>
                <circle cx="128" cy="128" r="12"/>
                <circle cx="80" cy="128" r="12"/>
                <circle cx="176" cy="128" r="12"/>
              </svg>
              <span className="hidden font-bold sm:inline-block text-foreground">
                {APP_NAME}
              </span>
            </a>
          </div>
          {/* This div acts as a spacer and aligns nav to the right */}
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
            </nav>
          </div>
        </div>
      </header>
      <HelpGuideDialogAm isOpen={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen} />
    </>
  );
}
