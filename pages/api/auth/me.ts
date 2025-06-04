import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🔍 [ME API] 요청 시작:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  if (req.method !== 'GET') {
    console.log('❌ [ME API] 잘못된 메서드:', req.method);
    return res.status(405).json({ message: '허용되지 않는 메서드입니다' });
  }

  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [ME API] 인증 토큰 없음');
      return res.status(401).json({ message: '인증 토큰이 필요합니다' });
    }

    const token = authHeader.substring(7); // "Bearer " 제거
    console.log('🔑 [ME API] 토큰 확인 중...');

    // JWT 토큰 검증
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, jwtSecret);
      console.log('✅ [ME API] 토큰 검증 성공:', { userId: decoded.userId });
    } catch (jwtError: any) {
      console.log('❌ [ME API] 토큰 검증 실패:', jwtError.message);
      return res.status(401).json({ message: '유효하지 않은 토큰입니다' });
    }

    // 사용자 정보 조회
    console.log('👤 [ME API] 사용자 정보 조회 중...');
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        userGroups: {
          include: {
            group: {
              include: {
                groupPermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      console.log('❌ [ME API] 사용자를 찾을 수 없음:', decoded.userId);
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    // 권한 추출
    const permissions = new Set<string>();
    
    // 역할에서 권한 추출
    user.userRoles?.forEach((userRole: any) => {
      userRole.role?.rolePermissions?.forEach((rp: any) => {
        if (rp.permission) {
          permissions.add(`${rp.permission.resource}:${rp.permission.action}`);
        }
      });
    });
    
    // 그룹에서 권한 추출
    user.userGroups?.forEach((userGroup: any) => {
      userGroup.group?.groupPermissions?.forEach((gp: any) => {
        if (gp.permission) {
          permissions.add(`${gp.permission.resource}:${gp.permission.action}`);
        }
      });
    });

    console.log('✅ [ME API] 사용자 정보 반환:', {
      userId: user.id,
      email: user.email,
      permissionsCount: permissions.size
    });

    // 응답 데이터 구성
    const responseUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      status: user.status,
      emailVerified: user.emailVerified,
      roles: user.userRoles?.map((ur: any) => ur.role.name) || [],
      groups: user.userGroups?.map((ug: any) => ug.group.name) || [],
      permissions: Array.from(permissions),
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      message: '사용자 정보 조회 성공',
      user: responseUser,
    });

  } catch (error: any) {
    console.error('💥 [ME API] 오류:', error);
    console.error('💥 [ME API] 오류 스택:', error.stack);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
} 