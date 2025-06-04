import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, Divider, Alert } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';

const { Title, Text, Link } = Typography;

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

export default function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [form] = Form.useForm();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: LoginFormData) => {
    console.log('로그인 시도:', { email: values.email, password: '***' });
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('로그인 함수 호출 시작');
      await login(values.email, values.password);
      console.log('로그인 성공');
    } catch (error: any) {
      console.log('로그인 오류:', error);
      setError(error.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <Card style={{
        width: '100%',
        maxWidth: '400px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ 
            color: '#1890ff', 
            marginBottom: '8px',
            fontSize: '28px',
            fontWeight: 600 
          }}>
            LLM Agent Manager
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            AI 에이전트 관리 시스템에 로그인하세요
          </Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: '24px' }}
            closable
            onClose={() => setError(null)}
          />
        )}

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          requiredMark={false}
          size="large"
        >
          <Form.Item
            name="email"
            label="이메일"
            rules={[
              { required: true, message: '이메일을 입력해주세요!' },
              { type: 'email', message: '올바른 이메일 형식이 아닙니다!' }
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="이메일을 입력하세요"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="비밀번호"
            rules={[
              { required: true, message: '비밀번호를 입력해주세요!' },
              { min: 6, message: '비밀번호는 최소 6자 이상이어야 합니다!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: '48px',
                fontSize: '16px',
                fontWeight: 500,
                borderRadius: '8px',
              }}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '24px 0' }}>
          <Text type="secondary">또는</Text>
        </Divider>

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {onSwitchToRegister && (
            <Button
              type="default"
              block
              onClick={onSwitchToRegister}
              style={{
                height: '44px',
                fontSize: '15px',
                borderRadius: '8px',
              }}
            >
              새 계정 만들기
            </Button>
          )}

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              데모 계정 정보
            </Text>
            <div style={{ 
              background: '#f8f9fa', 
              padding: '12px', 
              borderRadius: '6px', 
              marginTop: '8px',
              border: '1px solid #e9ecef'
            }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ fontSize: '13px' }}>관리자:</Text>
                  <Text code style={{ marginLeft: '8px', fontSize: '12px' }}>
                    admin@example.com / Admin123!
                  </Text>
                </div>
                <div>
                  <Text strong style={{ fontSize: '13px' }}>매니저:</Text>
                  <Text code style={{ marginLeft: '8px', fontSize: '12px' }}>
                    manager@example.com / Manager123!
                  </Text>
                </div>
                <div>
                  <Text strong style={{ fontSize: '13px' }}>사용자:</Text>
                  <Text code style={{ marginLeft: '8px', fontSize: '12px' }}>
                    user@example.com / User123!
                  </Text>
                </div>
              </Space>
            </div>
          </div>
        </Space>
      </Card>
    </div>
  );
} 