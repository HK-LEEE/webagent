import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🔍 [RAG DOCUMENTS API] 요청 시작:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  // JWT 토큰 검증
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ [RAG DOCUMENTS API] 인증 토큰 없음');
    return res.status(401).json({ message: '인증 토큰이 필요합니다' });
  }

  const token = authHeader.substring(7);
  let userId: string;

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded: any = jwt.verify(token, jwtSecret);
    userId = decoded.userId;
    console.log('✅ [RAG DOCUMENTS API] 토큰 검증 성공:', { userId });
  } catch (error) {
    console.log('❌ [RAG DOCUMENTS API] 토큰 검증 실패:', error);
    return res.status(401).json({ message: '유효하지 않은 토큰입니다' });
  }

  const { id: ragSetId } = req.query;

  if (!ragSetId || typeof ragSetId !== 'string') {
    console.log('❌ [RAG DOCUMENTS API] 잘못된 RAG 세트 ID');
    return res.status(400).json({ message: '유효한 RAG 세트 ID가 필요합니다' });
  }

  try {
    if (req.method === 'GET') {
      // RAG 세트 존재 확인
      const ragSet = await prisma.rAGSet.findUnique({
        where: { id: ragSetId }
      });

      if (!ragSet) {
        console.log('❌ [RAG DOCUMENTS API] RAG 세트를 찾을 수 없음:', ragSetId);
        return res.status(404).json({ message: 'RAG 세트를 찾을 수 없습니다' });
      }

      // RAG 세트의 문서 목록 조회
      console.log('📋 [RAG DOCUMENTS API] 문서 목록 조회 중...');
      
      const ragFiles = await prisma.rAGFile.findMany({
        where: { ragSetId },
        orderBy: { uploadedAt: 'desc' }
      });

      // 가상의 문서 데이터로 변환
      const documents = ragFiles.map((file: any) => ({
        id: file.id,
        filename: file.name,
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        status: file.indexed ? 'VECTORIZED' : 'UPLOADED',
        vectorized: file.indexed,
        vectorCount: file.chunks || 0,
        createdAt: file.uploadedAt,
        uploader: {
          username: '관리자'
        }
      }));

      console.log('✅ [RAG DOCUMENTS API] 문서 목록 반환:', {
        ragSetId,
        documentCount: documents.length
      });

      res.status(200).json({
        message: '문서 목록 조회 성공',
        documents
      });

    } else {
      console.log('❌ [RAG DOCUMENTS API] 지원하지 않는 메서드:', req.method);
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ message: '허용되지 않는 메서드입니다' });
    }

  } catch (error: any) {
    console.error('💥 [RAG DOCUMENTS API] 오류:', error);
    console.error('💥 [RAG DOCUMENTS API] 오류 스택:', error.stack);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
} 