// Storybook(rolldown-vite) 전용 스텁. 'expo-blur'의 build/index.js는 확장자 없이 './BlurView'를
// import하는데, resolve.extensions의 .web.js 우선순위를 rolldown이 안 타서 네이티브 BlurView.js를
// 그대로 잡는다 — 네이티브 버전은 expo-modules-core(SharedRef 등 네이티브 전용 export)를 끌어와
// 의존성 사전번들링 자체가 깨진다. 웹 전용 BlurView.web.js를 직접 가져와 원래 named export 형태로
// 되돌려준다.
export { default as BlurView } from 'expo-blur/build/BlurView.web.js';
