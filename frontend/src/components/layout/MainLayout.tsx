import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SiteHeader } from "@/components/ui/site-header";
import { ChatSidebar } from "@/components/ChatSidebar";
import { useAppState } from "@/hooks/useAppContext";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { sessionId } = useAppState();

  return (
    <div className="flex flex-col h-screen">
      <SiteHeader
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarEnabled={!!sessionId}
        isSidebarOpen={isSidebarOpen}
      />
      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        <ResizablePanel defaultSize={isSidebarOpen ? 70 : 100} minSize={30}>
          <main className="flex-grow container mx-auto py-16 md:py-10 px-4 md:px-8">
            <Outlet />
          </main>
        </ResizablePanel>

        {isSidebarOpen && sessionId && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
              <ChatSidebar />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};
