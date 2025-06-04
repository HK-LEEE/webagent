# 환경 변수 설정 가이드

프로젝트 루트 디렉터리에 `.env` 파일을 생성하고 아래 내용을 복사해서 붙여넣어 주세요:

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

## 설정 후 실행할 명령어:

1. Prisma 클라이언트 생성:
```bash
npx prisma generate
```

2. 데이터베이스 스키마 적용:
```bash
npx prisma db push
```

3. 시드 데이터 생성:
```bash
npx prisma db seed
```

4. 개발 서버 시작:
```bash
npm run dev
```

## 주의사항:
- MySQL 서버가 실행 중이어야 합니다
- DATABASE_URL의 사용자명, 비밀번호, 데이터베이스명을 실제 환경에 맞게 수정하세요
- 데이터베이스가 존재하지 않으면 먼저 생성해야 합니다:
```sql
CREATE DATABASE llm_agent_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
``` 