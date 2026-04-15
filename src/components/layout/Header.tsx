import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { User } from "lucide-react";

export const Header = () => {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b flex items-center justify-between px-6 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <h2 className="font-bold text-xl tracking-tight">Hasab AI</h2>
      </div>
      
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
             <span className="text-sm font-medium">{user.name}</span>
             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
             </div>
          </div>
        ) : (
          <Button variant="ghost" asChild>
            <a href="/login">Login</a>
          </Button>
        )}
      </div>
    </header>
  );
};
