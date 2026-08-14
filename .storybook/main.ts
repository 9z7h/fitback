import path from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-designs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: true,
  },
  async viteFinal(viteConfig) {
    const { mergeConfig } = await import('vite');
    return mergeConfig(viteConfig, {
      resolve: {
        alias: [
          { find: /^react-native$/, replacement: 'react-native-web' },
          {
            find: 'react-native-svg',
            replacement: path.resolve(__dirname, '../node_modules/react-native-svg/lib/module/ReactNativeSVG.web.js'),
          },
          // ReactNativeSVG.web.js 내부의 상대경로 './elements' import는 resolve.extensions의
          // .web.js 우선순위를 안 타고 네이티브 elements.js(RNSVGSvgView 등 코드젠 이름)를 그대로
          // 잡는다(rolldown-vite 쪽 이슈로 추정) — 절대경로로 직접 elements.web.js에 꽂아서 우회.
          {
            find: path.resolve(__dirname, '../node_modules/react-native-svg/lib/module/elements.js'),
            replacement: path.resolve(__dirname, '../node_modules/react-native-svg/lib/module/elements.web.js'),
          },
          // react-native-svg의 fabric/* 파일이 이 딥 경로를 직접 import함(Flow 문법이라 파싱 에러남).
          // 위 react-native-svg 얼라이어스로 대부분 안 타지만, 혹시 남는 경로 대비 안전망으로 스텁 처리.
          {
            find: /^react-native\/Libraries\/Utilities\/codegenNativeComponent$/,
            replacement: path.resolve(__dirname, './stubs/codegenNativeComponent.js'),
          },
          { find: '@', replacement: path.resolve(__dirname, '../src') },
        ],
        // .web.js를 우선 매칭 안 하면 react-native-svg(lucide-react-native가 내부적으로 씀) 같은 패키지가
        // 네이티브(Fabric) 빌드를 잡아서 react-native/Libraries의 Flow 문법 파일까지 끌고 들어와 파싱 에러남.
        extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
      },
      define: {
        __DEV__: JSON.stringify(true),
      },
      optimizeDeps: {
        // react-native-svg는 include/exclude 둘 다 넣지 않는다 — optimizeDeps.include는
        // 강제 프리번들 대상을 "패키지 이름"으로 직접 해석해서 resolve.alias(웹 엔트리 치환)를
        // 우회하고 원본(fabric/Flow 문법) 경로를 다시 잡아버린다. exclude는 반대로 esbuild의
        // CJS→ESM 변환을 안 해줘서 named export 에러가 난다. 그냥 자동 탐지(그래프 순회)에
        // 맡기면 import 구문을 실제로 타면서 alias가 정상 적용된다.
        include: ['react-native-web'],
      },
    });
  },
};

export default config;
