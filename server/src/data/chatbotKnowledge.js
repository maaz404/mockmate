module.exports = [
  // ===== INTERVIEW TIPS =====
  {
    id: "tip_001",
    title: "STAR Method for Behavioral Questions",
    content: `The STAR method is a structured approach for answering behavioral interview questions. It helps you provide clear, comprehensive answers:

- Situation: Set the context for your story (where, when, what was happening)
- Task: Describe the challenge or responsibility you faced
- Action: Explain the specific steps you took to address the situation
- Result: Share the outcomes, metrics, and what you learned

Example Question: "Tell me about a time you faced a difficult technical challenge"

Example Answer using STAR:
- Situation: "During my internship at XYZ Corp, our e-commerce site was experiencing 5-second page load times during peak hours"
- Task: "As the frontend developer, I was tasked with improving performance to under 2 seconds"
- Action: "I implemented code splitting, lazy loading for images, and optimized our bundle size by removing unused dependencies. I also added caching for API responses"
- Result: "Page load time dropped to 1.3 seconds, resulting in a 25% increase in conversion rate and positive customer feedback"

Tips:
- Quantify results whenever possible (percentages, numbers, metrics)
- Focus on YOUR actions, not the team's
- Keep it concise (2-3 minutes)
- Practice multiple STAR stories for different scenarios`,
    category: "interview-tips",
    source: "Interview Techniques",
    tags: ["STAR", "behavioral", "interview-method"],
  },

  {
    id: "tip_002",
    title: "Common Interview Mistakes to Avoid",
    content: `Top 10 mistakes candidates make in interviews and how to avoid them:

1. Not Researching the Company
   - Fix: Spend 30 minutes reviewing company website, recent news, products, and culture

2. Speaking Negatively About Previous Employers
   - Fix: Frame past challenges as learning opportunities; focus on what you gained

3. Failing to Prepare Questions
   - Fix: Prepare 5-10 thoughtful questions about the role, team, and company

4. Being Too Vague in Answers
   - Fix: Use specific examples with numbers and details (STAR method)

5. Not Practicing Out Loud
   - Fix: Record yourself answering common questions; use MockMate for practice

6. Poor Body Language
   - Fix: Maintain eye contact, sit up straight, smile naturally, avoid fidgeting

7. Arriving Late or Unprepared
   - Fix: Test your tech 30 mins early for virtual; arrive 10-15 mins early for in-person

8. Talking Too Much or Too Little
   - Fix: Aim for 2-3 minute answers; pause to check if they want more detail

9. Not Following Up
   - Fix: Send a thank-you email within 24 hours referencing specific conversation points

10. Lying or Exaggerating
    - Fix: Be honest about your experience level; focus on your willingness to learn`,
    category: "interview-tips",
    source: "Interview Techniques",
    tags: ["mistakes", "interview-tips", "best-practices"],
  },

  {
    id: "tip_003",
    title: "How to Answer 'Tell Me About Yourself'",
    content: `This is often the first question in interviews. A strong answer sets a positive tone for the entire conversation.

Structure (2-3 minutes):
1. Present (30 seconds): Current role and key responsibilities
2. Past (45 seconds): Relevant experience and achievements
3. Future (45 seconds): Why you're interested in this role and company

Example Answer:
"I'm currently a Full Stack Developer at Tech Startup, where I build scalable web applications using React and Node.js. In my current role, I led the migration of our legacy system to a microservices architecture, which reduced deployment time by 60%.

Before this, I worked as a Frontend Developer at Digital Agency for 2 years, where I built responsive websites for Fortune 500 clients. I'm particularly proud of an e-commerce platform I built that handled 1 million daily users during Black Friday.

I'm excited about this opportunity at your company because I'm passionate about fintech, and your mission to make financial services accessible aligns with my values. I'd love to bring my experience in building performant, user-friendly applications to your team."

Key Tips:
- Start with present, not your childhood or education
- Focus on professional experience relevant to the job
- Connect your story to why you want THIS job
- Keep it concise and engaging
- Practice until it sounds natural, not rehearsed
- End with enthusiasm about the opportunity`,
    category: "interview-tips",
    source: "Interview Techniques",
    tags: ["tell-me-about-yourself", "behavioral", "opening-question"],
  },

  // ===== TECHNICAL CONCEPTS =====
  {
    id: "tech_001",
    title: "React Hooks Deep Dive",
    content: `React Hooks let you use state and lifecycle features in functional components. Key hooks and their use cases:

**useState** - State Management
- Syntax: const [state, setState] = useState(initialValue)
- Use for: Simple state like counters, toggles, form inputs
- Example: const [count, setCount] = useState(0)

**useEffect** - Side Effects
- Syntax: useEffect(() => { /* effect */ }, [dependencies])
- Use for: API calls, subscriptions, DOM manipulation
- Cleanup: Return a function to clean up (unsubscribe, clear timers)
- Dependencies: Empty [] runs once, [dep] runs when dep changes

**useContext** - Context API
- Syntax: const value = useContext(MyContext)
- Use for: Accessing global state (theme, auth, language)
- Avoids prop drilling

**useReducer** - Complex State Logic
- Syntax: const [state, dispatch] = useReducer(reducer, initialState)
- Use for: Complex state with multiple sub-values or when next state depends on previous
- When to use over useState: Multiple state updates, complex logic, testing state transitions

**useMemo** - Memoization
- Syntax: const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b])
- Use for: Expensive calculations that shouldn't re-run on every render
- Returns a memoized VALUE

**useCallback** - Memoized Callbacks
- Syntax: const memoizedCallback = useCallback(() => { doSomething(a, b) }, [a, b])
- Use for: Preventing child component re-renders when passing callbacks
- Returns a memoized FUNCTION

**useRef** - DOM References & Persistent Values
- Syntax: const ref = useRef(initialValue)
- Use for: Accessing DOM elements, storing mutable values that don't trigger re-renders

Common Interview Questions:
1. "When would you use useReducer instead of useState?"
   Answer: When state logic is complex, has multiple sub-values, or when the next state depends on the previous one. Also better for testing.

2. "What's the difference between useMemo and useCallback?"
   Answer: useMemo memoizes a computed VALUE, useCallback memoizes a FUNCTION. Both prevent unnecessary re-computations.

3. "Explain useEffect dependency array"
   Answer: 
   - No array: Runs after every render
   - Empty []: Runs once on mount
   - [dep1, dep2]: Runs when dependencies change`,
    category: "technical",
    source: "Technical Concepts",
    tags: ["React", "JavaScript", "frontend", "hooks"],
  },

  {
    id: "tech_002",
    title: "REST API Design Best Practices",
    content: `RESTful API design principles for building scalable, maintainable APIs:

**1. HTTP Methods (Verbs)**
- GET: Retrieve resources (read-only, safe, idempotent)
- POST: Create new resources
- PUT: Update entire resource (replace)
- PATCH: Partial update (modify specific fields)
- DELETE: Remove resources

**2. HTTP Status Codes**
Success:
- 200 OK: Request succeeded
- 201 Created: Resource created successfully
- 204 No Content: Success but no response body

Client Errors:
- 400 Bad Request: Invalid input
- 401 Unauthorized: Authentication required
- 403 Forbidden: Authenticated but not authorized
- 404 Not Found: Resource doesn't exist
- 409 Conflict: Resource conflict (e.g., duplicate)

Server Errors:
- 500 Internal Server Error: Server-side error
- 503 Service Unavailable: Server down/maintenance

**3. URL Structure**
✓ Good:
- GET /api/users (list all users)
- GET /api/users/123 (get user by ID)
- POST /api/users (create user)
- PUT /api/users/123 (update user)
- DELETE /api/users/123 (delete user)

✗ Bad:
- GET /api/getUsers
- POST /api/createUser
- GET /api/user/delete/123

Rules:
- Use plural nouns (/users, not /user)
- Use hyphens for multi-word resources (/user-profiles)
- Lowercase URLs
- No trailing slashes

**4. Filtering, Sorting, Pagination**
Filtering: GET /api/users?role=admin&status=active
Sorting: GET /api/users?sort=createdAt:desc
Pagination: GET /api/users?page=2&limit=20

**5. Versioning**
- URL: /api/v1/users, /api/v2/users
- Header: Accept: application/vnd.company.v1+json

**6. Error Responses**
Consistent format:
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      { "field": "email", "message": "Must be valid email" }
    ]
  }
}

**7. Authentication**
- JWT tokens in Authorization header
- Bearer token: Authorization: Bearer <token>
- Refresh tokens for session management

Common Interview Questions:
1. "What's the difference between PUT and PATCH?"
   Answer: PUT replaces entire resource, PATCH updates specific fields. PUT is idempotent (same result if called multiple times).

2. "How do you handle API versioning?"
   Answer: URL versioning (/v1/, /v2/) is most common and clearest. Header versioning is more RESTful but less visible.

3. "What status code for successful DELETE?"
   Answer: 204 No Content (resource deleted, no response body) or 200 OK (with response body confirming deletion).`,
    category: "technical",
    source: "Technical Concepts",
    tags: ["REST", "API", "backend", "design", "Node.js"],
  },

  {
    id: "tech_003",
    title: "JavaScript Closures Explained",
    content: `Closures are one of the most powerful and frequently misunderstood concepts in JavaScript.

**What is a Closure?**
A closure is a function that has access to variables in its outer (enclosing) lexical scope, even after the outer function has returned.

**Simple Example:**
function outer() {
  const name = 'Alice';
  
  function inner() {
    console.log(name); // inner() has access to 'name'
  }
  
  return inner;
}

const closure = outer();
closure(); // Logs: "Alice" (even though outer() has finished executing)

**Why Closures Matter:**
1. Data Privacy (private variables)
2. Function factories
3. Callbacks and event handlers
4. Currying and partial application

**Practical Use Case - Counter:**
function createCounter() {
  let count = 0; // Private variable
  
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count
  };
}

const counter = createCounter();
counter.increment(); // 1
counter.increment(); // 2
counter.getCount();  // 2
// 'count' cannot be accessed directly - it's private!

**Practical Use Case - React useState Implementation:**
function useState(initialValue) {
  let state = initialValue; // Closure variable
  
  function setState(newValue) {
    state = newValue;
    render(); // Trigger re-render
  }
  
  return [state, setState];
}

**Common Interview Questions:**

1. "What will this code output?"
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1000);
}
// Output: 3, 3, 3 (var is function-scoped)

Fix with let (block-scoped):
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1000);
}
// Output: 0, 1, 2

Fix with closure:
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(() => console.log(j), 1000);
  })(i);
}
// Output: 0, 1, 2

2. "Create a function that logs a message after a delay"
function delayedLog(message, delay) {
  setTimeout(() => {
    console.log(message); // Closure over 'message'
  }, delay);
}

3. "Implement a private counter"
See createCounter() example above.

**Memory Considerations:**
- Closures keep references to outer variables, which can prevent garbage collection
- Be careful with closures in loops or event handlers
- Clean up event listeners to avoid memory leaks`,
    category: "technical",
    source: "Technical Concepts",
    tags: ["JavaScript", "closures", "scope", "frontend"],
  },

  {
    id: "tech_004",
    title: "SQL vs NoSQL Databases",
    content: `Understanding when to use SQL (relational) vs NoSQL (non-relational) databases.

**SQL Databases (Relational)**
Examples: PostgreSQL, MySQL, SQL Server

Characteristics:
- Structured data with predefined schema
- Tables with rows and columns
- ACID transactions (Atomicity, Consistency, Isolation, Durability)
- Relationships between tables (foreign keys)
- SQL query language
- Vertical scaling (add more power to existing server)

Use Cases:
✓ Financial applications (banking, payments)
✓ E-commerce (orders, inventory, transactions)
✓ CRM systems
✓ Applications requiring complex queries and joins
✓ Data integrity is critical

Example Schema:
Users Table:
- id (PRIMARY KEY)
- email
- name

Orders Table:
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- total
- created_at

**NoSQL Databases (Non-Relational)**
Examples: MongoDB, Cassandra, Redis, DynamoDB

Types:
1. Document: MongoDB (JSON-like documents)
2. Key-Value: Redis, DynamoDB
3. Column-Family: Cassandra
4. Graph: Neo4j

Characteristics:
- Flexible/dynamic schema
- Horizontal scaling (add more servers)
- Eventually consistent (BASE: Basically Available, Soft state, Eventually consistent)
- Designed for distributed systems
- High performance for specific use cases

Use Cases:
✓ Real-time analytics
✓ Content management systems
✓ IoT applications
✓ Social networks (flexible user profiles)
✓ Caching layers (Redis)
✓ Applications with unpredictable data structure

MongoDB Example:
{
  "_id": "123",
  "name": "Alice",
  "email": "alice@example.com",
  "orders": [
    { "id": "456", "total": 99.99, "items": [...] },
    { "id": "789", "total": 149.99, "items": [...] }
  ]
}

**Key Differences:**

| Feature | SQL | NoSQL |
|---------|-----|-------|
| Schema | Fixed | Flexible |
| Scaling | Vertical | Horizontal |
| Transactions | ACID | BASE (eventual) |
| Query Language | SQL | Varies |
| Relationships | JOINs | Embedded/References |
| Best For | Complex queries | High throughput |

**When to Choose SQL:**
- Data structure is well-defined and unlikely to change
- Need ACID compliance
- Require complex queries with JOINs
- Data integrity is critical (banking, healthcare)

**When to Choose NoSQL:**
- Schema might change frequently
- Need to scale horizontally
- High write throughput required
- Working with unstructured/semi-structured data
- Speed is more important than consistency

**Common Interview Questions:**

1. "Explain ACID properties"
- Atomicity: All or nothing (transaction succeeds or fails completely)
- Consistency: Data remains valid (constraints maintained)
- Isolation: Concurrent transactions don't interfere
- Durability: Committed data persists (survives system failures)

2. "What is denormalization and when would you use it?"
Answer: Storing redundant data to improve read performance. Use in NoSQL or read-heavy SQL systems. Trade-off: faster reads, slower writes, more storage.

3. "How do you handle relationships in MongoDB?"
Answer: Two approaches:
- Embedding: Store related data in same document (good for one-to-few)
- Referencing: Store IDs and use application-level joins (good for one-to-many)

**Hybrid Approach:**
Modern applications often use both:
- SQL for transactional data (orders, payments)
- NoSQL for caching (Redis)
- NoSQL for analytics (Cassandra)
- NoSQL for session storage (Redis)`,
    category: "technical",
    source: "Technical Concepts",
    tags: ["databases", "SQL", "NoSQL", "backend", "MongoDB", "PostgreSQL"],
  },

  // ===== PLATFORM HELP =====
  {
    id: "help_001",
    title: "How to Start a Mock Interview",
    content: `Step-by-step guide to starting your first mock interview on MockMate:

**Step 1: Navigate to Mock Interview**
- Click "Mock Interview" in the left sidebar
- Or click "Start New Interview" from your Dashboard

**Step 2: Configure Your Interview**
Required Settings:
- Job Role: Select your target position (e.g., Software Engineer, Frontend Developer, Data Scientist)
- Difficulty Level: Choose based on your experience
  • Beginner: Entry-level, basic concepts
  • Intermediate: 2-5 years experience
  • Advanced: Senior roles, system design

**Step 3: Optional Features**
Enable these for enhanced practice:

Adaptive Difficulty:
- ✓ Questions adapt based on your performance
- ✓ Starts at your selected difficulty
- ✓ Adjusts up/down as you answer
- Recommended for: Realistic interview experience

Coding Challenges:
- ✓ Includes coding problems with code editor
- ✓ Choose number of challenges (1-5)
- ✓ Select programming language
- Recommended for: Technical roles (developer, engineer)

**Step 4: Set Duration**
- Choose 15, 30, 45, or 60 minutes
- Recommendation: 30 minutes for first interview
- Time per question is calculated automatically

**Step 5: Review and Start**
- Preview your interview configuration
- Click "Start Interview"
- Interview begins immediately

**During the Interview:**
1. Read each question carefully
2. Click the microphone icon to respond with voice
   - Or type your answer in the text box
3. Your response is automatically recorded
4. Click "Submit & Next" to move forward
5. Progress bar shows current question (e.g., "3 of 10")

**Navigation:**
- "Submit & Next": Save answer and proceed
- "Skip Question": Move forward without answering (not recommended)
- "End Interview": Complete early (not recommended unless emergency)

**After Completing:**
- Automatic redirect to Results page
- View overall score and breakdown
- See detailed feedback for each answer
- Get personalized recommendations

**Tips for Success:**
- Find a quiet space with good internet
- Test your microphone beforehand
- Think before you speak (use STAR method for behavioral questions)
- Take your time - quality over speed
- Practice regularly to improve scores

**Troubleshooting:**
- Microphone not working? Check browser permissions
- Question not loading? Refresh the page
- Interview stuck? Click "End Interview" and start a new one
- Need help? Use the chatbot or contact support`,
    category: "platform",
    source: "Platform Guide",
    tags: ["mock-interview", "how-to", "getting-started"],
  },

  {
    id: "help_002",
    title: "Understanding Your Interview Results",
    content: `Complete guide to interpreting your MockMate interview results and improving your performance.

**Overall Score (0-100%)**
- Calculated as average of all question scores
- Represents your overall interview performance
- Color-coded:
  • 80-100%: Excellent (Green)
  • 60-79%: Good (Blue)
  • 40-59%: Needs Improvement (Yellow)
  • 0-39%: Needs Work (Red)

**Performance Breakdown**
Your score is analyzed across key categories:

Technical Skills:
- Programming knowledge
- Problem-solving approach
- Code quality (if coding challenges included)
- System design thinking

Communication:
- Clarity of explanation
- Structure and organization
- Articulation of thoughts
- Listening and comprehension

Problem Solving:
- Analytical thinking
- Breaking down complex problems
- Creative solutions
- Logical reasoning

**Question-by-Question Analysis**
For each question, you'll see:

1. Question Details:
   - Question text
   - Difficulty level
   - Category (technical/behavioral)
   - Time spent vs. allocated

2. Your Answer:
   - Full transcript of your response
   - Word count and speaking time
   - Notes you took (if any)

3. AI Evaluation:
   - Overall score (0-100)
   - Rubric scores (1-5 each):
     • Relevance: Did you answer the question?
     • Clarity: Was your answer clear and well-structured?
     • Depth: Did you provide sufficient detail?
     • Structure: Was your answer organized logically?

4. Feedback:
   - Strengths: What you did well
   - Improvements: What to work on
   - Specific suggestions for this question type

**Interview Statistics**
- Duration: Total time spent (e.g., "28m 45s")
- Questions: Number attempted vs. total
- Completion Rate: Percentage of questions answered
- Type: Interview format (behavioral, technical, mixed)
- Date: When the interview was completed

**Key Recommendations**
Personalized suggestions based on your performance:
- Top 3-5 actionable improvements
- Specific topics to study
- Practice resources
- Next steps for preparation

Example:
✓ "Practice more system design questions"
✓ "Strengthen your React Hooks knowledge"
✓ "Work on structuring behavioral answers with STAR method"

**Focus Areas**
Skills ranked by priority for improvement:

High Priority (Score < 60%):
- "Needs Work" label
- These should be your immediate focus
- Example: "Problem Solving: Needs Work"

Medium Priority (60-79%):
- "Moderate" label
- Continue practicing to reach excellence
- Example: "Technical Skills: Moderate"

Low Priority (≥ 80%):
- "Strong" label
- Maintain proficiency
- Example: "Communication: Strong"

**How to Improve Your Scores:**

1. Review Feedback:
   - Read each question's feedback carefully
   - Note common themes across questions
   - Identify patterns in mistakes

2. Practice Weak Areas:
   - Take practice interviews focused on low-scoring categories
   - Use Learning Materials section for targeted study
   - Review technical concepts you struggled with

3. Use STAR Method:
   - For behavioral questions, structure answers clearly
   - Situation → Task → Action → Result
   - Include metrics and specific examples

4. Time Management:
   - Track how long you spend per question
   - Practice answering within time limits
   - Avoid rushing or over-explaining

5. Regular Practice:
   - Take interviews weekly
   - Track improvement over time
   - Compare scores across interviews in Interview History

**Comparing Interviews:**
- View past results in "Interview History"
- Track score trends over time
- See which areas improved
- Identify persistent weak points

**Export and Share:**
- Print results for offline review
- Share with mentors or career coaches
- Download as PDF (coming soon)

**Next Steps After Results:**
1. Review all feedback and recommendations
2. Study weak areas using Learning Materials
3. Take another practice interview in 3-5 days
4. Track improvement in Dashboard analytics
5. Adjust difficulty level based on performance`,
    category: "platform",
    source: "Platform Guide",
    tags: ["results", "scoring", "analysis", "improvement"],
  },

  {
    id: "help_003",
    title: "Using Adaptive Difficulty Feature",
    content: `Learn how MockMate's adaptive difficulty adjusts questions based on your real-time performance.

**What is Adaptive Difficulty?**
Adaptive difficulty is an AI-powered feature that dynamically adjusts question difficulty during your interview based on how well you're answering questions.

**How It Works:**

1. Starting Point:
   - Interview begins at your selected difficulty level
   - Example: You choose "Intermediate"

2. Real-Time Evaluation:
   - AI scores your answer as you speak
   - Evaluates relevance, clarity, depth, structure

3. Dynamic Adjustment:
   - Strong answer (score ≥ 80%): Next question is harder
   - Moderate answer (60-79%): Stays at same level
   - Weak answer (< 60%): Next question is easier

4. Continuous Adaptation:
   - Questions adjust throughout the interview
   - Finds your optimal challenge level
   - Ensures you're neither bored nor overwhelmed

**Example Flow:**
Question 1 (Intermediate): "Explain React hooks" 
↓ Score: 85% (Strong)
Question 2 (Advanced): "Design a scalable React architecture"
↓ Score: 55% (Weak)
Question 3 (Intermediate): "Implement a custom hook"
↓ Score: 78% (Moderate)
Question 4 (Intermediate): "Optimize React performance"

**Benefits:**

1. Personalized Experience:
   - Questions match your actual skill level
   - No wasted time on too-easy questions
   - No frustration from impossibly hard questions

2. Accurate Assessment:
   - More precise skill measurement
   - Identifies exact strengths and weaknesses
   - Better preparation for real interviews

3. Efficient Learning:
   - Focus on appropriate challenge level
   - Learn at optimal difficulty (not too easy, not too hard)
   - Build confidence gradually

4. Realistic Interview Simulation:
   - Many real interviewers adjust difficulty based on responses
   - Practice handling varied difficulty levels
   - Improve adaptability under pressure

**When to Enable:**

✓ Enable Adaptive Difficulty if:
- You want the most realistic interview experience
- You're unsure of your exact skill level
- You want personalized challenge
- You're preparing for companies known for adaptive interviews

✗ Disable Adaptive Difficulty if:
- You want consistent difficulty throughout
- You're testing knowledge at a specific level
- You're comparing results with others
- You prefer predictable question flow

**Understanding Your Results:**
With adaptive difficulty enabled, your results show:

1. Difficulty Distribution:
   - Chart showing how many questions at each level
   - Example: 2 Easy, 5 Intermediate, 3 Advanced

2. Adaptation Path:
   - Visualization of difficulty changes
   - Shows where AI increased/decreased difficulty
   - Helps identify skill gaps

3. Peak Performance Level:
   - Highest difficulty level you handled well
   - Indicates your current ceiling
   - Target for improvement

**Tips for Success:**

1. Start Honest:
   - Choose your true skill level initially
   - Don't start too high or too low
   - Accuracy improves with honest starting point

2. Don't Panic on Hard Questions:
   - It means you did well on previous questions!
   - Do your best, learn from feedback
   - Difficulty will adjust if needed

3. Focus on Improvement:
   - Track which difficulty levels you score well in
   - Practice to consistently handle higher levels
   - Celebrate when hard questions become comfortable

4. Use Feedback:
   - Review why questions were adjusted
   - Understand scoring criteria
   - Improve specific rubric areas

**Troubleshooting:**

Q: "Questions seem too easy throughout"
A: You're performing well! Consider starting at a higher difficulty level next time.

Q: "Questions seem too hard throughout"
A: Normal if starting at a challenging level. System is finding your true level. Keep practicing!

Q: "Difficulty jumping erratically"
A: Indicates borderline performance. Focus on consistency in your answers.

**Comparing Adaptive vs. Fixed:**

Fixed Difficulty:
- All questions at same level
- Good for focused practice
- Easier to compare with others
- Predictable experience

Adaptive Difficulty:
- Questions vary by performance
- Better skill assessment
- More engaging experience
- Mimics real interviews

**Best Practices:**
1. Use adaptive for general interview prep
2. Use fixed for practicing specific difficulty levels
3. Alternate between both modes
4. Track performance trends over time
5. Adjust starting difficulty as you improve`,
    category: "platform",
    source: "Platform Guide",
    tags: ["adaptive", "difficulty", "ai", "features"],
  },

  {
    id: "help_004",
    title: "Coding Challenges Feature",
    content: `Complete guide to using coding challenges in your technical interviews on MockMate.

**What Are Coding Challenges?**
Coding challenges are programming problems included in your mock interview, allowing you to write and test code in a browser-based editor.

**When to Use:**
- Preparing for software engineering roles
- Frontend, backend, or full-stack positions
- Any role requiring coding skills
- Want to practice problem-solving under pressure

**How to Enable:**

1. During Interview Setup:
   - Toggle "Include Coding Challenges" to ON
   - Choose number of challenges (1-5)
   - Select difficulty level
   - Pick your programming language

2. Supported Languages:
   - JavaScript
   - Python
   - Java
   - C++
   - TypeScript
   - Go (more coming soon)

**During the Interview:**

When you encounter a coding question:

1. Problem Statement:
   - Read the problem description carefully
   - Review example inputs/outputs
   - Note any constraints (time/space complexity)

2. Code Editor:
   - Monaco editor (same as VS Code)
   - Syntax highlighting
   - Auto-completion
   - Line numbers
   - Find & replace (Ctrl+F)

3. Test Cases:
   - Pre-defined test cases shown
   - Run your code against them
   - See pass/fail for each case
   - View expected vs. actual output

4. Evaluation:
   - AI reviews your code for:
     • Correctness (does it work?)
     • Efficiency (time/space complexity)
     • Code quality (readability, style)
     • Edge case handling

**Example Coding Challenge:**

Problem:
"Write a function to reverse a string without using built-in reverse methods."

Input: "hello"
Output: "olleh"

Constraints:
- Time complexity: O(n)
- Space complexity: O(n)

Your Code:
function reverseString(str) {
  let result = '';
  for (let i = str.length - 1; i >= 0; i--) {
    result += str[i];
  }
  return result;
}

Test Cases:
✓ reverseString("hello") → "olleh"
✓ reverseString("a") → "a"
✓ reverseString("") → ""
✓ reverseString("12345") → "54321"

**Scoring Criteria:**

1. Correctness (40%):
   - All test cases pass
   - Handles edge cases
   - Produces correct output

2. Efficiency (30%):
   - Appropriate time complexity
   - Appropriate space complexity
   - Scalable solution

3. Code Quality (20%):
   - Clean, readable code
   - Good variable names
   - Proper code structure
   - Comments where needed

4. Problem-Solving (10%):
   - Logical approach
   - Handles edge cases
   - Robust error handling

**Tips for Success:**

1. Read Carefully:
   - Understand requirements fully
   - Note all constraints
   - Identify edge cases

2. Plan Before Coding:
   - Think through your approach
   - Consider time/space complexity
   - Sketch out algorithm (use notes section)

3. Start Simple:
   - Write a basic solution first
   - Then optimize if needed
   - Don't over-engineer

4. Test Thoroughly:
   - Run all provided test cases
   - Think of additional edge cases
   - Test with empty inputs, single elements

5. Write Clean Code:
   - Use meaningful variable names
   - Add comments for complex logic
   - Proper indentation
   - Break into helper functions if needed

6. Explain Your Thinking:
   - Use the notes section
   - Explain your approach
   - Mention alternative solutions considered
   - Discuss trade-offs

**Common Mistakes to Avoid:**

1. Not Reading Requirements:
   - Missing constraints
   - Ignoring time/space complexity
   - Overlooking edge cases

2. Jumping Straight to Code:
   - No planning
   - Inefficient first solution
   - Hard to debug

3. Ignoring Test Cases:
   - Not running tests
   - Not fixing failing cases
   - Assuming code works

4. Poor Code Quality:
   - Unclear variable names (x, y, temp)
   - No comments
   - Messy structure

5. Not Handling Edge Cases:
   - Empty inputs
   - Single element arrays
   - Null/undefined values
   - Large inputs

**Practice Problems by Difficulty:**

Easy:
- Reverse a string
- Find max in array
- Check if palindrome
- Sum of array elements
- Remove duplicates

Medium:
- Two sum problem
- Valid parentheses
- Binary search
- Merge sorted arrays
- First non-repeating character

Hard:
- Longest substring without repeating characters
- Median of two sorted arrays
- Regular expression matching
- N-Queens problem
- Serialize/deserialize binary tree

**Time Management:**

For a 30-minute interview with 2 coding challenges:
- Problem 1: ~10 minutes
- Problem 2: ~10 minutes
- Remaining: For spoken questions

Breakdown per problem:
- 2 min: Read and understand
- 2 min: Plan approach
- 4 min: Write code
- 2 min: Test and debug

**After the Interview:**

Review your coding performance:
1. See correct solutions
2. Review AI feedback on your code
3. Learn optimal time/space complexity
4. Study alternative approaches
5. Practice similar problems

**Resources for Practice:**
- LeetCode (leetcode.com)
- HackerRank (hackerrank.com)
- CodeSignal (codesignal.com)
- MockMate's Question Bank (built-in practice)

**Integration with Other Features:**

Coding + Adaptive Difficulty:
- Coding problems adjust difficulty too
- Strong solutions → Harder next problem
- Struggling → Easier next problem

Coding + Behavioral Questions:
- Realistic mixed interview
- Tests both technical and soft skills
- Common in real interviews

**Keyboard Shortcuts:**

Editor:
- Ctrl+S: Save (auto-saves)
- Ctrl+F: Find
- Ctrl+Z: Undo
- Ctrl+Shift+F: Format code
- Ctrl+/: Toggle comment

Run Code:
- Ctrl+Enter: Run all test cases

**Troubleshooting:**

Q: "Code editor not loading"
A: Refresh page or try different browser (Chrome/Firefox recommended)

Q: "Code won't run"
A: Check for syntax errors, ensure all test cases are defined

Q: "How to save progress?"
A: Auto-saves every 30 seconds, or Ctrl+S

Q: "Can I use external libraries?"
A: Standard library only (no npm packages)`,
    category: "platform",
    source: "Platform Guide",
    tags: ["coding", "challenges", "technical", "programming"],
  },
];
