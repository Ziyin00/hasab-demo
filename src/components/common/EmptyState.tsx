import { Box } from "lucide-react";

export const EmptyState = ({ title, description }: { title: string; description: string }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 py-24 border-2 border-dashed rounded-3xl text-center space-y-4">
      <div className="p-4 bg-muted rounded-full">
        <Box className="w-10 h-10 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};
