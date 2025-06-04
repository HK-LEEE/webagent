import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

// 비밀번호 강도 검증 함수
function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: '비밀번호는 최소 8자 이상이어야 합니다.' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: '비밀번호에 소문자가 포함되어야 합니다.' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: '비밀번호에 대문자가 포함되어야 합니다.' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: '비밀번호에 숫자가 포함되어야 합니다.' };
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return { isValid: false, message: '비밀번호에 특수문자(@$!%*?&)가 포함되어야 합니다.' };
  }
  
  return { isValid: true };
}

// 이메일 형식 검증 함수
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다' });
  }

  try {
    const { email, password, username } = req.body;

    // 입력 데이터 검증
    if (!email || !password) {
      return res.status(400).json({ message: '이메일과 비밀번호는 필수입니다.' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: '올바른 이메일 형식이 아닙니다.' });
    }

    // 비밀번호 강도 검증
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    // 비밀번호 해싱 (솔트 라운드: 12)
    const passwordHash = await bcrypt.hash(password, 12);

    // 새 사용자 생성
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        username: username || null,
        status: 'PENDING', // 관리자 승인 대기 상태
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        username: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      }
    });

    // 기본 사용자 그룹에 자동 할당 (General Users)
    const userGroup = await prisma.group.findUnique({
      where: { name: 'General Users' }
    });

    if (userGroup) {
      await prisma.userGroup.create({
        data: {
          userId: newUser.id,
          groupId: userGroup.id,
        }
      });
    }

    // 기본 사용자 역할 할당 (User)
    const userRole = await prisma.role.findUnique({
      where: { name: 'User' }
    });

    if (userRole) {
      await prisma.userRole.create({
        data: {
          userId: newUser.id,
          roleId: userRole.id,
        }
      });
    }

    // 감사 로그 기록
    console.log('새 사용자 회원가입:', {
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
      status: newUser.status,
      timestamp: new Date().toISOString(),
    });

    // TODO: 이메일 인증 메일 발송 (선택사항)
    // TODO: 관리자에게 승인 요청 알림 발송

    res.status(201).json({
      message: '회원가입이 완료되었습니다. 관리자 승인 후 서비스를 이용하실 수 있습니다.',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        status: newUser.status,
        emailVerified: newUser.emailVerified,
        createdAt: newUser.createdAt,
      },
    });

  } catch (error: any) {
    console.error('회원가입 오류:', error);
    
    // Prisma 오류 처리
    if (error.code === 'P2002') {
      return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
} 