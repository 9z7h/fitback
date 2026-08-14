// Storybook(rolldown-vite) 전용 스텁. react-native-svg의 fabric/* 파일들이
// 'react-native/Libraries/Utilities/codegenNativeComponent'를 딥 임포트하는데,
// 이 파일은 Flow 문법이라 rolldown이 파싱 못 함. 웹/Storybook에서는 Fabric
// 네이티브 컴포넌트 등록 자체가 무의미하니 이름만 돌려주는 no-op으로 대체한다.
export default function codegenNativeComponent(componentName) {
  return componentName;
}
