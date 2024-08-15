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

function saveProject() {
    console.log('Saving project');
    if (currentUserRole !== 'admin') {
        alert('ليس لديك صلاحية لإنشاء مشروع جديد');
        return;
    }
    const projectName = document.getElementById('projectName').value;
    const projectUser = document.getElementById('projectUser').value;
    const projectUserRole = document.getElementById('projectUserRole').value;

    if (!projectName) {
        alert('الرجاء إدخال اسم المشروع');
        return;
    }

    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const newProject = {
        id: Date.now().toString(),
        name: projectName,
        users: []
    };

    if (projectUser) {
        newProject.users.push({name: projectUser, role: projectUserRole});
        // Add user to users list
        const users = JSON.parse(localStorage.getItem('users')) || {};
        users[projectUser] = true;
        users['fah4494'] = true;  // Always ensure 'fah4494' is in the users list
        localStorage.setItem('users', JSON.stringify(users));
    }

    projects.push(newProject);
    localStorage.setItem('projects', JSON.stringify(projects));

    projectForm.classList.add('hidden');
    loadProjects();
    console.log('Project saved successfully');
}

function editProject(projectId) {
    console.log('Editing project:', projectId);
    if (currentUserRole !== 'admin') {
        alert('ليس لديك صلاحية لتعديل المشروع');
        return;
    }
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const project = projects.find(p => p.id === projectId);
    if (project) {
        document.getElementById('projectName').value = project.name;
        
        if (project.users && project.users.length > 0) {
            document.getElementById('projectUser').value = project.users[0].name;
            document.getElementById('projectUserRole').value = project.users[0].role;
        } else {
            document.getElementById('projectUser').value = '';
            document.getElementById('projectUserRole').value = 'collaborator';
        }
        
        projectForm.classList.remove('hidden');
        saveProjectBtn.onclick = function() {
            project.name = document.getElementById('projectName').value;
            const updatedUser = document.getElementById('projectUser').value;
            const updatedRole = document.getElementById('projectUserRole').value;
            
            if (updatedUser) {
                if (!project.users) {
                    project.users = [];
                }
                if (project.users.length > 0) {
                    project.users[0] = {name: updatedUser, role: updatedRole};
                } else {
                    project.users.push({name: updatedUser, role: updatedRole});
                }
                
                // Update users list
                const users = JSON.parse(localStorage.getItem('users')) || {};
                users[updatedUser] = true;
                localStorage.setItem('users', JSON.stringify(users));
            }
            
            localStorage.setItem('projects', JSON.stringify(projects));
            projectForm.classList.add('hidden');
            loadProjects();
            console.log('Project updated successfully');
        };
    }
}

function deleteProject(projectId) {
    console.log('Deleting project:', projectId);
    if (currentUserRole !== 'admin') {
        alert('ليس لديك صلاحية لحذف المشروع');
        return;
    }
    if (confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
        let projects = JSON.parse(localStorage.getItem('projects')) || [];
        projects = projects.filter(p => p.id !== projectId);
        localStorage.setItem('projects', JSON.stringify(projects));
        localStorage.removeItem(`expenses_${projectId}`);
        loadProjects();
        console.log('Project deleted successfully');
    }
}

function viewProject(projectId) {
    console.log('Viewing project:', projectId);
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const project = projects.find(p => p.id === projectId);
    if (project) {
        currentProjectId = projectId;
        dashboard.classList.add('hidden');
        loginSection.classList.add('hidden');
        projectPage.classList.remove('hidden');
        document.getElementById('projectTitle').textContent = project.name;
        loadExpenses(projectId);
        updateProjectSummary(projectId);
        
        // Show/hide buttons based on user role
        if (currentUserRole === 'collaborator') {
            addExpenseBtn.classList.remove('hidden');
            addUserBtn.classList.add('hidden');
        } else if (currentUserRole === 'supervisor' || currentUserRole === 'watcher') {
            addExpenseBtn.classList.add('hidden');
            addUserBtn.classList.add('hidden');
        } else if (currentUserRole === 'admin') {
            addExpenseBtn.classList.remove('hidden');
            addUserBtn.classList.remove('hidden');
        }
        
        if (currentUserRole === 'admin') {
            backToDashboardBtn.classList.remove('hidden');
        } else {
            backToDashboardBtn.classList.add('hidden');
        }
    }
}

function loadExpenses(projectId) {
    expenseTableBody.innerHTML = '';
    const expenses = JSON.parse(localStorage.getItem(`expenses_${projectId}`)) || [];

    if (expenses.length === 0) {
        expensesList.innerHTML = '<p>لا توجد مصروفات لهذا المشروع</p>';
    } else {
        expenses.forEach(expense => {
            const row = expenseTableBody.insertRow();
            const amountClass = expense.type === 'expense' ? 'negative' : 'positive';
            const amountSign = expense.type === 'expense' ? '-' : '+';

            row.innerHTML = `
                <td>${expense.description}</td>
                <td class="expense-amount ${amountClass}">${amountSign}${expense.amount}</td>
                <td>${expense.date}</td>
                <td>${expense.type === 'expense' ? 'مصروف' : 'إيداع'}</td>
                <td>${expense.paymentMethod}</td>
                <td>${expense.addedBy}</td>
                ${currentUserRole === 'admin' ? `
                    <td>
                        <button onclick="editExpense('${projectId}', '${expense.id}')">تعديل</button>
                        <button onclick="deleteExpense('${projectId}', '${expense.id}')">حذف</button>
                    </td>
                ` : ''}
            `;
        });
    }

    updateProjectSummary(projectId);
}

function saveExpense() {
    if (currentUserRole !== 'admin' && currentUserRole !== 'collaborator') {
        alert('ليس لديك صلاحية لإضافة مصروف');
        return;
    }
    const description = document.getElementById('expenseDescription').value;
    const amount = document.getElementById('expenseAmount').value;
    const date = document.getElementById('expenseDate').value;
    const type = document.getElementById('expenseType').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const vat = document.getElementById('expenseVAT').value;

    if (!description || !amount || !date) {
        alert('الرجاء إدخال جميع بيانات المصروف');
        return;
    }

    const expenses = JSON.parse(localStorage.getItem(`expenses_${currentProjectId}`)) || [];
    const newExpense = {
        id: Date.now().toString(),
        description,
        amount: parseFloat(amount),
        date,
        type,
        paymentMethod,
        vat: vat ? parseFloat(vat) : null,
        addedBy: currentUser
    };
    expenses.push(newExpense);
    localStorage.setItem(`expenses_${currentProjectId}`, JSON.stringify(expenses));

    expenseForm.classList.add('hidden');
    loadExpenses(currentProjectId);
}

function updateProjectSummary(projectId) {
    const expenses = JSON.parse(localStorage.getItem(`expenses_${projectId}`)) || [];
    let totalExpenses = 0;
    let totalDeposits = 0;

    expenses.forEach(expense => {
        if (expense.type === 'expense') {
            totalExpenses += expense.amount + (expense.vat || 0);
        } else {
            totalDeposits += expense.amount;
        }
    });

    const remainingBalance = totalDeposits - totalExpenses;

    totalsElement.innerHTML = `إجمالي الإيداعات: ${totalDeposits.toFixed(2)} ر.س<br>إجمالي المصروفات: ${totalExpenses.toFixed(2)} ر.س`;
    remainingElement.innerHTML = `الرصيد المتبقي: ${remainingBalance.toFixed(2)} ر.س`;
}

function addUserToProject() {
    if (currentUserRole !== 'admin') {
        alert('ليس لديك صلاحية لإضافة مستخدم للمشروع');
        return;
    }
    const newUser = document.getElementById('newProjectUser').value;
    const newUserRole = document.getElementById('newProjectUserRole').value;

    if (!newUser) {
        alert('الرجاء إدخال اسم المستخدم');
        return;
    }

    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const project = projects.find(p => p.id === currentProjectId);

    if (project) {
        if (!project.users) {
            project.users = [];
        }
        project.users.push({name: newUser, role: newUserRole});
        localStorage.setItem('projects', JSON.stringify(projects));

        // Add user to users list
        const users = JSON.parse(localStorage.getItem('users')) || {};
        users[newUser] = true;
        localStorage.setItem('users', JSON.stringify(users));

        addUserForm.classList.add('hidden');
        alert('تمت إضافة المستخدم بنجاح');
        loadProjects();  // Refresh the project list to show the new user
    }
}

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
