# Vortex AI-Powered Learning Management System (LMS)

An advanced, AI-driven Learning Management System that revolutionizes online education through intelligent content processing, personalized learning paths, and real-time collaboration features.

## 🚀 Features

### Core LMS Functionality
- **Multi-Role System**: Separate dashboards for Students, Instructors, and Administrators
- **Course Management**: Create, manage, and enroll in courses with comprehensive content organization
- **Video Processing**: Automated video upload, processing, and progress tracking
- **Material Management**: Upload and process various educational materials (PDFs, documents)
- **Assessment System**: Multiple Choice Questions (MCQ) with quiz attempts and scoring
- **Payment Integration**: Secure course purchasing with payment processing

### AI-Powered Features
- **Intelligent Summarization**: Automatic generation of material summaries using advanced NLP
- **AI Chatbot Assistant**: Vortex AI assistant for personalized learning support and Q&A
- **Content Recommendations**: Smart course and material recommendations based on user behavior
- **Automated Transcription**: Video transcription for enhanced accessibility and searchability
- **Smart Content Processing**: AI-driven material analysis and categorization

### Real-Time Collaboration
- **Live Chat**: Course-specific chat rooms for student-instructor interaction
- **Real-Time Notifications**: Instant updates on course activities and announcements

### Advanced Analytics & Security
- **Audit Logging**: Comprehensive tracking of system activities
- **Revenue Analytics**: Detailed financial reporting for administrators
- **User Management**: Advanced user administration with role-based access control
- **Security Features**: Failed login attempt tracking and secure authentication

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library with Lucide React icons
- **State Management**: React Context API
- **Real-Time Communication**: Socket.IO client

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with secure middleware
- **File Upload**: Multer for material and video handling
- **Real-Time**: Socket.IO server

### AI Services (Python)
- **Framework**: FastAPI
- **NLP Processing**: Custom summarization and recommendation algorithms
- **Video Processing**: FFmpeg integration for transcription
- **Document Parsing**: PDF and document processing utilities

### Infrastructure
- **Database**: Supabase with real-time subscriptions
- **File Storage**: Supabase Storage for uploads
- **Deployment**: Docker containerization
- **Version Control**: Git

## 📁 Project Structure

```
Vortex-AI-POWERED-LMS/
├── frontend/                    # Next.js frontend application
│   ├── components/             # Reusable React components
│   │   ├── Admin/             # Admin-specific components
│   │   ├── Auth/              # Authentication components
│   │   ├── Instructor/        # Instructor dashboard components
│   │   ├── student/           # Student dashboard components
│   │   └── common/            # Shared components (Chat, Chatbot, etc.)
│   ├── src/app/               # Next.js app router pages
│   ├── lib/                   # Utility libraries and API clients
│   └── types/                 # TypeScript type definitions
├── backend/                    # Express.js backend server
│   ├── models/                # Database models
│   ├── routes/                # API route handlers
│   ├── middleware/            # Authentication and validation middleware
│   ├── utils/                 # Backend utilities
│   └── migrations/            # Database migration scripts
├── material-summarizer/       # Python service for content summarization
├── python-server/             # Main Python AI services server
└── Architecture.tldr          # System architecture diagram
```

## 🏁 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- Docker (optional, for containerized deployment)
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Vortex-AI-POWERED-LMS
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Configure environment variables (see .env.example)
   npm run migrate  # Run database migrations
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   # Configure environment variables
   npm run dev
   ```

4. **AI Services Setup**
   ```bash
   # Material Summarizer
   cd ../material-summarizer
   pip install -r requirements.txt
   python app.py

   # Main Python Server
   cd ../python-server
   pip install -r requirements.txt
   python app.py
   ```

### Environment Configuration

Create `.env` files in each service directory with the following variables:

**Backend (.env)**
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Python Services**
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🚀 Usage

### For Students
1. Register/Login to access the student dashboard
2. Browse and enroll in available courses
3. Access course materials, videos, and quizzes
4. Participate in course chat and use AI assistant
5. Track learning progress and achievements

### For Instructors
1. Login with instructor privileges
2. Create and manage courses
3. Upload materials and create video content
4. Design MCQ quizzes and assessments
5. Monitor student progress and engagement
6. Manage course chat and student enrollments

### For Administrators
1. Access admin dashboard
2. Manage users and roles
3. View audit logs and system analytics
4. Monitor revenue and payment data
5. Configure system settings

## 🤖 AI Features

### Vortex AI Assistant
- **Contextual Help**: Answers questions about courses, materials, and LMS usage
- **Personalized Recommendations**: Suggests relevant courses and learning paths
- **Progress Tracking**: Provides insights on learning progress and achievements

### Content Intelligence
- **Automatic Summarization**: Generates concise summaries of uploaded materials
- **Smart Categorization**: Organizes content based on topics and difficulty levels
- **Video Transcription**: Converts video content to searchable text

## 🔒 Security Features

- JWT-based authentication with secure middleware
- Role-based access control (RBAC)
- Failed login attempt monitoring
- Secure file upload validation
- Audit logging for all critical operations

## 📊 Database Schema

The system uses Supabase with the following main tables:
- `users` - User accounts and profiles
- `courses` - Course information and metadata
- `materials` - Uploaded educational content
- `videos` - Video content and processing status
- `chat_messages` - Course chat messages
- `chatbot_messages` - AI assistant conversations
- `quiz_attempts` - Student quiz results
- `payments` - Transaction records
- `audit_logs` - System activity tracking

## 🐳 Docker Deployment

Build and run with Docker Compose:
```bash
docker-compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Author

Vennilavan Manoharen – for academic submission.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact venniwork16@gmail.com

## 🔄 Future Enhancements

- Mobile application development
- Advanced analytics dashboard
- Integration with external LMS platforms
- Gamification features
- Offline learning capabilities
- Advanced AI tutoring system

---

**Built with ❤️ for the future of education**
