import { useRouter } from 'expo-router';
import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconCalendar, IconCard, IconFit, IconFood } from '@/components/icons';
import { TabBar, TabBarItem, type TabBarIconComponent } from '@/components/ui/TabBar';

export default function AppTabs() {
  const router = useRouter();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="membership" href="/membership" asChild>
            <TabButton icon={IconCard}>회원권</TabButton>
          </TabTrigger>
          <TabTrigger name="workout" href="/workout" asChild>
            <TabButton icon={IconFit} onPress={() => router.replace('/workout')}>
              운동
            </TabButton>
          </TabTrigger>
          <TabTrigger name="diet" href="/diet" asChild>
            <TabButton icon={IconFood}>식단</TabButton>
          </TabTrigger>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon={IconCalendar}>기록</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & { icon: TabBarIconComponent };

export function TabButton({ children, isFocused, icon, style: _ignored, ...props }: TabButtonProps) {
  return <TabBarItem icon={icon} label={children as string} active={!!isFocused} {...props} />;
}

export function CustomTabList({ style: _ignored, ...props }: TabListProps) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[{ paddingBottom: bottom }]}>
      <TabBar>{props.children}</TabBar>
    </View>
  );
}
