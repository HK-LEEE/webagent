# LLM Agent Manager

MySQL 기반의 종합적인 LLM 에이전트 관리 시스템입니다. 사용자 관리, 그룹 관리, 역할 기반 권한 제어, LLM 에이전트 관리, RAG 시스템 관리 등의 기능을 제공합니다.

## 🚀 주요 기능

### 신규 추가 기능
- ✅ **메인 로그인 화면 회원가입 버튼**: 새로운 사용자가 직접 계정을 생성할 수 있습니다
- ✅ **MySQL ORM 연동**: Prisma를 사용한 데이터베이스 관리
- ✅ **환경 변수 관리**: 보안적인 설정 관리
- ✅ **자동 테이블 생성**: 시스템 구동 시 필요한 테이블 자동 생성
- ✅ **샘플 데이터**: 초기 관리자 계정 및 테스트 데이터 자동 생성
- ✅ **회원가입 승인 절차**: 관리자 승인을 통한 계정 활성화

### 핵심 기능
- 🔐 **사용자 관리**: 사용자 등록, 인증, 권한 관리
- 👥 **그룹 관리**: 조직 단위 관리 및 권한 부여
- 🎭 **역할/권한 관리**: 세분화된 권한 제어
- 🤖 **LLM 에이전트 관리**: 다양한 AI 모델 통합 관리
- 📚 **RAG 관리**: 문서 기반 검색 증강 생성
- 💬 **LLM 채팅**: 실시간 AI 대화 인터페이스
- 📊 **시스템 모니터링**: 성능 및 사용량 추적

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript 5.2
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL 8.0+
- **Authentication**: JWT, bcryptjs
- **Styling**: Tailwind CSS, styled-jsx
- **State Management**: React Context API

## 📋 시스템 요구사항

- Node.js 18+ 
- MySQL 8.0+
- npm 또는 yarn

## 🔧 설치 및 설정

### 1. 저장소 클론
```bash
git clone <repository-url>
cd webagent
```

### 2. 의존성 설치
```bash
npm install
# 또는
yarn install
```

### 3. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Database Configuration (필수)
DATABASE_URL="mysql://root:password@localhost:3306/llm_agent_db"

# MySQL Database Settings
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=llm_agent_db

# JWT Secret (보안상 변경 필수)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Admin Account Settings (자동 생성용)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123!
ADMIN_NAME=System Administrator

# Application Settings
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=http://localhost:3002

# Environment
NODE_ENV=development

# OpenAI API (선택사항)
OPENAI_API_KEY=your-openai-api-key

# Anthropic API (선택사항)
ANTHROPIC_API_KEY=your-anthropic-api-key

# File Upload Settings
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

**중요**: 
- `DATABASE_URL`은 실제 MySQL 서버 정보에 맞게 수정하세요
- `JWT_SECRET`은 프로덕션에서 반드시 안전한 값으로 변경하세요
- 관리자 계정 정보는 보안상 변경하는 것을 권장합니다

### 4. MySQL 데이터베이스 준비
MySQL 서버를 시작하고 데이터베이스를 생성하세요:

```sql
CREATE DATABASE llm_agent_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Prisma 설정 및 마이그레이션
```bash
# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스 스키마 푸시
npm run db:push

# 샘플 데이터 시딩
npm run db:seed
```

### 6. 개발 서버 시작
```bash
npm run dev
```

애플리케이션이 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

## 👤 기본 계정 정보

시드 데이터를 통해 생성되는 기본 계정들:

| 역할 | 이메일 | 비밀번호 | 설명 |
|------|--------|----------|------|
| 관리자 | admin@example.com | Admin123! | 시스템 전체 관리 권한 |
| 매니저 | manager@example.com | Manager123! | LLM 에이전트 및 RAG 관리 권한 |
| 일반 사용자 | user@example.com | User123! | 채팅 서비스 이용 권한 |

**참고**: 강력한 비밀번호 정책이 적용되어 있습니다 (8자 이상, 대소문자, 숫자, 특수문자 포함)

## 🗃️ 데이터베이스 스키마

### 주요 테이블
- `users`: 사용자 정보
- `groups`: 그룹 정보
- `roles`: 역할 정보
- `permissions`: 권한 정보
- `llm_agents`: LLM 에이전트 정보
- `rag_sets`: RAG 데이터셋 정보
- `chat_sessions`: 채팅 세션 정보
- `chat_messages`: 채팅 메시지 정보

### 관계 테이블
- `user_groups`: 사용자-그룹 연결
- `user_roles`: 사용자-역할 연결
- `role_permissions`: 역할-권한 연결
- `group_permissions`: 그룹-권한 연결

## 🔄 데이터베이스 마이그레이션

### 개발 환경
```bash
# 스키마 변경사항 적용
npm run db:push

# 마이그레이션 생성 및 적용
npm run db:migrate
```

### 프로덕션 환경
```bash
# 프로덕션 마이그레이션 적용
npx prisma migrate deploy

# Prisma 클라이언트 생성
npx prisma generate
```

## 🔐 보안 설정

### JWT 토큰
- 강력한 JWT_SECRET 사용 (32자 이상 추천)
- 적절한 토큰 만료 시간 설정
- HTTPS 환경에서만 사용

### 데이터베이스
- 강력한 데이터베이스 패스워드 사용
- 데이터베이스 접근 IP 제한
- 정기적인 백업 설정

### 환경 변수
- `.env.local` 파일을 git에 커밋하지 않음
- 프로덕션 환경변수 별도 관리
- 민감한 정보 암호화 저장

## 📁 프로젝트 구조

```
webagent/
├── pages/                    # Next.js 페이지
│   ├── api/                 # API 엔드포인트
│   │   └── auth/           # 인증 관련 API
│   ├── login.tsx           # 로그인/회원가입 페이지
│   └── index.tsx           # 메인 페이지
├── src/
│   ├── components/         # React 컴포넌트
│   │   ├── Auth/          # 인증 관련 컴포넌트
│   │   ├── Layout/        # 레이아웃 컴포넌트
│   │   └── Chat/          # 채팅 관련 컴포넌트
│   ├── context/           # React Context
│   └── types/             # TypeScript 타입 정의
├── prisma/
│   ├── schema.prisma      # 데이터베이스 스키마
│   └── seed.ts           # 시드 데이터
├── lib/
│   └── prisma.ts         # Prisma 클라이언트 설정
└── styles/               # 스타일 파일
```

## 🚀 배포

### 환경별 설정 파일
```bash
# 개발 환경
.env.development

# 스테이징 환경  
.env.staging

# 프로덕션 환경
.env.production
```

### Docker 배포 (선택사항)
```dockerfile
# Dockerfile 예시
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🐛 문제 해결

### 일반적인 문제들

1. **데이터베이스 연결 오류**
   - MySQL 서버 실행 상태 확인
   - DATABASE_URL 환경변수 확인
   - 방화벽 설정 확인

2. **Prisma 관련 오류**
   ```bash
   # Prisma 클라이언트 재생성
   npx prisma generate
   
   # 데이터베이스 스키마 확인
   npx prisma db pull
   ```

3. **권한 관련 오류**
   - 사용자 상태(ACTIVE/PENDING) 확인
   - 역할 및 권한 할당 확인

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 확인하세요.

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.

---

**LLM Agent Manager** - AI 시대의 종합적인 에이전트 관리 솔루션
