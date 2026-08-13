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
            find: /^react-native-svg$/,
            replacement: path.resolve(__dirname, '../node_modules/react-native-svg/lib/module/ReactNativeSVG.web.js'),
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
        include: ['react-native-web'],
        exclude: ['react-native-svg'],
      },
    });
  },
};

export default config;
