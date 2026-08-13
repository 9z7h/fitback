import { usePathname, useRouter } from 'expo-router';
import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { IconCalendar, IconCard, IconFit, IconFood } from '@/components/icons';
import { TabBar, TabBarItem, type TabBarIconComponent } from '@/components/ui/TabBar';

// Figma TabBar — 뒤 콘텐츠 블러(backdrop-filter)는 SVG로 재현 불가, CSS로만 가능
const tabBarBlur = { backdropFilter: 'blur(4px)' } as unknown as ViewStyle;

export default function AppTabs() {
  const router = useRouter();
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="membership" href="/membership" asChild>
            <TabButton icon={IconCard}>회원권</TabButton>
          </TabTrigger>
          {/* 운동 탭은 홈(/workout)을 기본 진입점으로 사용. 어디 있어도 항상 홈으로 리셋. */}
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

const TAB_ROUTES = new Set(['/', '/diet', '/workout', '/membership']);

export function CustomTabList({ style: _ignored, ...props }: TabListProps) {
  const pathname = usePathname();
  if (!TAB_ROUTES.has(pathname)) return null;
  return (
    <View style={styles.tabListContainer}>
      <TabBar clipStyle={tabBarBlur}>{props.children}</TabBar>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { height: '100%' },
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 54,
  },
});
