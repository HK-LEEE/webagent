import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// JWT 토큰 생성 함수
function generateJWTToken(user: any): string {
  const payload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    status: user.status,
          roles: user.userRoles?.map(ur => ur.role.name) || [],
      groups: user.userGroups?.map(ug => ug.group.name) || [],
    permissions: extractPermissions(user),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7일
  };
  
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
  return jwt.sign(payload, jwtSecret);
}

// 사용자 권한 추출 함수
function extractPermissions(user: any): string[] {
  const permissions = new Set<string>();
  
  // 역할에서 권한 추출
  user.userRoles?.forEach(userRole => {
    userRole.role?.rolePermissions?.forEach(rp => {
      if (rp.permission) {
        permissions.add(`${rp.permission.resource}:${rp.permission.action}`);
      }
    });
  });
  
  // 그룹에서 권한 추출
  user.userGroups?.forEach(userGroup => {
    userGroup.group?.groupPermissions?.forEach(gp => {
      if (gp.permission) {
        permissions.add(`${gp.permission.resource}:${gp.permission.action}`);
      }
    });
  });
  
  return Array.from(permissions);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🔐 [LOGIN API] 요청 시작:', {
    method: req.method,
    url: req.url,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });

  if (req.method !== 'POST') {
    console.log('❌ [LOGIN API] 잘못된 메서드:', req.method);
    return res.status(405).json({ message: '허용되지 않는 메서드입니다' });
  }

  try {
    const { email, password } = req.body;
    console.log('📧 [LOGIN API] 로그인 시도:', { 
      email, 
      passwordLength: password?.length,
      hasPassword: !!password 
    });

    if (!email || !password) {
      console.log('❌ [LOGIN API] 필수 필드 누락:', { email: !!email, password: !!password });
      return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요' });
    }

    console.log('🔍 [LOGIN API] 데이터베이스에서 사용자 조회 시작...');
    
    // 사용자 정보 조회 (관계 데이터 포함)
    const user = await prisma.user.findUnique({
      where: { email },
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

    console.log('👤 [LOGIN API] 사용자 조회 결과:', {
      found: !!user,
      email: user?.email,
      status: user?.status,
      hasPasswordHash: !!user?.passwordHash,
      passwordHashLength: user?.passwordHash?.length
    });

    if (!user) {
      console.log('❌ [LOGIN API] 사용자를 찾을 수 없음:', email);
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }

    console.log('🔒 [LOGIN API] 비밀번호 검증 시작...');
    console.log('🔒 [LOGIN API] bcrypt 비교 - 입력 비밀번호 길이:', password.length);
    console.log('🔒 [LOGIN API] bcrypt 비교 - 저장된 해시 길이:', user.passwordHash.length);
    console.log('🔒 [LOGIN API] bcrypt 비교 - 해시 시작 부분:', user.passwordHash.substring(0, 20));

    // 비밀번호 검증 (bcrypt 사용)
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      console.log('✅ [LOGIN API] bcrypt 비교 완료:', isPasswordValid);
    } catch (bcryptError) {
      console.error('💥 [LOGIN API] bcrypt 비교 오류:', bcryptError);
      return res.status(500).json({ message: '비밀번호 검증 중 오류가 발생했습니다' });
    }

    if (!isPasswordValid) {
      console.log('❌ [LOGIN API] 비밀번호 불일치');
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }

    console.log('🔍 [LOGIN API] 계정 상태 확인:', user.status);

    // 계정 상태 확인
    if (user.status !== 'ACTIVE') {
      const statusMessages = {
        PENDING: '계정이 승인 대기 중입니다. 관리자의 승인을 기다려주세요.',
        INACTIVE: '계정이 비활성화되었습니다. 관리자에게 문의하세요.',
        SUSPENDED: '계정이 일시 정지되었습니다. 관리자에게 문의하세요.',
      };
      
      console.log('❌ [LOGIN API] 계정 상태가 비활성:', user.status);
      return res.status(403).json({ 
        message: statusMessages[user.status as keyof typeof statusMessages] || '계정에 문제가 있습니다.'
      });
    }

    // JWT 토큰 생성
    const token = generateJWTToken(user);

    // 마지막 로그인 시간 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // 감사 로그 기록
    console.log('로그인 성공:', {
      userId: user.id,
      email: user.email,
      username: user.username,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });

    // 응답 데이터 구성
    const responseUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      status: user.status,
      emailVerified: user.emailVerified,
      roles: user.userRoles?.map(ur => ur.role.name) || [],
      groups: user.userGroups?.map(ug => ug.group.name) || [],
      permissions: extractPermissions(user),
      lastLoginAt: user.lastLoginAt,
    };

    res.status(200).json({
      message: '로그인 성공',
      token,
      user: responseUser,
    });

  } catch (error: any) {
    console.error('💥 [LOGIN API] 로그인 오류:', error);
    console.error('💥 [LOGIN API] 오류 스택:', error.stack);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
} 