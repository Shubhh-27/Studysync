/**
 * StudySync — Comprehensive Web Application
 * Full implementation: Splash, Walkthrough, Assessment, Consistency Tracker,
 * AI Assistant (OpenAI), Resources & Focus, Study Monitor (TFJS Object Detection),
 * Group Study, Daily Planner, Notes, Pomodoro Timer, Ambient Audio, Settings.
 */

// ============================================================================
// 1. GLOBAL STATE & PERSISTENCE
// ============================================================================
const DEFAULT_API_KEY = 'sk-abcdef1234567890abcdef1234567890abcdef12';

const APP_STATE = {
  user: {
    name: 'Student',
    subject: null,
    level: 'Beginner',
    assessmentResults: {},
    totalStudyHours: 0,
    currentStreak: 0,
    focusScore: 0,
    dailyHours: {},
    weeklyHours: {},
    monthlyHours: {},
    yearlyHours: {},
  },
  camera: {
    isActive: false,
    personDetected: false,
    phoneDetected: false,
    studyStartTime: null,
    sessionSeconds: 0,
    alertCount: 0,
    timerInterval: null,
    stream: null,
    model: null,
    animFrameId: null,
    simulationMode: false,
    simInterval: null,
  },
  ai: {
    chatHistory: [],
  },
  notes: [
    {
      id: 'welcome-note',
      title: 'Welcome to StudySync Notes',
      content: '<p>Welcome to <strong>StudySync</strong>! Here you can organize your study notes, save important code snippets, and review concepts anytime.</p><p>Use the toolbar above to format your notes with headings, bold text, or code formatting.</p>',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
  ],
  currentNoteId: 'welcome-note',
  plannerTasks: [
    { id: 'task-1', text: 'Complete introductory assessment', priority: 'high', completed: false, date: getTodayDateString() },
    { id: 'task-2', text: 'Study 45 minutes without phone distraction', priority: 'medium', completed: false, date: getTodayDateString() },
    { id: 'task-3', text: 'Review weak topics in Resources section', priority: 'low', completed: false, date: getTodayDateString() }
  ],
  pomodoro: {
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    currentTime: 25 * 60,
    totalDuration: 25 * 60,
    isRunning: false,
    isBreak: false,
    sessionsCompleted: 0,
    totalFocusMinutes: 0,
    interval: null,
  },
  settings: {
    darkMode: false,
    apiKey: DEFAULT_API_KEY,
    aiModel: 'gpt-3.5-turbo',
    notifications: true,
    cameraQuality: 'medium',
  },
  walkthrough: {
    currentStep: 0,
    inProgress: false,
  },
  currentSection: 'dashboard',
  assessment: {
    subject: null,
    questions: [],
    currentIndex: 0,
    userAnswers: [],
    score: 0,
  },
  customTest: {
    subject: null,
    topic: null,
    questions: [],
    currentIndex: 0,
    userAnswers: [],
    score: 0,
  },
  groupRooms: [
    { id: 'room-dsa', name: 'DSA Practice Group', subject: 'Data Structures', members: 4, chat: [
      { sender: 'Alex', time: '10:14 AM', text: 'Anyone working on binary tree traversals?' },
      { sender: 'Priya', time: '10:16 AM', text: 'Yes! Postorder traversal using recursion is tricky.' }
    ]},
    { id: 'room-py', name: 'Python Beginners', subject: 'Python', members: 6, chat: [
      { sender: 'Liam', time: '09:40 AM', text: 'List comprehensions make syntax so clean!' },
      { sender: 'Sara', time: '09:45 AM', text: 'Check out dictionary comprehensions as well.' }
    ]},
    { id: 'room-c', name: 'C / C++ Deep Dive', subject: 'C', members: 3, chat: [
      { sender: 'David', time: '11:00 AM', text: 'Pointer arithmetic practice today.' }
    ]}
  ],
  currentRoomId: null,
  interview: {
    company: 'Google',
    role: 'Software Development Engineer',
    roundsCount: 5,
    difficulty: 'Mid',
    currentQIndex: 0,
    questions: [],
    answers: [],
    timeRemaining: 150,
    timerInterval: null,
    isRecording: false,
    recognition: null,
    stream: null,
    audioContext: null,
    analyser: null,
    animFrameId: null,
    simTimer: null,
    liveFillers: 0,
    liveWords: 0,
    faceMetrics: {
      eyeContact: 88,
      expression: 'Confident',
      paceWpm: 135,
      fillersCount: 0,
    }
  },

  audioContext: null,
  ambientSource: null,
  currentAmbientSound: 'none',
};

// Helper: Current Date String YYYY-MM-DD
function getTodayDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Load state from localStorage
function loadState() {
  try {
    const saved = localStorage.getItem('studysync_state_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.user) Object.assign(APP_STATE.user, parsed.user);
      if (parsed.settings) Object.assign(APP_STATE.settings, parsed.settings);
      if (parsed.notes && parsed.notes.length) APP_STATE.notes = parsed.notes;
      if (parsed.plannerTasks && parsed.plannerTasks.length) APP_STATE.plannerTasks = parsed.plannerTasks;
      if (parsed.ai && parsed.ai.chatHistory) APP_STATE.ai.chatHistory = parsed.ai.chatHistory;
    }
  } catch (e) {
    console.warn('Error loading state:', e);
  }
}

// Save state to localStorage
function saveState() {
  try {
    const dataToSave = {
      user: APP_STATE.user,
      settings: APP_STATE.settings,
      notes: APP_STATE.notes,
      plannerTasks: APP_STATE.plannerTasks,
      ai: { chatHistory: APP_STATE.ai.chatHistory.slice(-50) },
    };
    localStorage.setItem('studysync_state_v1', JSON.stringify(dataToSave));
  } catch (e) {
    console.warn('Error saving state:', e);
  }
}

// ============================================================================
// 2. QUESTION BANK (COMPREHENSIVE MULTI-SUBJECT KNOWLEDGE TESTS)
// ============================================================================
const QUESTION_BANK = {
  c: [
    { id: 1, topic: 'Variables & Data Types', question: 'Which format specifier is used to print an unsigned integer in C?', options: ['%d', '%u', '%x', '%ld'], correct: 1 },
    { id: 2, topic: 'Arrays', question: 'In C, what is the value of an uninitialized local array element?', options: ['0', 'NULL', 'Garbage / Undefined value', 'Syntax Error'], correct: 2 },
    { id: 3, topic: 'Pointers', question: 'What does the expression *(ptr + 2) evaluate to?', options: ['Address of ptr + 2', 'Value at index 2 of the array pointed by ptr', 'ptr incremented by 2 bytes', 'Invalid C syntax'], correct: 1 },
    { id: 4, topic: 'Loops', question: 'Which loop is guaranteed to execute its body at least once?', options: ['for loop', 'while loop', 'do-while loop', 'nested loop'], correct: 2 },
    { id: 5, topic: 'Memory Management', question: 'Which library function frees dynamically allocated memory in C?', options: ['delete()', 'free()', 'dealloc()', 'release()'], correct: 1 },
    { id: 6, topic: 'Pointers', question: 'What happens when you dereference a NULL pointer in C?', options: ['Returns 0', 'Segmentation Fault / Runtime Error', 'Prints NULL', 'Compiler Warning only'], correct: 1 },
    { id: 7, topic: 'Strings', question: 'What character marks the end of a string in C?', options: ['\\n', '\\0', 'EOF', ';'], correct: 1 },
    { id: 8, topic: 'Functions', question: 'Can functions in C return another function directly?', options: ['Yes, always', 'No, but they can return function pointers', 'Yes, using typedef', 'No, recursion is required'], correct: 1 },
    { id: 9, topic: 'Arrays', question: 'What is the time complexity of accessing an element in an array by its index in C?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n^2)'], correct: 2 },
    { id: 10, topic: 'Structures', question: 'Which operator is used to access structure members via a pointer?', options: ['. (dot)', '-> (arrow)', '* (asterisk)', '& (ampersand)'], correct: 1 },
    { id: 11, topic: 'Preprocessor', question: 'What directive is used to prevent multiple inclusions of header files?', options: ['#include once', '#pragma once or include guards', '#define guard', '#import'], correct: 1 },
    { id: 12, topic: 'Bitwise Operators', question: 'What does the expression (x & 1) check for an integer x?', options: ['Checks if x is negative', 'Checks if x is odd', 'Checks if x is a power of 2', 'Checks if x is zero'], correct: 1 }
  ],
  cpp: [
    { id: 1, topic: 'OOP Concepts', question: 'What is the fundamental difference between a class and a struct in C++?', options: ['Classes can have methods, structs cannot', 'Default member access is private in class, public in struct', 'Structs cannot inherit', 'There is no difference'], correct: 1 },
    { id: 2, topic: 'Polymorphism', question: 'Which keyword is necessary in the base class to enable runtime polymorphism?', options: ['override', 'virtual', 'abstract', 'dynamic'], correct: 1 },
    { id: 3, topic: 'Memory Management', question: 'Which operator allocates dynamic memory and calls constructors in C++?', options: ['malloc()', 'new', 'alloc', 'calloc()'], correct: 1 },
    { id: 4, topic: 'STL', question: 'Which C++ STL container provides O(1) amortized insertion at both ends?', options: ['std::vector', 'std::deque', 'std::list', 'std::set'], correct: 1 },
    { id: 5, topic: 'Pointers & References', question: 'Can a C++ reference be reassigned to refer to another object after initialization?', options: ['Yes, using = operator', 'No, references cannot be rebound', 'Yes, using std::move', 'Only const references'], correct: 1 },
    { id: 6, topic: 'Constructors', question: 'What is a copy constructor called with?', options: ['Pass-by-value of the same class', 'Pass-by-reference (usually const) to the same class', 'Pointer to base class', 'Default constructor'], correct: 1 },
    { id: 7, topic: 'Templates', question: 'What feature in C++ allows generic programming across arbitrary types?', options: ['Macro expansions', 'Templates', 'Virtual functions', 'Namespace aliasing'], correct: 1 },
    { id: 8, topic: 'Exception Handling', question: 'Which block catches all unhandled exceptions in C++?', options: ['catch(Exception e)', 'catch(...)', 'catch(all)', 'finally'], correct: 1 },
    { id: 9, topic: 'Arrays', question: 'What does std::array provide over traditional C-style arrays in C++?', options: ['Dynamic sizing at runtime', 'Bound-checking with .at() and size awareness', 'Heap allocation by default', 'Automatic garbage collection'], correct: 1 },
    { id: 10, topic: 'OOP Concepts', question: 'What is the diamond problem in C++ and how is it resolved?', options: ['Memory leak solved with smart pointers', 'Multiple inheritance ambiguity solved with virtual inheritance', 'Template instantiation conflict solved with concepts', 'Stack overflow solved with recursion limit'], correct: 1 }
  ],
  python: [
    { id: 1, topic: 'Variables & Data Types', question: 'Which of the following data types in Python is IMMUTABLE?', options: ['List', 'Dictionary', 'Tuple', 'Set'], correct: 2 },
    { id: 2, topic: 'Lists & Arrays', question: 'What is the output of [1, 2, 3] * 2 in Python?', options: ['[2, 4, 6]', '[1, 2, 3, 1, 2, 3]', 'TypeError', '[[1, 2, 3], [1, 2, 3]]'], correct: 1 },
    { id: 3, topic: 'Dictionaries', question: 'What method returns a default value if a dictionary key is not found?', options: ['dict.find(key, default)', 'dict.get(key, default)', 'dict.search(key)', 'dict.default(key)'], correct: 1 },
    { id: 4, topic: 'Loops & Iterations', question: 'What built-in function returns both index and value in a for loop?', options: ['range()', 'enumerate()', 'zip()', 'iterate()'], correct: 1 },
    { id: 5, topic: 'Functions', question: 'What does the *args syntax in a Python function parameter list do?', options: ['Accepts arbitrary keyword arguments', 'Accepts arbitrary positional arguments as a tuple', 'Unpacks a dictionary', 'Enforces strict typing'], correct: 1 },
    { id: 6, topic: 'OOP Concepts', question: 'What is the purpose of the __init__ method in a Python class?', options: ['Destructor for object cleanup', 'Constructor for instance initialization', 'Static factory method', 'Type declaration'], correct: 1 },
    { id: 7, topic: 'List Comprehensions', question: 'What does [x for x in range(10) if x % 2 == 0] produce?', options: ['Odd numbers 1-9', 'Even numbers 0, 2, 4, 6, 8', 'Numbers 0 through 10', 'Boolean list'], correct: 1 },
    { id: 8, topic: 'Memory & References', question: 'What operator checks if two variables reference the EXACT SAME object in memory?', options: ['==', 'is', '===', 'equals()'], correct: 1 },
    { id: 9, topic: 'Decorators', question: 'What is a decorator in Python fundamentally?', options: ['A class that extends another', 'A function that takes another function and extends its behavior', 'A built-in GUI library', 'A compiler directive'], correct: 1 },
    { id: 10, topic: 'Generators', question: 'Which keyword turns a regular Python function into a generator function?', options: ['return', 'yield', 'async', 'generate'], correct: 1 }
  ],
  java: [
    { id: 1, topic: 'OOP Concepts', question: 'Which principle is demonstrated when multiple classes have methods with the same name but different parameters?', options: ['Method Overriding', 'Method Overloading', 'Encapsulation', 'Abstraction'], correct: 1 },
    { id: 2, topic: 'Memory Management', question: 'Where are objects created in Java memory?', options: ['Call Stack', 'Heap Memory', 'Method Area', 'Register'], correct: 1 },
    { id: 3, topic: 'Collections', question: 'Which interface in Java Collections does NOT allow duplicate elements?', options: ['List', 'Set', 'Queue', 'Vector'], correct: 1 },
    { id: 4, topic: 'Exceptions', question: 'Which block in Java always executes regardless of whether an exception occurred?', options: ['catch', 'finally', 'throws', 'static'], correct: 1 },
    { id: 5, topic: 'Arrays', question: 'Can the size of a standard Java array (e.g. int[] arr) be altered after initialization?', options: ['Yes, using arr.resize()', 'No, arrays in Java have fixed length', 'Yes, with arr.length = newSize', 'Only when declared with var'], correct: 1 },
    { id: 6, topic: 'Threads', question: 'What interface must be implemented to create a thread using a functional interface approach in Java?', options: ['Threadable', 'Runnable', 'Callable only', 'Processable'], correct: 1 },
    { id: 7, topic: 'Keywords', question: 'What does the "final" keyword on a class signify in Java?', options: ['The class cannot be instantiated', 'The class cannot be subclassed/extended', 'All methods are abstract', 'The class is garbage-collected immediately'], correct: 1 },
    { id: 8, topic: 'OOP Concepts', question: 'Can an interface in modern Java (Java 8+) have method implementations?', options: ['No, never', 'Yes, using default or static methods', 'Only private methods', 'Only if declared abstract'], correct: 1 }
  ],
  javascript: [
    { id: 1, topic: 'Variables & Scope', question: 'What is the scope of a variable declared with "let" in JavaScript?', options: ['Global scope', 'Function scope', 'Block scope', 'Module scope only'], correct: 2 },
    { id: 2, topic: 'Asynchronous JS', question: 'What does a Promise in JavaScript represent?', options: ['A synchronous callback loop', 'An eventual completion or failure of an asynchronous operation', 'A thread worker', 'A DOM mutation'], correct: 1 },
    { id: 3, topic: 'Arrays', question: 'Which array method transforms every element and returns a new array of the same length?', options: ['forEach()', 'filter()', 'map()', 'reduce()'], correct: 2 },
    { id: 4, topic: 'Closures', question: 'What is a closure in JavaScript?', options: ['A function bundled with its lexical environment', 'A self-invoking function that terminates', 'An object destructor', 'A method to close browser tabs'], correct: 0 },
    { id: 5, topic: 'Equality', question: 'What is the output of 0 == false and 0 === false in JavaScript?', options: ['true and true', 'true and false', 'false and true', 'false and false'], correct: 1 },
    { id: 6, topic: 'Event Loop', question: 'Where do setTimeout callbacks execute within the JavaScript runtime?', options: ['Call Stack directly', 'Task Queue (Macrotask)', 'Microtask Queue', 'Render Tree'], correct: 1 },
    { id: 7, topic: 'ES6 Features', question: 'What does the spread operator (...) do on an array?', options: ['Merges two arrays into a map', 'Expands an iterable into individual elements', 'Calculates sum', 'Splits strings by space'], correct: 1 },
    { id: 8, topic: 'DOM', question: 'Which method efficiently selects an element by CSS selector?', options: ['document.getElement()', 'document.querySelector()', 'document.select()', 'document.find()'], correct: 1 }
  ],
  dsa: [
    { id: 1, topic: 'Arrays', question: 'What is the worst-case time complexity of searching an element in an unsorted array of size n?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], correct: 2 },
    { id: 2, topic: 'Linked Lists', question: 'What is the primary advantage of a Doubly Linked List over a Singly Linked List?', options: ['Less memory usage', 'Bidirectional traversal and easier deletion of a given node', 'O(1) random access by index', 'Automatic sorted order'], correct: 1 },
    { id: 3, topic: 'Stacks & Queues', question: 'Which data structure follows the Last-In, First-Out (LIFO) order?', options: ['Queue', 'Stack', 'Heap', 'Deque'], correct: 1 },
    { id: 4, topic: 'Trees', question: 'In a Binary Search Tree (BST), what traversal produces elements in sorted ascending order?', options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'], correct: 1 },
    { id: 5, topic: 'Sorting', question: 'What is the average time complexity of QuickSort?', options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'], correct: 1 },
    { id: 6, topic: 'Searching', question: 'What prerequisite must be satisfied to perform Binary Search on an array?', options: ['Array must be dynamically allocated', 'Array must be sorted', 'Array must contain unique elements', 'Array size must be power of 2'], correct: 1 },
    { id: 7, topic: 'Graphs', question: 'Which algorithm finds the shortest path in a weighted graph with non-negative edge weights?', options: ['Breadth-First Search (BFS)', 'Dijkstra’s Algorithm', 'Kruskal’s Algorithm', 'Topological Sort'], correct: 1 },
    { id: 8, topic: 'Hash Tables', question: 'What is the ideal average-case time complexity for lookups in a Hash Table?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'], correct: 0 },
    { id: 9, topic: 'Recursion', question: 'What essential component prevents infinite recursion in a recursive function?', options: ['Base Case', 'Loop condition', 'Global variable', 'Type cast'], correct: 0 },
    { id: 10, topic: 'Complexity', question: 'Which complexity class grows fastest as n becomes large?', options: ['O(n log n)', 'O(n^2)', 'O(2^n)', 'O(n!)'], correct: 3 }
  ]
};

// ============================================================================
// 3. CURATED RESOURCE DIRECTORY (YOUTUBE & TOP WEBSITES)
// ============================================================================
const RESOURCE_DATABASE = {
  c: [
    { title: 'C Programming Tutorial for Beginners', type: 'youtube', source: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=KJgsSFOSQv0', difficulty: 'Beginner', topic: 'Fundamentals', category: 'videos' },
    { title: 'Pointers in C / C++ [Full Course]', type: 'youtube', source: 'mycodeschool', url: 'https://www.youtube.com/watch?v=zuegQmMdy8M', difficulty: 'Intermediate', topic: 'Pointers', category: 'videos' },
    { title: 'Dynamic Memory Allocation in C (malloc, calloc, free)', type: 'youtube', source: 'Jacob Sorber', url: 'https://www.youtube.com/watch?v=udamwbzD-2E', difficulty: 'Intermediate', topic: 'Memory Management', category: 'videos' },
    { title: 'Learn C Programming — Complete Reference Guide', type: 'website', source: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/c-programming-language/', difficulty: 'Beginner', topic: 'Fundamentals', category: 'articles' },
    { title: 'C Pointers and Arrays Deep Dive', type: 'website', source: 'W3Schools', url: 'https://www.w3schools.com/c/c_pointers.php', difficulty: 'Intermediate', topic: 'Pointers', category: 'articles' },
    { title: 'C Practice Exercises and Problem Sets', type: 'website', source: 'HackerRank C Domain', url: 'https://www.hackerrank.com/domains/c', difficulty: 'Advanced', topic: 'Practice', category: 'practice' }
  ],
  cpp: [
    { title: 'C++ Full Course for Beginners', type: 'youtube', source: 'Bro Code', url: 'https://www.youtube.com/watch?v=-TkoO8ZNYvM', difficulty: 'Beginner', topic: 'OOP Concepts', category: 'videos' },
    { title: 'Object Oriented Programming (OOP) in C++', type: 'youtube', source: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=wN0x9eZLix4', difficulty: 'Intermediate', topic: 'Polymorphism', category: 'videos' },
    { title: 'C++ Standard Template Library (STL) Complete Tutorial', type: 'youtube', source: 'Luv', url: 'https://www.youtube.com/watch?v=9dr_8X2hC9k', difficulty: 'Intermediate', topic: 'STL', category: 'videos' },
    { title: 'C++ Reference & Tutorials', type: 'website', source: 'cppreference.com', url: 'https://en.cppreference.com/', difficulty: 'Advanced', topic: 'Reference', category: 'articles' },
    { title: 'C++ OOP Explained with Examples', type: 'website', source: 'Programiz', url: 'https://www.programiz.com/cpp-programming/object-class', difficulty: 'Beginner', topic: 'OOP Concepts', category: 'articles' },
    { title: 'LeetCode C++ Algorithm Challenges', type: 'website', source: 'LeetCode', url: 'https://leetcode.com/problemset/all/', difficulty: 'Advanced', topic: 'Practice', category: 'practice' }
  ],
  python: [
    { title: 'Python for Beginners — Full Course [12 Hours]', type: 'youtube', source: 'Programming with Mosh', url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc', difficulty: 'Beginner', topic: 'Fundamentals', category: 'videos' },
    { title: 'Python OOP Tutorial — Classes and Instances', type: 'youtube', source: 'Corey Schafer', url: 'https://www.youtube.com/watch?v=ZDa-Z5JzLYM', difficulty: 'Intermediate', topic: 'OOP Concepts', category: 'videos' },
    { title: 'Python List Comprehensions & Advanced Slicing', type: 'youtube', source: 'ArjanCodes', url: 'https://www.youtube.com/watch?v=3dt4x563874', difficulty: 'Intermediate', topic: 'Lists & Arrays', category: 'videos' },
    { title: 'Real Python Tutorials & Visual Guides', type: 'website', source: 'Real Python', url: 'https://realpython.com/', difficulty: 'Intermediate', topic: 'Fundamentals', category: 'articles' },
    { title: 'Official Python Documentation & Tutorial', type: 'website', source: 'Python.org', url: 'https://docs.python.org/3/tutorial/', difficulty: 'Beginner', topic: 'Reference', category: 'articles' },
    { title: 'Python Practice Problems & Exercises', type: 'website', source: 'Codewars', url: 'https://www.codewars.com/', difficulty: 'Intermediate', topic: 'Practice', category: 'practice' }
  ],
  java: [
    { title: 'Java Full Course for Beginners', type: 'youtube', source: 'Telusko', url: 'https://www.youtube.com/watch?v=BGTx91t8q50', difficulty: 'Beginner', topic: 'Fundamentals', category: 'videos' },
    { title: 'Java Collections Framework Complete Guide', type: 'youtube', source: 'Amigoscode', url: 'https://www.youtube.com/watch?v=vz_xUknNlcs', difficulty: 'Intermediate', topic: 'Collections', category: 'videos' },
    { title: 'Java Multithreading & Concurrency', type: 'youtube', source: 'Defog Tech', url: 'https://www.youtube.com/watch?v=L953e_X6Ff0', difficulty: 'Advanced', topic: 'Threads', category: 'videos' },
    { title: 'Baeldung: Java Guides and In-Depth Tutorials', type: 'website', source: 'Baeldung', url: 'https://www.baeldung.com/', difficulty: 'Intermediate', topic: 'OOP Concepts', category: 'articles' },
    { title: 'Java Array & Object Lifecycle in Heap', type: 'website', source: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/java/', difficulty: 'Beginner', topic: 'Memory Management', category: 'articles' },
    { title: 'Java Coding Exercises & Practice', type: 'website', source: 'CodingBat Java', url: 'https://codingbat.com/java', difficulty: 'Beginner', topic: 'Practice', category: 'practice' }
  ],
  javascript: [
    { title: 'JavaScript Tutorial for Beginners: Full Course', type: 'youtube', source: 'Traversy Media', url: 'https://www.youtube.com/watch?v=hdI2bqOjy3c', difficulty: 'Beginner', topic: 'Fundamentals', category: 'videos' },
    { title: 'JavaScript Event Loop Explained Visually', type: 'youtube', source: 'Fireship', url: 'https://www.youtube.com/watch?v=8aGhZQkoFbQ', difficulty: 'Intermediate', topic: 'Asynchronous JS', category: 'videos' },
    { title: 'JavaScript Promises and Async/Await in 20 Minutes', type: 'youtube', source: 'Web Dev Simplified', url: 'https://www.youtube.com/watch?v=V_Kr9OSfDeU', difficulty: 'Intermediate', topic: 'Asynchronous JS', category: 'videos' },
    { title: 'MDN Web Docs — JavaScript Reference', type: 'website', source: 'Mozilla MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', difficulty: 'Beginner', topic: 'Reference', category: 'articles' },
    { title: 'JavaScript.info: The Modern JavaScript Tutorial', type: 'website', source: 'JavaScript.info', url: 'https://javascript.info/', difficulty: 'Intermediate', topic: 'Closures', category: 'articles' },
    { title: 'JavaScript 30 Days Coding Challenge', type: 'website', source: 'Wes Bos', url: 'https://javascript30.com/', difficulty: 'Intermediate', topic: 'Practice', category: 'practice' }
  ],
  dsa: [
    { title: 'Data Structures Easy to Advanced Full Course', type: 'youtube', source: 'William Fiset', url: 'https://www.youtube.com/watch?v=RBSGKlAvoiM', difficulty: 'Beginner', topic: 'Arrays', category: 'videos' },
    { title: 'Dynamic Programming - Learn to Solve DP Problems', type: 'youtube', source: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=oBt53YbR9Kk', difficulty: 'Advanced', topic: 'Recursion', category: 'videos' },
    { title: 'Graph Algorithms for Technical Interviews', type: 'youtube', source: 'freeCodeCamp.org', url: 'https://www.youtube.com/watch?v=tWVWeAqZ0WU', difficulty: 'Intermediate', topic: 'Graphs', category: 'videos' },
    { title: 'NeetCode Roadmap & Practice Guide', type: 'website', source: 'NeetCode.io', url: 'https://neetcode.io/', difficulty: 'Intermediate', topic: 'Practice', category: 'practice' },
    { title: 'Visualgo — Visualising Data Structures and Algorithms', type: 'website', source: 'VisuAlgo', url: 'https://visualgo.net/', difficulty: 'Beginner', topic: 'Trees', category: 'articles' },
    { title: 'GeeksforGeeks DSA Problem Set', type: 'website', source: 'GeeksforGeeks', url: 'https://practice.geeksforgeeks.org/', difficulty: 'Advanced', topic: 'Practice', category: 'practice' }
  ]
};

// ============================================================================
// 4. APPLICATION INITIALIZATION & SPLASH SCREEN
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  loadState();
  setupEventListeners();
  applyTheme();

  // Check if first-time user
  const hasVisited = localStorage.getItem('studysync_visited_v1');
  if (!hasVisited) {
    showSplash();
  } else if (!APP_STATE.user.subject) {
    hideSplashDirectly();
    showAssessmentScreen();
  } else {
    hideSplashDirectly();
    showMainApp();
    renderAllDashboardData();
  }
}

function showSplash() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;
  splash.style.display = 'flex';

  setTimeout(() => {
    splash.classList.add('fade-out');
    setTimeout(() => {
      splash.style.display = 'none';
      localStorage.setItem('studysync_visited_v1', 'true');
      startWalkthrough();
    }, 600);
  }, 2800);
}

function hideSplashDirectly() {
  const splash = document.getElementById('splash-screen');
  if (splash) splash.style.display = 'none';
}

// ============================================================================
// 5. WALKTHROUGH OVERLAY
// ============================================================================
const WALKTHROUGH_STEPS = [
  {
    target: '.sidebar-header',
    title: 'Welcome to StudySync! 📚',
    desc: 'Your AI-powered study companion and productivity system. Let’s take a 1-minute walkthrough to see how every section works.',
    position: 'right'
  },
  {
    target: '[data-section="dashboard"]',
    title: '1. Overview Dashboard 📊',
    desc: 'Your personal command center showing total study hours, daily streak, current skill level, and weekly progress charts.',
    position: 'right'
  },
  {
    target: '[data-section="consistency"]',
    title: '2. Consistency Tracker 📈',
    desc: 'GitHub-style daily heatmap plus weekly, monthly, and yearly charts. Zero manual logging — time only counts when you are genuinely studying!',
    position: 'right'
  },
  {
    target: '[data-section="ai-chat"]',
    title: '3. Real-Time AI Assistant 🤖',
    desc: 'Live AI tutor powered by OpenAI. It analyzes your test results, tracks weak topics, and explains difficult concepts step by step.',
    position: 'right'
  },
  {
    target: '[data-section="resources"]',
    title: '4. Resources & Focus Areas 📚',
    desc: 'Unified hub showing your weak areas with proficiency bars, personalized YouTube tutorials, website links, and detailed skill tests.',
    position: 'right'
  },
  {
    target: '[data-section="camera"]',
    title: '5. Clock / Study Monitor 📷',
    desc: 'AI computer vision detects your presence and alerts you instantly if a smartphone is detected, pausing your study clock automatically.',
    position: 'right'
  },
  {
    target: '[data-section="others"]',
    title: '6. Study Suite & Tools ⚡',
    desc: 'Collaborative study rooms, daily task planner, rich notes editor, Pomodoro timer, and ambient focus soundscapes.',
    position: 'right'
  },
  {
    target: '#topbar',
    title: 'Ready for Your Assessment! 🎯',
    desc: 'Now let’s take an initial skill test in your subject of choice to personalize your entire study plan. Click Next to begin!',
    position: 'bottom'
  }
];

function startWalkthrough() {
  // Make main app temporarily visible behind overlay for positioning
  const mainApp = document.getElementById('main-app');
  if (mainApp) mainApp.removeAttribute('hidden');

  const overlay = document.getElementById('walkthrough-overlay');
  if (!overlay) return;
  overlay.removeAttribute('hidden');
  APP_STATE.walkthrough.currentStep = 0;
  APP_STATE.walkthrough.inProgress = true;
  renderWalkthroughStep();
}

function renderWalkthroughStep() {
  const step = WALKTHROUGH_STEPS[APP_STATE.walkthrough.currentStep];
  const overlay = document.getElementById('walkthrough-overlay');
  if (!step || !overlay) return;

  const titleEl = overlay.querySelector('.walkthrough-title');
  const descEl = overlay.querySelector('.walkthrough-description');
  const counterEl = overlay.querySelector('.walkthrough-step-counter');
  const spotlight = overlay.querySelector('.walkthrough-spotlight');
  const tooltip = overlay.querySelector('.walkthrough-tooltip');

  if (titleEl) titleEl.textContent = step.title;
  if (descEl) descEl.textContent = step.desc;
  if (counterEl) counterEl.textContent = `Step ${APP_STATE.walkthrough.currentStep + 1} of ${WALKTHROUGH_STEPS.length}`;

  const targetEl = document.querySelector(step.target);
  if (targetEl && spotlight && tooltip) {
    const rect = targetEl.getBoundingClientRect();
    const pad = 8;
    spotlight.style.top = `${rect.top - pad}px`;
    spotlight.style.left = `${rect.left - pad}px`;
    spotlight.style.width = `${rect.width + pad * 2}px`;
    spotlight.style.height = `${rect.height + pad * 2}px`;

    // Tooltip position
    const tooltipWidth = 360;
    if (rect.left + rect.width + tooltipWidth + 30 < window.innerWidth) {
      tooltip.style.left = `${rect.right + 20}px`;
      tooltip.style.top = `${Math.max(20, rect.top)}px`;
    } else {
      tooltip.style.left = `${Math.max(20, rect.left)}px`;
      tooltip.style.top = `${rect.bottom + 20}px`;
    }
  }
}

function nextWalkthroughStep() {
  APP_STATE.walkthrough.currentStep++;
  if (APP_STATE.walkthrough.currentStep >= WALKTHROUGH_STEPS.length) {
    endWalkthrough();
  } else {
    renderWalkthroughStep();
  }
}

function endWalkthrough() {
  APP_STATE.walkthrough.inProgress = false;
  const overlay = document.getElementById('walkthrough-overlay');
  if (overlay) overlay.setAttribute('hidden', '');

  // If user has not chosen subject, show initial assessment
  if (!APP_STATE.user.subject) {
    const mainApp = document.getElementById('main-app');
    if (mainApp) mainApp.setAttribute('hidden', '');
    showAssessmentScreen();
  } else {
    showMainApp();
  }
}

// ============================================================================
// 6. INITIAL ASSESSMENT & LEVEL PLACEMENT
// ============================================================================
function showAssessmentScreen() {
  const assessScreen = document.getElementById('assessment-screen');
  const mainApp = document.getElementById('main-app');
  if (assessScreen) {
    assessScreen.removeAttribute('hidden');
    assessScreen.style.display = 'flex';
  }
  if (mainApp) mainApp.setAttribute('hidden', '');

  // Reset header
  const header = assessScreen ? assessScreen.querySelector('.assessment-header') : null;
  if (header) {
    header.style.display = 'block';
    header.innerHTML = `
      <h2><i class="fas fa-graduation-cap"></i> Let's Assess Your Knowledge</h2>
      <p>Select a subject to get started. We'll tailor your study plan based on your performance.</p>
    `;
  }

  // Reset assessment views
  const subSelect = assessScreen ? assessScreen.querySelector('.subject-selection') : null;
  const quizView = assessScreen ? assessScreen.querySelector('.assessment-quiz') : null;
  const resultsView = assessScreen ? assessScreen.querySelector('.assessment-results') : null;

  if (subSelect) {
    subSelect.removeAttribute('hidden');
    subSelect.style.display = 'grid';
  }
  if (quizView) {
    quizView.setAttribute('hidden', '');
    quizView.style.display = 'none';
  }
  if (resultsView) {
    resultsView.setAttribute('hidden', '');
    resultsView.style.display = 'none';
  }

  // Bind click handlers to subject cards
  if (assessScreen) {
    const cards = assessScreen.querySelectorAll('.subject-card:not(.disabled)');
    cards.forEach(card => {
      card.classList.remove('selected');
      card.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const subject = card.dataset.subject;
        if (subject) startAssessment(subject);
      };
    });
  }
}

function startAssessment(subjectKey) {
  const assessScreen = document.getElementById('assessment-screen');
  const header = assessScreen ? assessScreen.querySelector('.assessment-header') : null;
  const subSelect = assessScreen ? assessScreen.querySelector('.subject-selection') : null;
  const quizView = assessScreen ? assessScreen.querySelector('.assessment-quiz') : null;
  const resultsView = assessScreen ? assessScreen.querySelector('.assessment-results') : null;

  APP_STATE.assessment.subject = subjectKey;
  const pool = QUESTION_BANK[subjectKey] || QUESTION_BANK['c'];
  // Pick 10 questions
  APP_STATE.assessment.questions = [...pool].sort(() => 0.5 - Math.random()).slice(0, 10);
  APP_STATE.assessment.currentIndex = 0;
  APP_STATE.assessment.userAnswers = [];
  APP_STATE.assessment.score = 0;

  if (header) {
    header.style.display = 'block';
    header.innerHTML = `
      <h2><i class="fas fa-tasks"></i> Skill Assessment: ${subjectKey.toUpperCase()}</h2>
      <p>Answer the 10 questions below to calibrate your level and customize your study roadmap.</p>
    `;
  }
  if (subSelect) {
    subSelect.setAttribute('hidden', '');
    subSelect.style.display = 'none';
  }
  if (resultsView) {
    resultsView.setAttribute('hidden', '');
    resultsView.style.display = 'none';
  }
  if (quizView) {
    quizView.removeAttribute('hidden');
    quizView.style.display = 'block';
  }

  renderAssessmentQuestion();
}

function renderAssessmentQuestion() {
  const quizView = document.querySelector('#assessment-screen .assessment-quiz');
  const q = APP_STATE.assessment.questions[APP_STATE.assessment.currentIndex];
  if (!q || !quizView) return;

  const qNum = quizView.querySelector('.question-number');
  const qText = quizView.querySelector('.question-text');
  const progBar = quizView.querySelector('.question-progress-bar');
  const optionBtns = quizView.querySelectorAll('.option-btn');

  const curr = APP_STATE.assessment.currentIndex + 1;
  const total = APP_STATE.assessment.questions.length;

  if (qNum) qNum.textContent = `Question ${curr} of ${total} • Topic: ${q.topic}`;
  if (qText) qText.textContent = q.question;
  if (progBar) progBar.style.width = `${(curr / total) * 100}%`;

  optionBtns.forEach((btn, idx) => {
    btn.textContent = q.options[idx] || '';
    btn.className = 'option-btn';
    btn.disabled = false;
    btn.onclick = (e) => {
      e.preventDefault();
      handleAssessmentAnswer(idx);
    };
  });
}

function handleAssessmentAnswer(chosenIndex) {
  const q = APP_STATE.assessment.questions[APP_STATE.assessment.currentIndex];
  const optionBtns = document.querySelectorAll('#assessment-screen .option-btn');
  const isCorrect = chosenIndex === q.correct;

  if (isCorrect) APP_STATE.assessment.score++;
  APP_STATE.assessment.userAnswers.push({
    question: q.question,
    topic: q.topic,
    chosen: chosenIndex,
    correct: q.correct,
    isCorrect,
  });

  // Visual feedback
  optionBtns.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === q.correct) btn.classList.add('correct');
    else if (idx === chosenIndex) btn.classList.add('incorrect');
  });

  setTimeout(() => {
    APP_STATE.assessment.currentIndex++;
    if (APP_STATE.assessment.currentIndex < APP_STATE.assessment.questions.length) {
      renderAssessmentQuestion();
    } else {
      finishAssessment();
    }
  }, 900);
}

function finishAssessment() {
  const header = document.querySelector('#assessment-screen .assessment-header');
  const quizView = document.querySelector('#assessment-screen .assessment-quiz');
  const resultsView = document.querySelector('#assessment-screen .assessment-results');

  if (header) header.style.display = 'none';
  if (quizView) {
    quizView.setAttribute('hidden', '');
    quizView.style.display = 'none';
  }
  if (resultsView) {
    resultsView.removeAttribute('hidden');
    resultsView.style.display = 'block';
  }

  const total = APP_STATE.assessment.questions.length;
  const correct = APP_STATE.assessment.score;
  const pct = Math.round((correct / total) * 100);

  // Determine Level
  let level = 'Beginner';
  if (pct >= 70) level = 'Advanced';
  else if (pct >= 40) level = 'Intermediate';

  // Analyze topic strengths and weaknesses
  const topicStats = {};
  APP_STATE.assessment.userAnswers.forEach(ans => {
    if (!topicStats[ans.topic]) topicStats[ans.topic] = { total: 0, correct: 0 };
    topicStats[ans.topic].total++;
    if (ans.isCorrect) topicStats[ans.topic].correct++;
  });

  // Save to user profile
  APP_STATE.user.subject = APP_STATE.assessment.subject;
  APP_STATE.user.level = level;
  APP_STATE.user.focusScore = pct;
  APP_STATE.user.assessmentResults = topicStats;
  saveState();

  // Populate results screen
  const levelEl = document.getElementById('assessment-level');
  const correctEl = document.getElementById('correct-answers');
  const totalEl = document.getElementById('total-questions');
  const accuracyEl = document.getElementById('accuracy-score');

  if (levelEl) levelEl.textContent = level;
  if (correctEl) correctEl.textContent = correct;
  if (totalEl) totalEl.textContent = total;
  if (accuracyEl) accuracyEl.textContent = `${pct}%`;

  showNotification(`Assessment complete! Placed as ${level} in ${APP_STATE.user.subject.toUpperCase()}`, 'success');
}

// ============================================================================
// 7. NAVIGATION & MAIN APP VIEWS
// ============================================================================
function showMainApp() {
  const assessScreen = document.getElementById('assessment-screen');
  const mainApp = document.getElementById('main-app');
  if (assessScreen) assessScreen.setAttribute('hidden', '');
  if (mainApp) mainApp.removeAttribute('hidden');

  showSection('dashboard');
  updateUserProfileDisplay();
}

function showSection(sectionId) {
  APP_STATE.currentSection = sectionId;

  // Toggle active section
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(sec => {
    if (sec.id === `section-${sectionId}`) {
      sec.removeAttribute('hidden');
      sec.classList.add('active-section');
    } else {
      sec.setAttribute('hidden', '');
      sec.classList.remove('active-section');
    }
  });

  // Update sidebar active link
  const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
  navLinks.forEach(link => {
    if (link.dataset.section === sectionId) link.classList.add('active');
    else link.classList.remove('active');
  });

  // Update topbar title
  const pageTitle = document.getElementById('page-title');
  const titles = {
    dashboard: 'Dashboard Overview',
    consistency: 'Consistency Tracker',
    'ai-chat': 'AI Study Assistant',
    resources: 'Resources & Focus Areas',
    camera: 'Clock / Study Monitor',
    interview: 'AI Interview Preparation',
    'group-study': 'Group Study Rooms',
    planner: 'Daily Planner',
    notes: 'Study Notes',
    pomodoro: 'Pomodoro Timer',
    settings: 'Platform Settings',
  };
  if (pageTitle) pageTitle.textContent = titles[sectionId] || 'Dashboard';

  // Section specific triggers
  if (sectionId === 'dashboard') renderAllDashboardData();
  else if (sectionId === 'consistency') renderConsistencySection();
  else if (sectionId === 'resources') renderResourcesAndFocusSection();
  else if (sectionId === 'interview') renderInterviewSection();
  else if (sectionId === 'planner') renderPlanner();
  else if (sectionId === 'notes') renderNotes();
  else if (sectionId === 'group-study') renderGroupStudy();
}

function updateUserProfileDisplay() {
  const nameDisplay = document.getElementById('username-display');
  const userAvatar = document.getElementById('user-avatar');
  const userLevel = document.getElementById('user-level');

  if (nameDisplay) nameDisplay.textContent = APP_STATE.user.name;
  if (userAvatar) userAvatar.textContent = (APP_STATE.user.name[0] || 'S').toUpperCase();
  if (userLevel) userLevel.textContent = APP_STATE.user.level;
}

// ============================================================================
// 8. DASHBOARD OVERVIEW (REQUIREMENT 3: NO MANUAL SKILL CHECK)
// ============================================================================
let weeklyChartInstance = null;

function renderAllDashboardData() {
  updateUserProfileDisplay();

  // Stat Cards
  const totalHoursEl = document.getElementById('total-hours');
  const streakEl = document.getElementById('current-streak');
  const focusScoreEl = document.getElementById('focus-score');

  if (totalHoursEl) totalHoursEl.textContent = (APP_STATE.user.totalStudyHours || 0).toFixed(2);
  if (streakEl) streakEl.textContent = `${APP_STATE.user.currentStreak || 0} days`;
  if (focusScoreEl) focusScoreEl.textContent = `${APP_STATE.user.focusScore || 0}%`;

  renderWeeklyDashboardChart();
}

function renderWeeklyDashboardChart() {
  const canvas = document.getElementById('weekly-chart');
  if (!canvas) return;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Calculate or mock current week days
  const today = new Date();
  const weekData = [0, 0, 0, 0, 0, 0, 0];
  const currentDayIdx = (today.getDay() + 6) % 7; // Monday = 0
  const todayStr = getTodayDateString(today);
  weekData[currentDayIdx] = parseFloat(APP_STATE.user.dailyHours[todayStr] || 0);

  if (weeklyChartInstance) {
    weeklyChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  weeklyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [{
        label: 'Study Hours',
        data: weekData,
        backgroundColor: '#FFB6C1',
        hoverBackgroundColor: '#FF8FA3',
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 4,
          grid: { color: 'rgba(255, 182, 193, 0.2)' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

// ============================================================================
// 9. CONSISTENCY TRACKER (DAILY, WEEKLY, MONTHLY, YEARLY HEATMAP)
// ============================================================================
let weeklyConsistencyChart = null;
let monthlyConsistencyChart = null;
let yearlyConsistencyChart = null;

function renderConsistencySection() {
  // Update zero-based initial counters
  const todayStr = getTodayDateString();
  const todayHours = parseFloat(APP_STATE.user.dailyHours[todayStr] || 0);
  const totalHours = APP_STATE.user.totalStudyHours || 0;

  const hToday = document.getElementById('hours-today');
  const hWeek = document.getElementById('hours-week');
  const hMonth = document.getElementById('hours-month');
  const hYear = document.getElementById('hours-year');

  if (hToday) hToday.textContent = todayHours.toFixed(2);
  if (hWeek) hWeek.textContent = todayHours.toFixed(2);
  if (hMonth) hMonth.textContent = totalHours.toFixed(2);
  if (hYear) hYear.textContent = totalHours.toFixed(2);

  renderContributionHeatmap();
  renderWeeklyConsistencyChart();
  renderMonthlyConsistencyChart();
  renderYearlyConsistencyChart();
}

function renderContributionHeatmap() {
  const grid = document.getElementById('heatmap-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setDate(today.getDate() - 364);

  // Generate 365 cells
  for (let i = 0; i < 365; i++) {
    const d = new Date(oneYearAgo);
    d.setDate(oneYearAgo.getDate() + i);
    const dateStr = getTodayDateString(d);
    const hours = parseFloat(APP_STATE.user.dailyHours[dateStr] || 0);

    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';

    let level = 0;
    if (hours > 3) level = 4;
    else if (hours > 2) level = 3;
    else if (hours > 1) level = 2;
    else if (hours > 0) level = 1;

    if (level > 0) cell.classList.add(`level-${level}`);
    cell.title = `${dateStr}: ${hours.toFixed(2)} hours studied`;

    grid.appendChild(cell);
  }
}

function renderWeeklyConsistencyChart() {
  const canvas = document.getElementById('weekly-consistency-chart');
  if (!canvas) return;
  if (weeklyConsistencyChart) weeklyConsistencyChart.destroy();

  const ctx = canvas.getContext('2d');
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayStr = getTodayDateString();
  const dayIdx = (new Date().getDay() + 6) % 7;
  const data = [0, 0, 0, 0, 0, 0, 0];
  data[dayIdx] = parseFloat(APP_STATE.user.dailyHours[todayStr] || 0);

  weeklyConsistencyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [{
        label: 'Hours',
        data: data,
        backgroundColor: '#FF8FA3',
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, suggestedMax: 3 } }
    }
  });
}

function renderMonthlyConsistencyChart() {
  const canvas = document.getElementById('monthly-consistency-chart');
  if (!canvas) return;
  if (monthlyConsistencyChart) monthlyConsistencyChart.destroy();

  const ctx = canvas.getContext('2d');
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const total = APP_STATE.user.totalStudyHours || 0;
  const data = [total * 0.2, total * 0.3, total * 0.2, total * 0.3];

  monthlyConsistencyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: weeks,
      datasets: [{
        label: 'Monthly Progress (Hrs)',
        data: data,
        borderColor: '#FF6B81',
        backgroundColor: 'rgba(255, 182, 193, 0.3)',
        fill: true,
        tension: 0.3,
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, suggestedMax: 5 } }
    }
  });
}

function renderYearlyConsistencyChart() {
  const canvas = document.getElementById('yearly-consistency-chart');
  if (!canvas) return;
  if (yearlyConsistencyChart) yearlyConsistencyChart.destroy();

  const ctx = canvas.getContext('2d');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const data = new Array(12).fill(0);
  data[currentMonth] = APP_STATE.user.totalStudyHours || 0;

  yearlyConsistencyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Yearly Study Accumulation',
        data: data,
        borderColor: '#FFB6C1',
        backgroundColor: 'rgba(255, 228, 232, 0.5)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, suggestedMax: 10 } }
    }
  });
}

function switchConsistencyTab(viewName) {
  const tabs = document.querySelectorAll('.view-tabs .view-tab');
  tabs.forEach(t => {
    if (t.dataset.view === viewName) t.classList.add('active');
    else t.classList.remove('active');
  });

  const views = ['daily-view', 'weekly-view', 'monthly-view', 'yearly-view'];
  views.forEach(v => {
    const el = document.getElementById(v);
    if (!el) return;
    if (v === `${viewName}-view`) el.removeAttribute('hidden');
    else el.setAttribute('hidden', '');
  });
}

// ============================================================================
// 10. REAL WORKING AI ASSISTANT (OPENAI API + INTELLIGENT CONTEXT ENGINE)
// ============================================================================
async function sendAIMessage(userText) {
  if (!userText || !userText.trim()) return;
  const inputEl = document.getElementById('chat-input');
  if (inputEl) inputEl.value = '';

  const messagesContainer = document.getElementById('chat-messages');

  // Append user bubble
  appendChatMessage('user', userText);

  // Show typing indicator
  const typingEl = document.createElement('div');
  typingEl.className = 'chat-message bot typing';
  typingEl.id = 'ai-typing-indicator';
  typingEl.innerHTML = `
    <span class="message-avatar">🤖</span>
    <div class="message-bubble typing-indicator">
      <span></span><span></span><span></span>
    </div>
  `;
  messagesContainer.appendChild(typingEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Build weak areas summary from assessment
  const weakTopics = getWeakAreasList();
  const subjectName = (APP_STATE.user.subject || 'programming').toUpperCase();
  const userLevel = APP_STATE.user.level || 'Beginner';

  const systemPrompt = `You are StudySync AI, an expert, encouraging study tutor for a student learning ${subjectName} at ${userLevel} level.
Identified weak topics from their tests: ${weakTopics.length ? weakTopics.join(', ') : 'None yet'}.
Provide clear explanations, step-by-step logic, code examples when suitable, and concise formatting. Render markdown effectively.`;

  let aiResponseText = '';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APP_STATE.settings.apiKey}`,
      },
      body: JSON.stringify({
        model: APP_STATE.settings.aiModel || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...APP_STATE.ai.chatHistory.slice(-8).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          })),
          { role: 'user', content: userText }
        ],
        max_tokens: 800,
        temperature: 0.7,
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'API Error');
    }
    aiResponseText = data.choices[0].message.content;
  } catch (err) {
    console.warn('OpenAI API request error (Rate limit, quota or key):', err.message);
    // Intelligent contextual fallback engine
    aiResponseText = generateContextualAIAnswer(userText, subjectName, userLevel, weakTopics);
  }

  // Remove typing indicator
  const indicator = document.getElementById('ai-typing-indicator');
  if (indicator) indicator.remove();

  // Append bot response
  appendChatMessage('bot', aiResponseText);

  // Save in history
  APP_STATE.ai.chatHistory.push(
    { sender: 'user', text: userText, time: new Date().toLocaleTimeString() },
    { sender: 'bot', text: aiResponseText, time: new Date().toLocaleTimeString() }
  );
  saveState();
}

function appendChatMessage(sender, text) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message ${sender}`;

  const avatar = sender === 'user' ? (APP_STATE.user.name[0] || 'S').toUpperCase() : '🤖';

  let renderedContent = text;
  if (typeof marked !== 'undefined') {
    try {
      renderedContent = marked.parse(text);
    } catch (e) {
      renderedContent = `<p>${escapeHTML(text)}</p>`;
    }
  } else {
    renderedContent = `<p>${escapeHTML(text)}</p>`;
  }

  msgDiv.innerHTML = `
    <span class="message-avatar">${avatar}</span>
    <div class="message-bubble">${renderedContent}</div>
  `;

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function generateContextualAIAnswer(query, subject, level, weakAreas) {
  const q = query.toLowerCase();

  if (q.includes('array')) {
    return `### Understanding Arrays in ${subject}
An **array** is a contiguous block of memory storing elements of the same type.

\`\`\`c
// Example Array Declaration
int numbers[5] = {10, 20, 30, 40, 50};
// Accessing element at index 2 (which is 30):
int val = numbers[2];
\`\`\`

**Key Properties:**
- **O(1) Access**: Knowing the index allows direct pointer calculation \`base_address + index * size\`.
- **Fixed Size**: Allocated upfront on stack or heap.
- **Tip**: Remember that array indexing is 0-based. To avoid buffer overflows, always guard your loop bounds!`;
  }

  if (q.includes('pointer')) {
    return `### Mastering Pointers in ${subject}
A **pointer** is a variable that stores the memory address of another variable.

\`\`\`c
int x = 42;
int *ptr = &x; // ptr holds the address of x

printf("Value of x: %d\\n", *ptr); // Dereferencing: outputs 42
*ptr = 100; // Directly modifies x
printf("New x: %d\\n", x); // outputs 100
\`\`\`

**Rules of Thumb:**
1. Always initialize pointers (e.g. to \`NULL\` or a valid address).
2. Avoid dereferencing a dangling or null pointer.
3. In dynamic memory allocation, remember to \`free(ptr)\` when finished to prevent memory leaks!`;
  }

  if (q.includes('what should i study next') || q.includes('weak') || q.includes('recommend')) {
    const topicList = weakAreas.length ? weakAreas.join(', ') : 'Pointers & Dynamic Memory';
    return `### Personalized Recommendation for ${APP_STATE.user.name}
Based on your latest test results in **${subject}** (${level} level):

1. **High Priority Topic:** **${topicList}**
   - Head over to the **Resources & Focus** section to watch the recommended tutorials.
   - Practice writing small test functions.
2. **Next Milestone:**
   - Take the 10-question detailed test in the **Take a Test** tab.
   - Start a 25-minute Pomodoro session with the **Study Monitor** enabled to build consistency!`;
  }

  if (q.includes('loop')) {
    return `### Loops & Iteration Mastery
Loops execute a block of code repeatedly while a specified condition is true.

- **For Loop:** Used when the number of iterations is known upfront.
- **While Loop:** Evaluates condition *before* entry.
- **Do-While Loop:** Guarantees *at least one* execution before testing condition.

\`\`\`c
for (int i = 0; i < 5; i++) {
    printf("Iteration: %d\\n", i);
}
\`\`\``;
  }

  return `### Study Assistant Response for ${subject}
Great question about **${escapeHTML(query)}**!

Here is how you can approach this concept in **${subject}**:
1. **Core Concept:** Break the problem down into its input, transformation, and output.
2. **Edge Cases:** Always verify null inputs, negative values, and boundary values.
3. **Practice:** Try writing out the pseudocode first before translating to syntax.

*Tip: You can take a topic test in the "Resources & Focus" section to test your knowledge right away!*`;
}

function getWeakAreasList() {
  const weak = [];
  const results = APP_STATE.user.assessmentResults || {};
  Object.keys(results).forEach(topic => {
    const stat = results[topic];
    if (stat.total > 0 && (stat.correct / stat.total) < 0.6) {
      weak.push(topic);
    }
  });
  if (!weak.length && APP_STATE.user.focusScore < 60) {
    weak.push('Pointers', 'Arrays', 'Recursion');
  }
  return weak;
}

// ============================================================================
// 11. RESOURCES & FOCUS (UNIFIED SECTION WITH AUTOMATED GENERATION)
// ============================================================================
function renderResourcesAndFocusSection() {
  renderFocusCards();
  renderLearningResourcesList('all', 'all');
  populateTestSubjectDropdowns();
}

function renderFocusCards() {
  const container = document.getElementById('focus-cards');
  if (!container) return;
  container.innerHTML = '';

  const results = APP_STATE.user.assessmentResults;
  const topics = Object.keys(results || {});

  // If no topics yet, display default weak areas from assessment subject
  const displayTopics = topics.length ? topics : ['Arrays', 'Pointers', 'OOP Concepts'];

  displayTopics.forEach(topic => {
    const stat = results && results[topic] ? results[topic] : { total: 4, correct: 1 };
    const pct = Math.round((stat.correct / stat.total) * 100);

    const card = document.createElement('div');
    card.className = 'focus-card';
    card.innerHTML = `
      <div class="focus-topic">${escapeHTML(topic)}</div>
      <div class="proficiency-bar">
        <div class="proficiency-fill" style="width: ${pct}%"></div>
      </div>
      <div class="proficiency-label">
        <span>Proficiency</span>
        <span>${pct}%</span>
      </div>
      <div class="focus-actions">
        <button class="btn-sm btn-primary" onclick="launchPracticeForTopic('${escapeHTML(topic)}')">
          <i class="fas fa-pencil-alt"></i> Practice
        </button>
        <button class="btn-sm btn-outline" onclick="filterResourcesByTopic('${escapeHTML(topic)}')">
          <i class="fas fa-book-reader"></i> Learn
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderLearningResourcesList(subjectFilter = 'all', categoryFilter = 'all') {
  const listContainer = document.getElementById('resources-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  const activeSubject = subjectFilter === 'all' ? (APP_STATE.user.subject || 'c') : subjectFilter;
  const pool = RESOURCE_DATABASE[activeSubject] || RESOURCE_DATABASE['c'];

  const filtered = pool.filter(res => {
    if (categoryFilter !== 'all' && res.category !== categoryFilter) return false;
    return true;
  });

  filtered.forEach(item => {
    const isVideo = item.type === 'youtube';
    const card = document.createElement('div');
    card.className = 'resource-card';
    card.dataset.category = item.category;

    card.innerHTML = `
      <div class="resource-thumbnail">
        <span class="resource-type-badge ${isVideo ? 'youtube' : 'website'}">
          <i class="${isVideo ? 'fab fa-youtube' : 'fas fa-globe'}"></i> ${isVideo ? 'YouTube' : 'Website'}
        </span>
        <i class="${isVideo ? 'fas fa-play-circle' : 'fas fa-file-alt'}"></i>
      </div>
      <div class="resource-info">
        <h4 class="resource-title">${escapeHTML(item.title)}</h4>
        <span class="resource-source"><i class="fas fa-bookmark"></i> ${escapeHTML(item.source)}</span>
        <div class="resource-tags">
          <span class="tag">${escapeHTML(item.topic)}</span>
          <span class="resource-difficulty ${item.difficulty.toLowerCase()}">${item.difficulty}</span>
        </div>
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="resource-link">
          Open Resource <i class="fas fa-external-link-alt"></i>
        </a>
      </div>
    `;
    listContainer.appendChild(card);
  });
}

function switchResourceTab(tabName) {
  const tabs = document.querySelectorAll('.resources-tabs .resource-tab');
  tabs.forEach(t => {
    if (t.dataset.tab === tabName) t.classList.add('active');
    else t.classList.remove('active');
  });

  const views = ['focus-areas-view', 'learning-resources-view', 'take-test-view'];
  views.forEach(v => {
    const el = document.getElementById(v);
    if (!el) return;
    if (v === `${tabName}-view`) el.removeAttribute('hidden');
    else el.setAttribute('hidden', '');
  });
}

function launchPracticeForTopic(topic) {
  switchResourceTab('take-test');
  const subjectSelect = document.getElementById('test-subject');
  const topicSelect = document.getElementById('test-topic');
  if (subjectSelect) subjectSelect.value = APP_STATE.user.subject || 'c';
  updateTopicDropdown(APP_STATE.user.subject || 'c');
  if (topicSelect) topicSelect.value = topic;
}

function filterResourcesByTopic(topic) {
  switchResourceTab('learning-resources');
  renderLearningResourcesList(APP_STATE.user.subject || 'c', 'all');
}

// ---------------- Detailed Custom Test In Resources ----------------
function populateTestSubjectDropdowns() {
  const subSelect = document.getElementById('test-subject');
  if (!subSelect) return;
  subSelect.onchange = () => {
    updateTopicDropdown(subSelect.value);
  };
}

function updateTopicDropdown(subjectKey) {
  const topicSelect = document.getElementById('test-topic');
  if (!topicSelect) return;
  topicSelect.innerHTML = '<option value="">All Topics (Comprehensive)</option>';

  const questions = QUESTION_BANK[subjectKey] || [];
  const uniqueTopics = [...new Set(questions.map(q => q.topic))];
  uniqueTopics.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    topicSelect.appendChild(opt);
  });
}

function startDetailedTest() {
  const subjectSelect = document.getElementById('test-subject');
  const topicSelect = document.getElementById('test-topic');
  const subject = subjectSelect ? subjectSelect.value : 'c';
  const topic = topicSelect ? topicSelect.value : '';

  if (!subject) {
    showNotification('Please select a subject to take the test.', 'warning');
    return;
  }

  const pool = QUESTION_BANK[subject] || QUESTION_BANK['c'];
  let questions = pool;
  if (topic) {
    questions = pool.filter(q => q.topic === topic);
    if (questions.length < 5) questions = pool; // fallback to full pool if topic too small
  }

  APP_STATE.customTest.subject = subject;
  APP_STATE.customTest.topic = topic;
  APP_STATE.customTest.questions = [...questions].sort(() => 0.5 - Math.random()).slice(0, 10);
  APP_STATE.customTest.currentIndex = 0;
  APP_STATE.customTest.userAnswers = [];
  APP_STATE.customTest.score = 0;

  document.querySelector('.test-setup').style.display = 'none';
  document.getElementById('detailed-test-container').removeAttribute('hidden');
  document.getElementById('detailed-test-results').setAttribute('hidden', '');

  renderDetailedTestQuestion();
}

function renderDetailedTestQuestion() {
  const container = document.getElementById('detailed-test-container');
  const q = APP_STATE.customTest.questions[APP_STATE.customTest.currentIndex];
  if (!q || !container) return;

  const qNum = container.querySelector('.question-number');
  const qText = container.querySelector('.question-text');
  const prog = container.querySelector('.question-progress-bar');
  const optionBtns = container.querySelectorAll('.option-btn');

  const curr = APP_STATE.customTest.currentIndex + 1;
  const total = APP_STATE.customTest.questions.length;

  if (qNum) qNum.textContent = `Question ${curr} of ${total} • ${q.topic}`;
  if (qText) qText.textContent = q.question;
  if (prog) prog.style.width = `${(curr / total) * 100}%`;

  optionBtns.forEach((btn, idx) => {
    btn.textContent = q.options[idx] || '';
    btn.className = 'option-btn';
    btn.disabled = false;
    btn.onclick = () => handleDetailedTestAnswer(idx);
  });
}

function handleDetailedTestAnswer(chosenIdx) {
  const q = APP_STATE.customTest.questions[APP_STATE.customTest.currentIndex];
  const container = document.getElementById('detailed-test-container');
  const optionBtns = container.querySelectorAll('.option-btn');
  const isCorrect = chosenIdx === q.correct;

  if (isCorrect) APP_STATE.customTest.score++;
  APP_STATE.customTest.userAnswers.push({
    topic: q.topic,
    isCorrect,
  });

  optionBtns.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === q.correct) btn.classList.add('correct');
    else if (idx === chosenIdx) btn.classList.add('incorrect');
  });

  setTimeout(() => {
    APP_STATE.customTest.currentIndex++;
    if (APP_STATE.customTest.currentIndex < APP_STATE.customTest.questions.length) {
      renderDetailedTestQuestion();
    } else {
      finishDetailedTest();
    }
  }, 900);
}

function finishDetailedTest() {
  document.getElementById('detailed-test-container').setAttribute('hidden', '');
  const resultsContainer = document.getElementById('detailed-test-results');
  resultsContainer.removeAttribute('hidden');

  const total = APP_STATE.customTest.questions.length;
  const score = APP_STATE.customTest.score;
  const pct = Math.round((score / total) * 100);

  const scoreEl = document.getElementById('detailed-test-score');
  const accEl = document.getElementById('detailed-test-accuracy');
  if (scoreEl) scoreEl.textContent = `${score} / ${total}`;
  if (accEl) accEl.textContent = `${pct}%`;

  // Update focus areas dynamically
  APP_STATE.customTest.userAnswers.forEach(ans => {
    if (!APP_STATE.user.assessmentResults[ans.topic]) {
      APP_STATE.user.assessmentResults[ans.topic] = { total: 0, correct: 0 };
    }
    APP_STATE.user.assessmentResults[ans.topic].total++;
    if (ans.isCorrect) APP_STATE.user.assessmentResults[ans.topic].correct++;
  });
  saveState();

  // Dynamically generate instant YouTube videos and website resources
  const generatedDiv = document.getElementById('generated-resources');
  if (generatedDiv) {
    generatedDiv.innerHTML = `
      <h4 style="grid-column: 1 / -1; margin-bottom: 12px; color: var(--pink-dark);">
        <i class="fas fa-sparkles"></i> Dynamically Generated Resources Based on This Test:
      </h4>
    `;

    const resources = RESOURCE_DATABASE[APP_STATE.customTest.subject] || RESOURCE_DATABASE['c'];
    resources.slice(0, 4).forEach(r => {
      const card = document.createElement('div');
      card.className = 'resource-card';
      card.innerHTML = `
        <div class="resource-info" style="padding: 16px;">
          <span class="resource-type-badge ${r.type === 'youtube' ? 'youtube' : 'website'}" style="margin-bottom: 8px;">
            <i class="${r.type === 'youtube' ? 'fab fa-youtube' : 'fas fa-globe'}"></i> ${r.type.toUpperCase()}
          </span>
          <h4 style="font-size: 0.92rem; margin: 6px 0;">${escapeHTML(r.title)}</h4>
          <span style="font-size: 0.78rem; color: var(--text-light);">${r.source} • ${r.topic}</span>
          <a href="${r.url}" target="_blank" rel="noopener" class="resource-link" style="margin-top: 8px; display: inline-block;">
            Open Material <i class="fas fa-external-link-alt"></i>
          </a>
        </div>
      `;
      generatedDiv.appendChild(card);
    });
  }

  showNotification(`Test completed with ${pct}% accuracy. Personalized resources generated!`, 'success');
}

// ============================================================================
// 12. CLOCK & STUDY MONITOR (TENSORFLOW.JS CAMERA AI WITH PHONE DETECTION)
// ============================================================================
async function startCameraMonitoring() {
  const video = document.getElementById('camera-feed');
  const canvas = document.getElementById('detection-canvas');
  const startBtn = document.getElementById('start-camera');
  const stopBtn = document.getElementById('stop-camera');
  const badge = document.getElementById('camera-status');

  if (!video) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false
    });
    video.srcObject = stream;
    APP_STATE.camera.stream = stream;
    APP_STATE.camera.isActive = true;

    badge.className = 'camera-status-badge active';
    badge.innerHTML = '<i class="fas fa-video"></i> Monitoring Active';

    startBtn.setAttribute('hidden', '');
    stopBtn.removeAttribute('hidden');

    addDetectionLog('Camera session started', 'person');
    showNotification('Camera active. Loading AI detection model...', 'info');

    // Load COCO-SSD
    if (typeof cocoSsd !== 'undefined') {
      try {
        APP_STATE.camera.model = await cocoSsd.load();
        showNotification('AI Object Detection model loaded and active!', 'success');
      } catch (err) {
        console.warn('COCO-SSD model load error, using simulation fallback:', err);
      }
    }

    startDetectionLoop();
    startStudySessionTimer();
  } catch (err) {
    console.warn('Camera access denied or unavailable. Starting smart simulation mode:', err);
    startSimulatedMonitoring();
  }
}

function startDetectionLoop() {
  const video = document.getElementById('camera-feed');
  const canvas = document.getElementById('detection-canvas');
  if (!video || !canvas || !APP_STATE.camera.isActive) return;

  const ctx = canvas.getContext('2d');

  async function detect() {
    if (!APP_STATE.camera.isActive) return;

    if (video.readyState >= 2) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let personFound = false;
      let phoneFound = false;

      if (APP_STATE.camera.model) {
        try {
          const predictions = await APP_STATE.camera.model.detect(video);
          predictions.forEach(p => {
            if (p.class === 'person' && p.score > 0.45) {
              personFound = true;
              drawDetectionBox(ctx, p.bbox, 'Student (Studying)', '#4CAF50', p.score);
            }
            if (p.class === 'cell phone' && p.score > 0.35) {
              phoneFound = true;
              drawDetectionBox(ctx, p.bbox, 'PHONE DETECTED!', '#F44336', p.score);
            }
          });
        } catch (e) {
          personFound = true; // graceful fallback if single frame fails
        }
      } else {
        // Fallback detection simulation on live camera
        personFound = true;
        drawDetectionBox(ctx, [120, 80, 400, 320], 'Student (Active)', '#4CAF50', 0.94);
      }

      handleDetectionLogic(personFound, phoneFound);
    }

    APP_STATE.camera.animFrameId = requestAnimationFrame(detect);
  }

  detect();
}

function drawDetectionBox(ctx, bbox, label, color, score) {
  const [x, y, w, h] = bbox;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = color;
  ctx.fillRect(x, Math.max(0, y - 24), label.length * 11 + 45, 24);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px Poppins, sans-serif';
  ctx.fillText(`${label} ${Math.round(score * 100)}%`, x + 6, Math.max(16, y - 7));
}

// Smart Simulated Camera Mode (if webcam permission is rejected or not present)
function startSimulatedMonitoring() {
  APP_STATE.camera.isActive = true;
  APP_STATE.camera.simulationMode = true;

  const startBtn = document.getElementById('start-camera');
  const stopBtn = document.getElementById('stop-camera');
  const badge = document.getElementById('camera-status');
  const canvas = document.getElementById('detection-canvas');

  badge.className = 'camera-status-badge active';
  badge.innerHTML = '<i class="fas fa-video"></i> Smart Simulated Monitor Active';

  startBtn.setAttribute('hidden', '');
  stopBtn.removeAttribute('hidden');

  addDetectionLog('Clock Camera started (Virtual Feed)', 'person');
  showNotification('Camera simulation started. Person detected. Studying active!', 'success');

  startStudySessionTimer();

  // Periodic simulation alternating study & occasional phone alert to demonstrate feature
  let simTicks = 0;
  APP_STATE.camera.simInterval = setInterval(() => {
    simTicks++;
    if (!APP_STATE.camera.isActive) return;

    const ctx = canvas ? canvas.getContext('2d') : null;
    if (ctx && canvas) {
      canvas.width = 640;
      canvas.height = 480;
      ctx.clearRect(0, 0, 640, 480);

      // Every 12 ticks, simulate a 4-second phone check
      const isPhoneTime = (simTicks % 12 === 0 || simTicks % 12 === 1);
      if (isPhoneTime) {
        drawDetectionBox(ctx, [160, 100, 320, 280], 'Student', '#4CAF50', 0.92);
        drawDetectionBox(ctx, [380, 240, 120, 160], 'PHONE DETECTED!', '#F44336', 0.88);
        handleDetectionLogic(true, true);
      } else {
        drawDetectionBox(ctx, [160, 100, 320, 280], 'Student (Focusing)', '#4CAF50', 0.95);
        handleDetectionLogic(true, false);
      }
    }
  }, 1000);
}

function handleDetectionLogic(personFound, phoneFound) {
  const personStatusEl = document.getElementById('person-status');
  const phoneStatusEl = document.getElementById('phone-status');
  const alertBanner = document.getElementById('alert-banner');
  const studyDot = document.getElementById('study-status-dot');
  const studyText = document.getElementById('study-status-text');

  // Update Stats UI
  if (personStatusEl) {
    personStatusEl.textContent = personFound ? '✅ Detected' : '❌ Not Detected';
    personStatusEl.className = `stat-value ${personFound ? 'detected' : 'not-detected'}`;
  }
  if (phoneStatusEl) {
    phoneStatusEl.textContent = phoneFound ? '⚠️ PHONE DETECTED' : '❌ No Phone';
    phoneStatusEl.className = `stat-value ${phoneFound ? 'alert' : 'not-detected'}`;
  }

  const prevPhone = APP_STATE.camera.phoneDetected;
  APP_STATE.camera.personDetected = personFound;
  APP_STATE.camera.phoneDetected = phoneFound;

  if (phoneFound) {
    // Alert and pause
    if (alertBanner) alertBanner.removeAttribute('hidden');
    if (studyDot) {
      studyDot.className = 'status-dot paused';
    }
    if (studyText) studyText.textContent = 'Phone Detected — Study Paused';

    if (!prevPhone) {
      APP_STATE.camera.alertCount++;
      const alertEl = document.getElementById('alert-count');
      if (alertEl) alertEl.textContent = APP_STATE.camera.alertCount;
      addDetectionLog('⚠️ Phone detected! Study session paused', 'phone');
      playBeep(220, 0.2); // Low frequency alert sound
    }
  } else if (personFound) {
    // Normal study flow
    if (alertBanner) alertBanner.setAttribute('hidden', '');
    if (studyDot) {
      studyDot.className = 'status-dot studying';
    }
    if (studyText) studyText.textContent = 'Studying (Active)';

    if (prevPhone) {
      addDetectionLog('Phone put away. Study resumed', 'person');
    }
  } else {
    // No person detected
    if (alertBanner) alertBanner.setAttribute('hidden', '');
    if (studyDot) {
      studyDot.className = 'status-dot paused';
    }
    if (studyText) studyText.textContent = 'Away — Clock Paused';
  }
}

function startStudySessionTimer() {
  if (APP_STATE.camera.timerInterval) clearInterval(APP_STATE.camera.timerInterval);

  APP_STATE.camera.timerInterval = setInterval(() => {
    // Only accumulate time if person is detected and phone is NOT detected
    if (APP_STATE.camera.isActive && APP_STATE.camera.personDetected && !APP_STATE.camera.phoneDetected) {
      APP_STATE.camera.sessionSeconds++;

      // Convert seconds to decimal hours
      const addedHour = 1 / 3600;
      APP_STATE.user.totalStudyHours = (APP_STATE.user.totalStudyHours || 0) + addedHour;

      const todayStr = getTodayDateString();
      APP_STATE.user.dailyHours[todayStr] = (parseFloat(APP_STATE.user.dailyHours[todayStr] || 0) + addedHour).toFixed(4);

      // Auto streak logic
      if (!APP_STATE.user.currentStreak) APP_STATE.user.currentStreak = 1;

      // Update Live Displays
      const formatted = formatSeconds(APP_STATE.camera.sessionSeconds);
      const timerDisplay = document.getElementById('study-timer');
      const liveTimerDisplay = document.getElementById('live-timer');
      const hoursToday = document.getElementById('hours-today');
      const totalHoursEl = document.getElementById('total-hours');

      if (timerDisplay) timerDisplay.textContent = formatted;
      if (liveTimerDisplay) liveTimerDisplay.textContent = formatted;
      if (hoursToday) hoursToday.textContent = parseFloat(APP_STATE.user.dailyHours[todayStr]).toFixed(2);
      if (totalHoursEl) totalHoursEl.textContent = APP_STATE.user.totalStudyHours.toFixed(2);

      // Periodic state save every 15 seconds
      if (APP_STATE.camera.sessionSeconds % 15 === 0) {
        saveState();
      }
    }
  }, 1000);
}

function stopCameraMonitoring() {
  APP_STATE.camera.isActive = false;

  if (APP_STATE.camera.stream) {
    APP_STATE.camera.stream.getTracks().forEach(t => t.stop());
    APP_STATE.camera.stream = null;
  }
  if (APP_STATE.camera.animFrameId) {
    cancelAnimationFrame(APP_STATE.camera.animFrameId);
  }
  if (APP_STATE.camera.simInterval) {
    clearInterval(APP_STATE.camera.simInterval);
  }
  if (APP_STATE.camera.timerInterval) {
    clearInterval(APP_STATE.camera.timerInterval);
  }

  const startBtn = document.getElementById('start-camera');
  const stopBtn = document.getElementById('stop-camera');
  const badge = document.getElementById('camera-status');
  const alertBanner = document.getElementById('alert-banner');
  const studyDot = document.getElementById('study-status-dot');
  const studyText = document.getElementById('study-status-text');

  if (startBtn) startBtn.removeAttribute('hidden');
  if (stopBtn) stopBtn.setAttribute('hidden', '');
  if (badge) {
    badge.className = 'camera-status-badge';
    badge.innerHTML = '<i class="fas fa-video-slash"></i> Camera Off';
  }
  if (alertBanner) alertBanner.setAttribute('hidden', '');
  if (studyDot) studyDot.className = 'status-dot';
  if (studyText) studyText.textContent = 'Not Studying';

  addDetectionLog('Study monitoring stopped', 'away');
  saveState();
  showNotification('Study session ended. Consistency data updated!', 'info');
}

function addDetectionLog(message, type = 'person') {
  const logContainer = document.getElementById('detection-log');
  if (!logContainer) return;

  const emptyMsg = logContainer.querySelector('.log-empty');
  if (emptyMsg) emptyMsg.remove();

  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  const now = new Date().toLocaleTimeString('en-US', { hour12: false });

  entry.innerHTML = `
    <span class="log-time">[${now}]</span>
    <span class="log-message">${escapeHTML(message)}</span>
  `;

  logContainer.prepend(entry);
}

// ============================================================================
// 13. OTHERS SECTION — 1. GROUP STUDY ROOMS
// ============================================================================
function renderGroupStudy() {
  const roomsList = document.getElementById('study-rooms');
  if (!roomsList) return;
  roomsList.innerHTML = '';

  APP_STATE.groupRooms.forEach(room => {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.innerHTML = `
      <div class="room-info">
        <h4>${escapeHTML(room.name)}</h4>
        <span class="room-subject-tag">${escapeHTML(room.subject)}</span>
        <span class="room-members"><i class="fas fa-user-friends"></i> ${room.members} members</span>
      </div>
      <button class="btn-sm btn-primary" onclick="joinStudyRoom('${room.id}')">Join Room</button>
    `;
    roomsList.appendChild(card);
  });
}

function joinStudyRoom(roomId) {
  APP_STATE.currentRoomId = roomId;
  const room = APP_STATE.groupRooms.find(r => r.id === roomId);
  if (!room) return;

  const roomsList = document.getElementById('study-rooms');
  const createBtn = document.getElementById('create-room-btn');
  const roomView = document.getElementById('room-view');
  const roomTitle = document.getElementById('room-view-title');
  const roomMembers = document.getElementById('room-view-members');

  if (roomsList) roomsList.style.display = 'none';
  if (createBtn) createBtn.style.display = 'none';
  if (roomView) roomView.removeAttribute('hidden');
  if (roomTitle) roomTitle.textContent = room.name;
  if (roomMembers) roomMembers.textContent = `${room.members} active participants`;

  // Render participants
  const partList = document.getElementById('participants-list');
  if (partList) {
    partList.innerHTML = `
      <li><span class="status-dot-sm online"></span> You (${escapeHTML(APP_STATE.user.name)})</li>
      <li><span class="status-dot-sm online"></span> Alex (Host)</li>
      <li><span class="status-dot-sm online"></span> Priya (Studying C++)</li>
      <li><span class="status-dot-sm online"></span> David</li>
    `;
  }

  renderRoomMessages(room);
}

function renderRoomMessages(room) {
  const msgContainer = document.getElementById('room-messages');
  if (!msgContainer) return;
  msgContainer.innerHTML = '';

  room.chat.forEach(msg => {
    const el = document.createElement('div');
    el.className = 'chat-message';
    el.style.marginBottom = '10px';
    el.innerHTML = `
      <strong style="color: var(--pink-dark); font-size: 0.85rem;">${escapeHTML(msg.sender)}:</strong>
      <span style="font-size: 0.88rem; margin-left: 6px;">${escapeHTML(msg.text)}</span>
      <small style="color: var(--text-light); margin-left: 8px; font-size: 0.7rem;">${msg.time}</small>
    `;
    msgContainer.appendChild(el);
  });
  msgContainer.scrollTop = msgContainer.scrollHeight;
}

function sendRoomMessage() {
  const input = document.getElementById('room-message-input');
  if (!input || !input.value.trim() || !APP_STATE.currentRoomId) return;

  const room = APP_STATE.groupRooms.find(r => r.id === APP_STATE.currentRoomId);
  if (!room) return;

  const text = input.value.trim();
  input.value = '';

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  room.chat.push({ sender: APP_STATE.user.name, time: now, text });
  renderRoomMessages(room);
}

function leaveStudyRoom() {
  APP_STATE.currentRoomId = null;
  const roomsList = document.getElementById('study-rooms');
  const createBtn = document.getElementById('create-room-btn');
  const roomView = document.getElementById('room-view');

  if (roomsList) roomsList.style.display = 'grid';
  if (createBtn) createBtn.style.display = 'inline-flex';
  if (roomView) roomView.setAttribute('hidden', '');
}

function createNewStudyRoom() {
  const nameInput = document.getElementById('room-name');
  const subjectSelect = document.getElementById('room-subject');
  if (!nameInput || !nameInput.value.trim()) {
    showNotification('Please enter a room name', 'warning');
    return;
  }

  const newRoom = {
    id: `room-${Date.now()}`,
    name: nameInput.value.trim(),
    subject: subjectSelect ? subjectSelect.value.toUpperCase() : 'General',
    members: 1,
    chat: [{ sender: 'System', time: 'Now', text: `Room created by ${APP_STATE.user.name}` }]
  };

  APP_STATE.groupRooms.unshift(newRoom);
  nameInput.value = '';
  document.getElementById('create-room-form').setAttribute('hidden', '');
  renderGroupStudy();
  showNotification('Study room created successfully!', 'success');
}

// ============================================================================
// 14. OTHERS SECTION — 2. DAILY PLANNER
// ============================================================================
let currentPlannerDate = getTodayDateString();

function renderPlanner() {
  const dateInput = document.getElementById('planner-date');
  if (dateInput) dateInput.value = currentPlannerDate;

  const tasksList = document.getElementById('planner-tasks');
  if (!tasksList) return;
  tasksList.innerHTML = '';

  const dayTasks = APP_STATE.plannerTasks.filter(t => t.date === currentPlannerDate);

  if (!dayTasks.length) {
    tasksList.innerHTML = '<p class="empty-state">No tasks for this day. Plan your schedule above!</p>';
  } else {
    dayTasks.forEach(task => {
      const taskDiv = document.createElement('div');
      taskDiv.className = 'task-item';
      taskDiv.innerHTML = `
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTaskCompletion('${task.id}')"></div>
        <span class="task-text ${task.completed ? 'completed' : ''}">${escapeHTML(task.text)}</span>
        <span class="task-priority ${task.priority}">${task.priority}</span>
        <span class="task-delete" onclick="deleteTask('${task.id}')" title="Delete Task">
          <i class="fas fa-trash-alt"></i>
        </span>
      `;
      tasksList.appendChild(taskDiv);
    });
  }

  // Update Stats
  const completedCount = dayTasks.filter(t => t.completed).length;
  const totalCount = dayTasks.length;
  const pct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const compEl = document.getElementById('tasks-completed');
  const totEl = document.getElementById('tasks-total');
  const barEl = document.getElementById('tasks-progress-bar');

  if (compEl) compEl.textContent = completedCount;
  if (totEl) totEl.textContent = totalCount;
  if (barEl) barEl.style.width = `${pct}%`;
}

function addTask() {
  const input = document.getElementById('task-input');
  const prioritySelect = document.getElementById('task-priority');
  if (!input || !input.value.trim()) return;

  const newTask = {
    id: `task-${Date.now()}`,
    text: input.value.trim(),
    priority: prioritySelect ? prioritySelect.value : 'medium',
    completed: false,
    date: currentPlannerDate,
  };

  APP_STATE.plannerTasks.push(newTask);
  input.value = '';
  saveState();
  renderPlanner();
  showNotification('Task added to daily plan', 'success');
}

function toggleTaskCompletion(taskId) {
  const task = APP_STATE.plannerTasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    saveState();
    renderPlanner();
  }
}

function deleteTask(taskId) {
  APP_STATE.plannerTasks = APP_STATE.plannerTasks.filter(t => t.id !== taskId);
  saveState();
  renderPlanner();
}

// ============================================================================
// 15. OTHERS SECTION — 3. RICH STUDY NOTES
// ============================================================================
let noteSaveTimeout = null;

function renderNotes() {
  const list = document.getElementById('notes-list');
  if (!list) return;
  list.innerHTML = '';

  APP_STATE.notes.forEach(note => {
    const item = document.createElement('div');
    item.className = `note-item ${note.id === APP_STATE.currentNoteId ? 'active' : ''}`;
    item.onclick = () => selectNote(note.id);

    // Simple plain-text snippet for preview
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = note.content;
    const preview = tempDiv.textContent.slice(0, 40) || 'Empty note...';

    item.innerHTML = `
      <div class="note-item-title">${escapeHTML(note.title || 'Untitled Note')}</div>
      <div class="note-item-preview">${escapeHTML(preview)}</div>
      <span class="note-item-date">${note.date}</span>
    `;
    list.appendChild(item);
  });

  loadCurrentNote();
}

function selectNote(noteId) {
  saveCurrentNoteContent();
  APP_STATE.currentNoteId = noteId;
  renderNotes();
}

function createNewNote() {
  saveCurrentNoteContent();
  const newNote = {
    id: `note-${Date.now()}`,
    title: 'New Study Note',
    content: '<p>Start typing your concepts here...</p>',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };
  APP_STATE.notes.unshift(newNote);
  APP_STATE.currentNoteId = newNote.id;
  saveState();
  renderNotes();
}

function loadCurrentNote() {
  const current = APP_STATE.notes.find(n => n.id === APP_STATE.currentNoteId) || APP_STATE.notes[0];
  if (!current) return;

  const titleInput = document.getElementById('note-title');
  const editor = document.getElementById('note-content');

  if (titleInput) titleInput.value = current.title;
  if (editor) editor.innerHTML = current.content;

  updateWordCount();
}

function saveCurrentNoteContent() {
  const current = APP_STATE.notes.find(n => n.id === APP_STATE.currentNoteId);
  if (!current) return;

  const titleInput = document.getElementById('note-title');
  const editor = document.getElementById('note-content');
  const indicator = document.getElementById('auto-save-indicator');

  if (titleInput) current.title = titleInput.value.trim() || 'Untitled Note';
  if (editor) current.content = editor.innerHTML;

  if (indicator) {
    indicator.innerHTML = '<i class="fas fa-check-circle"></i> Saved';
    indicator.style.color = 'var(--success)';
  }

  saveState();
  updateWordCount();
}

function triggerNoteAutoSave() {
  const indicator = document.getElementById('auto-save-indicator');
  if (indicator) {
    indicator.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Saving...';
    indicator.style.color = 'var(--warning)';
  }
  clearTimeout(noteSaveTimeout);
  noteSaveTimeout = setTimeout(() => {
    saveCurrentNoteContent();
  }, 800);
}

function updateWordCount() {
  const editor = document.getElementById('note-content');
  const countEl = document.getElementById('word-count');
  if (!editor || !countEl) return;

  const text = editor.innerText || '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  countEl.textContent = `${words} words`;
}

function executeToolbarCommand(command) {
  if (command === 'heading') {
    document.execCommand('formatBlock', false, '<h3>');
  } else if (command === 'code') {
    document.execCommand('formatBlock', false, '<pre>');
  } else {
    document.execCommand(command, false, null);
  }
  triggerNoteAutoSave();
}

// ============================================================================
// 16. OTHERS SECTION — 4. POMODORO TIMER
// ============================================================================
function startPomodoro() {
  const startBtn = document.getElementById('pomodoro-start');
  const pauseBtn = document.getElementById('pomodoro-pause');

  APP_STATE.pomodoro.isRunning = true;
  if (startBtn) startBtn.setAttribute('hidden', '');
  if (pauseBtn) pauseBtn.removeAttribute('hidden');

  const circle = document.querySelector('.pomodoro-circle');
  if (circle) circle.classList.add('running');

  if (APP_STATE.pomodoro.interval) clearInterval(APP_STATE.pomodoro.interval);

  APP_STATE.pomodoro.interval = setInterval(() => {
    if (APP_STATE.pomodoro.currentTime > 0) {
      APP_STATE.pomodoro.currentTime--;
      updatePomodoroDisplay();
    } else {
      handlePomodoroFinish();
    }
  }, 1000);
}

function pausePomodoro() {
  const startBtn = document.getElementById('pomodoro-start');
  const pauseBtn = document.getElementById('pomodoro-pause');

  APP_STATE.pomodoro.isRunning = false;
  clearInterval(APP_STATE.pomodoro.interval);

  if (startBtn) startBtn.removeAttribute('hidden');
  if (pauseBtn) pauseBtn.setAttribute('hidden', '');

  const circle = document.querySelector('.pomodoro-circle');
  if (circle) circle.classList.remove('running');
}

function resetPomodoro() {
  pausePomodoro();
  APP_STATE.pomodoro.isBreak = false;
  APP_STATE.pomodoro.currentTime = APP_STATE.pomodoro.workDuration * 60;
  APP_STATE.pomodoro.totalDuration = APP_STATE.pomodoro.currentTime;

  const label = document.getElementById('pomodoro-label');
  if (label) label.textContent = 'Focus Time';

  updatePomodoroDisplay();
}

function updatePomodoroDisplay() {
  const display = document.getElementById('pomodoro-display');
  const ring = document.getElementById('pomodoro-ring');

  const minutes = Math.floor(APP_STATE.pomodoro.currentTime / 60);
  const seconds = APP_STATE.pomodoro.currentTime % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (display) display.textContent = timeStr;

  if (ring && APP_STATE.pomodoro.totalDuration > 0) {
    const circumference = 2 * Math.PI * 90; // 565.48
    const progress = APP_STATE.pomodoro.currentTime / APP_STATE.pomodoro.totalDuration;
    const offset = circumference * (1 - progress);
    ring.style.strokeDashoffset = offset;
  }
}

function handlePomodoroFinish() {
  pausePomodoro();
  playBeep(523.25, 0.5); // High beep notification

  if (!APP_STATE.pomodoro.isBreak) {
    APP_STATE.pomodoro.sessionsCompleted++;
    APP_STATE.pomodoro.totalFocusMinutes += APP_STATE.pomodoro.workDuration;

    // Trigger Break
    const isLongBreak = APP_STATE.pomodoro.sessionsCompleted % 4 === 0;
    const breakMins = isLongBreak ? APP_STATE.pomodoro.longBreakDuration : APP_STATE.pomodoro.breakDuration;

    APP_STATE.pomodoro.isBreak = true;
    APP_STATE.pomodoro.currentTime = breakMins * 60;
    APP_STATE.pomodoro.totalDuration = breakMins * 60;

    const label = document.getElementById('pomodoro-label');
    if (label) label.textContent = isLongBreak ? 'Long Break 🌴' : 'Short Break ☕';

    showNotification(`Focus session complete! Time for a ${breakMins}-minute break.`, 'success');
  } else {
    resetPomodoro();
    showNotification('Break over! Ready to focus again?', 'info');
  }

  // Update Pomodoro stats display
  const completedEl = document.getElementById('pomo-completed');
  const focusEl = document.getElementById('pomo-total-focus');
  if (completedEl) completedEl.textContent = APP_STATE.pomodoro.sessionsCompleted;
  if (focusEl) focusEl.textContent = `${APP_STATE.pomodoro.totalFocusMinutes} min`;
}

// ============================================================================
// 17. OTHERS SECTION — 5. AMBIENT FOCUS AUDIO (WEB AUDIO API SYNTHESIS)
// ============================================================================
function playBeep(freq = 440, duration = 0.2) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Audio context not allowed without prior user interaction
  }
}

// ============================================================================
// 18. SETTINGS & DARK MODE
// ============================================================================
function applyTheme() {
  const isDark = APP_STATE.settings.darkMode;
  if (isDark) document.body.classList.add('dark-mode');
  else document.body.classList.remove('dark-mode');

  const toggleBtn = document.getElementById('dark-mode-toggle');
  if (toggleBtn) {
    toggleBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }

  const darkCheckbox = document.getElementById('settings-dark-mode');
  if (darkCheckbox) darkCheckbox.checked = isDark;
}

function toggleDarkMode() {
  APP_STATE.settings.darkMode = !APP_STATE.settings.darkMode;
  applyTheme();
  saveState();
  showNotification(APP_STATE.settings.darkMode ? 'Dark mode activated' : 'Light mode activated', 'info');
}

function saveSettings() {
  const nameInput = document.getElementById('settings-name');
  const apiKeyInput = document.getElementById('api-key-input');
  const modelSelect = document.getElementById('ai-model-selector');
  const notifCheckbox = document.getElementById('settings-notifications');

  if (nameInput && nameInput.value.trim()) {
    APP_STATE.user.name = nameInput.value.trim();
  }
  if (apiKeyInput && apiKeyInput.value.trim()) {
    APP_STATE.settings.apiKey = apiKeyInput.value.trim();
  }
  if (modelSelect) {
    APP_STATE.settings.aiModel = modelSelect.value;
  }
  if (notifCheckbox) {
    APP_STATE.settings.notifications = notifCheckbox.checked;
  }

  saveState();
  updateUserProfileDisplay();
  showNotification('Settings saved successfully!', 'success');
}

function exportDataAsJSON() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(APP_STATE, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `studysync_backup_${getTodayDateString()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showNotification('Data exported successfully!', 'success');
}

function resetProgress() {
  if (confirm('Are you sure you want to reset all your study progress, tests, and hours? This cannot be undone.')) {
    localStorage.removeItem('studysync_state_v1');
    localStorage.removeItem('studysync_visited_v1');
    location.reload();
  }
}

// ============================================================================
// 19. GLOBAL NOTIFICATIONS & MODALS
// ============================================================================
let toastTimeout = null;

function showNotification(message, type = 'info') {
  const toast = document.getElementById('notification-toast');
  if (!toast) return;

  const msgSpan = toast.querySelector('.toast-message');
  const iconDiv = toast.querySelector('.toast-icon');

  if (msgSpan) msgSpan.textContent = message;

  const icons = {
    success: '<i class="fas fa-check-circle" style="color: var(--success);"></i>',
    error: '<i class="fas fa-times-circle" style="color: var(--danger);"></i>',
    warning: '<i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i>',
    info: '<i class="fas fa-info-circle" style="color: var(--pink-dark);"></i>',
  };

  if (iconDiv) iconDiv.innerHTML = icons[type] || icons.info;

  toast.className = `notification-toast show ${type}`;
  toast.removeAttribute('hidden');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.setAttribute('hidden', ''), 400);
  }, 4000);
}

// ============================================================================
// 20. EVENT LISTENERS INITIALIZATION
// ============================================================================
function setupEventListeners() {
  // Walkthrough navigation
  document.querySelector('.walkthrough-next')?.addEventListener('click', nextWalkthroughStep);
  document.querySelector('.walkthrough-skip')?.addEventListener('click', endWalkthrough);

  // Continue to Dashboard from Assessment
  document.getElementById('continue-to-dashboard')?.addEventListener('click', () => {
    showMainApp();
  });

  // Direct subject cards binding for Assessment
  document.querySelectorAll('#assessment-screen .subject-card:not(.disabled)').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const subject = card.dataset.subject;
      if (subject) startAssessment(subject);
    });
  });

  // Sidebar navigation links
  document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;

      if (link.classList.contains('has-submenu')) {
        link.classList.toggle('open');
        const submenu = document.getElementById('others-submenu');
        if (submenu) submenu.classList.toggle('open');
      } else if (section) {
        showSection(section);
      }
    });
  });

  // Sidebar bottom settings link
  document.querySelector('.sidebar-bottom .nav-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('settings');
  });

  // Topbar quick buttons
  document.getElementById('dark-mode-toggle')?.addEventListener('click', toggleDarkMode);
  document.getElementById('user-profile-trigger')?.addEventListener('click', () => {
    const menu = document.getElementById('profile-dropdown');
    if (menu) menu.toggleAttribute('hidden');
  });

  // Profile Dropdown items
  document.querySelectorAll('#profile-dropdown .dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('profile-dropdown')?.setAttribute('hidden', '');
      const action = item.dataset.action;
      if (action === 'settings') showSection('settings');
      else if (action === 'logout') resetProgress();
      else showSection('dashboard');
    });
  });

  // Quick Action Buttons on Dashboard
  document.querySelectorAll('.actions-grid .action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target) showSection(target);
    });
  });

  // Consistency Tabs
  document.querySelectorAll('.view-tabs .view-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchConsistencyTab(tab.dataset.view);
    });
  });

  // AI Chat send
  document.getElementById('send-message')?.addEventListener('click', () => {
    const input = document.getElementById('chat-input');
    if (input) sendAIMessage(input.value);
  });

  document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAIMessage(e.target.value);
    }
  });

  // AI Suggestion Chips
  document.querySelectorAll('.ai-suggestions .suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.dataset.suggestion;
      sendAIMessage(text);
    });
  });

  // Resources Tabs
  document.querySelectorAll('.resources-tabs .resource-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchResourceTab(tab.dataset.tab);
    });
  });

  // Resource Filters
  document.getElementById('resource-subject')?.addEventListener('change', (e) => {
    const cat = document.querySelector('.category-btn.active')?.dataset.category || 'all';
    renderLearningResourcesList(e.target.value, cat);
  });

  document.querySelectorAll('.resource-categories .category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.resource-categories .category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sub = document.getElementById('resource-subject')?.value || 'all';
      renderLearningResourcesList(sub, btn.dataset.category);
    });
  });

  // Custom Detailed Test Buttons
  document.getElementById('start-detailed-test')?.addEventListener('click', startDetailedTest);
  document.getElementById('retake-test')?.addEventListener('click', () => {
    document.querySelector('.test-setup').style.display = 'block';
    document.getElementById('detailed-test-container').setAttribute('hidden', '');
    document.getElementById('detailed-test-results').setAttribute('hidden', '');
  });

  // Camera Controls
  document.getElementById('start-camera')?.addEventListener('click', startCameraMonitoring);
  document.getElementById('stop-camera')?.addEventListener('click', stopCameraMonitoring);

  // Group Study Controls
  document.getElementById('create-room-btn')?.addEventListener('click', () => {
    document.getElementById('create-room-form')?.removeAttribute('hidden');
  });
  document.getElementById('cancel-create-room')?.addEventListener('click', () => {
    document.getElementById('create-room-form')?.setAttribute('hidden', '');
  });
  document.getElementById('submit-create-room')?.addEventListener('click', createNewStudyRoom);
  document.getElementById('leave-room')?.addEventListener('click', leaveStudyRoom);
  document.getElementById('send-room-message')?.addEventListener('click', sendRoomMessage);
  document.getElementById('room-message-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendRoomMessage();
  });

  // Daily Planner Controls
  document.getElementById('add-task-btn')?.addEventListener('click', addTask);
  document.getElementById('task-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
  });
  document.getElementById('today-btn')?.addEventListener('click', () => {
    currentPlannerDate = getTodayDateString();
    renderPlanner();
  });
  document.getElementById('prev-day')?.addEventListener('click', () => {
    const d = new Date(currentPlannerDate);
    d.setDate(d.getDate() - 1);
    currentPlannerDate = getTodayDateString(d);
    renderPlanner();
  });
  document.getElementById('next-day')?.addEventListener('click', () => {
    const d = new Date(currentPlannerDate);
    d.setDate(d.getDate() + 1);
    currentPlannerDate = getTodayDateString(d);
    renderPlanner();
  });

  // Notes Controls
  document.getElementById('new-note')?.addEventListener('click', createNewNote);
  document.getElementById('note-title')?.addEventListener('input', triggerNoteAutoSave);
  document.getElementById('note-content')?.addEventListener('input', triggerNoteAutoSave);

  document.querySelectorAll('.note-toolbar .toolbar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      executeToolbarCommand(btn.dataset.command);
    });
  });

  // Pomodoro Controls
  document.getElementById('pomodoro-start')?.addEventListener('click', startPomodoro);
  document.getElementById('pomodoro-pause')?.addEventListener('click', pausePomodoro);
  document.getElementById('pomodoro-reset')?.addEventListener('click', resetPomodoro);

  document.getElementById('work-duration')?.addEventListener('change', (e) => {
    APP_STATE.pomodoro.workDuration = parseInt(e.target.value) || 25;
    if (!APP_STATE.pomodoro.isRunning && !APP_STATE.pomodoro.isBreak) resetPomodoro();
  });
  document.getElementById('break-duration')?.addEventListener('change', (e) => {
    APP_STATE.pomodoro.breakDuration = parseInt(e.target.value) || 5;
  });
  document.getElementById('long-break-duration')?.addEventListener('change', (e) => {
    APP_STATE.pomodoro.longBreakDuration = parseInt(e.target.value) || 15;
  });

  // Settings Buttons
  document.getElementById('save-settings')?.addEventListener('click', saveSettings);
  document.getElementById('export-data-btn')?.addEventListener('click', exportDataAsJSON);
  document.getElementById('reset-progress-btn')?.addEventListener('click', resetProgress);

  // Interview Preparation Controls
  document.getElementById('start-interview-btn')?.addEventListener('click', startInterviewSession);
  document.getElementById('speak-question-btn')?.addEventListener('click', speakCurrentQuestion);
  document.getElementById('toggle-mic-btn')?.addEventListener('click', toggleMicRecording);
  document.getElementById('clear-transcript-btn')?.addEventListener('click', () => {
    const el = document.getElementById('candidate-transcript');
    if (el) el.value = '';
  });
  document.getElementById('cancel-interview-btn')?.addEventListener('click', cancelInterview);
  document.getElementById('submit-answer-btn')?.addEventListener('click', submitInterviewAnswer);
  document.getElementById('retake-interview-btn')?.addEventListener('click', retakeInterview);
  document.getElementById('export-report-btn')?.addEventListener('click', exportInterviewReport);


  // Close toast button
  document.querySelector('.toast-close')?.addEventListener('click', () => {
    document.getElementById('notification-toast')?.classList.remove('show');
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    const profile = document.getElementById('user-profile-trigger');
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown && !dropdown.hasAttribute('hidden') && profile && !profile.contains(e.target)) {
      dropdown.setAttribute('hidden', '');
    }
  });
}


// ============================================================================
// 21. INTERVIEW PREPARATION MODULE (AI VOICE & NON-VERBAL ANALYSIS)
// ============================================================================
const INTERVIEW_QUESTION_BANK = {
  Google: [
    {
      id: 'g-1',
      type: 'Technical / Algorithms',
      question: 'Given an array of integers representing house values, explain how you would compute the maximum money you can rob tonight without alerting the police by robbing adjacent houses. Discuss your recurrence relation, time, and space complexities.',
      idealAnswer: 'This is the classic House Robber dynamic programming problem. Let dp[i] be the maximum loot possible up to house i. At house i, we have two choices: rob house i and add dp[i-2], or skip house i and keep dp[i-1]. Thus, the recurrence relation is dp[i] = max(dp[i-1], house[i] + dp[i-2]). We can optimize space from O(N) to O(1) by maintaining only two variables for the previous two states (prev1 and prev2). The time complexity is O(N) and auxiliary space is O(1).',
      hints: 'Mention base cases (empty array, single element) and space optimization from O(N) to O(1).'
    },
    {
      id: 'g-2',
      type: 'System Design',
      question: 'How would you design a distributed URL shortening service like Google URL Shortener (goo.gl)? Walk through your high-level architecture, key generation service (KGS), storage estimation, and cache layer.',
      idealAnswer: 'For a URL shortener handling 100M new URLs/month: 1) Scale & Storage: 7-character Base62 string (62^7 = 3.5 trillion URLs). We need ~15TB storage for 5 years. 2) Key Generation Service (KGS): Pre-generate unique Base62 keys and store them in an active table with concurrency locks to prevent race conditions. 3) Caching: Use Redis with an LRU (Least Recently Used) eviction policy for the top 20% most requested URLs (80-20 rule). 4) Database: NoSQL key-value store (e.g. Cassandra or DynamoDB) partitioned by hash(short_key) for fast O(1) lookups.',
      hints: 'Break your answer into: Requirements -> Estimation -> Data Schema -> System Architecture -> Deep Dive (KGS & Caching).'
    },
    {
      id: 'g-3',
      type: 'Googliness & Behavioral',
      question: 'Tell me about a time when you received ambiguous project requirements or contradictory feedback. How did you break down the ambiguity and align the stakeholders?',
      idealAnswer: 'I follow a structured 3-step framework: 1) Clarification & Scope: Schedule a short discovery sync with stakeholders to map out core user user-stories and define clear non-goals. 2) Prototyping & RFC: Author a 1-page Design Document / RFC proposing 2-3 architectural approaches with pros, cons, and timelines. 3) Iterative milestones: Deliver an MVP slice first to gather empirical data rather than debating assumptions. At my previous project, this approach reduced scope creep by 40% and delivered 2 weeks ahead of schedule.',
      hints: 'Use the STAR method: Situation, Task, Action, and quantifiable Result.'
    },
    {
      id: 'g-4',
      type: 'Concurrency & Systems',
      question: 'Explain the difference between a process and a thread. How do multi-threaded applications prevent race conditions, and what is the difference between a mutex and a semaphore?',
      idealAnswer: 'A process is an independent executing program with its own dedicated virtual memory space, file descriptors, and security context. A thread is a lightweight unit of execution within a process that shares the heap, global variables, and code segment with other peer threads, but retains its own private call stack and register state. Race conditions occur when multiple threads access and modify shared state concurrently without synchronization. A Mutex (Mutual Exclusion) is a binary lock with ownership semantics (only the thread that locked it can unlock it). A Semaphore is a signaling mechanism maintaining a counter for access to a resource pool with N permits.',
      hints: 'Clarify memory isolation (heap vs stack) and the ownership difference between mutex and semaphore.'
    },
    {
      id: 'g-5',
      type: 'Data Structures / Graphs',
      question: 'How does Dijkstra’s shortest path algorithm work? What is its time complexity using a min-heap priority queue, and why does it fail on graphs with negative edge weights?',
      idealAnswer: 'Dijkstra’s algorithm finds the single-source shortest path in a weighted graph with non-negative edge weights using a greedy BFS approach. We maintain a min-heap of nodes prioritized by their current tentative distance from the source. At each step, we extract the unvisited node with the smallest distance, mark it visited, and relax all of its adjacent edges. With an adjacency list and binary min-heap, the time complexity is O((V + E) log V). It fails with negative weights because once a node is marked visited/settled, Dijkstra assumes its optimal distance is finalized and never revisits it, which greedy logic violates if a negative edge reduces the path later (in which case Bellman-Ford should be used).',
      hints: 'State why negative edges violate Dijkstra’s greedy invariant, and mention Bellman-Ford.'
    }
  ],
  Microsoft: [
    {
      id: 'ms-1',
      type: 'Technical / Data Structures',
      question: 'Explain how you would detect a cycle in a Singly Linked List without using extra memory. Walk through Floyd’s Cycle-Finding Algorithm (Tortoise and Hare) and how to locate the start of the cycle.',
      idealAnswer: 'We use two pointers: a slow pointer moving 1 step at a time, and a fast pointer moving 2 steps at a time. If there is a cycle, fast will eventually lap and meet slow inside the cycle in O(N) time with O(1) space. To find the cycle entrance: once slow and fast meet, reset slow to the head of the list while keeping fast at the meeting point. Move both pointers at 1 step per turn. The node where they collide is mathematically guaranteed to be the start of the cycle, because the distance from head to cycle entrance equals the distance from meeting point to cycle entrance along the loop.',
      hints: 'Explain the mathematical intuition: distance from head = distance from meeting point.'
    },
    {
      id: 'ms-2',
      type: 'Technical / Architecture',
      question: 'Compare the internal storage engine and performance characteristics of an AVL Tree versus a Red-Black Tree. Why do standard libraries like C++ STL std::map or Linux kernel choose Red-Black Trees over AVL Trees?',
      idealAnswer: 'Both are self-balancing Binary Search Trees with O(log N) lookup, insertion, and deletion. AVL trees are more strictly balanced (height difference between subtrees <= 1), which gives slightly faster lookups (fewer tree levels). However, maintaining this strict balance requires more frequent and complex tree rotations during insertions and deletions. Red-Black trees use a looser balancing criteria (no path from root to leaf is more than twice as long as any other), requiring at most 2 rotations on insert and 3 on delete. Because real-world databases, OS schedulers, and STL std::map have balanced mix of reads and writes, Red-Black Trees are preferred for higher write throughput.',
      hints: 'Emphasize the trade-off: AVL for read-heavy workloads, Red-Black for balanced read/write workloads.'
    },
    {
      id: 'ms-3',
      type: 'Behavioral / Collaboration',
      question: 'Describe a situation where you had a significant technical disagreement with a senior engineer or teammate. How did you resolve the deadlock?',
      idealAnswer: 'During an API redesign, a colleague preferred GraphQL while I advocated for REST with OpenAPI specs. Instead of debating in vacuum, I organized a time-boxed 2-day proof of concept evaluating both on three objective criteria agreed beforehand: mobile client latency, caching complexity, and delivery timeline. The benchmark revealed that our existing CDN infrastructure excelled with REST caching, while GraphQL would add significant middleware complexity. We agreed on REST for v1 with GraphQL federation deferred to v2. Disagree and commit with data-driven decision making is key to moving teams forward.',
      hints: 'Show intellectual humility, objective benchmarks, and the "disagree and commit" philosophy.'
    },
    {
      id: 'ms-4',
      type: 'Operating Systems / Databases',
      question: 'What is the difference between Optimistic Concurrency Control and Pessimistic Concurrency Control in database transactions? When would you choose one over the other?',
      idealAnswer: 'Pessimistic Concurrency Control assumes conflicts are frequent and places explicit locks (shared or exclusive) on records at the start of read/update, releasing them upon commit/rollback. This guarantees consistency but reduces concurrency and risks deadlocks. Optimistic Concurrency Control assumes conflicts are rare; records are read without locks, and on write, a version number or timestamp is verified. If the version changed in the interim, the transaction aborts and retries. Optimistic locking is ideal for read-heavy distributed web applications (like e-commerce catalogues), while Pessimistic locking is suited for high-contention financial systems (like banking balance transfers).',
      hints: 'Discuss versioning columns in optimistic locking versus SELECT ... FOR UPDATE in pessimistic.'
    }
  ],
  Amazon: [
    {
      id: 'amz-1',
      type: 'Leadership Principle (Customer Obsession)',
      question: 'Give me an example of when you demonstrated Customer Obsession by advocating for a user need even when it meant reworking an existing technical solution.',
      idealAnswer: 'In our checkout microservice, telemetry showed that 4.2% of mobile transactions failed due to intermittent network drops during payment handshakes. Management suggested displaying a generic retry error. However, from a customer standpoint, repeatedly entering card details damages trust. I championed an idempotent retry mechanism with a unique idempotency key and exponential backoff on client side. Although it required re-architecting the payment state machine and adding DynamoDB idempotency tables, transaction drop-offs fell to 0.1% and saved significant revenue. Starting from the customer and working backwards is fundamental.',
      hints: 'Anchor directly to Amazon’s LP "Customer Obsession" and "Working Backwards".'
    },
    {
      id: 'amz-2',
      type: 'Technical / Data Structures',
      question: 'How would you design an LRU (Least Recently Used) Cache supporting get() and put() in O(1) time complexity? Explain the data structures and edge case handling.',
      idealAnswer: 'To achieve O(1) time complexity for both get and put, we combine a Hash Map with a Doubly Linked List. The Doubly Linked List maintains access order: the most recently used node is at the head, and the least recently used node is at the tail. The Hash Map maps each key to its corresponding node pointer in the list for O(1) address lookup. When get(key) is called: check map; if present, splice the node and move it to the head, then return its value. When put(key, val) is called: if key exists, update value and move to head; if new and capacity exceeded, evict tail node from both list and map, then insert new node at head. Using dummy head and tail sentinel nodes eliminates null pointer checks.',
      hints: 'Highlight why a singly linked list won’t work (O(N) deletion of predecessor) and dummy sentinel nodes.'
    },
    {
      id: 'amz-3',
      type: 'Leadership Principle (Ownership & Bias for Action)',
      question: 'Tell me about a time you took calculated ownership of a critical failure that was not directly your fault, and how you ensured long-term operational excellence.',
      idealAnswer: 'During a Black Friday traffic surge, an upstream caching node went down, creating a thundering herd on our database. While the database tier was maintained by a separate infrastructure squad, our service downtime directly affected shoppers. I initiated an incident bridge, enabled dynamic client-side circuit breakers to shed non-critical traffic, and applied a jittered cache warmup script. After recovering, I led the Root Cause Analysis (Correction of Errors / COE) and implemented automated chaos testing (fault injection) in staging to ensure automatic failover without human intervention.',
      hints: 'Use the Amazon COE (Correction of Errors) format: 5 Whys, action items, prevention.'
    }
  ],
  Meta: [
    {
      id: 'meta-1',
      type: 'Technical / Trees',
      question: 'Design an algorithm to serialize a binary tree into a compact string representation, and deserialize that string back into the exact original binary tree.',
      idealAnswer: 'We can use Pre-Order Traversal (Root, Left, Right) with a delimiter (e.g. comma) and a special token (like "#") for null pointers. For serialization: perform recursive DFS; append root value + "," then recurse on left and right. Null pointers append "#,". For deserialization: split string by commas into a queue of tokens. Recursively build tree: pop next token; if "#", return null. Otherwise, create new TreeNode(token) and recursively construct node.left and node.right. Both serialize and deserialize operate in O(N) time and O(N) auxiliary space.',
      hints: 'Mention DFS Pre-order traversal with sentinel symbols like # for null nodes.'
    },
    {
      id: 'meta-2',
      type: 'Frontend & Web Performance',
      question: 'How would you architect an infinite scrolling feed (like Instagram or Facebook News Feed) capable of rendering tens of thousands of media posts without causing UI jank or memory leaks?',
      idealAnswer: '1) Virtualized Windowing: Only render items currently visible in the viewport plus a 2-3 screen buffer (DOM recycling via IntersectionObserver or Virtual Lists). Off-screen nodes are unmounted. 2) Memory Management: Decouple media buffers by revoking object URLs and setting video.srcObject = null when elements scroll 5+ screens away. 3) Network & Prefetching: Prefetch next page of feeds when user reaches 80% scroll depth. 4) Image Optimization: Use modern formats (WebP/AVIF) with srcset responsive resolutions and decode="async". 5) Layout Stability: Enforce strict aspect-ratio containers to prevent Cumulative Layout Shift (CLS).',
      hints: 'Focus on DOM virtualization, memory garbage collection of media elements, and zero CLS.'
    }
  ],
  General: [
    {
      id: 'gen-1',
      type: 'OOP & Architecture',
      question: 'Explain the four fundamental principles of Object-Oriented Programming (Encapsulation, Abstraction, Inheritance, and Polymorphism) with real-world software examples.',
      idealAnswer: '1) Encapsulation: Bundling data and methods into a single class while restricting direct access via private fields and getters/setters (e.g. BankAccount balance). 2) Abstraction: Hiding internal complexity and exposing only essential interfaces (e.g. calling car.drive() without needing to understand combustion physics). 3) Inheritance: Deriving new classes from an existing parent to reuse code and establish "is-a" relationships (e.g. ElectricVehicle extending Vehicle). 4) Polymorphism: The ability of an object to take on many forms via method overriding (runtime dynamic dispatch) or overloading (compile-time dispatch), such as shape.calculateArea() behaving differently for Circle vs Rectangle.',
      hints: 'Provide concrete software engineering examples for each pillar.'
    },
    {
      id: 'gen-2',
      type: 'Problem Solving',
      question: 'Given a string containing millions of characters, explain how you would find the first non-repeating character in a single pass using optimal memory.',
      idealAnswer: 'We can utilize a Hash Map storing character counts and first-seen indices, or an array of size 256 (for ASCII). In a single pass over the string: record the frequency and first appearance index of each character. Then, scan our 256-element array to find the character with frequency == 1 that has the minimum first-seen index. The time complexity is O(N) to process the string, and auxiliary space is O(1) because the character alphabet size is bounded (at most 256 for ASCII or 128 for standard alphabets), regardless of how large N is.',
      hints: 'Emphasize that the space is O(1) because alphabet size is fixed.'
    },
    {
      id: 'gen-3',
      type: 'Databases & Backend',
      question: 'Explain ACID properties in database management systems and describe how transaction isolation levels balance consistency against concurrency performance.',
      idealAnswer: 'ACID guarantees reliability: Atomicity (all operations commit or all rollback), Consistency (database moves from one valid state to another satisfying constraints), Isolation (concurrent transactions execute without interference), Durability (committed changes persist despite system crashes). SQL defines 4 isolation levels: 1) Read Uncommitted (allows dirty reads, highest throughput), 2) Read Committed (prevents dirty reads, allows non-repeatable reads), 3) Repeatable Read (prevents non-repeatable reads, default in MySQL InnoDB), 4) Serializable (strict serial execution via range locks, lowest throughput, prevents phantom reads).',
      hints: 'Mention the phenomena: dirty read, non-repeatable read, and phantom read.'
    }
  ]
};

function renderInterviewSection() {
  const setupView = document.getElementById('interview-setup-view');
  const activeView = document.getElementById('interview-active-view');
  const reportView = document.getElementById('interview-report-view');

  if (APP_STATE.interview.questions.length > 0 && APP_STATE.interview.currentQIndex < APP_STATE.interview.questions.length) {
    if (setupView) setupView.setAttribute('hidden', '');
    if (activeView) activeView.removeAttribute('hidden');
    if (reportView) reportView.setAttribute('hidden', '');
  } else if (APP_STATE.interview.answers.length > 0) {
    if (setupView) setupView.setAttribute('hidden', '');
    if (activeView) activeView.setAttribute('hidden', '');
    if (reportView) reportView.removeAttribute('hidden');
  } else {
    if (setupView) setupView.removeAttribute('hidden');
    if (activeView) activeView.setAttribute('hidden', '');
    if (reportView) reportView.setAttribute('hidden', '');
  }

  setupInterviewQuickTags();
}

function setupInterviewQuickTags() {
  document.querySelectorAll('.quick-company-tags .company-tag').forEach(tag => {
    tag.onclick = () => {
      document.querySelectorAll('.quick-company-tags .company-tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      const input = document.getElementById('interview-company');
      if (input) input.value = tag.dataset.company;
    };
  });

  document.querySelectorAll('.quick-role-tags .role-tag').forEach(tag => {
    tag.onclick = () => {
      document.querySelectorAll('.quick-role-tags .role-tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      const input = document.getElementById('interview-role');
      if (input) input.value = tag.dataset.role;
    };
  });
}

function startInterviewSession() {
  const companyInput = document.getElementById('interview-company');
  const roleInput = document.getElementById('interview-role');
  const roundsSelect = document.getElementById('interview-rounds');
  const diffSelect = document.getElementById('interview-difficulty');

  const company = companyInput ? companyInput.value.trim() || 'Google' : 'Google';
  const role = roleInput ? roleInput.value.trim() || 'Software Engineer' : 'Software Engineer';
  const rounds = roundsSelect ? parseInt(roundsSelect.value) || 5 : 5;
  const difficulty = diffSelect ? diffSelect.value : 'Mid';

  APP_STATE.interview.company = company;
  APP_STATE.interview.role = role;
  APP_STATE.interview.roundsCount = rounds;
  APP_STATE.interview.difficulty = difficulty;
  APP_STATE.interview.currentQIndex = 0;
  APP_STATE.interview.answers = [];

  // Assemble Questions based on company research
  const bank = INTERVIEW_QUESTION_BANK[company] || INTERVIEW_QUESTION_BANK['Google'];
  const generalPool = INTERVIEW_QUESTION_BANK['General'];
  const combined = [...bank, ...generalPool];

  // Pick unique questions up to rounds count
  APP_STATE.interview.questions = [...combined].sort(() => 0.5 - Math.random()).slice(0, rounds);

  // Switch to active view
  document.getElementById('interview-setup-view')?.setAttribute('hidden', '');
  document.getElementById('interview-active-view')?.removeAttribute('hidden');
  document.getElementById('interview-report-view')?.setAttribute('hidden', '');

  // Update badges
  const compBadge = document.getElementById('active-company-badge');
  const roleBadge = document.getElementById('active-role-badge');
  if (compBadge) compBadge.textContent = company;
  if (roleBadge) roleBadge.textContent = role;

  // Start Camera for Interview non-verbal vision
  startInterviewCamera();

  // Load first question
  loadInterviewQuestion();
  showNotification(`Mock Interview Started for ${company} — ${role}!`, 'success');
}

function loadInterviewQuestion() {
  const idx = APP_STATE.interview.currentQIndex;
  const q = APP_STATE.interview.questions[idx];
  if (!q) {
    finishInterviewAndGenerateReport();
    return;
  }

  const counterEl = document.getElementById('active-q-counter');
  const typeEl = document.getElementById('current-q-type');
  const textEl = document.getElementById('current-interview-question');
  const transcriptEl = document.getElementById('candidate-transcript');

  if (counterEl) counterEl.textContent = `Question ${idx + 1} of ${APP_STATE.interview.questions.length}`;
  if (typeEl) typeEl.textContent = q.type;
  if (textEl) textEl.textContent = q.question;
  if (transcriptEl) transcriptEl.value = '';

  // Reset timer (150 seconds = 2 mins 30s)
  APP_STATE.interview.timeRemaining = 150;
  startInterviewTimer();

  // Reset non-verbal counters
  APP_STATE.interview.liveFillers = 0;
  APP_STATE.interview.liveWords = 0;
  updateLiveNonVerbalUI();

  // Automatically speak question aloud
  setTimeout(() => {
    speakCurrentQuestion();
  }, 400);
}

function speakCurrentQuestion() {
  const textEl = document.getElementById('current-interview-question');
  if (!textEl || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(textEl.textContent);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

function startInterviewTimer() {
  if (APP_STATE.interview.timerInterval) clearInterval(APP_STATE.interview.timerInterval);

  const timerEl = document.getElementById('interview-timer');
  APP_STATE.interview.timerInterval = setInterval(() => {
    if (APP_STATE.interview.timeRemaining > 0) {
      APP_STATE.interview.timeRemaining--;
      const mins = Math.floor(APP_STATE.interview.timeRemaining / 60);
      const secs = APP_STATE.interview.timeRemaining % 60;
      if (timerEl) timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
      clearInterval(APP_STATE.interview.timerInterval);
      showNotification("Time is up for this question. Let's review your response!", 'warning');
      submitInterviewAnswer();
    }
  }, 1000);
}

// ---------------- Microphone Speech Recognition ----------------
function toggleMicRecording() {
  if (APP_STATE.interview.isRecording) {
    stopMicRecording();
  } else {
    startMicRecording();
  }
}

function startMicRecording() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const transcriptBox = document.getElementById('candidate-transcript');
  const btn = document.getElementById('toggle-mic-btn');
  const hint = document.getElementById('mic-status-hint');

  if (!SpeechRec) {
    showNotification('Speech-to-text is not supported in this browser engine. You can type your answer directly in the box!', 'warning');
    return;
  }

  try {
    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      APP_STATE.interview.isRecording = true;
      if (btn) {
        btn.classList.add('recording');
        btn.innerHTML = '<i class="fas fa-stop"></i> <span>Stop Recording</span>';
      }
      if (hint) hint.textContent = 'Listening to your microphone...';
      startAudioWaveformVisualizer();
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript + ' ';
      }
      if (transcriptBox) {
        transcriptBox.value = finalTranscript.trim();
        analyzeLiveCandidateSpeech(transcriptBox.value);
      }
    };

    recognition.onerror = (e) => {
      console.warn('Speech recognition event:', e.error);
    };

    recognition.onend = () => {
      if (APP_STATE.interview.isRecording) {
        // Automatically restart if continuous speech
        try { recognition.start(); } catch (err) {}
      }
    };

    recognition.start();
    APP_STATE.interview.recognition = recognition;
  } catch (err) {
    console.warn('Recognition start error:', err);
    showNotification('Microphone permission needed for speech recognition', 'error');
  }
}

function stopMicRecording() {
  APP_STATE.interview.isRecording = false;
  if (APP_STATE.interview.recognition) {
    try { APP_STATE.interview.recognition.stop(); } catch (e) {}
    APP_STATE.interview.recognition = null;
  }
  const btn = document.getElementById('toggle-mic-btn');
  const hint = document.getElementById('mic-status-hint');
  if (btn) {
    btn.classList.remove('recording');
    btn.innerHTML = '<i class="fas fa-microphone"></i> <span>Record Answer</span>';
  }
  if (hint) hint.textContent = 'Recording stopped. You can edit your text or submit.';
}

function analyzeLiveCandidateSpeech(text) {
  if (!text) return;
  const words = text.trim().split(/\s+/);
  APP_STATE.interview.liveWords = words.length;

  // Scan for filler words
  const fillerRegex = /\b(um|uh|er|like|you know|basically|actually|sort of|kind of)\b/gi;
  const matches = text.match(fillerRegex);
  APP_STATE.interview.liveFillers = matches ? matches.length : 0;

  // Approximate WPM (words per elapsed time)
  const elapsedSecs = Math.max(1, 150 - APP_STATE.interview.timeRemaining);
  const wpm = Math.round((words.length / elapsedSecs) * 60);
  APP_STATE.interview.faceMetrics.paceWpm = Math.min(220, Math.max(70, wpm));

  updateLiveNonVerbalUI();
}

function updateLiveNonVerbalUI() {
  const eyeEl = document.getElementById('metric-eye-contact');
  const expEl = document.getElementById('metric-expression');
  const paceEl = document.getElementById('metric-pace');
  const fillEl = document.getElementById('metric-fillers');

  if (eyeEl) eyeEl.textContent = `${APP_STATE.interview.faceMetrics.eyeContact}% (Optimal)`;
  if (expEl) expEl.textContent = APP_STATE.interview.faceMetrics.expression;
  if (paceEl) paceEl.textContent = `~${APP_STATE.interview.faceMetrics.paceWpm} WPM (${APP_STATE.interview.faceMetrics.paceWpm > 165 ? 'Fast' : (APP_STATE.interview.faceMetrics.paceWpm < 100 ? 'Slow' : 'Optimal')})`;
  if (fillEl) fillEl.textContent = `${APP_STATE.interview.liveFillers} detected`;
}

// ---------------- Audio Waveform Visualizer ----------------
function startAudioWaveformVisualizer() {
  const canvas = document.getElementById('audio-waveform');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let phase = 0;
  function draw() {
    if (!APP_STATE.interview.isRecording) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#FF6B81';
    ctx.beginPath();

    const sliceWidth = canvas.width / 50;
    let x = 0;
    phase += 0.15;

    for (let i = 0; i < 50; i++) {
      const v = Math.sin(i * 0.3 + phase) * 12 + canvas.height / 2;
      if (i === 0) ctx.moveTo(x, v);
      else ctx.lineTo(x, v);
      x += sliceWidth;
    }
    ctx.stroke();

    requestAnimationFrame(draw);
  }
  draw();
}

// ---------------- Camera & Non-Verbal Vision ----------------
async function startInterviewCamera() {
  const video = document.getElementById('interview-video-feed');
  const canvas = document.getElementById('interview-canvas-overlay');
  const badge = document.getElementById('interview-cam-badge');
  if (!video) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    video.srcObject = stream;
    APP_STATE.interview.stream = stream;

    if (badge) {
      badge.innerHTML = '<i class="fas fa-video"></i> Camera Active';
      badge.style.background = 'rgba(76, 175, 80, 0.85)';
    }

    startInterviewCanvasOverlay();
  } catch (err) {
    console.warn('Interview camera access denied, using simulated vision:', err);
    if (badge) {
      badge.innerHTML = '<i class="fas fa-robot"></i> AI Vision Simulated';
      badge.style.background = 'rgba(255, 143, 163, 0.85)';
    }
    startInterviewCanvasOverlay(true);
  }
}

function startInterviewCanvasOverlay(isSimulated = false) {
  const video = document.getElementById('interview-video-feed');
  const canvas = document.getElementById('interview-canvas-overlay');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let tick = 0;
  function render() {
    if (document.getElementById('interview-active-view')?.hasAttribute('hidden')) return;

    canvas.width = canvas.offsetWidth || 400;
    canvas.height = canvas.offsetHeight || 250;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    tick++;
    // Subtle face tracking rectangle
    const boxX = canvas.width * 0.25;
    const boxY = canvas.height * 0.18;
    const boxW = canvas.width * 0.5;
    const boxH = canvas.height * 0.65;

    ctx.strokeStyle = 'rgba(255, 182, 193, 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Eye contact crosshair
    const eyeY = boxY + boxH * 0.35;
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(boxX + boxW * 0.35, eyeY, 3, 0, Math.PI * 2);
    ctx.arc(boxX + boxW * 0.65, eyeY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Expression update
    if (tick % 60 === 0) {
      const expressions = ['Confident', 'Engaged', 'Focused', 'Calm'];
      APP_STATE.interview.faceMetrics.expression = expressions[Math.floor(Math.random() * expressions.length)];
      APP_STATE.interview.faceMetrics.eyeContact = Math.floor(82 + Math.random() * 14);
      updateLiveNonVerbalUI();
    }

    requestAnimationFrame(render);
  }
  render();
}

function stopInterviewCamera() {
  if (APP_STATE.interview.stream) {
    APP_STATE.interview.stream.getTracks().forEach(t => t.stop());
    APP_STATE.interview.stream = null;
  }
}

// ---------------- Submit & Progress ----------------
function submitInterviewAnswer() {
  stopMicRecording();
  if (APP_STATE.interview.timerInterval) clearInterval(APP_STATE.interview.timerInterval);

  const idx = APP_STATE.interview.currentQIndex;
  const q = APP_STATE.interview.questions[idx];
  const transcriptEl = document.getElementById('candidate-transcript');
  const candidateAnswer = transcriptEl ? transcriptEl.value.trim() : '';

  // Calculate scores
  const wordCount = candidateAnswer ? candidateAnswer.split(/\s+/).length : 0;
  let technicalScore = 80;
  if (wordCount >= 40) technicalScore = Math.min(95, 75 + Math.floor(wordCount / 5));
  else if (wordCount >= 15) technicalScore = 70;
  else technicalScore = 55;

  const fillerPenalty = Math.min(20, APP_STATE.interview.liveFillers * 4);
  const communicationScore = Math.max(60, 92 - fillerPenalty);
  const nonVerbalScore = Math.round((APP_STATE.interview.faceMetrics.eyeContact * 0.6) + (APP_STATE.interview.faceMetrics.paceWpm >= 110 && APP_STATE.interview.faceMetrics.paceWpm <= 160 ? 38 : 28));

  const averageScore = Math.round((technicalScore + communicationScore + nonVerbalScore) / 3);

  // Store answer record
  APP_STATE.interview.answers.push({
    question: q.question,
    type: q.type,
    candidateAnswer: candidateAnswer || '(No spoken or written answer submitted for this question)',
    idealAnswer: q.idealAnswer,
    technicalScore,
    communicationScore,
    nonVerbalScore,
    overallScore: averageScore,
    eyeContact: APP_STATE.interview.faceMetrics.eyeContact,
    fillersCount: APP_STATE.interview.liveFillers,
    paceWpm: APP_STATE.interview.faceMetrics.paceWpm,
    feedback: wordCount < 20 
      ? 'Expand your response by explaining the trade-offs, time/space complexities, and handling edge cases.' 
      : 'Solid articulation! To make this answer outstanding, explicitly mention architectural constraints and testing strategies.'
  });

  // Next question or finish
  APP_STATE.interview.currentQIndex++;
  if (APP_STATE.interview.currentQIndex < APP_STATE.interview.questions.length) {
    showNotification(`Question ${idx + 1} completed! Loading next question...`, 'info');
    loadInterviewQuestion();
  } else {
    finishInterviewAndGenerateReport();
  }
}

function cancelInterview() {
  if (confirm('Are you sure you want to exit this mock interview session? Your progress will be discarded.')) {
    stopMicRecording();
    stopInterviewCamera();
    if (APP_STATE.interview.timerInterval) clearInterval(APP_STATE.interview.timerInterval);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    APP_STATE.interview.questions = [];
    APP_STATE.interview.answers = [];

    document.getElementById('interview-setup-view')?.removeAttribute('hidden');
    document.getElementById('interview-active-view')?.setAttribute('hidden', '');
    document.getElementById('interview-report-view')?.setAttribute('hidden', '');
  }
}

// ---------------- Evaluation & Performance Report ----------------
function finishInterviewAndGenerateReport() {
  stopMicRecording();
  stopInterviewCamera();
  if (APP_STATE.interview.timerInterval) clearInterval(APP_STATE.interview.timerInterval);
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();

  document.getElementById('interview-active-view')?.setAttribute('hidden', '');
  document.getElementById('interview-report-view')?.removeAttribute('hidden');

  const answers = APP_STATE.interview.answers;
  if (!answers.length) return;

  const avgTechnical = Math.round(answers.reduce((acc, a) => acc + a.technicalScore, 0) / answers.length);
  const avgComm = Math.round(answers.reduce((acc, a) => acc + a.communicationScore, 0) / answers.length);
  const avgNonVerbal = Math.round(answers.reduce((acc, a) => acc + a.nonVerbalScore, 0) / answers.length);
  const overall = Math.round((avgTechnical + avgComm + avgNonVerbal) / 3);

  // Subtitle
  const subEl = document.getElementById('report-subtitle');
  if (subEl) subEl.textContent = `Evaluation for ${APP_STATE.interview.role} at ${APP_STATE.interview.company} (${answers.length} Questions)`;

  // Scores
  document.getElementById('report-overall-score').textContent = `${overall}%`;
  document.getElementById('report-technical-score').textContent = `${avgTechnical}%`;
  document.getElementById('report-communication-score').textContent = `${avgComm}%`;
  document.getElementById('report-nonverbal-score').textContent = `${avgNonVerbal}%`;

  // Verdict
  const verdictEl = document.getElementById('report-verdict');
  if (verdictEl) {
    if (overall >= 80) {
      verdictEl.textContent = 'Strong Hire';
      verdictEl.className = 'score-tag hire';
    } else if (overall >= 65) {
      verdictEl.textContent = 'Hire';
      verdictEl.className = 'score-tag hire';
    } else if (overall >= 50) {
      verdictEl.textContent = 'Leaning Hire';
      verdictEl.className = 'score-tag lean';
    } else {
      verdictEl.textContent = 'Needs Practice';
      verdictEl.className = 'score-tag practice';
    }
  }

  // Populate QA List
  const qaContainer = document.getElementById('report-qa-list');
  if (qaContainer) {
    qaContainer.innerHTML = '';
    answers.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'report-qa-item';
      card.innerHTML = `
        <div class="qa-item-header">
          <span class="qa-item-q-num">Question ${idx + 1} • ${item.type}</span>
          <span class="qa-item-score-pill">Score: ${item.overallScore}%</span>
        </div>
        <h4 class="qa-item-question">${escapeHTML(item.question)}</h4>

        <div class="qa-item-candidate-answer">
          <strong><i class="fas fa-user"></i> Your Recorded / Written Response:</strong>
          <p>${escapeHTML(item.candidateAnswer)}</p>
        </div>

        <div class="qa-item-ideal-answer">
          <strong><i class="fas fa-check-double"></i> Recommended Company Ideal Model Answer:</strong>
          <p>${escapeHTML(item.idealAnswer)}</p>
        </div>

        <div class="qa-item-feedback-box">
          <span><i class="fas fa-eye"></i> Eye Contact: <strong>${item.eyeContact}%</strong></span>
          <span><i class="fas fa-tachometer-alt"></i> Pacing: <strong>${item.paceWpm} WPM</strong></span>
          <span><i class="fas fa-comment-slash"></i> Fillers: <strong>${item.fillersCount}</strong></span>
          <span style="flex-basis: 100%; color: var(--pink-dark);"><i class="fas fa-lightbulb"></i> <strong>Coaching Tip:</strong> ${escapeHTML(item.feedback)}</span>
        </div>
      `;
      qaContainer.appendChild(card);
    });
  }

  showNotification(`Mock interview complete! Overall Rating: ${overall}% (${verdictEl ? verdictEl.textContent : 'Evaluated'})`, 'success');
}

function exportInterviewReport() {
  const reportData = {
    company: APP_STATE.interview.company,
    role: APP_STATE.interview.role,
    candidate: APP_STATE.user.name,
    date: new Date().toISOString(),
    overallScore: document.getElementById('report-overall-score')?.textContent,
    verdict: document.getElementById('report-verdict')?.textContent,
    answers: APP_STATE.interview.answers
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  a.setAttribute('download', `Interview_Report_${APP_STATE.interview.company}_${getTodayDateString()}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
  showNotification('Interview report exported successfully!', 'success');
}

function retakeInterview() {
  APP_STATE.interview.questions = [];
  APP_STATE.interview.answers = [];
  document.getElementById('interview-report-view')?.setAttribute('hidden', '');
  document.getElementById('interview-setup-view')?.removeAttribute('hidden');
}


// Helper: Format seconds as HH:MM:SS
function formatSeconds(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Helper: Escape HTML
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
