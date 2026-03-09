import { currentUser } from "@clerk/nextjs/server";
import { Settings } from "lucide-react";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const user = await currentUser();

  const userData = {
    firstName: user?.firstName ?? null,
    lastName: user?.lastName ?? null,
    emailAddress:
      user?.emailAddresses?.[0]?.emailAddress ?? "unknown@example.com",
    imageUrl: user?.imageUrl ?? "",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
      </div>

      <SettingsForm user={userData} />
    </div>
  );
}
