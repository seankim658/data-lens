import { useAppState } from "@/hooks/useAppContext";
import { FileUpload } from "@/components/FileUpload";

// TODO : this will become the main data visualization and interaction area
const Workspace = () => (
  <div className="text-center">
    <h2 className="text-2xl font-semibold">Workspace</h2>
    <p>Data loaded. Ready to analyze!</p>
  </div>
);

export const WorkspacePage = () => {
  const { sessionId } = useAppState();

  return sessionId ? <Workspace /> : <FileUpload />;
};
