// DOM Elements
const loginForm = document.getElementById('loginForm');
const loginSection = document.getElementById('loginSection');
const dashboard = document.getElementById('dashboard');
const logoutBtn = document.getElementById('logoutBtn');
const projectsList = document.getElementById('projectsList');
const addProjectBtn = document.getElementById('addProjectBtn');
const projectForm = document.getElementById('projectForm');
const saveProjectBtn = document.getElementById('saveProjectBtn');
const projectPage = document.getElementById('projectPage');
const expenseTableBody = document.querySelector('#expenseTable tbody');
const expensesList = document.getElementById('expensesList');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const expenseForm = document.getElementById('expenseForm');
const saveExpenseBtn = document.getElementById('saveExpenseBtn');
const backToDashboardBtn = document.getElementById('backToDashboardBtn');
const addUserBtn = document.getElementById('addUserBtn');
const addUserForm = document.getElementById('addUserForm');
const saveNewUserBtn = document.getElementById('saveNewUserBtn');
const totalsElement = document.getElementById('totals');
const remainingElement = document.getElementById('remaining');

// Global variables
let currentUser = '';
let currentProjectId = '';
let currentUserRole = '';
let expenses = [];

// Functions
function handleLogin(e) {
    e.preventDefault();
    console.log('Login attempt');
    const username = document.getElementById('username').value;
    console.log('Username:', username);

    if (username === 'fah4494') {
        console.log('Admin login successful');
        currentUser = username;
        currentUserRole = 'admin';
        localStorage.setItem('currentUser', username);
        localStorage.setItem('currentUserRole', 'admin');
        showDashboard();
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || {};

    if (users[username]) {
        console.log('User login successful');
        currentUser = username;
        localStorage.setItem('currentUser', username);
        const projects = JSON.parse(localStorage.getItem('projects')) || [];
        const userProject = projects.find(project => project.users && project.users.some(user => user.name === username));
        if (userProject) {
            currentProjectId = userProject.id;
            currentUserRole = userProject.users.find(user => user.name === username).role;
            localStorage.setItem('currentUserRole', currentUserRole);
            viewProject(userProject.id);
        } else {
            console.log('User not assigned to any project');
            alert('لم يتم تعيين المستخدم لأي مشروع');
        }
    } else {
        console.log('Invalid username');
        alert('اسم المستخدم غير صحيح');
    }
}

function showDashboard() {
    loginSection.classList.add('hidden');
    projectPage.classList.add('hidden');
    dashboard.classList.remove('hidden');
    loadProjects();
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserRole');
    currentUser = '';
    currentProjectId = '';
    currentUserRole = '';
    dashboard.classList.add('hidden');
    projectPage.classList.add('hidden');
    loginSection.classList.remove('hidden');
    document.getElementById('username').value = '';
}

function loadProjects() {
    if (currentUserRole !== 'admin') {
        return;
    }
    projectsList.innerHTML = '';
    const projects = JSON.parse(localStorage.getItem('projects')) || [];

    if (projects.length === 0) {
        projectsList.innerHTML = '<p>لا توجد مشاريع حالياً</p>';
    } else {
        projects.forEach(project => {
            const projectElement = document.createElement('div');
            const usersInfo = project.users ? project.users.map(user => `${user.name} (${user.role === 'collaborator' ? 'متعاون' : 'مراقب'})`).join(', ') : 'لا يوجد مستخدمين';
            projectElement.innerHTML = `
                <h4>${project.name}</h4>
                <p>المستخدمون: ${usersInfo}</p>
                <button onclick="editProject('${project.id}')">تعديل</button>
                <button onclick="deleteProject('${project.id}')">حذف</button>
                <button onclick="viewProject('${project.id}')">عرض</button>
            `;
            projectsList.appendChild(projectElement);
        });
    }
}

// ... (rest of the functions remain the same)

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    currentUser = localStorage.getItem('currentUser');
    currentUserRole = localStorage.getItem('currentUserRole');
    console.log('Current user:', currentUser);
    console.log('Current user role:', currentUserRole);
    if (currentUser) {
        loginSection.classList.add('hidden');
        if (currentUserRole === 'admin') {
            console.log('Showing dashboard for admin');
            showDashboard();
        } else {
            console.log('Attempting to view project for non-admin user');
            const projects = JSON.parse(localStorage.getItem('projects')) || [];
            const userProject = projects.find(project => project.users && project.users.some(user => user.name === currentUser));
            if (userProject) {
                viewProject(userProject.id);
            } else {
                console.log('User not assigned to any project');
                alert('لم يتم تعيين المستخدم لأي مشروع');
                handleLogout();
            }
        }
    }
});

// Event Listeners
if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}
if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
}
if (addProjectBtn) {
    addProjectBtn.addEventListener('click', () => projectForm.classList.remove('hidden'));
}
if (saveProjectBtn) {
    saveProjectBtn.addEventListener('click', saveProject);
}
if (addExpenseBtn) {
    addExpenseBtn.addEventListener('click', () => expenseForm.classList.remove('hidden'));
}
if (saveExpenseBtn) {
    saveExpenseBtn.addEventListener('click', saveExpense);
}
if (backToDashboardBtn) {
    backToDashboardBtn.addEventListener('click', showDashboard);
}
if (addUserBtn) {
    addUserBtn.addEventListener('click', () => addUserForm.classList.remove('hidden'));
}
if (saveNewUserBtn) {
    saveNewUserBtn.addEventListener('click', addUserToProject);
}
