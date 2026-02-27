# Activity Diagram - Quiz Application

## 1. User Registration Activity Diagram

```mermaid
flowchart TD
    Start([User Visits Application]) --> CheckAuth{Authenticated?}
    CheckAuth -->|Yes| Dashboard[Go to Dashboard]
    CheckAuth -->|No| ShowLogin[Show Login Page]
    ShowLogin --> ClickRegister{Click Register?}
    ClickRegister -->|No| EnterLogin[Enter Login Credentials]
    ClickRegister -->|Yes| ShowRegForm[Show Registration Form]
    
    ShowRegForm --> EnterUsername[Enter Username]
    EnterUsername --> EnterPassword[Enter Password]
    EnterPassword --> ValidateInput{Input Valid?}
    
    ValidateInput -->|No: Username < 3 chars| ShowError1[Show Error Message]
    ShowError1 --> EnterUsername
    ValidateInput -->|No: Password too short| ShowError2[Show Error Message]
    ShowError2 --> EnterPassword
    
    ValidateInput -->|Yes| SubmitReg[Submit Registration]
    SubmitReg --> HashPassword[Hash Password with BCrypt]
    HashPassword --> CheckUsername{Username<br/>Already Exists?}
    
    CheckUsername -->|Yes| ShowError3[Show 'Username Taken' Error]
    ShowError3 --> EnterUsername
    
    CheckUsername -->|No| CreateUser[Create User in Database]
    CreateUser --> GenerateToken[Generate JWT Token]
    GenerateToken --> StoreToken[Store Token in LocalStorage]
    StoreToken --> UpdateContext[Update Auth Context]
    UpdateContext --> Dashboard
    
    Dashboard --> End([End])
```

## 2. Taking a Quiz Activity Diagram

```mermaid
flowchart TD
    Start([User Logged In]) --> ViewDashboard[View Quiz Dashboard]
    ViewDashboard --> SelectCategory{Select Category<br/>Filter?}
    
    SelectCategory -->|Yes| FilterByCat[Apply Category Filter]
    FilterByCat --> SelectDiff{Select Difficulty<br/>Filter?}
    
    SelectCategory -->|No| SelectDiff
    
    SelectDiff -->|Yes| FilterByDiff[Apply Difficulty Filter]
    FilterByDiff --> ShowFiltered[Display Filtered Quizzes]
    
    SelectDiff -->|No| ShowAll[Display All Quizzes]
    ShowAll --> ShowFiltered
    
    ShowFiltered --> ClickStart[Click 'Start Quiz' Button]
    ClickStart --> FetchQuestions[Fetch Quiz Questions from API]
    FetchQuestions --> InitQuiz[Initialize Quiz State]
    InitQuiz --> ShowQuestion[Display First Question]
    
    ShowQuestion --> UserSelect[User Selects Answer]
    UserSelect --> StoreAnswer[Store Answer in State]
    StoreAnswer --> CheckMore{More Questions?}
    
    CheckMore -->|Yes| ClickNext[Click 'Next']
    ClickNext --> ShowQuestion
    
    CheckMore -->|No| ReviewAnswers{Want to Review?}
    ReviewAnswers -->|Yes| ShowSummary[Show Answer Summary]
    ShowSummary --> ConfirmSubmit{Confirm Submit?}
    ConfirmSubmit -->|No| ShowQuestion
    
    ReviewAnswers -->|No| ConfirmSubmit
    ConfirmSubmit -->|Yes| CalcScore[Calculate Score]
    
    CalcScore --> SubmitResult[Submit Result to API]
    SubmitResult --> SaveDB[Save Result in Database]
    SaveDB --> CheckBadges[Check Badge Conditions]
    
    CheckBadges --> EvalFirstQuiz{First Quiz<br/>Completed?}
    EvalFirstQuiz -->|Yes| AwardFirst[Award 'First Quiz' Badge]
    EvalFirstQuiz -->|No| EvalPerfect
    
    AwardFirst --> EvalPerfect{Score = 100%?}
    EvalPerfect -->|Yes| AwardPerfect[Award 'Perfect Score' Badge]
    EvalPerfect -->|No| EvalTopScorer
    
    AwardPerfect --> EvalTopScorer{Score >= 90%?}
    EvalTopScorer -->|Yes| AwardTop[Award 'Top Scorer' Badge]
    EvalTopScorer -->|No| EvalVeteran
    
    AwardTop --> EvalVeteran{Total Quizzes >= 10?}
    EvalVeteran -->|Yes| AwardVeteran[Award 'Quiz Veteran' Badge]
    EvalVeteran -->|No| EvalSeeker
    
    AwardVeteran --> EvalSeeker{Categories >= 3?}
    EvalSeeker -->|Yes| AwardSeeker[Award 'Knowledge Seeker' Badge]
    EvalSeeker -->|No| ShowResults
    
    AwardSeeker --> ShowResults[Display Results Page]
    ShowResults --> GenCert[Generate Certificate]
    GenCert --> ShowCert[Display Certificate]
    ShowCert --> ShowScore[Show Score & Breakdown]
    ShowScore --> ShowNewBadges{New Badges<br/>Earned?}
    
    ShowNewBadges -->|Yes| DisplayBadges[Display New Badges]
    ShowNewBadges -->|No| NextAction
    
    DisplayBadges --> NextAction{User Action?}
    NextAction -->|View History| GoHistory[Navigate to Quiz History]
    NextAction -->|Take Another| ViewDashboard
    NextAction -->|View Analytics| GoAnalytics[Navigate to Analytics]
    
    GoHistory --> End([End])
    GoAnalytics --> End
```

## 3. Admin Quiz Management Activity Diagram

```mermaid
flowchart TD
    Start([Admin Logs In]) --> CheckRole{User Role<br/>= Admin?}
    CheckRole -->|No| Denied[Access Denied - Redirect to Dashboard]
    CheckRole -->|Yes| ShowAdminDash[Show Admin Dashboard]
    
    ShowAdminDash --> SelectTab{Select Tab}
    
    SelectTab -->|Manage Quizzes| ShowQuizTab[Display Quiz Management]
    SelectTab -->|Manage Users| ShowUserTab[Display User Management]
    SelectTab -->|User Results| ShowResultTab[Display Results View]
    
    %% Quiz Management Branch
    ShowQuizTab --> QuizAction{Choose Action}
    QuizAction -->|Create| NavCreate[Navigate to Create Quiz]
    QuizAction -->|Edit| SelectQuiz[Select Quiz to Edit]
    QuizAction -->|Delete| ConfirmDelete{Confirm Delete?}
    QuizAction -->|Filter| ApplyFilter[Apply Category/Difficulty Filter]
    
    NavCreate --> FillForm[Fill Quiz Form]
    FillForm --> EnterQ[Enter Question Text]
    EnterQ --> EnterOpt[Enter 4 Options]
    EnterOpt --> SelectCorrect[Select Correct Answer]
    SelectCorrect --> SelectCatDiff[Select Category & Difficulty]
    SelectCatDiff --> ValidateQuiz{Form Valid?}
    
    ValidateQuiz -->|No| ShowValidErr[Show Validation Error]
    ShowValidErr --> FillForm
    
    ValidateQuiz -->|Yes| SubmitQuiz[Submit Quiz]
    SubmitQuiz --> SaveQuiz[Save to Database]
    SaveQuiz --> SuccessMsg[Show Success Message]
    SuccessMsg --> ShowQuizTab
    
    SelectQuiz --> LoadQuiz[Load Quiz Data]
    LoadQuiz --> EditForm[Display Edit Form]
    EditForm --> ModifyFields[Modify Fields]
    ModifyFields --> ValidateEdit{Changes Valid?}
    ValidateEdit -->|No| ShowEditErr[Show Error]
    ShowEditErr --> ModifyFields
    ValidateEdit -->|Yes| UpdateQuiz[Update in Database]
    UpdateQuiz --> ShowQuizTab
    
    ConfirmDelete -->|No| ShowQuizTab
    ConfirmDelete -->|Yes| DeleteQuiz[Delete from Database]
    DeleteQuiz --> ShowQuizTab
    
    ApplyFilter --> ShowQuizTab
    
    %% User Management Branch
    ShowUserTab --> UserAction{Choose Action}
    UserAction -->|View All| DisplayUsers[Display All Users]
    UserAction -->|Change Role| SelectUser[Select User]
    
    SelectUser --> ConfirmRole{Confirm Role<br/>Change?}
    ConfirmRole -->|No| ShowUserTab
    ConfirmRole -->|Yes| UpdateRole[Update User Role]
    UpdateRole --> ShowUserTab
    
    DisplayUsers --> ShowUserTab
    
    %% Results Management Branch
    ShowResultTab --> LoadResults[Load All Results]
    LoadResults --> DisplayResults[Display Results Table]
    DisplayResults --> ResultFilter{Apply Filter?}
    
    ResultFilter -->|Filter by User| FilterUser[Filter by Selected User]
    ResultFilter -->|Filter by Category| FilterCat[Filter by Category]
    ResultFilter -->|Both| FilterBoth[Apply Combined Filters]
    ResultFilter -->|None| DisplayResults
    
    FilterUser --> UpdateTable[Update Results Table]
    FilterCat --> UpdateTable
    FilterBoth --> UpdateTable
    UpdateTable --> ShowStats[Show Statistics]
    ShowStats --> ShowResultTab
    
    ShowResultTab --> BackToDash{Back to<br/>Dashboard?}
    ShowQuizTab --> BackToDash
    ShowUserTab --> BackToDash
    
    BackToDash -->|Yes| ShowAdminDash
    BackToDash -->|No| Logout[Logout]
    
    Denied --> End([End])
    Logout --> End
```

## 4. View Analytics and Leaderboard Activity Diagram

```mermaid
flowchart TD
    Start([User Dashboard]) --> Navigate{Navigate To}
    
    Navigate -->|Analytics| ReqAnalytics[Request Analytics Data]
    Navigate -->|Leaderboard| ReqLeaderboard[Request Leaderboard Data]
    Navigate -->|History| ReqHistory[Request Quiz History]
    
    %% Analytics Branch
    ReqAnalytics --> FetchUserResults[Fetch User Results from DB]
    FetchUserResults --> CalcStats[Calculate Statistics]
    CalcStats --> CalcTotal[Calculate Total Quizzes]
    CalcTotal --> CalcAvg[Calculate Average Score]
    CalcAvg --> GroupByCat[Group Results by Category]
    GroupByCat --> GroupByDiff[Group Results by Difficulty]
    GroupByDiff --> CalcBest[Calculate Best Scores]
    CalcBest --> CheckWeak{Weak Areas<br/>Detected?}
    
    CheckWeak -->|Yes: Score < 70%| GenRec[Generate Recommendations]
    CheckWeak -->|No| SkipRec[No Recommendations]
    
    GenRec --> SuggestQuiz[Suggest Quizzes to Practice]
    SuggestQuiz --> DisplayAnalytics[Display Analytics Dashboard]
    SkipRec --> DisplayAnalytics
    
    DisplayAnalytics --> ShowCharts[Show Performance Charts]
    ShowCharts --> ShowRec[Show Recommendations]
    ShowRec --> AnalyticsEnd
    
    %% Leaderboard Branch
    ReqLeaderboard --> FetchAllResults[Fetch All Results from DB]
    FetchAllResults --> GroupByUser[Group Results by User]
    GroupByUser --> CalcBestPerUser[Calculate Best % per User]
    CalcBestPerUser --> SortDesc[Sort by Best % Descending]
    SortDesc --> TakeTop10[Take Top 10 Users]
    TakeTop10 --> DisplayLeader[Display Leaderboard]
    DisplayLeader --> ShowRanks[Show User Rankings]
    ShowRanks --> HighlightCurrent{Current User<br/>in Top 10?}
    
    HighlightCurrent -->|Yes| HighlightUser[Highlight User Entry]
    HighlightCurrent -->|No| ShowPosition[Show User's Position]
    
    HighlightUser --> LeaderEnd
    ShowPosition --> LeaderEnd
    
    %% History Branch
    ReqHistory --> FetchHistory[Fetch User's Results]
    FetchHistory --> SortByDate[Sort by Date Descending]
    SortByDate --> DisplayHistory[Display Quiz History]
    DisplayHistory --> ShowAttempts[Show All Attempts]
    ShowAttempts --> ClickDetails{Click View<br/>Details?}
    
    ClickDetails -->|Yes| ShowDetail[Show Detailed Result]
    ShowDetail --> ShowAnswers[Show All Answers]
    ShowAnswers --> HistoryEnd
    
    ClickDetails -->|No| HistoryEnd
    
    AnalyticsEnd --> ReturnDash{Return to<br/>Dashboard?}
    LeaderEnd --> ReturnDash
    HistoryEnd --> ReturnDash
    
    ReturnDash -->|Yes| End([Back to Dashboard])
    ReturnDash -->|No| Navigate
```

## Key Activity Flow Characteristics

### Decision Points
- **Authentication Checks**: Verify user is logged in before accessing protected features
- **Role Verification**: Ensure admin privileges for management functions
- **Validation Gates**: Validate user input at multiple points
- **Conditional Badge Awards**: Evaluate badge conditions after quiz completion

### Parallel Activities
- Multiple filters can be applied simultaneously (category + difficulty)
- Badge checks happen concurrently during result submission
- Statistics calculations occur in parallel during analytics generation

### Loop Structures
- Question iteration during quiz taking
- Filter application on dashboard
- Review and correction of form inputs

### Error Handling
- Validation errors redirect back to input stage
- Authentication failures redirect to login
- Authorization failures redirect to appropriate page

### State Transitions
- Unauthenticated → Authenticated (via login/register)
- Quiz Selection → Quiz Taking → Results Viewing
- Dashboard → Admin Panel (for admins only)
- Results → Badge Award (conditional)
