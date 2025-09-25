import { Outlet } from "react-router-dom";
import { SiteHeader } from "@/components/ui/site-header";

export const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container mx-auto py-16 md:py-20 px-4 md:px-8">
        <Outlet />
      </main>
    </div>
  );
};
