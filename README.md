# Coding Test Application - MERN Stack with CompileX

A comprehensive MERN stack application for conducting coding tests and contests with automatic code evaluation using CompileX.

## Features

### Admin Features
- **Contest Management**: Create, edit, and delete coding contests
- **Question Management**: Add multiple coding questions with custom test cases
- **Individual Test Case Marks**: Assign specific marks to each test case
- **Flexible Test Cases**: Support for both visible and hidden test cases
- **Real-time Monitoring**: View submissions and contest statistics
- **Language Support**: Configure allowed programming languages per contest

### User Features
- **Contest Participation**: Browse and join available contests
- **Code Editor**: Integrated Monaco editor with syntax highlighting
- **Multiple Languages**: Support for C, C++, Java, Python, and JavaScript
- **Real-time Evaluation**: Automatic code compilation and testing
- **Detailed Results**: View test case results with individual marks
- **Submission History**: Track all attempts and scores

### Technical Features
- **CompileX Integration**: Secure code compilation and execution
- **JWT Authentication**: Secure user authentication and authorization
- **Role-based Access**: Separate admin and user interfaces
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live submission status updates

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **CompileX** for code compilation and execution
- **JWT** for authentication
- **bcryptjs** for password hashing

### Frontend
- **React** with hooks
- **React Router** for navigation
- **Axios** for API communication
- **Monaco Editor** for code editing
- **Tailwind CSS** for styling
- **React Toastify** for notifications

## Installation and Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Git

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables in `.env`:**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/coding-test-app
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```

5. **Start MongoDB service:**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

6. **Start the backend server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Tailwind CSS:**
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

4. **Start the frontend development server:**
   ```bash
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Usage Guide

### Getting Started

1. **Create an Account:**
   - Visit http://localhost:3000/register
   - Choose "Admin" role to create contests or "User" to participate

2. **Admin Workflow:**
   - Login with admin credentials
   - Navigate to Admin Dashboard
   - Create a new contest with questions and test cases
   - Set individual marks for each test case
   - Configure contest timing and allowed languages

3. **User Workflow:**
   - Login with user credentials
   - Browse available contests
   - Join a contest and view questions
   - Write code in the integrated editor
   - Submit solutions and view results

### Creating a Contest (Admin)

1. **Contest Information:**
   - Set contest name, description, and timing
   - Configure duration and maximum attempts
   - Select allowed programming languages

2. **Adding Questions:**
   - Provide question title and description
   - Set difficulty level and constraints
   - Add input/output format and sample cases
   - Configure time and memory limits

3. **Test Cases:**
   - Add multiple test cases with individual marks
   - Set some test cases as hidden for security
   - Ensure comprehensive test coverage

### Participating in Contests (User)

1. **Contest Selection:**
   - View available contests on the dashboard
   - Check contest status (upcoming/active/ended)
   - Click "Enter Contest" to participate

2. **Solving Questions:**
   - Read problem statements carefully
   - Use the Monaco editor to write code
   - Select appropriate programming language
   - Test with sample input/output

3. **Submission and Results:**
   - Submit code for evaluation
   - View real-time compilation and execution results
   - Check individual test case results and marks
   - Track total score and performance

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Contests (User)
- `GET /api/contests` - Get available contests
- `GET /api/contests/:id` - Get contest details
- `GET /api/contests/:contestId/questions/:questionId` - Get question details

### Admin
- `GET /api/admin/contests` - Get all contests (admin)
- `POST /api/admin/contests` - Create new contest
- `PUT /api/admin/contests/:id` - Update contest
- `DELETE /api/admin/contests/:id` - Delete contest
- `GET /api/admin/contests/:id/stats` - Get contest statistics

### Submissions
- `POST /api/submissions` - Submit code for evaluation
- `GET /api/submissions/:id` - Get submission result
- `GET /api/submissions/contest/:contestId/user` - Get user submissions

## Database Schema

### User Model
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: String (admin/user),
  fullName: String,
  createdAt: Date
}
```

### Contest Model
```javascript
{
  name: String,
  description: String,
  startTime: Date,
  endTime: Date,
  duration: Number,
  questions: [QuestionSchema],
  createdBy: ObjectId,
  isActive: Boolean,
  allowedLanguages: [String],
  maxAttempts: Number
}
```

### Question Schema
```javascript
{
  title: String,
  description: String,
  difficulty: String,
  constraints: String,
  inputFormat: String,
  outputFormat: String,
  sampleInput: String,
  sampleOutput: String,
  testCases: [TestCaseSchema],
  timeLimit: Number,
  memoryLimit: Number,
  totalMarks: Number
}
```

### Test Case Schema
```javascript
{
  input: String,
  expectedOutput: String,
  marks: Number,
  isHidden: Boolean
}
```

### Submission Model
```javascript
{
  contestId: ObjectId,
  questionId: ObjectId,
  userId: ObjectId,
  code: String,
  language: String,
  status: String,
  testCaseResults: [TestCaseResultSchema],
  totalMarks: Number,
  maxMarks: Number,
  submittedAt: Date
}
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Role-based Access Control**: Admin/user role separation
- **Input Validation**: Server-side validation for all inputs
- **Code Isolation**: CompileX ensures secure code execution
- **Rate Limiting**: Submission attempt limits per contest

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation for common solutions
- Review the API endpoints and database schema

## Roadmap

- [ ] Add more programming languages
- [ ] Implement plagiarism detection
- [ ] Add contest leaderboards
- [ ] Email notifications for contest updates
- [ ] Export results to CSV/PDF
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] Integration with external judge systems
