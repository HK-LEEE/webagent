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
    // 에이전트 목록 조회
    try {
      const agents = await prisma.lLMAgent.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          model: true,
          version: true,
          status: true,
          configuration: true,
          endpoint: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      console.log('에이전트 목록 조회:', {
        count: agents.length,
        timestamp: new Date().toISOString(),
      });

      res.status(200).json({
        success: true,
        agents,
        total: agents.length,
      });

    } catch (error: any) {
      console.error('에이전트 목록 조회 오류:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }

  } else if (req.method === 'POST') {
    // 새 에이전트 생성
    try {
      const { name, description, model, version, endpoint, configuration } = req.body;

      if (!name || !model || !version) {
        return res.status(400).json({ message: '필수 필드가 누락되었습니다' });
      }

      const newAgent = await prisma.lLMAgent.create({
        data: {
          name,
          description,
          model,
          version,
          endpoint,
          configuration: configuration || {},
          status: 'INACTIVE',
        }
      });

      console.log('새 에이전트 생성:', {
        agentId: newAgent.id,
        name: newAgent.name,
        model: newAgent.model,
        timestamp: new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        message: '에이전트가 성공적으로 생성되었습니다',
        agent: newAgent,
      });

    } catch (error: any) {
      console.error('에이전트 생성 오류:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }

  } else {
    res.status(405).json({ message: '허용되지 않는 메서드입니다' });
  }
} 