import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Logo from "@/assets/logo.svg?react";
import { FileUpload } from "@/components/FileUpload";
import { useAppState } from "@/hooks/useAppContext";
import "./HomePage.css";

export const HomePage = () => {
  const [showUpload, setShowUpload] = useState(false);
  const { sessionId } = useAppState();
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionId) {
      navigate("/workspace");
    }
  }, [sessionId, navigate]);

  return (
    <div className="w-full max-w-2xl">
      <Card className="border-0 shadow-none">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <CardTitle className="text-4xl">Welcome to Data Lens</CardTitle>
            <Logo className="w-20 h-20" />
          </div>
          <CardDescription className="pt-1">
            An interactive toolkit to help you critically analyze data
            visualizations and uncover the stories they tell.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button size="lg" onClick={() => setShowUpload(true)}>
            Get Started
          </Button>
          <Button asChild variant="outline" size="lg">
            {/* TODO : Build this page later */}
            <Link to="#">About the Project</Link>
          </Button>
        </CardContent>
      </Card>

      <div className={`collapsible-section ${showUpload ? "expanded" : ""}`}>
        <div>
          <FileUpload onClose={() => setShowUpload(false)} />
        </div>
      </div>
    </div>
  );
};
