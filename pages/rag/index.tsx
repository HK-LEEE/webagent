import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Upload, 
  Tag, 
  Space, 
  Card, 
  Tooltip, 
  Progress,
  Typography,
  Row,
  Col,
  Statistic,
  Badge,
  Popconfirm,
  message,
  Tabs,
  Alert,
  Switch
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  CloudUploadOutlined,
  DatabaseOutlined,
  LineChartOutlined,
  SettingOutlined,
  SyncOutlined,
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import MainLayout from '@/components/Layout/MainLayout';
import type { NextPage } from 'next';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface RagSet {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PROCESSING' | 'ERROR';
  embeddingModel: string;
  documentCount: number;
  vectorCount: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    username: string;
    email: string;
  };
  ragPermissions: Array<{
    group: {
      id: string;
      name: string;
    };
  }>;
}

interface RagDocument {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  status: 'UPLOADED' | 'PROCESSING' | 'VECTORIZED' | 'ERROR';
  vectorized: boolean;
  vectorCount?: number;
  createdAt: string;
  uploader: {
    username: string;
  };
}

interface Group {
  id: string;
  name: string;
  description?: string;
}

const RAGManagement: NextPage = () => {
  const [ragSets, setRagSets] = useState<RagSet[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRagSet, setEditingRagSet] = useState<RagSet | null>(null);
  const [selectedRagSet, setSelectedRagSet] = useState<RagSet | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [ragDocuments, setRagDocuments] = useState<RagDocument[]>([]);
  const [form] = Form.useForm();

  // 통계 데이터
  const [stats, setStats] = useState({
    totalRagSets: 0,
    activeRagSets: 0,
    totalDocuments: 0,
    totalVectors: 0
  });

  const embeddingModels = [
    'all-MiniLM-L6-v2',
    'paraphrase-multilingual-MiniLM-L12-v2',
    'all-mpnet-base-v2',
    'sentence-transformers/all-MiniLM-L12-v2'
  ];

  // RAG Set 목록 조회
  const fetchRagSets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rag/sets');
      if (response.ok) {
        const data = await response.json();
        setRagSets(data.ragSets || []);
        
        // 통계 계산
        const totalRagSets = data.ragSets?.length || 0;
        const activeRagSets = data.ragSets?.filter((set: RagSet) => set.status === 'ACTIVE').length || 0;
        const totalDocuments = data.ragSets?.reduce((sum: number, set: RagSet) => sum + set.documentCount, 0) || 0;
        const totalVectors = data.ragSets?.reduce((sum: number, set: RagSet) => sum + set.vectorCount, 0) || 0;
        
        setStats({ totalRagSets, activeRagSets, totalDocuments, totalVectors });
      } else {
        message.error('RAG 세트 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('RAG 세트 조회 오류:', error);
      message.error('RAG 세트 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 그룹 목록 조회
  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('그룹 목록 조회 오류:', error);
    }
  };

  // RAG Set 상세 정보 및 문서 목록 조회
  const fetchRagSetDetails = async (ragSetId: string) => {
    try {
      const response = await fetch(`/api/rag/sets/${ragSetId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setRagDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('RAG 문서 목록 조회 오류:', error);
    }
  };

  useEffect(() => {
    fetchRagSets();
    fetchGroups();
  }, []);

  // RAG Set 생성/수정
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const url = editingRagSet 
        ? `/api/rag/sets/${editingRagSet.id}` 
        : '/api/rag/sets';
      
      const method = editingRagSet ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          embeddingModel: values.embeddingModel,
          groupIds: values.groupIds,
          chunkingStrategy: {
            method: values.chunkingMethod || 'character',
            chunkSize: values.chunkSize || 1000,
            overlap: values.overlap || 200
          },
          preprocessingRules: {
            removeExtraSpaces: values.removeExtraSpaces || true,
            normalizeText: values.normalizeText || true,
            extractMetadata: values.extractMetadata || true
          }
        }),
      });

      if (response.ok) {
        message.success(editingRagSet ? 'RAG 세트가 수정되었습니다.' : 'RAG 세트가 생성되었습니다.');
        setIsModalVisible(false);
        setEditingRagSet(null);
        form.resetFields();
        fetchRagSets();
      } else {
        const error = await response.json();
        message.error(error.message || 'RAG 세트 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('RAG 세트 저장 오류:', error);
      message.error('RAG 세트 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // RAG Set 삭제
  const handleDelete = async (ragSetId: string) => {
    try {
      const response = await fetch(`/api/rag/sets/${ragSetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        message.success('RAG 세트가 삭제되었습니다.');
        fetchRagSets();
      } else {
        const error = await response.json();
        message.error(error.message || 'RAG 세트 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('RAG 세트 삭제 오류:', error);
      message.error('RAG 세트 삭제에 실패했습니다.');
    }
  };

  // 상태별 색상 및 아이콘
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { color: 'success', icon: <CheckCircleOutlined />, text: '활성' };
      case 'INACTIVE':
        return { color: 'default', icon: <ExclamationCircleOutlined />, text: '비활성' };
      case 'PROCESSING':
        return { color: 'processing', icon: <SyncOutlined spin />, text: '처리중' };
      case 'ERROR':
        return { color: 'error', icon: <ExclamationCircleOutlined />, text: '오류' };
      default:
        return { color: 'default', icon: <InfoCircleOutlined />, text: status };
    }
  };

  // 테이블 컬럼 정의
  const columns: ColumnsType<RagSet> = [
    {
      title: 'RAG 세트명',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: RagSet) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.description.length > 50 
                  ? `${record.description.substring(0, 50)}...` 
                  : record.description}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = getStatusConfig(status);
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '문서/벡터',
      key: 'counts',
      width: 120,
      render: (_, record: RagSet) => (
        <div>
          <div><Text>{record.documentCount} 문서</Text></div>
          <div><Text type="secondary">{record.vectorCount.toLocaleString()} 벡터</Text></div>
        </div>
      ),
    },
    {
      title: '임베딩 모델',
      dataIndex: 'embeddingModel',
      key: 'embeddingModel',
      width: 180,
      render: (model: string) => (
        <Tag color="blue" icon={<DatabaseOutlined />}>
          {model}
        </Tag>
      ),
    },
    {
      title: '권한 그룹',
      key: 'permissions',
      width: 150,
      render: (_, record: RagSet) => (
        <div>
          {record.ragPermissions?.map((perm, index) => (
            <Tag key={index} color="geekblue" icon={<TeamOutlined />}>
              {perm.group.name}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '작업',
      key: 'actions',
      width: 150,
      render: (_, record: RagSet) => (
        <Space>
          <Tooltip title="상세 보기">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedRagSet(record);
                setIsDetailModalVisible(true);
                fetchRagSetDetails(record.id);
              }}
            />
          </Tooltip>
          <Tooltip title="편집">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingRagSet(record);
                form.setFieldsValue({
                  name: record.name,
                  description: record.description,
                  embeddingModel: record.embeddingModel,
                  groupIds: record.ragPermissions?.map(p => p.group.id)
                });
                setIsModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="삭제">
            <Popconfirm
              title="RAG 세트를 삭제하시겠습니까?"
              description="이 작업은 되돌릴 수 없습니다."
              onConfirm={() => handleDelete(record.id)}
              okText="삭제"
              cancelText="취소"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div style={{ padding: '24px' }}>
        {/* 페이지 헤더 */}
        <div style={{ marginBottom: '24px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0 }}>
                <DatabaseOutlined /> RAG 관리
              </Title>
              <Paragraph type="secondary">
                RAG(Retrieval Augmented Generation) 세트를 생성하고 관리합니다.
              </Paragraph>
            </Col>
            <Col>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingRagSet(null);
                  form.resetFields();
                  setIsModalVisible(true);
                }}
              >
                새 RAG 세트 생성
              </Button>
            </Col>
          </Row>
        </div>

        {/* 통계 카드 */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="총 RAG 세트"
                value={stats.totalRagSets}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="활성 RAG 세트"
                value={stats.activeRagSets}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="총 문서 수"
                value={stats.totalDocuments}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="총 벡터 수"
                value={stats.totalVectors}
                prefix={<LineChartOutlined />}
                formatter={(value) => `${value?.toLocaleString()}`}
              />
            </Card>
          </Col>
        </Row>

        {/* RAG 세트 테이블 */}
        <Card>
          <Table
            columns={columns}
            dataSource={ragSets}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `총 ${total}개 항목`,
            }}
            scroll={{ x: 1200 }}
          />
        </Card>

        {/* RAG 세트 생성/편집 모달 */}
        <Modal
          title={editingRagSet ? 'RAG 세트 편집' : '새 RAG 세트 생성'}
          open={isModalVisible}
          onOk={() => form.submit()}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingRagSet(null);
            form.resetFields();
          }}
          width={800}
          confirmLoading={loading}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="RAG 세트명"
                  rules={[{ required: true, message: 'RAG 세트명을 입력해주세요.' }]}
                >
                  <Input placeholder="예: 고객지원FAQ" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="embeddingModel"
                  label="임베딩 모델"
                  rules={[{ required: true, message: '임베딩 모델을 선택해주세요.' }]}
                >
                  <Select placeholder="임베딩 모델 선택">
                    {embeddingModels.map(model => (
                      <Option key={model} value={model}>{model}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="설명"
            >
              <TextArea 
                rows={3} 
                placeholder="RAG 세트의 목적이나 포함될 데이터에 대한 설명을 입력해주세요."
              />
            </Form.Item>

            <Form.Item
              name="groupIds"
              label="권한 그룹"
              rules={[{ required: true, message: '접근 권한 그룹을 선택해주세요.' }]}
            >
              <Select
                mode="multiple"
                placeholder="이 RAG 세트를 사용할 수 있는 그룹을 선택하세요"
                allowClear
              >
                {groups.map(group => (
                  <Option key={group.id} value={group.id}>
                    {group.name} {group.description && `(${group.description})`}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Tabs defaultActiveKey="basic" type="card">
              <TabPane tab="기본 설정" key="basic">
                <Alert 
                  message="기본 설정은 위의 필드들로 구성됩니다." 
                  type="info" 
                  showIcon 
                />
              </TabPane>
              
              <TabPane tab="청킹 전략" key="chunking">
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="chunkingMethod"
                      label="청킹 방법"
                      initialValue="character"
                    >
                      <Select>
                        <Option value="character">문자 단위</Option>
                        <Option value="token">토큰 단위</Option>
                        <Option value="paragraph">문단 단위</Option>
                        <Option value="sentence">문장 단위</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="chunkSize"
                      label="청크 크기"
                      initialValue={1000}
                    >
                      <Input type="number" placeholder="1000" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="overlap"
                      label="오버랩"
                      initialValue={200}
                    >
                      <Input type="number" placeholder="200" />
                    </Form.Item>
                  </Col>
                </Row>
              </TabPane>

              <TabPane tab="전처리 규칙" key="preprocessing">
                <Form.Item
                  name="removeExtraSpaces"
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Space>
                    <Switch />
                    <Text>불필요한 공백 제거</Text>
                  </Space>
                </Form.Item>

                <Form.Item
                  name="normalizeText"
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Space>
                    <Switch />
                    <Text>텍스트 정규화</Text>
                  </Space>
                </Form.Item>

                <Form.Item
                  name="extractMetadata"
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Space>
                    <Switch />
                    <Text>메타데이터 추출</Text>
                  </Space>
                </Form.Item>
              </TabPane>
            </Tabs>
          </Form>
        </Modal>

        {/* RAG 세트 상세 모달 */}
        <Modal
          title={`RAG 세트 상세: ${selectedRagSet?.name}`}
          open={isDetailModalVisible}
          onCancel={() => setIsDetailModalVisible(false)}
          width={1000}
          footer={[
            <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
              닫기
            </Button>
          ]}
        >
          {selectedRagSet && (
            <div>
              {/* RAG 세트 정보 */}
              <Card title="기본 정보" size="small" style={{ marginBottom: '16px' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>상태: </Text>
                    {(() => {
                      const config = getStatusConfig(selectedRagSet.status);
                      return (
                        <Tag color={config.color} icon={config.icon}>
                          {config.text}
                        </Tag>
                      );
                    })()}
                  </Col>
                  <Col span={12}>
                    <Text strong>임베딩 모델: </Text>
                    <Tag color="blue">{selectedRagSet.embeddingModel}</Tag>
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: '8px' }}>
                  <Col span={24}>
                    <Text strong>설명: </Text>
                    <Text>{selectedRagSet.description || '설명 없음'}</Text>
                  </Col>
                </Row>
              </Card>

              {/* 문서 목록 */}
              <Card title="업로드된 문서" size="small">
                <Table
                  dataSource={ragDocuments}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 5 }}
                  columns={[
                    {
                      title: '파일명',
                      dataIndex: 'originalName',
                      key: 'originalName',
                    },
                    {
                      title: '크기',
                      dataIndex: 'fileSize',
                      key: 'fileSize',
                      render: (size: number) => `${(size / 1024).toFixed(1)} KB`,
                    },
                    {
                      title: '상태',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status: string) => {
                        const config = getStatusConfig(status);
                        return (
                          <Tag color={config.color} icon={config.icon}>
                            {config.text}
                          </Tag>
                        );
                      },
                    },
                    {
                      title: '벡터 수',
                      dataIndex: 'vectorCount',
                      key: 'vectorCount',
                      render: (count: number) => count?.toLocaleString() || '0',
                    },
                    {
                      title: '업로드일',
                      dataIndex: 'createdAt',
                      key: 'createdAt',
                      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
                    },
                  ]}
                />
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
};

export default RAGManagement; 