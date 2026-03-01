declare module '@azesmway/react-native-unity' {
  import { Component } from 'react';
    import { ViewProps } from 'react-native';

  export interface UnityViewProps extends ViewProps {
    onMessage?: (event: any) => void;
    onUnityMessage?: (event: any) => void;
    androidKeepPlayerMounted?: boolean;
    fullScreen?: boolean;
  }

  export default class UnityView extends Component<UnityViewProps> {
    postMessage(gameObject: string, methodName: string, message: string): void;
    pause(): void;
    resume(): void;
  }
}