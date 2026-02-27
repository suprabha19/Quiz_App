# System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer - React SPA"
        Browser[Web Browser]
        
        subgraph "React Application"
            Router[React Router]
            AuthContext[Auth Context Provider]
            
            subgraph "Pages"
                Login[Login/Register]
                Dashboard[Dashboard]
                Quiz[Quiz Interface]
                Results[Results]
                History[Quiz History]
                Leaderboard[Leaderboard]
                Analytics[Analytics]
                AdminDash[Admin Dashboard]
                AdminCreate[Create Quiz]
                AdminEdit[Edit Quiz]
            end
            
            subgraph "Components"
                TopBar[Top Bar]
                Sidebar[Sidebar]
                Certificate[Certificate]
            end
            
            API[API Service Layer]
        end
    end
    
    subgraph "Network Layer"
        HTTP[HTTP/HTTPS]
        JWT[JWT Token Auth]
    end
    
    subgraph "Server Layer - Node.js/Express"
        Express[Express Server]
        
        subgraph "Middleware"
            CORS[CORS]
            BodyParser[Body Parser]
            AuthMW[Auth Middleware]
            AdminMW[Admin Middleware]
        end
        
        subgraph "Routes"
            AuthRoutes[/api/auth]
            QuizRoutes[/api/quizzes]
            ResultRoutes[/api/results]
        end
        
        subgraph "Controllers"
            AuthCtrl[Auth Controller]
            QuizCtrl[Quiz Controller]
            ResultCtrl[Result Controller]
        end
        
        subgraph "Models"
            UserModel[User Model]
            QuizModel[Quiz Model]
            ResultModel[Result Model]
        end
    end
    
    subgraph "Database Layer"
        MongoDB[(MongoDB Database)]
        
        subgraph "Collections"
            Users[Users Collection]
            Quizzes[Quizzes Collection]
            Results[Results Collection]
        end
    end
    
    subgraph "External Services"
        BCrypt[BCrypt - Password Hashing]
        JWTLib[JWT - Token Generation]
    end
    
    %% Client connections
    Browser --> Router
    Router --> Login
    Router --> Dashboard
    Router --> Quiz
    Router --> Results
    Router --> History
    Router --> Leaderboard
    Router --> Analytics
    Router --> AdminDash
    Router --> AdminCreate
    Router --> AdminEdit
    
    Login --> AuthContext
    Dashboard --> TopBar
    Dashboard --> Sidebar
    Results --> Certificate
    
    AuthContext --> API
    Login --> API
    Dashboard --> API
    Quiz --> API
    Results --> API
    History --> API
    Leaderboard --> API
    Analytics --> API
    AdminDash --> API
    AdminCreate --> API
    AdminEdit --> API
    
    %% Network layer
    API -->|REST API Calls| HTTP
    HTTP --> JWT
    JWT --> Express
    
    %% Server middleware
    Express --> CORS
    CORS --> BodyParser
    BodyParser --> AuthMW
    AuthMW --> AdminMW
    
    %% Routing
    AdminMW --> AuthRoutes
    AdminMW --> QuizRoutes
    AdminMW --> ResultRoutes
    
    %% Controllers
    AuthRoutes --> AuthCtrl
    QuizRoutes --> QuizCtrl
    ResultRoutes --> ResultCtrl
    
    %% Models
    AuthCtrl --> UserModel
    QuizCtrl --> QuizModel
    ResultCtrl --> ResultModel
    ResultCtrl --> UserModel
    QuizCtrl --> UserModel
    
    %% External services
    AuthCtrl --> BCrypt
    AuthCtrl --> JWTLib
    
    %% Database
    UserModel -->|Mongoose| MongoDB
    QuizModel -->|Mongoose| MongoDB
    ResultModel -->|Mongoose| MongoDB
    
    MongoDB --> Users
    MongoDB --> Quizzes
    MongoDB --> Results
    
    %% Styling
    classDef client fill:#e1f5ff,stroke:#0277bd,stroke-width:2px
    classDef server fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef database fill:#f1f8e9,stroke:#558b2f,stroke-width:2px
    classDef external fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    
    class Browser,Router,AuthContext,Login,Dashboard,Quiz,Results,History,Leaderboard,Analytics,AdminDash,AdminCreate,AdminEdit,TopBar,Sidebar,Certificate,API client
    class Express,CORS,BodyParser,AuthMW,AdminMW,AuthRoutes,QuizRoutes,ResultRoutes,AuthCtrl,QuizCtrl,ResultCtrl,UserModel,QuizModel,ResultModel server
    class MongoDB,Users,Quizzes,Results database
    class BCrypt,JWTLib external
```

## Architecture Overview

### Three-Tier Architecture

The Quiz Application follows a **three-tier architecture** pattern:

#### 1. **Presentation Layer (Client)**
- **Technology**: React 18 with Vite
- **State Management**: React Context API (AuthContext)
- **Routing**: React Router v6 with protected routes
- **Styling**: Custom CSS with responsive design
- **API Communication**: Axios for HTTP requests

**Key Features**:
- Single Page Application (SPA)
- Component-based architecture
- Centralized authentication state
- Dynamic routing based on user roles

#### 2. **Application Layer (Server)**
- **Technology**: Node.js with Express.js
- **Architecture Pattern**: MVC (Model-View-Controller)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing

**Components**:
- **Middleware**: CORS, body-parser, custom auth/admin middleware
- **Routes**: RESTful API endpoints organized by resource
- **Controllers**: Business logic for authentication, quizzes, and results
- **Models**: Mongoose schemas defining data structure

#### 3. **Data Layer (Database)**
- **Technology**: MongoDB (NoSQL)
- **ODM**: Mongoose for schema validation and queries
- **Collections**: 
  - Users (authentication and profile data)
  - Quizzes (questions, options, answers)
  - Results (user attempts and scores)

### Communication Flow

1. **Client → Server**: 
   - HTTPS requests with JWT in Authorization header
   - RESTful API calls (GET, POST, PUT, DELETE)

2. **Server → Database**: 
   - Mongoose ODM for type-safe database operations
   - Connection pooling for performance

3. **Authentication Flow**:
   - User credentials → bcrypt hash comparison
   - JWT token generation and validation
   - Token stored in localStorage (client-side)

### Security Measures

- **Password Protection**: bcryptjs hashing (salt rounds: 10)
- **API Security**: JWT-based authentication
- **Role-Based Access**: Middleware checks for admin privileges
- **CORS**: Configured for specific origins
- **Input Validation**: Express-validator on server-side

### Scalability Considerations

- **Stateless API**: JWT tokens enable horizontal scaling
- **Database Indexing**: MongoDB indexes on frequently queried fields
- **Modular Architecture**: Easy to add new features or microservices
- **Separation of Concerns**: Clear division between layers
