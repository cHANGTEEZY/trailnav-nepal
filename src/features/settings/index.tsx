import { router } from "expo-router";
import { Linking, View } from "react-native";
import { useUniwind } from "uniwind";

import { Mail01Icon, PaintBrush01Icon } from "@hugeicons/core-free-icons";
import GoBackButton from "@/components/GoBackButton";
import CollapsedLargeHeader from "@/components/layouts/CollapsedLargeHeader";
import MeshBackground from "@/components/MeshBackground";
import ProfileButton from "@/components/ProfileButton";
import { useSession } from "@/lib/auth-client";

import { Typography } from "heroui-native/text";

import { SettingsRow } from "./components/settings-row";
import { SettingsSection } from "./components/settings-section";
import {
  getAppearanceLabel,
  resolveAppearancePreference,
} from "./lib/appearance";

function openSupport() {
  void Linking.openURL(
    "mailto:support@example.com?subject=Expo%20Boilerplate%20support",
  );
}

export default function Settings() {
  const { data: session } = useSession();
  const { theme, hasAdaptiveThemes } = useUniwind();
  const appearance = resolveAppearancePreference(theme, hasAdaptiveThemes);

  const name = session?.user?.name?.trim() || "Your profile";
  const email = session?.user?.email ?? "";

  return (
    <View className="flex-1 bg-background">
      <MeshBackground />
      <CollapsedLargeHeader title="Settings" leading={<GoBackButton />}>
        <View className="gap-6 px-4 pb-8 mt-5">
          <SettingsSection>
            <SettingsRow
              title={name}
              description={email}
              leading={<ProfileButton size="md" />}
              trailing={null}
            />
          </SettingsSection>

          <SettingsSection title="Preferences">
            <SettingsRow
              title="Appearance"
              description={getAppearanceLabel(appearance)}
              icon={PaintBrush01Icon}
              iconBackground="#6366F1"
              onPress={() => router.push("/(screens)/settings/appearance")}
            />
          </SettingsSection>

          <SettingsSection title="Support">
            <SettingsRow
              title="Contact support"
              icon={Mail01Icon}
              iconBackground="#0EA5E9"
              external
              onPress={openSupport}
            />
          </SettingsSection>

          <Typography type="body-xs" className="text-center text-muted">
            Expo Boilerplate v1.0.0
          </Typography>
        </View>
      </CollapsedLargeHeader>
    </View>
  );
}
