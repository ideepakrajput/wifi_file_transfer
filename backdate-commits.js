#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Generate last 7 days
function getLast7Days() {
    const days = [];
    for (let i = 1; i <= 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push({
            index: i,
            date: date,
            formatted: date.toISOString().split('T')[0],
            display: date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        });
    }
    return days;
}

// Create directory structure
function createDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Commit content with backdated timestamp
function createBackdatedCommit(date, message, filePath) {
    const isoDate = date.toISOString();

    try {
        execSync(`git add "${filePath}"`, { stdio: 'inherit' });
        execSync(`GIT_COMMITTER_DATE="${isoDate}" git commit --date="${isoDate}" -m "${message}"`, {
            stdio: 'inherit'
        });
        console.log(`✅ Created commit: ${message}`);
    } catch (error) {
        console.error(`❌ Failed to create commit: ${error.message}`);
    }
}

// Content templates for each commit
const commitContents = [
    {
        folder: 'date_1',
        filename: 'project-setup.md',
        content: `# 🚀 Project Initialization

## Overview
Starting a new exciting project today! This marks the beginning of something amazing.

## Goals
- [ ] Set up project structure
- [ ] Define core requirements
- [ ] Create initial documentation
- [ ] Plan development roadmap

## Tech Stack Considerations
- **Frontend**: React/Vue.js
- **Backend**: Node.js/Express
- **Database**: MongoDB/PostgreSQL
- **Deployment**: Docker/AWS

> "Every great project starts with a single commit" - Anonymous Developer

---
*Created on: ${new Date().toLocaleDateString()}*
`,
        message: '🎯 Initial project setup and planning documentation'
    },
    {
        folder: 'date_2',
        filename: 'architecture-design.md',
        content: `# 🏗️ System Architecture Design

## Architecture Overview
Designing a scalable and maintainable system architecture.

\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │───▶│   Backend   │───▶│  Database   │
│   (React)   │    │  (Node.js)  │    │ (MongoDB)   │
└─────────────┘    └─────────────┘    └─────────────┘
\`\`\`

## Key Components
1. **API Gateway** - Route management and authentication
2. **Microservices** - Modular business logic
3. **Message Queue** - Async communication
4. **Cache Layer** - Performance optimization

## Design Patterns
- **MVC** for separation of concerns
- **Repository Pattern** for data access
- **Observer Pattern** for event handling

### Performance Metrics
- Response time: < 200ms
- Uptime: 99.9%
- Concurrent users: 10,000+
`,
        message: '🏗️ Add comprehensive system architecture design'
    },
    {
        folder: 'date_3',
        filename: 'api-documentation.md',
        content: `# 📡 API Documentation

## REST API Endpoints

### Authentication
\`\`\`http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
\`\`\`

### User Management
\`\`\`http
GET /api/users/:id
Authorization: Bearer <token>
\`\`\`

\`\`\`http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
\`\`\`

### Data Operations
\`\`\`http
GET /api/data?page=1&limit=10
Authorization: Bearer <token>
\`\`\`

## Response Formats
\`\`\`json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

## Error Codes
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **500** - Internal Server Error
`,
        message: '📡 Implement comprehensive API documentation'
    },
    {
        folder: 'date_4',
        filename: 'testing-strategy.md',
        content: `# 🧪 Testing Strategy & Implementation

## Testing Pyramid
\`\`\`
        /\\
       /E2E\\
      /______\\
     /        \\
    /Integration\\
   /______________\\
  /                \\
 /   Unit Tests     \\
/____________________\\
\`\`\`

## Test Coverage Goals
- **Unit Tests**: 90%+ coverage
- **Integration Tests**: Critical paths
- **E2E Tests**: User journeys

## Testing Tools
- **Jest** - Unit testing framework
- **Supertest** - API testing
- **Cypress** - E2E testing
- **Postman** - Manual API testing

## Test Scenarios

### Unit Tests
\`\`\`javascript
describe('UserService', () => {
  test('should create user successfully', () => {
    // Test implementation
  });
  
  test('should validate email format', () => {
    // Test implementation
  });
});
\`\`\`

### Integration Tests
- Database connections
- External API integrations
- Authentication flows

### Performance Tests
- Load testing with 1000+ concurrent users
- Stress testing for breaking points
- Memory leak detection

## Continuous Integration
- Automated testing on every PR
- Code quality checks
- Security vulnerability scans
`,
        message: '🧪 Establish comprehensive testing strategy and framework'
    },
    {
        folder: 'date_5',
        filename: 'deployment-guide.md',
        content: `# 🚀 Deployment Guide & DevOps

## Deployment Pipeline
\`\`\`
Development → Testing → Staging → Production
     ↓           ↓         ↓          ↓
   Local      CI/CD    Preview    Live Site
\`\`\`

## Docker Configuration
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## Environment Variables
\`\`\`bash
NODE_ENV=production
PORT=3000
DATABASE_URL=mongodb://localhost:27017/myapp
JWT_SECRET=your-secret-key
API_KEY=your-api-key
\`\`\`

## Monitoring & Logging
- **Application Monitoring**: New Relic/DataDog
- **Error Tracking**: Sentry
- **Logs**: Winston + ELK Stack
- **Uptime Monitoring**: Pingdom

## Security Checklist
- ✅ HTTPS enabled
- ✅ Security headers configured
- ✅ Input validation implemented
- ✅ Rate limiting active
- ✅ Dependencies updated
- ✅ Secrets management

## Backup Strategy
- **Database**: Daily automated backups
- **Files**: S3 with versioning
- **Code**: Git with multiple remotes
- **Recovery Time**: < 1 hour

## Scaling Considerations
- Horizontal scaling with load balancers
- Database read replicas
- CDN for static assets
- Caching strategies (Redis)

---
🎉 **Project is now production-ready!**
`,
        message: '🚀 Complete deployment guide and production setup'
    }
];

async function main() {
    console.log('\n🕒 Backdated Commit Generator\n');

    const days = getLast7Days();

    console.log('Select a date from the past 7 days:\n');
    days.forEach(day => {
        console.log(`${day.index}. ${day.display} (${day.formatted})`);
    });

    const answer = await new Promise(resolve => {
        rl.question('\nEnter your choice (1-7): ', resolve);
    });

    const selectedDay = days[parseInt(answer) - 1];

    if (!selectedDay) {
        console.log('❌ Invalid selection!');
        rl.close();
        return;
    }

    console.log(`\n✅ Selected: ${selectedDay.display}\n`);

    // Create base directory
    const baseDir = path.join('backdated', selectedDay.formatted);
    createDirectory(baseDir);

    console.log('🔄 Creating 5 backdated commits...\n');

    // Create commits with different times throughout the day
    for (let i = 0; i < commitContents.length; i++) {
        const content = commitContents[i];
        const commitDate = new Date(selectedDay.date);

        // Spread commits throughout the day (9 AM to 5 PM)
        commitDate.setHours(9 + (i * 2), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

        const folderPath = path.join(baseDir, content.folder);
        createDirectory(folderPath);

        const filePath = path.join(folderPath, content.filename);
        fs.writeFileSync(filePath, content.content);

        console.log(`📝 Created: ${filePath}`);

        // Create the backdated commit
        createBackdatedCommit(commitDate, content.message, filePath);

        // Small delay between commits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 Successfully created 5 backdated commits!');
    console.log(`📁 Files created in: ${baseDir}`);
    console.log('\n💡 Use "git log --oneline" to see your commits');

    rl.close();
}

// Handle errors
process.on('unhandledRejection', (error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
});

// Run the application
if (require.main === module) {
    main().catch(console.error);
}