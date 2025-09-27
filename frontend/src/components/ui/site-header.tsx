import { Button } from "./button";
import Logo from "@/assets/logo.svg?react";
import { MessageSquarePlus } from "lucide-react";

interface SiteHeaderProps {
  onToggleSidebar: () => void;
  isSidebarEnabled: boolean;
}

export function SiteHeader({
  onToggleSidebar,
  isSidebarEnabled,
}: SiteHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <h1 className="text-xl font-semibold">Data Lens</h1>
        <Logo className="w-7 h-7" />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/seankim658/data-lens"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              GitHub
            </a>
          </Button>
          {isSidebarEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleSidebar}
              className="flex items-center gap-2"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Assistant</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
