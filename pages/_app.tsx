import '@/styles/globals.css';
import 'antd/dist/reset.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/context/AuthContext';
import { ConfigProvider } from 'antd';
import koKR from 'antd/locale/ko_KR';

// Ant Design 전역 테마 설정
const theme = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    borderRadius: 8,
    wireframe: false,
  },
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ConfigProvider 
      theme={theme} 
      locale={koKR}
    >
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ConfigProvider>
  );
}
