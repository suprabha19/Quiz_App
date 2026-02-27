# Sequence Diagrams - Quiz Application

## 1. User Registration and Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as React Frontend
    participant API as Express API
    participant AC as AuthController
    participant DB as MongoDB
    participant BC as BCrypt
    participant JWT as JWT Library
    
    %% Registration Flow
    rect rgb(240, 248, 255)
    Note over U,JWT: Registration Process
    U->>FE: Enter username & password
    FE->>FE: Validate input (min 3 chars)
    FE->>API: POST /api/auth/register
    API->>AC: register(username, password)
    AC->>BC: hashPassword(password)
    BC-->>AC: hashedPassword
    AC->>DB: Create User document
    DB-->>AC: User saved
    AC->>JWT: generateToken(userId)
    JWT-->>AC: token
    AC-->>API: {token, user}
    API-->>FE: 201 Created {token, user}
    FE->>FE: Store token in localStorage
    FE->>FE: Update AuthContext
    FE-->>U: Redirect to Dashboard
    end
    
    %% Login Flow
    rect rgb(255, 250, 240)
    Note over U,JWT: Login Process
    U->>FE: Enter credentials
    FE->>API: POST /api/auth/login
    API->>AC: login(username, password)
    AC->>DB: Find User by username
    DB-->>AC: User document
    AC->>BC: comparePassword(password, hashedPassword)
    BC-->>AC: isMatch = true
    AC->>JWT: generateToken(userId)
    JWT-->>AC: token
    AC-->>API: {token, user}
    API-->>FE: 200 OK {token, user}
    FE->>FE: Store token in localStorage
    FE->>FE: Update AuthContext
    FE-->>U: Redirect to Dashboard
    end
```

## 2. Taking a Quiz and Viewing Results

```mermaid
sequenceDiagram
    participant U as User
    participant FE as React Frontend
    participant QC as Quiz Component
    participant API as Express API
    participant QCtrl as QuizController
    participant RCtrl as ResultController
    participant DB as MongoDB
    
    %% Browse and Select Quiz
    rect rgb(240, 255, 240)
    Note over U,DB: Quiz Selection
    U->>FE: Navigate to Dashboard
    FE->>API: GET /api/quizzes?category=CSS&difficulty=Basic
    API->>QCtrl: getQuizzesByFilter(category, difficulty)
    QCtrl->>DB: Query Quiz collection
    DB-->>QCtrl: Array of Quiz documents
    QCtrl-->>API: Filtered quizzes
    API-->>FE: 200 OK [quizzes]
    FE-->>U: Display quiz cards
    U->>FE: Click "Start Quiz"
    FE->>QC: Initialize Quiz Component
    end
    
    %% Take Quiz
    rect rgb(255, 248, 240)
    Note over U,QC: Quiz Interaction
    QC->>QC: Load first question
    loop For each question
        QC-->>U: Display question & options
        U->>QC: Select answer
        QC->>QC: Store answer in state
        U->>QC: Click "Next"
        QC->>QC: Move to next question
    end
    U->>QC: Click "Submit Quiz"
    QC->>QC: Calculate score
    end
    
    %% Submit Results
    rect rgb(255, 240, 245)
    Note over U,DB: Result Submission
    QC->>API: POST /api/results
    Note right of QC: Payload: category, difficulty,<br/>score, totalQuestions, answers[]
    API->>RCtrl: submitResult(resultData)
    RCtrl->>DB: Create Result document
    DB-->>RCtrl: Result saved
    RCtrl->>RCtrl: Check badge conditions
    alt New badge earned
        RCtrl->>DB: Update User badges
        DB-->>RCtrl: User updated
        RCtrl-->>API: {result, newBadges: [badge1, badge2]}
    else No new badges
        RCtrl-->>API: {result, newBadges: []}
    end
    API-->>QC: 201 Created {result, newBadges}
    QC->>FE: Navigate to Results page
    FE-->>U: Display score, certificate, badges
    end
```

## 3. Admin Creating a Quiz

```mermaid
sequenceDiagram
    participant A as Admin
    participant FE as React Frontend
    participant API as Express API
    participant AuthMW as Auth Middleware
    participant AdminMW as Admin Middleware
    participant QCtrl as QuizController
    participant DB as MongoDB
    
    %% Navigate to Create Quiz
    rect rgb(240, 248, 255)
    Note over A,DB: Quiz Creation Process
    A->>FE: Navigate to /admin/create
    FE->>FE: Check user role
    alt User is not admin
        FE-->>A: Redirect to Dashboard
    else User is admin
        FE-->>A: Display Create Quiz form
    end
    end
    
    %% Fill and Submit Form
    rect rgb(255, 250, 240)
    Note over A,FE: Form Submission
    A->>FE: Enter question details
    A->>FE: Enter 4 options
    A->>FE: Select correct answer
    A->>FE: Select category & difficulty
    A->>FE: Click "Create Quiz"
    FE->>FE: Validate form data
    end
    
    %% Create Quiz via API
    rect rgb(240, 255, 240)
    Note over FE,DB: Backend Processing
    FE->>API: POST /api/quizzes
    Note right of FE: Headers: Authorization: Bearer <token>
    API->>AuthMW: protect(req, res, next)
    AuthMW->>AuthMW: Verify JWT token
    AuthMW->>AuthMW: Decode user ID
    AuthMW->>DB: Find User by ID
    DB-->>AuthMW: User document
    AuthMW->>AuthMW: Attach user to req
    AuthMW->>AdminMW: next()
    AdminMW->>AdminMW: Check user.role === 'admin'
    alt User is not admin
        AdminMW-->>API: 403 Forbidden
        API-->>FE: 403 Not authorized
        FE-->>A: Display error message
    else User is admin
        AdminMW->>QCtrl: next()
        QCtrl->>QCtrl: Validate quiz data
        QCtrl->>DB: Create Quiz document
        DB-->>QCtrl: Quiz saved
        QCtrl-->>API: New quiz object
        API-->>FE: 201 Created {quiz}
        FE-->>A: Success message & redirect
    end
    end
```

## 4. Viewing User Results (Admin)

```mermaid
sequenceDiagram
    participant A as Admin
    participant FE as React Frontend
    participant API as Express API
    participant RCtrl as ResultController
    participant DB as MongoDB
    
    %% Access Results Tab
    rect rgb(240, 248, 255)
    Note over A,DB: Accessing User Results
    A->>FE: Navigate to Admin Dashboard
    A->>FE: Click "User Results" tab
    FE->>API: GET /api/results/all
    Note right of FE: Headers: Authorization: Bearer <token>
    API->>RCtrl: getAllResults()
    RCtrl->>DB: Find all Results
    Note right of RCtrl: Populate: user (username)
    DB-->>RCtrl: Array of Result documents
    RCtrl-->>API: Results with user data
    API-->>FE: 200 OK [results]
    FE-->>A: Display results table
    end
    
    %% Filter Results
    rect rgb(255, 250, 240)
    Note over A,FE: Filtering Results
    A->>FE: Select user filter: "alice_dev"
    FE->>FE: Filter results array locally
    FE-->>A: Display filtered results
    A->>FE: Select category filter: "JavaScript"
    FE->>FE: Apply additional filter
    FE-->>A: Display results for alice_dev + JavaScript
    end
    
    %% View Statistics
    rect rgb(240, 255, 240)
    Note over A,FE: Statistics Calculation
    FE->>FE: Calculate total attempts
    FE->>FE: Count unique active users
    FE->>FE: Calculate average score
    FE-->>A: Display statistics cards
    end
```

## 5. Leaderboard and Analytics

```mermaid
sequenceDiagram
    participant U as User
    participant FE as React Frontend
    participant API as Express API
    participant RCtrl as ResultController
    participant DB as MongoDB
    
    %% Leaderboard
    rect rgb(240, 248, 255)
    Note over U,DB: Leaderboard Request
    U->>FE: Navigate to Leaderboard
    FE->>API: GET /api/results/leaderboard
    API->>RCtrl: getLeaderboard()
    RCtrl->>DB: Find all Results with user data
    DB-->>RCtrl: All results
    RCtrl->>RCtrl: Calculate best score per user
    RCtrl->>RCtrl: Sort by percentage (descending)
    RCtrl->>RCtrl: Take top 10 users
    RCtrl-->>API: Leaderboard array
    API-->>FE: 200 OK [leaderboard]
    FE-->>U: Display top 10 users
    end
    
    %% Analytics
    rect rgb(255, 250, 240)
    Note over U,DB: Analytics Request
    U->>FE: Navigate to Analytics
    FE->>API: GET /api/results/analytics
    API->>RCtrl: getAnalytics(userId)
    RCtrl->>DB: Find Results for user
    DB-->>RCtrl: User's results
    RCtrl->>RCtrl: Calculate total quizzes
    RCtrl->>RCtrl: Calculate avg score
    RCtrl->>RCtrl: Group by category
    RCtrl->>RCtrl: Group by difficulty
    RCtrl-->>API: Analytics object
    API-->>FE: 200 OK {analytics}
    FE-->>U: Display charts & stats
    end
    
    %% Recommendations
    rect rgb(240, 255, 240)
    Note over U,DB: Recommendation Request
    FE->>API: GET /api/results/recommendations
    API->>RCtrl: getRecommendations(userId)
    RCtrl->>DB: Find Results for user
    DB-->>RCtrl: User's results
    RCtrl->>RCtrl: Calculate avg per category
    RCtrl->>RCtrl: Identify weak areas (<70%)
    RCtrl->>RCtrl: Suggest appropriate difficulty
    RCtrl-->>API: Recommendations array
    API-->>FE: 200 OK [recommendations]
    FE-->>U: Display recommended quizzes
    end
```

## Key Sequence Flow Patterns

### Authentication Flow
1. User submits credentials
2. Frontend validates input
3. API receives request
4. Controller queries database
5. Password verification (bcrypt)
6. JWT token generation
7. Token stored in localStorage
8. User redirected to protected route

### Protected Route Flow
1. Frontend sends request with JWT
2. Auth middleware validates token
3. User data attached to request
4. Admin middleware checks role (if needed)
5. Controller processes request
6. Database operation performed
7. Response sent to frontend

### Data Flow Pattern
1. User interaction triggers event
2. Component updates local state
3. API call made to backend
4. Middleware validates authentication
5. Controller processes business logic
6. Database query executed
7. Response formatted and returned
8. Frontend updates UI with data
