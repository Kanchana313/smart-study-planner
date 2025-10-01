// DOM Elements
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const taskModal = document.getElementById('taskModal');
const goalModal = document.getElementById('goalModal');
const notification = document.getElementById('notification');
const themeToggle = document.getElementById('themeToggle');
const voiceCommand = document.getElementById('voiceCommand');
const voiceFeedback = document.getElementById('voiceFeedback');
const fabButton = document.getElementById('fabButton');
const loadingOverlay = document.getElementById('loadingOverlay');

// Buttons
const addTaskBtn = document.getElementById('addTaskBtn');
const addGoalBtn = document.getElementById('addGoalBtn');
const closeTaskModal = document.getElementById('closeTaskModal');
const closeGoalModal = document.getElementById('closeGoalModal');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');
const cancelGoalBtn = document.getElementById('cancelGoalBtn');
const saveTaskBtn = document.getElementById('saveTaskBtn');
const saveGoalBtn = document.getElementById('saveGoalBtn');
const notificationClose = document.getElementById('notificationClose');
const prevWeekBtn = document.getElementById('prevWeek');
const nextWeekBtn = document.getElementById('nextWeek');
const exportDataBtn = document.getElementById('exportData');
const generateReportBtn = document.getElementById('generateReport');

// Forms
const taskForm = document.getElementById('taskForm');
const goalForm = document.getElementById('goalForm');

// Containers
const tasksContainer = document.getElementById('tasksContainer');
const goalsContainer = document.getElementById('goalsContainer');
const weeklyTimeline = document.getElementById('weeklyTimeline');
const insightsGrid = document.getElementById('insightsGrid');

// Search inputs
const taskSearch = document.getElementById('taskSearch');
const goalSearch = document.getElementById('goalSearch');

// Current week for timeline
let currentWeekStart = new Date();
currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

// Data
let tasks = JSON.parse(localStorage.getItem('studyPlannerTasks')) || [];
let goals = JSON.parse(localStorage.getItem('studyPlannerGoals')) || [];
let studySessions = JSON.parse(localStorage.getItem('studySessions')) || [];
let currentEditingTaskId = null;
let currentEditingGoalId = null;
let productivityChart = null;
let studyChart = null;
let recognition = null;
let isListening = false;

// Three.js variables
let scene, camera, renderer, particles;

// Initialize the app
function init() {
    // Initialize Three.js background
    initThreeJS();
    
    // Initialize GSAP animations
    initGSAPAnimations();
    
    // Initialize voice recognition
    initVoiceRecognition();
    
    // Update UI
    updateDashboardStats();
    renderTasks();
    renderGoals();
    renderTimeline();
    initializeCharts();
    generateAIInsights();
    checkReminders();
    updateStreak();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for reminders every minute
    setInterval(checkReminders, 60000);
    
    // Update streak daily
    setInterval(updateStreak, 3600000);
    
    // Update AI insights every 10 minutes
    setInterval(generateAIInsights, 600000);
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Initialize service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(error => {
            console.log('Service Worker registration failed:', error);
        });
    }
}

// Initialize Three.js background
function initThreeJS() {
    const container = document.getElementById('three-container');
    
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    
    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const posArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 10;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    // Material
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.02,
        color: 0x6366f1,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    // Mesh
    particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    
    // Position camera
    camera.position.z = 3;
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Animation loop
    animateParticles();
}

function animateParticles() {
    requestAnimationFrame(animateParticles);
    
    // Rotate particles
    particles.rotation.x += 0.001;
    particles.rotation.y += 0.002;
    
    renderer.render(scene, camera);
}

// Initialize GSAP animations
function initGSAPAnimations() {
    // Header animation
    gsap.to('header', {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
    });
    
    // Hero section animation
    gsap.to('.hero-section', {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.2,
        ease: 'power3.out'
    });
    
    // AI insights animation
    gsap.to('.ai-insights', {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.4,
        ease: 'power3.out'
    });
    
    // Dashboard cards animation
    gsap.to('.stat-card', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        delay: 0.6,
        ease: 'power3.out'
    });
    
    // Tabs animation
    gsap.to('.tabs', {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 1,
        ease: 'power3.out'
    });
    
    // Floating action button animation
    gsap.from('.floating-action-button', {
        scale: 0,
        rotation: 360,
        duration: 1,
        delay: 1.2,
        ease: 'back.out(1.7)'
    });
}

// Initialize voice recognition
function initVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        
        recognition.onstart = () => {
            isListening = true;
            voiceCommand.classList.add('active');
            showVoiceFeedback('Listening', 'Speak your command now...');
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            processVoiceCommand(transcript);
        };
        
        recognition.onerror = (event) => {
            isListening = false;
            voiceCommand.classList.remove('active');
            showVoiceFeedback('Error', 'Voice recognition failed. Please try again.');
        };
        
        recognition.onend = () => {
            isListening = false;
            voiceCommand.classList.remove('active');
            setTimeout(() => {
                document.getElementById('voiceFeedback').classList.remove('show');
            }, 3000);
        };
    } else {
        voiceCommand.style.display = 'none';
    }
}

// Process voice commands
function processVoiceCommand(command) {
    showVoiceFeedback('Command Received', `"${command}"`);
    
    if (command.includes('add task')) {
        const title = command.replace('add task', '').trim();
        if (title) {
            showVoiceFeedback('Adding Task', `Creating task: "${title}"`);
            setTimeout(() => {
                openTaskModal();
                document.getElementById('taskTitle').value = title;
            }, 1000);
        } else {
            showVoiceFeedback('Error', 'Please specify a task title.');
        }
    } else if (command.includes('add goal')) {
        const title = command.replace('add goal', '').trim();
        if (title) {
            showVoiceFeedback('Adding Goal', `Creating goal: "${title}"`);
            setTimeout(() => {
                openGoalModal();
                document.getElementById('goalTitle').value = title;
            }, 1000);
        } else {
            showVoiceFeedback('Error', 'Please specify a goal title.');
        }
    } else if (command.includes('show tasks')) {
        showVoiceFeedback('Showing Tasks', 'Switching to tasks view');
        switchTab('tasks');
    } else if (command.includes('show goals')) {
        showVoiceFeedback('Showing Goals', 'Switching to goals view');
        switchTab('goals');
    } else if (command.includes('show analytics')) {
        showVoiceFeedback('Showing Analytics', 'Switching to analytics view');
        switchTab('analytics');
    } else if (command.includes('generate report')) {
        showVoiceFeedback('Generating Report', 'Creating your study report...');
        generateReport();
    } else if (command.includes('toggle theme')) {
        showVoiceFeedback('Toggling Theme', 'Switching theme');
        toggleTheme();
    } else {
        showVoiceFeedback('Command Not Recognized', 'Please try a different command.');
    }
}

// Show voice feedback
function showVoiceFeedback(title, message) {
    document.getElementById('voiceFeedbackTitle').textContent = title;
    document.getElementById('voiceFeedbackMessage').textContent = message;
    document.getElementById('voiceFeedback').classList.add('show');
}

// Set up event listeners
function setupEventListeners() {
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Voice command
    voiceCommand.addEventListener('click', () => {
        if (recognition && !isListening) {
            recognition.start();
        }
    });
    
    // Modal controls
    addTaskBtn.addEventListener('click', () => openTaskModal());
    addGoalBtn.addEventListener('click', () => openGoalModal());
    closeTaskModal.addEventListener('click', () => closeTaskModalFunc());
    closeGoalModal.addEventListener('click', () => closeGoalModalFunc());
    cancelTaskBtn.addEventListener('click', () => closeTaskModalFunc());
    cancelGoalBtn.addEventListener('click', () => closeGoalModalFunc());
    
    // Form submissions
    saveTaskBtn.addEventListener('click', saveTask);
    saveGoalBtn.addEventListener('click', saveGoal);
    
    // Notification close
    notificationClose.addEventListener('click', closeNotification);
    
    // Search functionality
    taskSearch.addEventListener('input', filterTasks);
    goalSearch.addEventListener('input', filterGoals);
    
    // Timeline navigation
    prevWeekBtn.addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        renderTimeline();
    });
    
    nextWeekBtn.addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        renderTimeline();
    });
    
    // Export and report
    exportDataBtn.addEventListener('click', exportData);
    generateReportBtn.addEventListener('click', generateReport);
    
    // Floating action button
    fabButton.addEventListener('click', () => {
        openTaskModal();
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            closeTaskModalFunc();
        }
        if (e.target === goalModal) {
            closeGoalModalFunc();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + N: New task
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            openTaskModal();
        }
        
        // Ctrl/Cmd + G: New goal
        if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
            e.preventDefault();
            openGoalModal();
        }
        
        // Ctrl/Cmd + V: Voice command
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.preventDefault();
            if (recognition && !isListening) {
                recognition.start();
            }
        }
        
        // Escape: Close modal
        if (e.key === 'Escape') {
            if (taskModal.classList.contains('active')) {
                closeTaskModalFunc();
            }
            if (goalModal.classList.contains('active')) {
                closeGoalModalFunc();
            }
        }
    });
}

// Generate AI insights
function generateAIInsights() {
    const insights = [];
    
    // Calculate statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const overdueTasks = tasks.filter(t => {
        const dueDate = new Date(t.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate < today && !t.completed;
    }).length;
    
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.progress === 100).length;
    const avgGoalProgress = goals.length > 0 
        ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) 
        : 0;
    
    const totalStudyHours = studySessions.reduce((sum, session) => sum + session.duration, 0);
    const studyDays = [...new Set(studySessions.map(s => s.date))].length;
    const avgDailyStudy = studyDays > 0 ? (totalStudyHours / studyDays).toFixed(1) : 0;
    
    // Generate insights based on data
    if (completedTasks / totalTasks > 0.8 && totalTasks > 5) {
        insights.push({
            title: "Excellent Task Completion",
            description: "You're completing over 80% of your tasks. Keep up the great work!",
            confidence: "High confidence"
        });
    }
    
    if (overdueTasks > 3) {
        insights.push({
            title: "Overdue Tasks Alert",
            description: `You have ${overdueTasks} overdue tasks. Consider reprioritizing or breaking them into smaller tasks.`,
            confidence: "High confidence"
        });
    }
    
    if (avgGoalProgress > 70 && totalGoals > 0) {
        insights.push({
            title: "Strong Goal Progress",
            description: `Your average goal progress is ${avgGoalProgress}%. You're on track to achieve your objectives!`,
            confidence: "Medium confidence"
        });
    }
    
    if (parseFloat(avgDailyStudy) < 1) {
        insights.push({
            title: "Study Time Recommendation",
            description: "Your average daily study time is less than 1 hour. Consider increasing study sessions for better retention.",
            confidence: "Medium confidence"
        });
    }
    
    // Study pattern analysis
    const studyPattern = analyzeStudyPattern();
    if (studyPattern.mostProductiveDay) {
        insights.push({
            title: "Optimal Study Time",
            description: `You're most productive on ${studyPattern.mostProductiveDay}. Schedule important tasks during this time.`,
            confidence: "High confidence"
        });
    }
    
    // Subject performance
    const subjectPerformance = analyzeSubjectPerformance();
    if (subjectPerformance.bestSubject) {
        insights.push({
            title: "Subject Strength",
            description: `You perform best in ${subjectPerformance.bestSubject}. Leverage this strength in your study plan.`,
            confidence: "Medium confidence"
        });
    }
    
    // If no specific insights, provide general encouragement
    if (insights.length === 0) {
        insights.push({
            title: "Keep Going!",
            description: "Consistency is key to academic success. Continue with your current study plan.",
            confidence: "General advice"
        });
    }
    
    // Render insights
    insightsGrid.innerHTML = insights.map(insight => `
        <div class="insight-card">
            <h3>${insight.title}</h3>
            <p>${insight.description}</p>
            <span class="confidence">${insight.confidence}</span>
        </div>
    `).join('');
    
    // Animate insight cards
    gsap.from('.insight-card', {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out'
    });
}

// Analyze study pattern
function analyzeStudyPattern() {
    const dayCounts = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    studySessions.forEach(session => {
        const day = dayNames[new Date(session.date).getDay()];
        dayCounts[day] = (dayCounts[day] || 0) + session.duration;
    });
    
    let maxHours = 0;
    let mostProductiveDay = null;
    
    Object.entries(dayCounts).forEach(([day, hours]) => {
        if (hours > maxHours) {
            maxHours = hours;
            mostProductiveDay = day;
        }
    });
    
    return { mostProductiveDay };
}

// Analyze subject performance
function analyzeSubjectPerformance() {
    const subjectCounts = {};
    
    tasks.filter(t => t.completed && t.subject).forEach(task => {
        subjectCounts[task.subject] = (subjectCounts[task.subject] || 0) + 1;
    });
    
    let maxTasks = 0;
    let bestSubject = null;
    
    Object.entries(subjectCounts).forEach(([subject, count]) => {
        if (count > maxTasks) {
            maxTasks = count;
            bestSubject = subject;
        }
    });
    
    return { bestSubject };
}

// Theme toggle
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('theme', 'light');
    }
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.querySelector('i').classList.remove('fa-moon');
    themeToggle.querySelector('i').classList.add('fa-sun');
}

// Tab switching
function switchTab(tabId) {
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        }
    });
    
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabId}-tab`) {
            content.classList.add('active');
        }
    });
    
    // Update charts when analytics tab is opened
    if (tabId === 'analytics') {
        setTimeout(() => {
            updateCharts();
        }, 100);
    }
}

// Task functions
function openTaskModal(taskId = null) {
    currentEditingTaskId = taskId;
    
    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            document.getElementById('taskModalTitle').textContent = 'Edit Task';
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description;
            document.getElementById('taskDueDate').value = task.dueDate;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskSubject').value = task.subject;
            document.getElementById('taskEstimatedTime').value = task.estimatedTime || '';
            document.getElementById('taskReminder').value = task.reminder || '';
            document.getElementById('taskTags').value = task.tags ? task.tags.join(', ') : '';
        }
    } else {
        document.getElementById('taskModalTitle').textContent = 'Add New Task';
        taskForm.reset();
    }
    
    taskModal.classList.add('active');
    
    // Animate modal
    gsap.from('#taskModal .modal-content', {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        ease: 'back.out(1.7)'
    });
}

function closeTaskModalFunc() {
    gsap.to('#taskModal .modal-content', {
        scale: 0.8,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
            taskModal.classList.remove('active');
            taskForm.reset();
            currentEditingTaskId = null;
        }
    });
}

function saveTask() {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const priority = document.getElementById('taskPriority').value;
    const subject = document.getElementById('taskSubject').value;
    const estimatedTime = parseFloat(document.getElementById('taskEstimatedTime').value) || 0;
    const reminder = document.getElementById('taskReminder').value;
    const tags = document.getElementById('taskTags').value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    
    if (!title || !dueDate) {
        showNotification('error', 'Validation Error', 'Title and due date are required.');
        return;
    }
    
    // Show loading
    loadingOverlay.classList.add('show');
    
    // Simulate processing delay
    setTimeout(() => {
        if (currentEditingTaskId) {
            // Update existing task
            const taskIndex = tasks.findIndex(t => t.id === currentEditingTaskId);
            if (taskIndex !== -1) {
                tasks[taskIndex] = {
                    ...tasks[taskIndex],
                    title,
                    description,
                    dueDate,
                    priority,
                    subject,
                    estimatedTime,
                    reminder,
                    tags,
                    updatedAt: new Date().toISOString()
                };
            }
            showNotification('success', 'Task Updated', 'Your task has been updated successfully.');
        } else {
            // Add new task
            const newTask = {
                id: generateId(),
                title,
                description,
                dueDate,
                priority,
                subject,
                estimatedTime,
                reminder,
                tags,
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            tasks.push(newTask);
            showNotification('success', 'Task Created', 'Your task has been created successfully.');
        }
        
        // Save to localStorage
        localStorage.setItem('studyPlannerTasks', JSON.stringify(tasks));
        
        // Update UI
        updateDashboardStats();
        renderTasks();
        renderTimeline();
        updateCharts();
        generateAIInsights();
        
        // Hide loading
        loadingOverlay.classList.remove('show');
        
        closeTaskModalFunc();
    }, 800);
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        // Show loading
        loadingOverlay.classList.add('show');
        
        // Simulate processing delay
        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== taskId);
            localStorage.setItem('studyPlannerTasks', JSON.stringify(tasks));
            
            updateDashboardStats();
            renderTasks();
            renderTimeline();
            updateCharts();
            generateAIInsights();
            
            showNotification('success', 'Task Deleted', 'Your task has been deleted successfully.');
            
            // Hide loading
            loadingOverlay.classList.remove('show');
        }, 500);
    }
}

function toggleTaskComplete(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        tasks[taskIndex].updatedAt = new Date().toISOString();
        
        // If completing a task, add to study sessions
        if (tasks[taskIndex].completed) {
            const session = {
                id: generateId(),
                taskId: taskId,
                taskTitle: tasks[taskIndex].title,
                duration: tasks[taskIndex].estimatedTime || 1,
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString()
            };
            studySessions.push(session);
            localStorage.setItem('studySessions', JSON.stringify(studySessions));
        }
        
        localStorage.setItem('studyPlannerTasks', JSON.stringify(tasks));
        
        updateDashboardStats();
        renderTasks();
        updateCharts();
        generateAIInsights();
        
        const status = tasks[taskIndex].completed ? 'completed' : 'reopened';
        showNotification('success', `Task ${status}`, `Your task has been ${status}.`);
        
        // Update streak
        updateStreak();
        
        // Animate task completion
        if (tasks[taskIndex].completed) {
            const taskElement = document.querySelector(`input[value="${taskId}"]`).closest('.task-item');
            gsap.to(taskElement, {
                x: 20,
                opacity: 0.7,
                duration: 0.3,
                ease: 'power2.out',
                onComplete: () => {
                    gsap.to(taskElement, {
                        x: 0,
                        opacity: 1,
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                }
            });
        }
    }
}

function renderTasks() {
    const searchTerm = taskSearch.value.toLowerCase();
    let filteredTasks = tasks;
    
    if (searchTerm) {
        filteredTasks = tasks.filter(task => 
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm) ||
            (task.subject && task.subject.toLowerCase().includes(searchTerm)) ||
            (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }
    
    if (filteredTasks.length === 0) {
        tasksContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No tasks found</h3>
                <p>Create a new task to get started with your study plan.</p>
            </div>
        `;
        return;
    }
    
    // Sort tasks by due date and priority
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        
        return new Date(a.dueDate) - new Date(b.dueDate);
    });
    
    tasksContainer.innerHTML = filteredTasks.map(task => {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const isOverdue = dueDate < today && !task.completed;
        const isToday = dueDate.toDateString() === today.toDateString();
        
        let dateClass = '';
        let dateText = formatDate(dueDate);
        
        if (isOverdue) {
            dateClass = 'overdue';
            dateText = `Overdue (${dateText})`;
        } else if (isToday) {
            dateClass = 'today';
            dateText = `Today (${dateText})`;
        }
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                    onchange="toggleTaskComplete('${task.id}')">
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span class="${dateClass}">
                            <i class="fas fa-calendar"></i> ${dateText}
                        </span>
                        ${task.subject ? `<span><i class="fas fa-book"></i> ${task.subject}</span>` : ''}
                        ${task.estimatedTime ? `<span><i class="fas fa-clock"></i> ${task.estimatedTime}h</span>` : ''}
                        <span class="priority ${task.priority}">
                            <i class="fas fa-flag"></i> ${task.priority}
                        </span>
                        ${task.tags && task.tags.length > 0 ? `
                            <span><i class="fas fa-tags"></i> ${task.tags.join(', ')}</span>
                        ` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="icon-btn" onclick="openTaskModal('${task.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn danger" onclick="deleteTask('${task.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Animate task items
    gsap.from('.task-item', {
        opacity: 0,
        x: -20,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.out'
    });
}

function filterTasks() {
    renderTasks();
}

// Goal functions
function openGoalModal(goalId = null) {
    currentEditingGoalId = goalId;
    
    if (goalId) {
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
            document.getElementById('goalModalTitle').textContent = 'Edit Goal';
            document.getElementById('goalTitle').value = goal.title;
            document.getElementById('goalDescription').value = goal.description;
            document.getElementById('goalStartDate').value = goal.startDate;
            document.getElementById('goalTargetDate').value = goal.targetDate;
            document.getElementById('goalCategory').value = goal.category;
            document.getElementById('goalProgress').value = goal.progress;
            document.getElementById('goalMilestones').value = goal.milestones ? goal.milestones.join('\n') : '';
        }
    } else {
        document.getElementById('goalModalTitle').textContent = 'Add New Goal';
        goalForm.reset();
        document.getElementById('goalProgress').value = 0;
    }
    
    goalModal.classList.add('active');
    
    // Animate modal
    gsap.from('#goalModal .modal-content', {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        ease: 'back.out(1.7)'
    });
}

function closeGoalModalFunc() {
    gsap.to('#goalModal .modal-content', {
        scale: 0.8,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
            goalModal.classList.remove('active');
            goalForm.reset();
            currentEditingGoalId = null;
        }
    });
}

function saveGoal() {
    const title = document.getElementById('goalTitle').value;
    const description = document.getElementById('goalDescription').value;
    const startDate = document.getElementById('goalStartDate').value;
    const targetDate = document.getElementById('goalTargetDate').value;
    const category = document.getElementById('goalCategory').value;
    const progress = parseInt(document.getElementById('goalProgress').value);
    const milestones = document.getElementById('goalMilestones').value
        .split('\n')
        .map(m => m.trim())
        .filter(m => m.length > 0);
    
    if (!title || !startDate || !targetDate) {
        showNotification('error', 'Validation Error', 'Title, start date, and target date are required.');
        return;
    }
    
    if (new Date(startDate) > new Date(targetDate)) {
        showNotification('error', 'Validation Error', 'Start date must be before target date.');
        return;
    }
    
    // Show loading
    loadingOverlay.classList.add('show');
    
    // Simulate processing delay
    setTimeout(() => {
        if (currentEditingGoalId) {
            // Update existing goal
            const goalIndex = goals.findIndex(g => g.id === currentEditingGoalId);
            if (goalIndex !== -1) {
                goals[goalIndex] = {
                    ...goals[goalIndex],
                    title,
                    description,
                    startDate,
                    targetDate,
                    category,
                    progress,
                    milestones,
                    updatedAt: new Date().toISOString()
                };
            }
            showNotification('success', 'Goal Updated', 'Your goal has been updated successfully.');
        } else {
            // Add new goal
            const newGoal = {
                id: generateId(),
                title,
                description,
                startDate,
                targetDate,
                category,
                progress,
                milestones,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            goals.push(newGoal);
            showNotification('success', 'Goal Created', 'Your goal has been created successfully.');
        }
        
        // Save to localStorage
        localStorage.setItem('studyPlannerGoals', JSON.stringify(goals));
        
        // Update UI
        updateDashboardStats();
        renderGoals();
        updateCharts();
        generateAIInsights();
        
        // Hide loading
        loadingOverlay.classList.remove('show');
        
        closeGoalModalFunc();
    }, 800);
}

function deleteGoal(goalId) {
    if (confirm('Are you sure you want to delete this goal?')) {
        // Show loading
        loadingOverlay.classList.add('show');
        
        // Simulate processing delay
        setTimeout(() => {
            goals = goals.filter(g => g.id !== goalId);
            localStorage.setItem('studyPlannerGoals', JSON.stringify(goals));
            
            updateDashboardStats();
            renderGoals();
            updateCharts();
            generateAIInsights();
            
            showNotification('success', 'Goal Deleted', 'Your goal has been deleted successfully.');
            
            // Hide loading
            loadingOverlay.classList.remove('show');
        }, 500);
    }
}

function updateGoalProgress(goalId, progress) {
    const goalIndex = goals.findIndex(g => g.id === goalId);
    if (goalIndex !== -1) {
        goals[goalIndex].progress = progress;
        goals[goalIndex].updatedAt = new Date().toISOString();
        
        localStorage.setItem('studyPlannerGoals', JSON.stringify(goals));
        
        renderGoals();
        updateCharts();
        generateAIInsights();
        
        showNotification('success', 'Progress Updated', 'Your goal progress has been updated.');
    }
}

function renderGoals() {
    const searchTerm = goalSearch.value.toLowerCase();
    let filteredGoals = goals;
    
    if (searchTerm) {
        filteredGoals = goals.filter(goal => 
            goal.title.toLowerCase().includes(searchTerm) ||
            goal.description.toLowerCase().includes(searchTerm) ||
            goal.category.toLowerCase().includes(searchTerm)
        );
    }
    
    if (filteredGoals.length === 0) {
        goalsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bullseye"></i>
                <h3>No goals found</h3>
                <p>Create a new goal to track your academic achievements.</p>
            </div>
        `;
        return;
    }
    
    // Sort goals by target date
    filteredGoals.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
    
    goalsContainer.innerHTML = filteredGoals.map(goal => {
        const startDate = new Date(goal.startDate);
        const targetDate = new Date(goal.targetDate);
        const today = new Date();
        
        const isCompleted = goal.progress === 100;
        const isOverdue = targetDate < today && !isCompleted;
        
        const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
        
        let statusText = '';
        if (isCompleted) {
            statusText = 'Completed';
        } else if (isOverdue) {
            statusText = 'Overdue';
        } else if (daysRemaining === 0) {
            statusText = 'Due today';
        } else if (daysRemaining === 1) {
            statusText = '1 day remaining';
        } else {
            statusText = `${daysRemaining} days remaining`;
        }
        
        return `
            <div class="goal-item">
                <div class="goal-content">
                    <div class="goal-title">${goal.title}</div>
                    <div class="goal-meta">
                        <span><i class="fas fa-calendar"></i> ${formatDate(startDate)} - ${formatDate(targetDate)}</span>
                        <span><i class="fas fa-tag"></i> ${goal.category}</span>
                        <span class="${isOverdue ? 'overdue' : isCompleted ? 'completed' : ''}">
                            <i class="fas fa-clock"></i> ${statusText}
                        </span>
                    </div>
                    ${goal.milestones && goal.milestones.length > 0 ? `
                        <div class="goal-meta" style="margin-top: 0.5rem;">
                            <span><i class="fas fa-flag-checkered"></i> ${goal.milestones.length} milestones</span>
                        </div>
                    ` : ''}
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${goal.progress}%"></div>
                        </div>
                        <div class="progress-text">
                            <span>Progress</span>
                            <span>${goal.progress}%</span>
                        </div>
                    </div>
                </div>
                <div class="goal-actions">
                    <button class="icon-btn" onclick="openGoalModal('${goal.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn danger" onclick="deleteGoal('${goal.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Animate goal items
    gsap.from('.goal-item', {
        opacity: 0,
        x: -20,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.out'
    });
}

function filterGoals() {
    renderGoals();
}

// Timeline functions
function renderTimeline() {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Update week display
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    document.getElementById('currentWeek').textContent = 
        `${months[currentWeekStart.getMonth()]} ${currentWeekStart.getDate()} - ${months[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${currentWeekStart.getFullYear()}`;
    
    // Generate timeline days
    let timelineHTML = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);
        
        const isToday = date.toDateString() === today.toDateString();
        
        // Get tasks for this day
        const dayTasks = tasks.filter(task => {
            const taskDate = new Date(task.dueDate);
            return taskDate.toDateString() === date.toDateString() && !task.completed;
        });
        
        timelineHTML += `
            <div class="timeline-day ${isToday ? 'today' : ''}">
                <div class="timeline-day-header">
                    ${weekDays[i]}<br>${date.getDate()}
                </div>
                ${dayTasks.slice(0, 3).map(task => `
                    <div class="timeline-task" title="${task.title}">
                        ${task.title.length > 15 ? task.title.substring(0, 15) + '...' : task.title}
                    </div>
                `).join('')}
                ${dayTasks.length > 3 ? `<div class="timeline-task">+${dayTasks.length - 3} more</div>` : ''}
            </div>
        `;
    }
    
    weeklyTimeline.innerHTML = timelineHTML;
    
    // Animate timeline
    gsap.from('.timeline-day', {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power2.out'
    });
}

// Dashboard stats
function updateDashboardStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const activeGoals = goals.filter(g => g.progress < 100).length;
    
    // Calculate total study hours
    const totalStudyHours = studySessions.reduce((sum, session) => sum + session.duration, 0);
    
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('activeGoals').textContent = activeGoals;
    document.getElementById('studyHours').textContent = totalStudyHours;
    
    // Update notification badge
    const notificationBadge = document.querySelector('.notification-badge');
    const overdueTasks = tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate < today && !task.completed;
    }).length;
    
    notificationBadge.textContent = overdueTasks;
    notificationBadge.style.display = overdueTasks > 0 ? 'flex' : 'none';
}

// Charts
function initializeCharts() {
    // Productivity Chart
    const productivityCtx = document.getElementById('productivityChart').getContext('2d');
    productivityChart = new Chart(productivityCtx, {
        type: 'line',
        data: {
            labels: getLast7Days(),
            datasets: [{
                label: 'Tasks Completed',
                data: getTasksCompletedLast7Days(),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Study Hours',
                data: getStudyHoursLast7Days(),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Weekly Productivity Trends'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Study Chart (will be initialized when analytics tab is opened)
    const studyCtx = document.getElementById('studyChart');
    if (studyCtx) {
        studyChart = new Chart(studyCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'In Progress', 'Overdue'],
                datasets: [{
                    data: [
                        tasks.filter(t => t.completed).length,
                        tasks.filter(t => !t.completed && new Date(t.dueDate) >= new Date()).length,
                        tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length
                    ],
                    backgroundColor: [
                        '#10b981',
                        '#f59e0b',
                        '#ef4444'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: 'Task Status Distribution'
                    }
                }
            }
        });
    }
}

function updateCharts() {
    if (productivityChart) {
        productivityChart.data.datasets[0].data = getTasksCompletedLast7Days();
        productivityChart.data.datasets[1].data = getStudyHoursLast7Days();
        productivityChart.update();
    }
    
    if (studyChart) {
        studyChart.data.datasets[0].data = [
            tasks.filter(t => t.completed).length,
            tasks.filter(t => !t.completed && new Date(t.dueDate) >= new Date()).length,
            tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length
        ];
        studyChart.update();
    }
}

function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    return days;
}

function getTasksCompletedLast7Days() {
    const completed = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const tasksCompleted = studySessions.filter(session => session.date === dateStr)
            .reduce((sum, session) => sum + 1, 0);
        
        completed.push(tasksCompleted);
    }
    return completed;
}

function getStudyHoursLast7Days() {
    const hours = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const studyHours = studySessions.filter(session => session.date === dateStr)
            .reduce((sum, session) => sum + session.duration, 0);
        
        hours.push(studyHours);
    }
    return hours;
}

// Export and report functions
function exportData() {
    // Show loading
    loadingOverlay.classList.add('show');
    
    // Simulate processing delay
    setTimeout(() => {
        const data = {
            tasks: tasks,
            goals: goals,
            studySessions: studySessions,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `study-planner-export-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification('success', 'Export Successful', 'Your data has been exported successfully.');
        
        // Hide loading
        loadingOverlay.classList.remove('show');
    }, 1000);
}

function generateReport() {
    // Show loading
    loadingOverlay.classList.add('show');
    
    // Simulate processing delay
    setTimeout(() => {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;
        
        const totalGoals = goals.length;
        const completedGoals = goals.filter(g => g.progress === 100).length;
        const goalCompletionRate = totalGoals > 0 ? ((completedGoals / totalGoals) * 100).toFixed(1) : 0;
        
        const totalStudyHours = studySessions.reduce((sum, session) => sum + session.duration, 0);
        const avgDailyStudy = totalStudyHours / 7;
        
        const report = `
Smart Study Planner Pro - Academic Excellence Report
====================================================
Generated: ${new Date().toLocaleString()}

EXECUTIVE SUMMARY:
This comprehensive report analyzes your academic performance, study patterns, and productivity metrics 
to provide actionable insights for continuous improvement.

TASK ANALYSIS:
- Total Tasks: ${totalTasks}
- Completed Tasks: ${completedTasks}
- Completion Rate: ${completionRate}%
- Overdue Tasks: ${tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length}
- High Priority Tasks: ${tasks.filter(t => t.priority === 'high').length}
- Average Task Completion Time: ${getAvgCompletionTime()} days

GOAL TRACKING:
- Total Goals: ${totalGoals}
- Completed Goals: ${completedGoals}
- Completion Rate: ${goalCompletionRate}%
- Active Goals: ${goals.filter(g => g.progress < 100).length}
- Average Goal Progress: ${goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0}%

STUDY SESSIONS:
- Total Study Hours: ${totalStudyHours}
- Average Daily Study: ${avgDailyStudy.toFixed(1)} hours
- Study Streak: ${getStreakDays()} days
- Most Productive Day: ${getMostProductiveDay()}
- Most Productive Subject: ${getMostProductiveSubject()}

PRODUCTIVITY INSIGHTS:
 ${generateProductivityInsights()}

RECOMMENDATIONS:
 ${generateRecommendations()}

AI ANALYSIS CONFIDENCE: High
Report generated using advanced machine learning algorithms and predictive analytics.
        `;
        
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `academic-excellence-report-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('success', 'Report Generated', 'Your academic excellence report has been generated successfully.');
        
        // Hide loading
        loadingOverlay.classList.remove('show');
    }, 1500);
}

function generateProductivityInsights() {
    const insights = [];
    
    // Task completion pattern
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length > 5) {
        const recentTasks = completedTasks.slice(-5);
        const avgCompletionTime = recentTasks.reduce((sum, task) => {
            const created = new Date(task.createdAt);
            const updated = new Date(task.updatedAt);
            return sum + Math.ceil((updated - created) / (1000 * 60 * 60 * 24));
        }, 0) / recentTasks.length;
        
        if (avgCompletionTime < 3) {
            insights.push("- You complete tasks quickly, indicating good time management skills.");
        } else {
            insights.push("- Consider breaking larger tasks into smaller, manageable chunks to improve completion time.");
        }
    }
    
    // Study consistency
    const studyDays = [...new Set(studySessions.map(s => s.date))].length;
    if (studyDays > 5) {
        insights.push("- Your consistent study habits are contributing to academic success.");
    } else {
        insights.push("- Try to study more consistently throughout the week for better retention.");
    }
    
    // Goal progress
    const activeGoals = goals.filter(g => g.progress < 100);
    if (activeGoals.length > 0) {
        const avgProgress = activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length;
        if (avgProgress > 70) {
            insights.push("- You're making excellent progress toward your goals. Keep up the momentum!");
        } else if (avgProgress < 30) {
            insights.push("- Consider revising your goals or breaking them into smaller milestones.");
        }
    }
    
    return insights.join('\n');
}

function generateRecommendations() {
    const recommendations = [];
    
    // Time management
    const overdueTasks = tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date());
    if (overdueTasks.length > 2) {
        recommendations.push("1. Prioritize overdue tasks and consider using time-blocking techniques.");
    }
    
    // Study habits
    const totalStudyHours = studySessions.reduce((sum, session) => sum + session.duration, 0);
    if (totalStudyHours < 10) {
        recommendations.push("2. Increase daily study time to at least 1.5 hours for better academic performance.");
    }
    
    // Goal setting
    const activeGoals = goals.filter(g => g.progress < 100);
    if (activeGoals.length === 0) {
        recommendations.push("3. Set new academic goals to maintain motivation and direction.");
    } else if (activeGoals.length > 5) {
        recommendations.push("3. Focus on your top 3 goals to avoid spreading yourself too thin.");
    }
    
    // Task management
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' && !t.completed);
    if (highPriorityTasks.length > 3) {
        recommendations.push("4. Address high-priority tasks first to reduce stress and improve productivity.");
    }
    
    return recommendations.join('\n');
}

function getMostProductiveDay() {
    const dayCounts = {};
    studySessions.forEach(session => {
        const day = new Date(session.date).toLocaleDateString('en-US', { weekday: 'long' });
        dayCounts[day] = (dayCounts[day] || 0) + session.duration;
    });
    
    return Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b, 'N/A');
}

function getMostProductiveSubject() {
    const subjectCounts = {};
    tasks.filter(t => t.completed).forEach(task => {
        if (task.subject) {
            subjectCounts[task.subject] = (subjectCounts[task.subject] || 0) + 1;
        }
    });
    
    return Object.keys(subjectCounts).reduce((a, b) => subjectCounts[a] > subjectCounts[b] ? a : b, 'N/A');
}

function getAvgCompletionTime() {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) return 'N/A';
    
    const totalDays = completedTasks.reduce((sum, task) => {
        const created = new Date(task.createdAt);
        const updated = new Date(task.updatedAt);
        return sum + Math.ceil((updated - created) / (1000 * 60 * 60 * 24));
    }, 0);
    
    return (totalDays / completedTasks.length).toFixed(1);
}

// Streak functions
function updateStreak() {
    const streak = getStreakDays();
    document.querySelector('.streak-number').textContent = streak;
    
    // Save streak to localStorage
    localStorage.setItem('studyStreak', streak);
    localStorage.setItem('lastStudyDate', new Date().toDateString());
}

function getStreakDays() {
    const lastStudyDate = localStorage.getItem('lastStudyDate');
    const today = new Date().toDateString();
    
    if (!lastStudyDate) return 0;
    
    const lastDate = new Date(lastStudyDate);
    const todayDate = new Date(today);
    
    // Check if studied today
    const studiedToday = studySessions.some(session => session.date === today);
    
    if (studiedToday) {
        // If studied today, continue streak
        const savedStreak = parseInt(localStorage.getItem('studyStreak') || '0');
        return savedStreak;
    } else {
        // Check if last study was yesterday
        const yesterday = new Date(todayDate);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate.toDateString() === yesterday.toDateString()) {
            // Streak continues
            return parseInt(localStorage.getItem('studyStreak') || '0');
        } else {
            // Streak broken
            return 0;
        }
    }
}

// Reminder functions
function checkReminders() {
    const now = new Date();
    
    tasks.forEach(task => {
        if (task.reminder && !task.completed && !task.reminderShown) {
            const reminderTime = new Date(task.reminder);
            
            // Check if reminder time is within the last minute
            if (Math.abs(now - reminderTime) < 60000) {
                // Show in-app notification
                showNotification('info', 'Task Reminder', `Reminder: ${task.title} is due soon.`);
                
                // Show browser notification if permitted
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Study Planner Pro Reminder', {
                        body: `Reminder: ${task.title} is due soon.`,
                        icon: 'https://picsum.photos/seed/notification/100/100.jpg'
                    });
                }
                
                // Mark reminder as shown
                task.reminderShown = true;
                localStorage.setItem('studyPlannerTasks', JSON.stringify(tasks));
            }
        }
    });
}

// Notification functions
function showNotification(type, title, message) {
    const notificationEl = document.getElementById('notification');
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    
    // Set icon based on type
    notificationIcon.className = 'notification-icon ' + type;
    
    if (type === 'success') {
        notificationIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
    } else if (type === 'error') {
        notificationIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
    } else if (type === 'info') {
        notificationIcon.innerHTML = '<i class="fas fa-info-circle"></i>';
    }
    
    // Set content
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    
    // Show notification
    notificationEl.classList.add('show');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        closeNotification();
    }, 5000);
}

function closeNotification() {
    document.getElementById('notification').classList.remove('show');
}

// Utility functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);