import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Logo from "@/assets/logo.svg?react";

export const HomePage = () => {
  return (
    <Card className="w-full max-w-2xl border-0 shadow-none">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <CardTitle className="text-4xl">Welcome to Data Lens</CardTitle>
          <Logo className="w-20 h-20" />
          <CardDescription className="pt-1">
            An interactive toolkit to help you critically analyze data
            visualizations and uncover the stories they tell.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button asChild size="lg">
          <Link to="/workspace">Get Started</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          {/* TODO : Build this page later */}
          <Link to="#">About the Project</Link>
        </Button>
      </CardContent>
    </Card>
  );
};
