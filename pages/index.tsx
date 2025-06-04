import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/Auth/LoginForm';
import MainLayout from '@/components/Layout/MainLayout';
import ChatInterface from '@/components/Chat/ChatInterface';

export default function Home() {
  const { state: authState } = useAuth();

  // 로딩 중일 때
  if (authState.isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div className="loading"></div>
        <p>시스템을 로딩 중입니다...</p>
      </div>
    );
  }

  // 로그인되지 않은 경우
  if (!authState.isAuthenticated || !authState.user) {
    return <LoginForm />;
  }

  // 로그인된 경우 - 기본적으로 LLM 채팅 화면 표시
  return (
    <MainLayout>
      <div className="home-container">
        <div className="welcome-section">
          <h1>안녕하세요, {authState.user.name || authState.user.email}님!</h1>
          <p>LLM Agent Manager에 오신 것을 환영합니다.</p>
        </div>
        
        <div className="main-content">
          <ChatInterface />
        </div>
      </div>

      <style jsx>{`
        .home-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .welcome-section {
          margin-bottom: 24px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .welcome-section h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 700;
        }

        .welcome-section p {
          margin: 0;
          font-size: 16px;
          opacity: 0.9;
        }

        .main-content {
          flex: 1;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        @media (max-width: 768px) {
          .welcome-section {
            padding: 16px;
          }
          
          .welcome-section h1 {
            font-size: 24px;
          }
          
          .welcome-section p {
            font-size: 14px;
          }
        }
      `}</style>
    </MainLayout>
  );
}
