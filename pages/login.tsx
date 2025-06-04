import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/Auth/LoginForm';
import RegisterForm from '@/components/Auth/RegisterForm';

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state.isAuthenticated) {
      router.push('/');
    }
  }, [state.isAuthenticated, router]);

  const handleLoginSuccess = () => {
    router.push('/');
  };

  const handleRegisterSuccess = () => {
    setShowSuccessMessage(true);
    setTimeout(() => {
      setAuthMode('login');
      setShowSuccessMessage(false);
    }, 3000);
  };

  const handleSwitchToRegister = () => {
    setAuthMode('register');
    setShowSuccessMessage(false);
  };

  const handleBackToLogin = () => {
    setAuthMode('login');
    setShowSuccessMessage(false);
  };

  if (showSuccessMessage) {
    return (
      <div className="success-container">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h1 className="success-title">회원가입 완료!</h1>
          <p className="success-message">
            회원가입이 성공적으로 완료되었습니다.<br/>
            관리자 승인 후 서비스를 이용하실 수 있습니다.
          </p>
          <p className="success-sub-message">
            승인 완료 시 등록하신 이메일로 알림을 보내드립니다.
          </p>
          <div className="success-loading">
            <span></span>
            로그인 페이지로 이동 중...
          </div>
        </div>

        <style jsx>{`
          .success-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
          }

          .success-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            padding: 40px;
            width: 100%;
            max-width: 400px;
            text-align: center;
          }

          .success-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }

          .success-title {
            font-size: 24px;
            font-weight: 700;
            color: #333;
            margin: 0 0 16px 0;
          }

          .success-message {
            color: #666;
            margin: 0 0 12px 0;
            line-height: 1.5;
          }

          .success-sub-message {
            color: #999;
            font-size: 14px;
            margin: 0 0 24px 0;
          }

          .success-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #1976d2;
            font-size: 14px;
          }

          .success-loading span {
            width: 12px;
            height: 12px;
            border: 2px solid transparent;
            border-top: 2px solid #1976d2;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {authMode === 'login' ? (
        <LoginForm
          onSuccess={handleLoginSuccess}
          onRegisterClick={handleSwitchToRegister}
        />
      ) : (
        <RegisterForm
          onSuccess={handleRegisterSuccess}
          onBackToLogin={handleBackToLogin}
        />
      )}
    </>
  );
} 