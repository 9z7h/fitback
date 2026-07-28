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
          { find: '@', replacement: path.resolve(__dirname, '../src') },
        ],
      },
      define: {
        __DEV__: JSON.stringify(true),
      },
      optimizeDeps: {
        include: ['react-native-web'],
      },
    });
  },
};

export default config;
