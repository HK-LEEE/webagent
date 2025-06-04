import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Table, 
  Button, 
  Card, 
  Tag, 
  Typography, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select,
  message,
  Popconfirm,
  Empty,
  Spin,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  RobotOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/Layout/MainLayout';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

interface LLMAgent {
  id: string;
  name: string;
  description?: string;
  model: string;
  version: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TESTING' | 'DEPRECATED';
  configuration?: any;
  endpoint?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AgentsPage() {
  const { state, hasPermission } = useAuth();
  const router = useRouter();
  const [agents, setAgents] = useState<LLMAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<LLMAgent | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!hasPermission('agents:read')) {
      setError('LLM 에이전트 조회 권한이 없습니다.');
      return;
    }

    fetchAgents();
  }, [state.isAuthenticated, hasPermission, router]);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents', {
        headers: {
          'Authorization': `Bearer ${state.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      } else {
        setError('에이전트 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('에이전트 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async (values: any) => {
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success('에이전트가 성공적으로 생성되었습니다.');
        setShowCreateModal(false);
        form.resetFields();
        fetchAgents();
      } else {
        message.error('에이전트 생성에 실패했습니다.');
      }
    } catch (err) {
      message.error('에이전트 생성에 실패했습니다.');
    }
  };

  const handleEditAgent = async (values: any) => {
    if (!editingAgent) return;

    try {
      const response = await fetch(`/api/agents/${editingAgent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success('에이전트가 성공적으로 수정되었습니다.');
        setEditingAgent(null);
        form.resetFields();
        fetchAgents();
      } else {
        message.error('에이전트 수정에 실패했습니다.');
      }
    } catch (err) {
      message.error('에이전트 수정에 실패했습니다.');
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${state.token}`,
        },
      });

      if (response.ok) {
        message.success('에이전트가 성공적으로 삭제되었습니다.');
        setAgents(agents.filter(agent => agent.id !== agentId));
      } else {
        message.error('에이전트 삭제에 실패했습니다.');
      }
    } catch (err) {
      message.error('에이전트 삭제에 실패했습니다.');
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: '활성', color: 'success', icon: <PlayCircleOutlined /> },
      INACTIVE: { label: '비활성', color: 'default', icon: <PauseCircleOutlined /> },
      TESTING: { label: '테스트', color: 'warning', icon: <WarningOutlined /> },
      DEPRECATED: { label: '사용중단', color: 'error', icon: <PauseCircleOutlined /> },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE;
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.label}
      </Tag>
    );
  };

  const columns: ColumnsType<LLMAgent> = [
    {
      title: '에이전트',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <div style={{ color: '#8c8c8c', fontSize: '12px' }}>{record.description}</div>
        </div>
      ),
    },
    {
      title: '모델',
      dataIndex: 'model',
      key: 'model',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ color: '#8c8c8c', fontSize: '12px' }}>v{record.version}</div>
        </div>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '작업',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {hasPermission('agents:update') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingAgent(record);
                form.setFieldsValue(record);
              }}
            />
          )}
          {hasPermission('agents:delete') && (
            <Popconfirm
              title="에이전트 삭제"
              description="정말로 이 에이전트를 삭제하시겠습니까?"
              onConfirm={() => handleDeleteAgent(record.id)}
              okText="삭제"
              cancelText="취소"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (error) {
    return (
      <MainLayout>
        <div style={{ padding: '24px' }}>
          <Alert
            message="오류"
            description={error}
            type="error"
            showIcon
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ padding: '24px' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
                <RobotOutlined style={{ marginRight: '8px' }} />
                LLM Agent 관리
              </Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>
                AI 에이전트들을 관리하고 모니터링할 수 있습니다.
              </Paragraph>
            </div>
            {hasPermission('agents:create') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowCreateModal(true)}
                size="large"
              >
                새 에이전트 추가
              </Button>
            )}
          </div>
        </div>

        {/* 에이전트 목록 */}
        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px', color: '#8c8c8c' }}>
                에이전트 목록을 불러오는 중...
              </div>
            </div>
          ) : agents.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  등록된 에이전트가 없습니다<br />
                  첫 번째 LLM 에이전트를 추가해보세요.
                </span>
              }
            >
              {hasPermission('agents:create') && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowCreateModal(true)}
                >
                  에이전트 추가하기
                </Button>
              )}
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={agents}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} 에이전트`,
              }}
            />
          )}
        </Card>

        {/* 에이전트 생성/수정 모달 */}
        <Modal
          title={editingAgent ? '에이전트 수정' : '새 에이전트 생성'}
          open={showCreateModal || !!editingAgent}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingAgent(null);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={editingAgent ? handleEditAgent : handleCreateAgent}
          >
            <Form.Item
              name="name"
              label="에이전트 이름"
              rules={[{ required: true, message: '에이전트 이름을 입력해주세요!' }]}
            >
              <Input placeholder="예: GPT-4 Assistant" />
            </Form.Item>

            <Form.Item
              name="description"
              label="설명"
            >
              <TextArea 
                rows={3} 
                placeholder="에이전트에 대한 설명을 입력하세요" 
              />
            </Form.Item>

            <Form.Item
              name="model"
              label="모델"
              rules={[{ required: true, message: '모델을 입력해주세요!' }]}
            >
              <Input placeholder="예: gpt-4, claude-3-sonnet" />
            </Form.Item>

            <Form.Item
              name="version"
              label="버전"
              rules={[{ required: true, message: '버전을 입력해주세요!' }]}
            >
              <Input placeholder="예: 1.0.0" />
            </Form.Item>

            <Form.Item
              name="status"
              label="상태"
              rules={[{ required: true, message: '상태를 선택해주세요!' }]}
            >
              <Select placeholder="상태를 선택하세요">
                <Select.Option value="ACTIVE">활성</Select.Option>
                <Select.Option value="INACTIVE">비활성</Select.Option>
                <Select.Option value="TESTING">테스트</Select.Option>
                <Select.Option value="DEPRECATED">사용중단</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="endpoint"
              label="API 엔드포인트"
            >
              <Input placeholder="예: https://api.openai.com/v1/chat/completions" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
} 