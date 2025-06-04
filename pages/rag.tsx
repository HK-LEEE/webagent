import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/Layout/MainLayout';

interface RAGSet {
  id: string;
  name: string;
  description?: string;
  status: 'READY' | 'INDEXING' | 'ERROR';
  createdAt: string;
  fileCount: number;
  totalSize: number;
}

export default function RAGPage() {
  const { state, hasPermission } = useAuth();
  const router = useRouter();
  const [ragSets, setRagSets] = useState<RAGSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!hasPermission('rag:read')) {
      setError('RAG 세트 조회 권한이 없습니다.');
      return;
    }

    fetchRAGSets();
  }, [state.isAuthenticated, hasPermission, router]);

  const fetchRAGSets = async () => {
    try {
      const response = await fetch('/api/rag', {
        headers: {
          'Authorization': `Bearer ${state.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRagSets(data.ragSets || []);
      } else {
        setError('RAG 세트 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('RAG 세트 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      READY: { label: '준비완료', color: 'bg-green-100 text-green-800' },
      INDEXING: { label: '인덱싱중', color: 'bg-yellow-100 text-yellow-800' },
      ERROR: { label: '오류', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ERROR;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (error) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RAG 관리</h1>
              <p className="mt-1 text-sm text-gray-500">
                문서 검색 증강 생성을 위한 RAG 세트를 관리합니다.
              </p>
            </div>
            {hasPermission('rag:create') && (
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                + 새 RAG 세트 생성
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">RAG 세트 목록을 불러오는 중...</p>
            </div>
          </div>
        ) : ragSets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 RAG 세트가 없습니다</h3>
            <p className="text-gray-500 mb-4">첫 번째 RAG 세트를 생성해보세요.</p>
            {hasPermission('rag:create') && (
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                RAG 세트 생성하기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {ragSets.map((ragSet) => (
              <div key={ragSet.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{ragSet.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{ragSet.description}</p>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className="text-sm text-gray-500">📄 {ragSet.fileCount}개 파일</span>
                      <span className="text-sm text-gray-500">📅 {new Date(ragSet.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    {getStatusBadge(ragSet.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 