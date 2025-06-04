import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🔍 [RAG SETS API] 요청 시작:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  // JWT 토큰 검증
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ [RAG SETS API] 인증 토큰 없음');
    return res.status(401).json({ message: '인증 토큰이 필요합니다' });
  }

  const token = authHeader.substring(7);
  let userId: string;

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded: any = jwt.verify(token, jwtSecret);
    userId = decoded.userId;
    console.log('✅ [RAG SETS API] 토큰 검증 성공:', { userId });
  } catch (error) {
    console.log('❌ [RAG SETS API] 토큰 검증 실패:', error);
    return res.status(401).json({ message: '유효하지 않은 토큰입니다' });
  }

  try {
    if (req.method === 'GET') {
      // RAG 세트 목록 조회 (현재는 기존 RAGSet 모델 사용)
      console.log('📋 [RAG SETS API] RAG 세트 목록 조회 중...');
      
      const ragSets = await prisma.rAGSet.findMany({
        include: {
          ragFiles: true,
          ragSetAccess: {
            include: {
              group: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // 가상의 데이터로 enrichment
      const enrichedRagSets = ragSets.map((ragSet: any) => ({
        id: ragSet.id,
        name: ragSet.name,
        description: ragSet.description,
        status: ragSet.status,
        embeddingModel: 'all-MiniLM-L6-v2', // 기본값
        documentCount: ragSet.ragFiles?.length || 0,
        vectorCount: ragSet.ragFiles?.reduce((sum: number, file: any) => sum + (file.chunks || 0), 0) || 0,
        createdAt: ragSet.createdAt,
        updatedAt: ragSet.updatedAt,
        creator: {
          username: '관리자',
          email: 'admin@example.com'
        },
        ragPermissions: ragSet.ragSetAccess?.map((access: any) => ({
          group: {
            id: access.group.id,
            name: access.group.name
          }
        })) || []
      }));

      console.log('✅ [RAG SETS API] RAG 세트 목록 반환:', {
        count: enrichedRagSets.length
      });

      res.status(200).json({
        message: 'RAG 세트 목록 조회 성공',
        ragSets: enrichedRagSets
      });

    } else if (req.method === 'POST') {
      // RAG 세트 생성 (기존 RAGSet 모델 사용)
      console.log('🆕 [RAG SETS API] RAG 세트 생성 중...');
      
      const {
        name,
        description,
        embeddingModel = 'all-MiniLM-L6-v2',
        groupIds = []
      } = req.body;

      // 입력 검증
      if (!name) {
        console.log('❌ [RAG SETS API] 필수 필드 누락');
        return res.status(400).json({ 
          message: 'RAG 세트명은 필수입니다' 
        });
      }

      // 중복 이름 확인
      const existingRagSet = await prisma.rAGSet.findFirst({
        where: { name }
      });

      if (existingRagSet) {
        console.log('❌ [RAG SETS API] 중복된 RAG 세트명:', name);
        return res.status(400).json({ 
          message: '이미 존재하는 RAG 세트명입니다' 
        });
      }

      // RAG 세트 생성
      const ragSet = await prisma.rAGSet.create({
        data: {
          name,
          description,
          vectorDbLocation: `/vector_db/${name.replace(/\s+/g, '_').toLowerCase()}`,
          status: 'READY',
          metadata: {
            embeddingModel,
            chunkingStrategy: {
              method: 'character',
              chunkSize: 1000,
              overlap: 200
            },
            preprocessingRules: {
              removeExtraSpaces: true,
              normalizeText: true,
              extractMetadata: true
            }
          }
        },
        include: {
          ragSetAccess: {
            include: {
              group: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      // 그룹 권한 설정
      if (groupIds.length > 0) {
        await Promise.all(
          groupIds.map(async (groupId: string) => {
            try {
              await prisma.rAGSetAccess.create({
                data: {
                  ragSetId: ragSet.id,
                  groupId: groupId
                }
              });
            } catch (error) {
              console.warn('⚠️ [RAG SETS API] 그룹 권한 설정 실패:', { groupId, error });
            }
          })
        );
      }

      console.log('✅ [RAG SETS API] RAG 세트 생성 완료:', {
        id: ragSet.id,
        name: ragSet.name
      });

      res.status(201).json({
        message: 'RAG 세트가 생성되었습니다',
        ragSet: {
          id: ragSet.id,
          name: ragSet.name,
          description: ragSet.description,
          status: ragSet.status,
          embeddingModel,
          documentCount: 0,
          vectorCount: 0,
          createdAt: ragSet.createdAt,
          updatedAt: ragSet.updatedAt,
          creator: {
            username: '관리자',
            email: 'admin@example.com'
          },
          ragPermissions: []
        }
      });

    } else {
      console.log('❌ [RAG SETS API] 지원하지 않는 메서드:', req.method);
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ message: '허용되지 않는 메서드입니다' });
    }

  } catch (error: any) {
    console.error('💥 [RAG SETS API] 오류:', error);
    console.error('💥 [RAG SETS API] 오류 스택:', error.stack);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
} 