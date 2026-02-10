<div align="center">
  <img src="frontend/public/webtitleimg1.jpg" alt="Vortex LMS Banner" width="15%" height="15%">
  
  <h1>🌪️ Vortex AI-Powered Learning Management System</h1>
  
  <p>
    <strong>A Next-Gen AI-Driven Education Platform</strong>
  </p>
  
  <p>
    <a href="#-features">Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-contributing">Contributing</a>
  </p>

  ![License](https://img.shields.io/badge/license-MIT-blue.svg)
  ![Next.js](https://img.shields.io/badge/Next.js-14-black)
  ![Node.js](https://img.shields.io/badge/Node.js-18+-green)
  ![Python](https://img.shields.io/badge/Python-3.8+-yellow)
  ![Supabase](https://img.shields.io/badge/Supabase-Database-emerald)
  ![Docker](https://img.shields.io/badge/Docker-Ready-blue)
</div>

---

## 🚀 Overview

**Vortex** is an advanced Learning Management System (LMS) that integrates Artificial Intelligence to revolutionize the online education experience. By combining real-time collaboration tools with intelligent content processing, Vortex offers a personalized, efficient, and engaging learning environment for students, while providing powerful management tools for instructors and administrators.

Whether you're looking to host courses, track student progress, or automate content creation, Vortex provides a robust, scalable solution.

---

## ✨ Features

### 🎓 Core LMS Functionality
- **Multi-Role System**: Dedicated dashboards for **Students**, **Instructors**, and **Administrators**.
- **Course Management**: Comprehensive tools to create, manage, and deliver rich course content.
- **Secure Payments**: Integrated Stripe payment processing for course purchases.
- **Assessment Engine**: Multiple Choice Questions (MCQ) system with automated grading and attempts tracking.

### 🤖 AI-Powered Intelligence
- **Smart Summarization**: Automatically generates concise summaries of uploaded materials (PDFs, docs) using NLP.
- **AI Chat Assistant**: Integration with advanced LLMs to answer student queries in real-time.
- **Content Recommendations**: Personalized course suggestions based on user behavior and learning history.
- **Video Transcription**: Automated speech-to-text for video content to enhance accessibility.

### ⚡ Real-Time Collaboration
- **Live Chat**: Course-specific chat rooms powered by **Socket.IO** for instant student-instructor interaction.
- **Real-Time Notifications**: Immediate updates on new content, announcements, and grades.

### 🛡️ Enterprise-Grade Security
- **Role-Based Access Control (RBAC)**: secure permission management.
- **Audit Logging**: Detailed tracking of all critical system actions.
- **Secure Authentication**: JWT-based auth flow with Supabase integration.

---

## 🛠️ Tech Stack

### Frontend
| Tech | Description |
|Data | Value |
| --- | --- |
| **Framework** | [Next.js](https://nextjs.org/) (React) with TypeScript |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/) |
| **State Management** | React Context API |
| **Real-Time** | [Socket.IO Client](https://socket.io/) |
| **UI Components** | [Lucide React](https://lucide.dev/) & Custom Components |

### Backend
| Tech | Description |
|Data | Value |
| --- | --- |
| **Runtime** | [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Authentication** | JWT & Supabase Auth |
| **File Storage** | Supabase Storage |
| **Real-Time Server** | Socket.IO Server |

### AI Services (Microservices)
| Tech | Description |
|Data | Value |
| --- | --- |
| **Language** | [Python](https://www.python.org/) |
| **Framework** | [FastAPI](https://fastapi.tiangolo.com/) |
| **NLP** | [NLTK](https://www.nltk.org/) / Transformers |
| **Video Processing** | [FFmpeg](https://ffmpeg.org/) |

---

## 🏗️ Architecture

The system follows a microservices-inspired architecture:

1.  **Frontend**: Next.js application serving the UI.
2.  **Backend API**: Express.js server handling business logic, database operations, and real-time sockets.
3.  **AI Services**: Python-based FastAPI services for heavy lifting (summarization, recommendations).
4.  **Database & Storage**: Managed Supabase instance.

---

## 🏁 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.8+)
- **Docker** (Optional)
- **Supabase Account**

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/Vortex-AI-POWERED-LMS.git
cd Vortex-AI-POWERED-LMS
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create a .env file based on .env.example
# Run database migrations
npm run migrate

# Start the server
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Create .env.local file
# Start the development server
npm run dev
```

### 4. AI Services Setup
```bash
# Material Summarizer
cd ../material-summarizer
pip install -r requirements.txt
python app.py

# Main AI Server
cd ../python-server
pip install -r requirements.txt
python app.py
```

### Environment Variables
You need to configure `.env` files for each service.

**Backend (.env)**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_key
JWT_SECRET=your_jwt_secret
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch: `git checkout -b feature/your-feature-name`.
3.  Make your changes and commit them: `git commit -m 'Add some feature'`.
4.  Push to the branch: `git push origin feature/your-feature-name`.
5.  Submit a pull request.

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 📞 Support & Author

**Vennilavan Manoharen**

- 📧 Email: venniwork16@gmail.com
- 🐙 GitHub: [Venni16](https://github.com/Venni16)

<div align="center">
  <sub>Built with ❤️ for the future of education.</sub>
</div>
