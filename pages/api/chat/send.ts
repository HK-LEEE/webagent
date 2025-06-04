import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🔍 [CHAT SEND API] 요청 시작:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  if (req.method !== 'POST') {
    console.log('❌ [CHAT SEND API] 잘못된 메서드:', req.method);
    return res.status(405).json({ message: '허용되지 않는 메서드입니다' });
  }

  // JWT 토큰 검증
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ [CHAT SEND API] 인증 토큰 없음');
    return res.status(401).json({ message: '인증 토큰이 필요합니다' });
  }

  const token = authHeader.substring(7);
  let userId: string;

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded: any = jwt.verify(token, jwtSecret);
    userId = decoded.userId;
    console.log('✅ [CHAT SEND API] 토큰 검증 성공:', { userId });
  } catch (error) {
    console.log('❌ [CHAT SEND API] 토큰 검증 실패:', error);
    return res.status(401).json({ message: '유효하지 않은 토큰입니다' });
  }

  try {
    const { message, agentId, ragSetId, sessionId } = req.body;

    // 입력 검증
    if (!message || !agentId) {
      console.log('❌ [CHAT SEND API] 필수 필드 누락');
      return res.status(400).json({ 
        message: '메시지와 에이전트 ID는 필수입니다' 
      });
    }

    console.log('💬 [CHAT SEND API] 메시지 처리 중:', {
      userId,
      agentId,
      ragSetId,
      sessionId,
      messageLength: message.length
    });

    // 에이전트 존재 확인
    const agent = await prisma.lLMAgent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      console.log('❌ [CHAT SEND API] 에이전트를 찾을 수 없음:', agentId);
      return res.status(404).json({ message: '에이전트를 찾을 수 없습니다' });
    }

    // RAG 세트 정보 조회 (선택 사항)
    let ragSet = null;
    let referencedDocs: any[] = [];
    
    if (ragSetId) {
      ragSet = await prisma.rAGSet.findUnique({
        where: { id: ragSetId },
        include: {
          ragFiles: true
        }
      });

      if (ragSet) {
        console.log('📚 [CHAT SEND API] RAG 세트 연결됨:', {
          ragSetId: ragSet.id,
          ragSetName: ragSet.name,
          fileCount: ragSet.ragFiles?.length || 0
        });

        // 가상의 문서 검색 결과 생성 (실제 구현에서는 벡터 검색 수행)
        referencedDocs = [
          {
            filename: '예시문서1.pdf',
            snippet: '관련 내용의 일부분...',
            relevance: 0.85
          },
          {
            filename: '예시문서2.docx',
            snippet: '검색된 텍스트 조각...',
            relevance: 0.72
          }
        ];
      }
    }

    // 채팅 세션 조회 또는 생성
    let chatSession;
    if (sessionId && sessionId !== 'default') {
      chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId }
      });
    }

    if (!chatSession) {
      // 새 세션 생성
      chatSession = await prisma.chatSession.create({
        data: {
          userId,
          agentId,
          title: `채팅 세션 ${new Date().toLocaleString()}`,
          settings: {
            ragSetId: ragSetId || null,
            model: agent.model
          }
        }
      });
      console.log('🆕 [CHAT SEND API] 새 채팅 세션 생성:', chatSession.id);
    }

    // 사용자 메시지 저장
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'USER',
        content: message,
        metadata: {
          ragSetId: ragSetId || null,
          agentId
        }
      }
    });

    // LLM 응답 생성 (가상의 응답)
    let response = '';
    
    if (ragSet) {
      response = `[RAG 세트 "${ragSet.name}" 기반 응답]\n\n` +
                `질문: "${message}"\n\n` +
                `RAG 세트의 문서들을 참조하여 다음과 같이 답변드립니다:\n\n` +
                `이는 "${ragSet.name}" 문서에서 추출한 정보를 바탕으로 한 응답입니다. ` +
                `${ragSet.ragFiles?.length || 0}개의 문서에서 관련 정보를 찾았습니다.`;
    } else {
      response = `안녕하세요! 질문: "${message}"\n\n` +
                `${agent.name} (${agent.model}) 에이전트가 응답드립니다. ` +
                `현재 RAG 세트가 연결되지 않아 일반적인 지식으로 답변드립니다.`;
    }

    // 어시스턴트 메시지 저장
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'ASSISTANT',
        content: response,
        metadata: {
          ragSetId: ragSetId || null,
          agentId,
          referencedDocs,
          processingTime: Math.random() * 2000 + 500 // 가상의 처리 시간
        }
      }
    });

    // RAG 참조 정보 저장 (RAG 세트가 있는 경우)
    if (ragSet && referencedDocs.length > 0) {
      await Promise.all(
        referencedDocs.map(async (doc: any) => {
          try {
            await prisma.rAGReference.create({
              data: {
                messageId: assistantMessage.id,
                ragSetId: ragSet.id,
                documentId: 'virtual-doc-id', // 실제 구현에서는 실제 문서 ID
                documentName: doc.filename,
                snippet: doc.snippet,
                score: doc.relevance
              }
            });
          } catch (error) {
            console.warn('⚠️ [CHAT SEND API] RAG 참조 저장 실패:', error);
          }
        })
      );
    }

    console.log('✅ [CHAT SEND API] 메시지 처리 완료:', {
      sessionId: chatSession.id,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
      responseLength: response.length,
      referencedDocsCount: referencedDocs.length
    });

    res.status(200).json({
      message: '메시지 전송 성공',
      sessionId: chatSession.id,
      response,
      referencedDocs,
      metadata: {
        agent: {
          name: agent.name,
          model: agent.model
        },
        ragSet: ragSet ? {
          name: ragSet.name,
          documentCount: ragSet.ragFiles?.length || 0
        } : null
      }
    });

  } catch (error: any) {
    console.error('💥 [CHAT SEND API] 오류:', error);
    console.error('💥 [CHAT SEND API] 오류 스택:', error.stack);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
} 