import React, { useState } from 'react';
import { Menu, Layout } from 'antd';
const { Sider } = Layout;
import {
  MessageOutlined,
  RobotOutlined,
  SettingOutlined,
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  MonitorOutlined,
  QuestionCircleOutlined,
  DatabaseOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';

type MenuItem = Required<MenuProps>['items'][number];

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const { hasPermission, hasGroupAccess } = useAuth();
  const router = useRouter();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // 메뉴 아이템 생성 함수
  function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
    permissions?: string[],
    groups?: string[]
  ): MenuItem {
    // 권한 체크
    if (permissions && permissions.length > 0) {
      const hasRequiredPermissions = permissions.some(permission => 
        hasPermission(permission)
      );
      if (!hasRequiredPermissions) return null;
    }

    // 그룹 체크
    if (groups && groups.length > 0) {
      const hasRequiredGroups = groups.some(groupId => 
        hasGroupAccess(groupId)
      );
      if (!hasRequiredGroups) return null;
    }

    return {
      key,
      icon,
      children,
      label,
    } as MenuItem;
  }

  // 메뉴 아이템 정의
  const items: any[] = [
    getItem('대시보드', 'dashboard', <DashboardOutlined />, undefined, ['dashboard:read']),
    
    {
      type: 'divider' as const,
    },

    getItem('LLM 채팅', 'chat-group', <MessageOutlined />, [
      getItem('새 대화 시작', 'chat-new', null, undefined, ['chat:create']),
      getItem('대화 기록', 'chat-history', null, undefined, ['chat:read']),
    ]),

    getItem('LLM 관리', 'llm-group', <RobotOutlined />, [
      getItem('Agent 관리', 'agents', null, undefined, ['agents:read']),
      getItem('RAG 관리', 'rag', null, undefined, ['rag:read']),
    ]),

    {
      type: 'divider' as const,
    },

    getItem('시스템 관리', 'system-group', <SettingOutlined />, [
      getItem('사용자 관리', 'users', <UserOutlined />, undefined, ['users:read']),
      getItem('그룹 관리', 'groups', <TeamOutlined />, undefined, ['groups:read']),
      getItem('역할 및 권한', 'roles', <SafetyOutlined />, undefined, ['roles:read']),
      getItem('모니터링', 'monitoring', <MonitorOutlined />, undefined, ['monitoring:read']),
      getItem('시스템 설정', 'settings', <SettingOutlined />, undefined, ['settings:read']),
    ]),

    {
      type: 'divider' as const,
    },

    getItem('도움말', 'help', <QuestionCircleOutlined />),
  ].filter(Boolean); // null 값 제거

  // 메뉴 클릭 핸들러
  const handleMenuClick: MenuProps['onClick'] = (e) => {
    setSelectedKeys([e.key]);
    
    // 라우팅 로직
    const routeMap: Record<string, string> = {
      'dashboard': '/dashboard',
      'chat-new': '/chat',
      'chat-history': '/chat/history',
      'agents': '/agents',
      'rag': '/rag',
      'users': '/users',
      'groups': '/groups',
      'roles': '/roles',
      'monitoring': '/monitoring',
      'settings': '/settings',
      'help': '/help',
    };

    const route = routeMap[e.key];
    if (route) {
      router.push(route);
    }
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={280}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 64, // AppBar 높이만큼 여백
        bottom: 0,
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
        zIndex: 999,
      }}
    >
      <div style={{ 
        padding: collapsed ? '16px 8px' : '16px 24px',
        borderBottom: '1px solid #f0f0f0',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: collapsed ? '12px' : '16px',
        color: '#1890ff',
        transition: 'all 0.2s'
      }}>
        {collapsed ? 'LAM' : 'LLM Agent Manager'}
      </div>
      
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={selectedKeys}
        items={items}
        onClick={handleMenuClick}
        style={{
          border: 'none',
          fontSize: '14px',
        }}
      />

      {/* 사용자 정보 표시 (하단) */}
      {!collapsed && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#666',
          }}>
            <UserOutlined />
            <div>
              <div style={{ fontWeight: 500 }}>관리자</div>
              <div>admin@example.com</div>
            </div>
          </div>
        </div>
      )}
    </Sider>
  );
} 