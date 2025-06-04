import React, { useState } from 'react';
import { Layout, Button, Input, Badge, Avatar, Dropdown, Space, Typography } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';

const { Header, Content } = Layout;
const { Search } = Input;
const { Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { state: authState, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const handleSearch = (value: string) => {
    console.log('Search:', value);
    setSearchQuery(value);
  };

  // 프로필 드롭다운 메뉴
  const profileMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '프로필',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '설정',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '로그아웃',
      onClick: logout,
    },
  ];

  const handleProfileMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout();
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} />

      {/* Main Layout */}
      <Layout style={{ 
        marginLeft: collapsed ? 80 : 280,
        transition: 'margin-left 0.2s'
      }}>
        {/* Header */}
        <Header style={{
          position: 'fixed',
          top: 0,
          right: 0,
          left: collapsed ? 80 : 280,
          zIndex: 1000,
          padding: '0 24px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'left 0.2s',
          height: 64,
        }}>
          {/* 왼쪽 영역 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapsed}
              style={{
                fontSize: '16px',
                width: 40,
                height: 40,
              }}
            />
            
            <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
              LLM Agent Manager
            </Text>
          </div>

          {/* 오른쪽 영역 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* 검색 */}
            <Search
              placeholder="검색..."
              allowClear
              onSearch={handleSearch}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />

            {/* 알림 */}
            <Badge count={4} size="small">
              <Button 
                type="text" 
                icon={<BellOutlined />}
                style={{ fontSize: '18px' }}
              />
            </Badge>

            {/* 사용자 프로필 */}
            <Dropdown
              menu={{
                items: profileMenuItems,
                onClick: handleProfileMenuClick,
              }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar 
                  size="default" 
                  icon={<UserOutlined />}
                  src={authState.user?.avatar}
                >
                  {authState.user?.username?.charAt(0) || authState.user?.email?.charAt(0)}
                </Avatar>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong style={{ fontSize: '14px' }}>
                    {authState.user?.username || 'User'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {authState.user?.email}
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </div>
        </Header>

        {/* Content */}
        <Content style={{
          marginTop: 64, // Header 높이만큼 여백
          padding: '24px',
          background: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)',
        }}>
          <div style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            minHeight: 'calc(100vh - 112px)', // Header + padding
          }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
} 