import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 시작: 데이터베이스 시딩...');

  try {
    // 1. 권한 생성
    console.log('📋 권한 생성 중...');
    const permissions = [
      // 사용자 관리
      { name: 'users:read', resource: 'users', action: 'read', description: '사용자 목록 조회' },
      { name: 'users:create', resource: 'users', action: 'create', description: '사용자 생성' },
      { name: 'users:update', resource: 'users', action: 'update', description: '사용자 수정' },
      { name: 'users:delete', resource: 'users', action: 'delete', description: '사용자 삭제' },
      
      // 그룹 관리
      { name: 'groups:read', resource: 'groups', action: 'read', description: '그룹 목록 조회' },
      { name: 'groups:create', resource: 'groups', action: 'create', description: '그룹 생성' },
      { name: 'groups:update', resource: 'groups', action: 'update', description: '그룹 수정' },
      { name: 'groups:delete', resource: 'groups', action: 'delete', description: '그룹 삭제' },
      
      // 역할 관리
      { name: 'roles:read', resource: 'roles', action: 'read', description: '역할 목록 조회' },
      { name: 'roles:create', resource: 'roles', action: 'create', description: '역할 생성' },
      { name: 'roles:update', resource: 'roles', action: 'update', description: '역할 수정' },
      { name: 'roles:delete', resource: 'roles', action: 'delete', description: '역할 삭제' },
      
      // LLM 에이전트 관리
      { name: 'agents:read', resource: 'agents', action: 'read', description: 'LLM 에이전트 조회' },
      { name: 'agents:create', resource: 'agents', action: 'create', description: 'LLM 에이전트 생성' },
      { name: 'agents:update', resource: 'agents', action: 'update', description: 'LLM 에이전트 수정' },
      { name: 'agents:delete', resource: 'agents', action: 'delete', description: 'LLM 에이전트 삭제' },
      
      // RAG 관리
      { name: 'rag:read', resource: 'rag', action: 'read', description: 'RAG 세트 조회' },
      { name: 'rag:create', resource: 'rag', action: 'create', description: 'RAG 세트 생성' },
      { name: 'rag:update', resource: 'rag', action: 'update', description: 'RAG 세트 수정' },
      { name: 'rag:delete', resource: 'rag', action: 'delete', description: 'RAG 세트 삭제' },
      
      // 채팅
      { name: 'chat:create', resource: 'chat', action: 'create', description: '채팅 세션 생성' },
      { name: 'chat:read', resource: 'chat', action: 'read', description: '채팅 기록 조회' },
      
      // 대시보드
      { name: 'dashboard:read', resource: 'dashboard', action: 'read', description: '대시보드 조회' },
      
      // 모니터링
      { name: 'monitoring:read', resource: 'monitoring', action: 'read', description: '모니터링 데이터 조회' },
      
      // 시스템 설정
      { name: 'settings:read', resource: 'settings', action: 'read', description: '시스템 설정 조회' },
      { name: 'settings:update', resource: 'settings', action: 'update', description: '시스템 설정 수정' },
    ];

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
    }

    // 2. 역할 생성
    console.log('👥 역할 생성 중...');
    const adminRole = await prisma.role.upsert({
      where: { name: 'Administrator' },
      update: {},
      create: {
        name: 'Administrator',
        description: '시스템 전체 관리자',
      },
    });

    const userRole = await prisma.role.upsert({
      where: { name: 'User' },
      update: {},
      create: {
        name: 'User',
        description: '일반 사용자',
      },
    });

    const managerRole = await prisma.role.upsert({
      where: { name: 'Manager' },
      update: {},
      create: {
        name: 'Manager',
        description: 'LLM 에이전트 관리자',
      },
    });

    // 3. 그룹 생성
    console.log('👨‍👩‍👧‍👦 그룹 생성 중...');
    const adminGroup = await prisma.group.upsert({
      where: { name: 'Administrators' },
      update: {},
      create: {
        name: 'Administrators',
        description: '시스템 관리자 그룹',
        purpose: '시스템 전체 관리 및 설정',
      },
    });

    const managerGroup = await prisma.group.upsert({
      where: { name: 'LLM Managers' },
      update: {},
      create: {
        name: 'LLM Managers',
        description: 'LLM 에이전트 관리자 그룹',
        purpose: 'LLM 에이전트 및 RAG 시스템 관리',
      },
    });

    const userGroup = await prisma.group.upsert({
      where: { name: 'General Users' },
      update: {},
      create: {
        name: 'General Users',
        description: '일반 사용자 그룹',
        purpose: 'LLM 채팅 서비스 이용',
      },
    });

    // 4. 사용자 생성
    console.log('👤 사용자 생성 중...');
    
    // 관리자 계정
    const adminPassword = await bcrypt.hash('Admin123!', 12);  // 환경변수 대신 직접 설정
    console.log('🔑 관리자 비밀번호 해시 생성:', adminPassword.substring(0, 20) + '...');
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },  // 환경변수 대신 직접 설정
      update: {
        passwordHash: adminPassword,  // 기존 계정이 있으면 비밀번호 업데이트
        status: 'ACTIVE',
        emailVerified: true,
      },
      create: {
        email: 'admin@example.com',
        passwordHash: adminPassword,
        username: 'System Administrator',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    // 매니저 계정
    const managerPassword = await bcrypt.hash('Manager123!', 12);
    const managerUser = await prisma.user.upsert({
      where: { email: 'manager@example.com' },
      update: {},
      create: {
        email: 'manager@example.com',
        passwordHash: managerPassword,
        username: 'LLM Manager',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    // 일반 사용자 계정
    const testUserPassword = await bcrypt.hash('User123!', 12);
    const testUser = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        email: 'user@example.com',
        passwordHash: testUserPassword,
        username: 'Test User',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    // 5. 사용자-그룹 연결
    console.log('🔗 사용자-그룹 연결 중...');
    await prisma.userGroup.upsert({
      where: {
        userId_groupId: {
          userId: adminUser.id,
          groupId: adminGroup.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        groupId: adminGroup.id,
      },
    });

    await prisma.userGroup.upsert({
      where: {
        userId_groupId: {
          userId: managerUser.id,
          groupId: managerGroup.id,
        },
      },
      update: {},
      create: {
        userId: managerUser.id,
        groupId: managerGroup.id,
      },
    });

    await prisma.userGroup.upsert({
      where: {
        userId_groupId: {
          userId: testUser.id,
          groupId: userGroup.id,
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        groupId: userGroup.id,
      },
    });

    // 6. 사용자-역할 연결
    console.log('🎭 사용자-역할 연결 중...');
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: managerUser.id,
          roleId: managerRole.id,
        },
      },
      update: {},
      create: {
        userId: managerUser.id,
        roleId: managerRole.id,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: testUser.id,
          roleId: userRole.id,
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        roleId: userRole.id,
      },
    });

    // 7. LLM 에이전트 샘플 생성
    console.log('🤖 LLM 에이전트 샘플 생성 중...');
    
    // GPT-4 Agent 확인 후 생성
    const existingGPT = await prisma.lLMAgent.findFirst({
      where: { name: 'GPT-4 Assistant' }
    });
    
    if (!existingGPT) {
      await prisma.lLMAgent.create({
        data: {
          name: 'GPT-4 Assistant',
          description: 'OpenAI GPT-4 기반 범용 AI 어시스턴트',
          model: 'gpt-4',
          version: '1.0.0',
          status: 'ACTIVE',
          configuration: {
            temperature: 0.7,
            maxTokens: 2048,
            topP: 0.9,
          },
          endpoint: 'https://api.openai.com/v1/chat/completions',
        },
      });
    }

    // Claude Agent 확인 후 생성
    const existingClaude = await prisma.lLMAgent.findFirst({
      where: { name: 'Claude Assistant' }
    });
    
    if (!existingClaude) {
      await prisma.lLMAgent.create({
        data: {
          name: 'Claude Assistant',
          description: 'Anthropic Claude 기반 AI 어시스턴트',
          model: 'claude-3-sonnet',
          version: '1.0.0',
          status: 'TESTING',
          configuration: {
            temperature: 0.8,
            maxTokens: 1024,
            topP: 0.95,
          },
          endpoint: 'https://api.anthropic.com/v1/messages',
        },
      });
    }

    // 8. RAG 세트 샘플 생성
    console.log('📚 RAG 세트 샘플 생성 중...');
    
    // 기술 문서 RAG 확인 후 생성
    const existingTechRAG = await prisma.rAGSet.findFirst({
      where: { name: '기술 문서 RAG' }
    });
    
    if (!existingTechRAG) {
      await prisma.rAGSet.create({
        data: {
          name: '기술 문서 RAG',
          description: '시스템 개발 관련 기술 문서들을 벡터화한 RAG 세트',
          vectorDbLocation: '/vector/tech-docs',
          status: 'READY',
          metadata: {
            totalDocuments: 245,
            vectorDimension: 1536,
          },
        },
      });
    }

    // 회사 정책 RAG 확인 후 생성
    const existingPolicyRAG = await prisma.rAGSet.findFirst({
      where: { name: '회사 정책 RAG' }
    });
    
    if (!existingPolicyRAG) {
      await prisma.rAGSet.create({
        data: {
          name: '회사 정책 RAG',
          description: '인사 정책, 업무 가이드라인 등 회사 내부 문서 RAG 세트',
          vectorDbLocation: '/vector/company-policies',
          status: 'READY',
          metadata: {
            totalDocuments: 87,
            vectorDimension: 1536,
          },
        },
      });
    }

    console.log('✅ 시딩 완료!');
    console.log('\n📋 생성된 계정 정보:');
    console.log('👑 관리자: admin@example.com / Admin123!');
    console.log('👨‍💼 매니저: manager@example.com / Manager123!');
    console.log('👤 일반 사용자: user@example.com / User123!');

  } catch (error) {
    console.error('❌ 시딩 오류:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 