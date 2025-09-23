import { Outlet } from "react-router-dom";

export const CenteredLayout = () => {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <Outlet />
    </main>
  );
};
