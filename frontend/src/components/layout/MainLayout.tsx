import { Outlet } from "react-router-dom";

export const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="pb-4 border-b">
        <h1 className="text-2xl font-bold text-center">Data Lens 🔎</h1>
      </header>
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};
