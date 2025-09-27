import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SiteHeader } from "@/components/ui/site-header";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { ChatSidebar } from "@/components/ChatSidebar";
import { useAppState } from "@/hooks/useAppContext";

export const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { sessionId } = useAppState();

  return (
    <Drawer
      open={isSidebarOpen}
      onOpenChange={setIsSidebarOpen}
      direction="right"
    >
      <div className="flex flex-col min-h-screen">
        <SiteHeader
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarEnabled={!!sessionId}
        />
        <main className="flex-grow container mx-auto py-16 md:py-10 px-4 md:px-8">
          <Outlet />
        </main>
      </div>
      <DrawerContent className="h-full w-[450px] mt-0 ml-auto rounded-none">
        <ChatSidebar onClose={() => setIsSidebarOpen(false)} />
      </DrawerContent>
    </Drawer>
  );
};
