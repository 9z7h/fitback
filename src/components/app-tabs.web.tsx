import { usePathname, useRouter } from 'expo-router';
import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { IconCalendar, IconCard, IconFit, IconFood } from '@/components/icons';
import { sheetPresentation } from '@/components/modal-presentation';
import { TabBar, TabBarItem, type TabBarIconComponent } from '@/components/ui/TabBar';
import { MonthCalendar } from '@/features/home/MonthCalendar';

export default function AppTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const [showCalendar, setShowCalendar] = useState(false);
  return (
    <>
      <Tabs>
        <TabSlot style={styles.slot} />
        <TabList asChild>
          <CustomTabList>
            <TabTrigger name="membership" href="/membership" asChild>
              <TabButton icon={IconCard} forceActive={pathname === '/'} onPress={() => router.replace('/')}>
                회원권
              </TabButton>
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
              <TabButton
                icon={IconCalendar}
                forceActive={false}
                onPress={(e) => {
                  e?.preventDefault?.();
                  setShowCalendar(true);
                }}>
                기록
              </TabButton>
            </TabTrigger>
          </CustomTabList>
        </TabList>
      </Tabs>

      <Modal
        visible={showCalendar}
        animationType="slide"
        presentationStyle={sheetPresentation}
        onRequestClose={() => setShowCalendar(false)}>
        <ThemedView style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <MonthCalendar onClose={() => setShowCalendar(false)} />
          </SafeAreaView>
        </ThemedView>
      </Modal>
    </>
  );
}

type TabButtonProps = TabTriggerSlotProps & { icon: TabBarIconComponent; forceActive?: boolean };

// isFocused는 TabTrigger 자신의 href와 실제 라우트를 비교해서 결정되는데, 회원권/기록처럼
// onPress로 다른 경로로 보내거나(회원권→"/") 아예 라우트 이동이 없는(기록=모달만) 경우엔
// 실제 라우트와 무관하게 active 상태를 직접 지정해야 한다 — forceActive가 있으면 그걸 우선.
export function TabButton({ children, isFocused, icon, style: _ignored, forceActive, ...props }: TabButtonProps) {
  return <TabBarItem icon={icon} label={children as string} active={forceActive ?? !!isFocused} {...props} />;
}

const TAB_ROUTES = new Set(['/', '/diet', '/workout', '/membership']);

export function CustomTabList({ style: _ignored, ...props }: TabListProps) {
  const pathname = usePathname();
  if (!TAB_ROUTES.has(pathname)) return null;
  return (
    <View style={styles.tabListContainer}>
      <TabBar>{props.children}</TabBar>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { height: '100%' },
  tabListContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 54,
  },
});
