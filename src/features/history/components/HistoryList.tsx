import { HistoryItemComponent } from "./HistoryItem";
import { HistoryItem } from "../types/history.types";

interface HistoryListProps {
  items: HistoryItem[];
}

export const HistoryList = ({ items }: HistoryListProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">No history items found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <HistoryItemComponent key={item.id} item={item} />
      ))}
    </div>
  );
};
