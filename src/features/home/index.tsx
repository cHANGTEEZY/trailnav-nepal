import {
  Mail01Icon,
  Notification03Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import { View } from "react-native";

import { useUsers } from "@/api/hooks/use-users";
import { Fab } from "@/components/fab";
import { runHaptic } from "@/components/HapticButton";
import CollapsingLargeHeader from "@/components/layouts/CollapsingLargeHeader";
import MeshBackground from "@/components/MeshBackground";
import ProfileButton from "@/components/ProfileButton";
import { SwipeMenuButton } from "@/features/swipe-menu";
import { useSession } from "@/lib/auth-client";

import { Alert } from "heroui-native/alert";
import { Button } from "heroui-native/button";
import { Card } from "heroui-native/card";
import { Surface } from "heroui-native/surface";
import { Typography } from "heroui-native/text";

export default function Home() {
  const { data: session } = useSession();
  const {
    data: usersData,
    isLoading: usersLoading,
    isError: usersError,
    error: usersErr,
    refetch,
  } = useUsers(undefined, { retry: false });

  return (
    <View className="flex-1 bg-background">
      <MeshBackground />
      <CollapsingLargeHeader
        title="Home"
        leading={<SwipeMenuButton />}
        trailing={
          <ProfileButton
            onPress={() => router.push("/(screens)/settings")}
          />
        }
      >
        <View className="gap-4 px-4">
          <Card>
            <Card.Header>
              <Typography type="h5" weight="semibold">
                Welcome
              </Typography>
            </Card.Header>
            <Card.Body className="gap-2">
              <Typography type="body" color="muted">
                You are signed in as{" "}
                <Typography type="body" weight="semibold">
                  {session?.user.name}
                </Typography>
              </Typography>
              <Typography type="body-xs" color="muted">
                {session?.user.email}
              </Typography>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Typography type="h5" weight="semibold">
                Users API
              </Typography>
            </Card.Header>
            <Card.Body className="gap-3">
              <Typography type="body-sm" color="muted">
                Sample trekkers stored on this device.
              </Typography>

              {usersError ? (
                <Alert status="warning">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Description>
                      {usersErr?.message ??
                        "Failed to load users (is your API running?)"}
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : null}

              {usersData?.users?.length ? (
                <View className="gap-2">
                  {usersData.users.map((user) => (
                    <Surface
                      key={user.id}
                      variant="secondary"
                      className="rounded-xl px-4 py-3"
                    >
                      <Typography type="body" weight="medium">
                        {user.name}
                      </Typography>
                      <Typography type="body-xs" color="muted">
                        {user.email}
                      </Typography>
                    </Surface>
                  ))}
                </View>
              ) : !usersLoading && !usersError ? (
                <Typography type="body-sm" color="muted">
                  No users returned.
                </Typography>
              ) : null}

              <Button
                variant="outline"
                size="md"
                onPress={() => void refetch()}
              >
                <Button.Label>Refresh users</Button.Label>
              </Button>
            </Card.Body>
          </Card>
        </View>
      </CollapsingLargeHeader>

      <Fab position="bottom-right">
        <Fab.Item
          icon={StarIcon}
          label="Star"
          onPress={() => runHaptic({ type: "selection" })}
        />
        <Fab.Item
          icon={Mail01Icon}
          label="Email"
          onPress={() => runHaptic({ type: "selection" })}
        />
        <Fab.Item
          icon={Notification03Icon}
          label="Remind"
          onPress={() => runHaptic({ type: "selection" })}
        />
      </Fab>
    </View>
  );
}
