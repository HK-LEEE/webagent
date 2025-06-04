import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

// JWT 토큰 검증 함수
function verifyToken(authHeader: string | undefined): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    jwt.verify(token, jwtSecret);
    return true;
  } catch (error) {
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 인증 확인
  if (!verifyToken(req.headers.authorization)) {
    return res.status(401).json({ message: '인증이 필요합니다' });
  }

  if (req.method === 'GET') {
    // RAG 세트 목록 조회
    try {
      const ragSets = await prisma.rAGSet.findMany({
        include: {
          ragFiles: true,
        },
        orderBy: { createdAt: 'desc' }
      });

      // 통계 계산
      const ragSetsWithStats = ragSets.map(ragSet => ({
        ...ragSet,
        fileCount: ragSet.ragFiles.length,
        totalSize: ragSet.ragFiles.reduce((sum, file) => sum + (file.size || 0), 0)
      }));

      console.log('RAG 세트 목록 조회:', {
        count: ragSets.length,
        timestamp: new Date().toISOString(),
      });

      const summary = {
        totalSets: ragSets.length,
        readySets: ragSets.filter(r => r.status === 'READY').length,
        indexingSets: ragSets.filter(r => r.status === 'INDEXING').length,
        errorSets: ragSets.filter(r => r.status === 'ERROR').length,
        totalFiles: ragSetsWithStats.reduce((sum, ragSet) => sum + ragSet.fileCount, 0),
        totalSize: ragSetsWithStats.reduce((sum, ragSet) => sum + ragSet.totalSize, 0),
      };

      res.status(200).json({
        success: true,
        ragSets: ragSetsWithStats,
        total: ragSets.length,
        summary,
      });

    } catch (error: any) {
      console.error('RAG 세트 목록 조회 오류:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }

  } else if (req.method === 'POST') {
    // 새 RAG 세트 생성
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'RAG 세트 이름은 필수입니다' });
      }

      const newRAGSet = await prisma.rAGSet.create({
        data: {
          name,
          description,
          vectorDbLocation: `/vector/${name.toLowerCase().replace(/\s+/g, '-')}`,
          status: 'INDEXING',
          metadata: {},
        }
      });

      console.log('새 RAG 세트 생성:', {
        ragSetId: newRAGSet.id,
        name: newRAGSet.name,
        vectorDbLocation: newRAGSet.vectorDbLocation,
        timestamp: new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        message: 'RAG 세트가 성공적으로 생성되었습니다',
        ragSet: newRAGSet,
      });

    } catch (error: any) {
      console.error('RAG 세트 생성 오류:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }

  } else {
    res.status(405).json({ message: '허용되지 않는 메서드입니다' });
  }
} 