import { useAppState } from "./hooks/useAppContext";
import "./App.css";

// TODO : placeholders for now
const FileUpload = () => <div>File Upload Component</div>;
const Workspace = () => <div>Main Workspace Component</div>;

function App() {
  const { sessionId } = useAppState();

  return (
    <div className="app-container">
      <header>
        <h1>Data Lens</h1>
      </header>
      <main>{sessionId ? <Workspace /> : <FileUpload />}</main>
    </div>
  );
}

export default App;
