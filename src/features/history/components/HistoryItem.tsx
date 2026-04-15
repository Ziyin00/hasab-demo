import { HistoryItem } from "../types/history.types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, FileText, Languages, Mic2, Subtitles, Users } from "lucide-react";

interface HistoryItemProps {
  item: HistoryItem;
}

const iconMap = {
  transcription: FileText,
  translation: Languages,
  tts: Mic2,
  meeting: Users,
  subtitles: Subtitles,
};

export const HistoryItemComponent = ({ item }: HistoryItemProps) => {
  const Icon = iconMap[item.type];

  return (
    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">{item.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{item.createdAt}</span>
            </div>
          </div>
        </div>
        <Badge variant={item.status === "completed" ? "default" : "secondary"}>
          {item.status}
        </Badge>
      </CardContent>
    </Card>
  );
};
