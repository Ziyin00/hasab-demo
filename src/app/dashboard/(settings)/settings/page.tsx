import { SettingsPage } from "@/features/settings/components/SettingsPage";

export default async function SettingsRoute({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return <SettingsPage initialTab={tab} />;
}
