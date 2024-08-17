// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, signInAnonymously, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, push, set, get, update, remove, query, orderByChild, equalTo, limitToFirst, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDOkIghRKHFsP1WVbm_IzrnVjM2a0U62cs",
  authDomain: "expense-tracker-412b2.firebaseapp.com",
  databaseURL: "https://expense-tracker-412b2-default-rtdb.firebaseio.com",
  projectId: "expense-tracker-412b2",
  storageBucket: "expense-tracker-412b2.appspot.com",
  messagingSenderId: "802525395906",
  appId: "1:802525395906:web:fd6e26ab26388cfd59b45b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Global variables and constants
let currentUser = null;
let currentProjectId = '';
let currentUserRole = '';
let currentPage = 1;
const itemsPerPage = 10;

const ROLES = {
    ADMIN: 'admin',
    COLLABORATOR: 'collaborator',
    VIEWER: 'viewer'
};

// Hardcoded admin username
const ADMIN_USERNAME = 'fah44944';

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboard = document.getElementById('dashboard');
const logoutBtn = document.getElementById('logoutBtn');
const projectPage = document.getElementById('projectPage');
const projectsList = document.getElementById('projectsList');
const projectForm = document.getElementById('projectForm');
const saveProjectBtn = document.getElementById('saveProjectBtn');
const expenseTableBody = document.querySelector('#expenseTable tbody');
const expenseForm = document.getElementById('expenseForm');
const saveExpenseBtn = document.getElementById('saveExpenseBtn');
const addUserForm = document.getElementById('addUserForm');
const logContainer = document.getElementById('activityLogContainer');
const totalsElement = document.getElementById('totals');
const remainingElement = document.getElementById('remaining');
const loadingIndicator = document.getElementById('loadingIndicator');

// Ensure these functions are globally accessible
window.showDashboard = showDashboard;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.showExpenseForm = showExpenseForm;
window.saveExpense = saveExpense;
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
window.showProjectForm = showProjectForm;
window.saveProject = saveProject;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.viewProject = viewProject;
window.addUserToProject = addUserToProject;
window.exportProjectExpenses = exportProjectExpenses;

// Initialize the application
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;

        // Hardcode the admin check
        if (user.uid === ADMIN_USERNAME) {
            currentUserRole = ROLES.ADMIN;
            showDashboard();
        } else {
            findAndViewUserProject(user.uid);
        }
    } else {
        showLoginForm();
    }
});

function showDashboard() {
    loginSection.classList.add('hidden');
    dashboard.classList.remove('hidden');
    projectPage.classList.add('hidden');
    loadProjects();
}

function showLoginForm() {
    loginSection.classList.remove('hidden');
    dashboard.classList.add('hidden');
    projectPage.classList.add('hidden');
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;

    try {
        showLoading();
        const userCredential = await signInAnonymously(auth);
        currentUser = userCredential.user;

        console.log('User credential:', userCredential);

        // Hardcode the admin role check
        if (username === ADMIN_USERNAME) {
            currentUserRole = ROLES.ADMIN;
            currentUser.displayName = username;
            showDashboard();
        } else {
            currentUserRole = ROLES.COLLABORATOR; // Assume other users are collaborators
            findAndViewUserProject(username);
        }
    } catch (error) {
        handleFirebaseError(error, 'فشل تسجيل الدخول');
    } finally {
        hideLoading();
    }
}

async function handleLogout() {
    try {
        showLoading();
        await signOut(auth);
        currentUser = null;
        currentProjectId = '';
        currentUserRole = '';
        showLoginForm();
    } catch (error) {
        handleFirebaseError(error, 'فشل تسجيل الخروج');
    } finally {
        hideLoading();
    }
}

async function findAndViewUserProject(userId) {
    try {
        // Adjusted the query to correctly filter by user ID.
        const userProjectsQuery = query(ref(db, 'projects'), orderByChild(`users/${userId}`), equalTo(true));
        const projectsSnapshot = await get(userProjectsQuery);

        if (projectsSnapshot.exists()) {
            const projects = projectsSnapshot.val();
            const projectId = Object.keys(projects)[0]; // Get the first project ID for this user
            if (projectId) {
                viewProject(projectId);
            } else {
                throw new Error('لم يتم تعيين المستخدم لأي مشروع');
            }
        } else {
            throw new Error('لا توجد مشاريع مرتبطة بالمستخدم');
        }
    } catch (error) {
        handleFirebaseError(error, 'حدث خطأ أثناء محاولة تحميل المشروع المرتبط بالمستخدم');
        handleLogout();
    }
}

async function addUserToProject() {
    if (currentUserRole !== ROLES.ADMIN) {
        alert('ليس لديك صلاحية لإضافة مستخدم للمشروع');
        return;
    }

    const newUser = document.getElementById('newProjectUser').value;
    const newUserRole = document.getElementById('newProjectUserRole').value;

    if (!newUser) {
        alert('الرجاء إدخال اسم المستخدم');
        return;
    }

    try {
        showLoading();
        const projectSnapshot = await get(ref(db, `projects/${currentProjectId}`));
        if (projectSnapshot.exists()) {
            const project = projectSnapshot.val();
            if (!project.users) {
                project.users = [];
            }
            project.users.push(newUser);
            await update(ref(db, `projects/${currentProjectId}`), { users: project.users });

            await set(ref(db, `users/${newUser}`), { role: newUserRole });

            addUserForm.classList.add('hidden');
            alert('تمت إضافة المستخدم بنجاح');
            loadProjects();
            await logActivity('add_user', `Added user ${newUser} to project ${currentProjectId}`);
        }
    } catch (error) {
        handleFirebaseError(error, 'فشل في إضافة المستخدم');
    } finally {
        hideLoading();
    }
}

function showAddUserForm() {
    addUserForm.classList.remove('hidden');
}

function showLoading() {
    loadingIndicator.classList.remove('hidden');
}

function hideLoading() {
    loadingIndicator.classList.add('hidden');
}

function handleFirebaseError(error, customMessage = 'حدث خطأ') {
    console.error('Error during operation:', error);
    let errorMessage = customMessage;
    if (error.code) {
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'المستخدم غير موجود. يرجى التحقق من اسم المستخدم.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'كلمة المرور غير صحيحة. حاول مرة أخرى.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'محاولات تسجيل دخول فاشلة كثيرة. يرجى المحاولة لاحقًا.';
                break;
            case 'permission-denied':
                errorMessage = 'ليس لديك الصلاحية لإجراء هذه العملية.';
                break;
            default:
                errorMessage = `Error code: ${error.code}`;
        }
    }
    alert(errorMessage);
}

async function logActivity(action, details) {
    if (currentUserRole !== ROLES.ADMIN) return;

    try {
        const newLogRef = push(ref(db, 'activityLog'));
        await set(newLogRef, {
            timestamp: serverTimestamp(),
            user: currentUser.displayName,
            action: action,
            details: details
        });
    } catch (error) {
        console.error("Error adding activity log: ", error);
    }
}

// Project Management Functions

async function loadProjects() {
    if (currentUserRole !== ROLES.ADMIN) return;

    showLoading();
    projectsList.innerHTML = '';

    try {
        const projectsSnapshot = await get(query(ref(db, 'projects'), orderByChild('name'), limitToFirst(itemsPerPage)));
        const projects = [];
        projectsSnapshot.forEach((childSnapshot) => {
            projects.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });

        if (projects.length === 0) {
            projectsList.innerHTML = '<p>لا توجد مشاريع حالياً</p>';
        } else {
            projects.forEach(project => {
                const projectElement = createProjectElement(project);
                projectsList.appendChild(projectElement);
            });
        }

    } catch (error) {
        handleFirebaseError(error, 'فشل في تحميل المشاريع');
    } finally {
        hideLoading();
    }
}

function createProjectElement(project) {
    const projectElement = document.createElement('div');
    projectElement.classList.add('project-block');
    projectElement.innerHTML = `
        <h4>${sanitizeInput(project.name)}</h4>
        <p>المستخدمون: ${project.users ? project.users.map(sanitizeInput).join(', ') : 'لا يوجد مستخدمين'}</p>
        <button onclick="editProject('${project.id}')">تعديل</button>
        <button onclick="deleteProject('${project.id}')">حذف</button>
        <button onclick="viewProject('${project.id}')">عرض</button>
        <button onclick="exportProjectExpenses('${project.id}', '${project.name}')" class="export-btn">تصدير تقرير القيود</button>
    `;
    return projectElement;
}

function showProjectForm() {
    projectForm.classList.remove('hidden');
    document.getElementById('projectName').value = '';
    document.getElementById('projectUser').value = '';
    document.getElementById('projectUserRole').value = 'collaborator';
    saveProjectBtn.onclick = saveProject;
}

async function saveProject() {
    if (currentUserRole !== ROLES.ADMIN) {
        alert('ليس لديك صلاحية لإنشاء مشروع جديد');
        return;
    }

    if (!validateForm('projectForm')) {
        return;
    }

    const projectName = sanitizeInput(document.getElementById('projectName').value);
    const projectUser = sanitizeInput(document.getElementById('projectUser').value);
    const projectUserRole = sanitizeInput(document.getElementById('projectUserRole').value);

    try {
        showLoading();
        const newProjectRef = push(ref(db, 'projects'));
        const newProject = {
            name: projectName,
            users: projectUser ? [projectUser] : []
        };

        await set(newProjectRef, newProject);

        if (projectUser) {
            await set(ref(db, `users/${projectUser}`), { role: projectUserRole });
        }

        projectForm.classList.add('hidden');
        await logActivity('create_project', `Created project ${projectName}`);
        loadProjects();
    } catch (error) {
        handleFirebaseError(error, 'فشل في حفظ المشروع');
    } finally {
        hideLoading();
    }
}

async function editProject(projectId) {
    if (currentUserRole !== ROLES.ADMIN) {
        alert('ليس لديك صلاحية لتعديل المشروع');
        return;
    }

    try {
        showLoading();
        const projectSnapshot = await get(ref(db, `projects/${projectId}`));
        if (projectSnapshot.exists()) {
            const project = projectSnapshot.val();
            document.getElementById('projectName').value = project.name;
            document.getElementById('projectUser').value = project.users && project.users.length > 0 ? project.users[0] : '';
            document.getElementById('projectUserRole').value = 'collaborator';
            projectForm.classList.remove('hidden');
            saveProjectBtn.onclick = () => updateProject(projectId);
        }
    } catch (error) {
        handleFirebaseError(error, 'فشل في تحميل بيانات المشروع');
    } finally {
        hideLoading();
    }
}

async function updateProject(projectId) {
    if (!validateForm('projectForm')) {
        return;
    }

    const updatedName = sanitizeInput(document.getElementById('projectName').value);
    const updatedUser = sanitizeInput(document.getElementById('projectUser').value);
    const updatedRole = sanitizeInput(document.getElementById('projectUserRole').value);

    try {
        showLoading();
        const updatedProject = {
            name: updatedName,
            users: updatedUser ? [updatedUser] : []
        };
        await update(ref(db, `projects/${projectId}`), updatedProject);
        if (updatedUser) {
            await set(ref(db, `users/${updatedUser}`), { role: updatedRole });
        }
        projectForm.classList.add('hidden');
        await logActivity('update_project', `Updated project ${updatedName}`);
        loadProjects();
    } catch (error) {
        handleFirebaseError(error, 'فشل في تحديث المشروع');
    } finally {
        hideLoading();
    }
}

async function deleteProject(projectId) {
    if (currentUserRole !== ROLES.ADMIN) {
        alert('ليس لديك صلاحية لحذف المشروع');
        return;
    }

    if (confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
        try {
            showLoading();
            await remove(ref(db, `projects/${projectId}`));
            await logActivity('delete_project', `Deleted project ${projectId}`);
            loadProjects();
        } catch (error) {
            handleFirebaseError(error, 'فشل في حذف المشروع');
        } finally {
            hideLoading();
        }
    }
}

async function loadExpenses(projectId) {
    showLoading();
    expenseTableBody.innerHTML = '';

    try {
        const expensesSnapshot = await get(query(ref(db, `projects/${projectId}/expenses`), orderByChild('date'), limitToFirst(itemsPerPage)));
        const expenses = [];
        expensesSnapshot.forEach((childSnapshot) => {
            expenses.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });

        if (expenses.length === 0) {
            expenseTableBody.innerHTML = '<p>لا توجد قيود لهذا المشروع</p>';
        } else {
            expenses.forEach(expense => {
                const row = expenseTableBody.insertRow();
                row.innerHTML = `
                    <td>${sanitizeInput(expense.description)}</td>
                    <td>${formatCurrency(expense.amount, expense.type)}</td>
                    <td>${formatDate(expense.date)}</td>
                    <td>${expense.type === 'expense' ? 'مصروف' : 'إيداع'}</td>
                    <td>${sanitizeInput(expense.paymentMethod)}</td>
                    <td>${sanitizeInput(expense.addedBy)}</td>
                    ${currentUserRole !== ROLES.VIEWER ? `
                        <td>
                            <button onclick="editExpense('${projectId}', '${expense.id}')" class="edit-btn">تعديل</button>
                            <button onclick="deleteExpense('${projectId}', '${expense.id}')" class="delete-btn">حذف</button>
                        </td>
                    ` : ''}
                `;
            });
        }

        updateProjectSummary(projectId);

    } catch (error) {
        handleFirebaseError(error, 'فشل في تحميل القيود');
    } finally {
        hideLoading();
    }
}

async function saveExpense() {
    if (currentUserRole === ROLES.VIEWER) {
        alert('ليس لديك صلاحية لإضافة أو تعديل القيود');
        return;
    }

    if (!validateForm('expenseForm')) {
        return;
    }

    const expenseDescription = sanitizeInput(document.getElementById('expenseDescription').value);
    const expenseAmount = parseFloat(document.getElementById('expenseAmount').value);
    const expenseDate = sanitizeInput(document.getElementById('expenseDate').value);
    const expenseType = sanitizeInput(document.getElementById('expenseType').value);
    const paymentMethod = sanitizeInput(document.getElementById('paymentMethod').value);
    const expenseVAT = document.getElementById('expenseVAT').value ? parseFloat(document.getElementById('expenseVAT').value) : null;

    try {
        showLoading();
        const newExpense = {
            description: expenseDescription,
            amount: expenseAmount,
            date: expenseDate,
            type: expenseType,
            paymentMethod: paymentMethod,
            vat: expenseVAT,
            addedBy: currentUser.displayName
        };

        const newExpenseRef = push(ref(db, `projects/${currentProjectId}/expenses`));
        await set(newExpenseRef, newExpense);

        expenseForm.classList.add('hidden');
        await logActivity('add_expense', `Added expense ${newExpenseRef.key} to project ${currentProjectId}`);
        loadExpenses(currentProjectId);
    } catch (error) {
        handleFirebaseError(error, 'فشل في حفظ القيد');
    } finally {
        hideLoading();
    }
}

async function editExpense(projectId, expenseId) {
    if (currentUserRole === ROLES.VIEWER) {
        alert('ليس لديك صلاحية لتعديل القيود');
        return;
    }

    try {
        showLoading();
        const expenseSnapshot = await get(ref(db, `projects/${projectId}/expenses/${expenseId}`));
        if (expenseSnapshot.exists()) {
            const expense = expenseSnapshot.val();
            document.getElementById('expenseDescription').value = expense.description;
            document.getElementById('expenseAmount').value = expense.amount;
            document.getElementById('expenseDate').value = expense.date;
            document.getElementById('expenseType').value = expense.type;
            document.getElementById('paymentMethod').value = expense.paymentMethod;
            document.getElementById('expenseVAT').value = expense.vat || '';

            expenseForm.classList.remove('hidden');
            saveExpenseBtn.onclick = () => updateExpense(projectId, expenseId);
        }
    } catch (error) {
        handleFirebaseError(error, 'فشل في تحميل بيانات القيد');
    } finally {
        hideLoading();
    }
}

async function updateExpense(projectId, expenseId) {
    if (!validateForm('expenseForm')) {
        return;
    }

    const updatedExpense = {
        description: sanitizeInput(document.getElementById('expenseDescription').value),
        amount: parseFloat(document.getElementById('expenseAmount').value),
        date: sanitizeInput(document.getElementById('expenseDate').value),
        type: sanitizeInput(document.getElementById('expenseType').value),
        paymentMethod: sanitizeInput(document.getElementById('paymentMethod').value),
        vat: document.getElementById('expenseVAT').value ? parseFloat(document.getElementById('expenseVAT').value) : null,
        addedBy: currentUser.displayName
    };

    try {
        showLoading();
        await update(ref(db, `projects/${projectId}/expenses/${expenseId}`), updatedExpense);
        expenseForm.classList.add('hidden');
        await logActivity('update_expense', `Updated expense ${expenseId} in project ${projectId}`);
        loadExpenses(projectId);
    } catch (error) {
        handleFirebaseError(error, 'فشل في تحديث القيد');
    } finally {
        hideLoading();
    }
}

async function deleteExpense(projectId, expenseId) {
    if (currentUserRole === ROLES.VIEWER) {
        alert('ليس لديك صلاحية لحذف القيود');
        return;
    }

    if (confirm('هل أنت متأكد من حذف هذا القيد؟')) {
        try {
            showLoading();
            await remove(ref(db, `projects/${projectId}/expenses/${expenseId}`));
            await logActivity('delete_expense', `Deleted expense ${expenseId} from project ${projectId}`);
            loadExpenses(projectId);
        } catch (error) {
            handleFirebaseError(error, 'فشل في حذف القيد');
        } finally {
            hideLoading();
        }
    }
}

function updateProjectSummary(projectId) {
    get(ref(db, `projects/${projectId}/expenses`)).then(snapshot => {
        let totalExpenses = 0;
        let totalDeposits = 0;

        snapshot.forEach(childSnapshot => {
            const expense = childSnapshot.val();
            if (expense.type === 'expense') {
                totalExpenses += expense.amount + (expense.vat || 0);
            } else {
                totalDeposits += expense.amount;
            }
        });

        const remainingBalance = totalDeposits - totalExpenses;

        if (totalsElement) {
            totalsElement.innerHTML = `
                إجمالي الإيداعات: ${formatCurrency(totalDeposits, 'deposit')}<br>
                إجمالي المصروفات: ${formatCurrency(totalExpenses, 'expense')}
            `;
        }

        if (remainingElement) {
            remainingElement.innerHTML = `الرصيد المتبقي: ${formatCurrency(remainingBalance, remainingBalance >= 0 ? 'deposit' : 'expense')}`;
        }
    });
}

function showExpenseForm() {
    expenseForm.classList.remove('hidden');
    document.getElementById('expenseDescription').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseDate').value = '';
    document.getElementById('expenseType').value = 'expense';
    document.getElementById('paymentMethod').value = '';
    document.getElementById('expenseVAT').value = '';
    saveExpenseBtn.onclick = saveExpense;
}

async function viewProject(projectId) {
    try {
        showLoading();
        currentProjectId = projectId;
        const projectSnapshot = await get(ref(db, `projects/${projectId}`));
        if (projectSnapshot.exists()) {
            const project = projectSnapshot.val();
            document.getElementById('projectTitle').textContent = project.name;
            projectPage.classList.remove('hidden');
            dashboard.classList.add('hidden');
            loadExpenses(projectId);
        } else {
            throw new Error('Project not found');
        }
    } catch (error) {
        handleFirebaseError(error, 'Failed to load project');
    } finally {
        hideLoading();
    }
}

function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return input;
    }
    let sanitized = input.replace(/<[^>]*>/g, '');
    sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    return sanitized.trim();
}

const arabicNumberFormatter = new Intl.NumberFormat('ar-SA');

function formatNumber(number) {
    return arabicNumberFormatter.format(number);
}

function formatCurrency(amount, type) {
    const formattedAmount = arabicNumberFormatter.format(Math.abs(amount));
    const className = type === 'expense' ? 'negative-amount' : 'positive-amount';
    const sign = type === 'expense' ? '-' : '+';
    return `<span class="${className}">${sign} ${formattedAmount} ر.س</span>`;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ar-SA', options);
}

function validateForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input, select');
    let isValid = true;

    inputs.forEach(input => {
        if (input.hasAttribute('required') && !input.value.trim()) {
            isValid = false;
            showError(input, 'هذا الحقل مطلوب');
        } else if (input.type === 'number' && input.value && isNaN(input.value)) {
            isValid = false;
            showError(input, 'يرجى إدخال رقم صحيح');
        } else {
            hideError(input);
        }
    });

    return isValid;
}

function showError(input, message) {
    const errorElement = input.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
        errorElement.textContent = message;
    } else {
        const error = document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        input.parentNode.insertBefore(error, input.nextSibling);
    }
    input.classList.add('error');
}

function hideError(input) {
    const errorElement = input.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
        errorElement.remove();
    }
    input.classList.remove('error');
}

function convertToCSV(expenses) {
    const headers = ['التاريخ', 'الوصف', 'المبلغ', 'النوع', 'طريقة الدفع', 'ضريبة القيمة المضافة', 'أضيف بواسطة'];
    let csvContent = headers.join(',') + '\n';

    expenses.forEach(expense => {
        const row = [
            expense.date,
            `"${expense.description.replace(/"/g, '""')}"`,
            expense.amount,
            expense.type === 'expense' ? 'مصروف' : 'إيداع',
            expense.paymentMethod,
            expense.vat || '',
            expense.addedBy
        ];
        csvContent += row.join(',') + '\n';
    });

    return csvContent;
}

function downloadCSV(content, fileName) {
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + content);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function exportProjectExpenses(projectId, projectName) {
    if (currentUserRole !== ROLES.ADMIN) {
        alert('فقط المسؤول يمكنه تصدير بيانات المشروع');
        return;
    }

    showLoading();

    try {
        const expensesSnapshot = await get(ref(db, `projects/${projectId}/expenses`));
        const expenses = [];
        expensesSnapshot.forEach(childSnapshot => {
            expenses.push(childSnapshot.val());
        });

        if (expenses.length === 0) {
            alert('لا توجد مصروفات لتصديرها');
            hideLoading();
            return;
        }

        const csvContent = convertToCSV(expenses);
        const fileName = `${projectName}_expenses_${new Date().toISOString().split('T')[0]}.csv`;
        downloadCSV(csvContent, fileName);

        await logActivity('export_expenses', `Exported expenses for project ${projectName}`);

    } catch (error) {
        handleFirebaseError(error, 'فشل في تصدير المصروفات');
    } finally {
        hideLoading();
    }
}

async function viewActivityLog() {
    if (currentUserRole !== ROLES.ADMIN) {
        alert('فقط المسؤول يمكنه عرض سجل النشاط');
        return;
    }

    try {
        showLoading();
        const logSnapshot = await get(query(ref(db, 'activityLog'), orderByChild('timestamp'), limitToFirst(100)));
        let logHTML = '<h2>سجل النشاط</h2><ul>';

        logSnapshot.forEach(childSnapshot => {
            const log = childSnapshot.val();
            logHTML += `<li>${formatDate(new Date(log.timestamp))} - ${log.user}: ${log.action} - ${log.details}</li>`;
        });

        logHTML += '</ul>';

        logContainer.innerHTML = logHTML;
        logContainer.style.display = 'block';
    } catch (error) {
        handleFirebaseError(error, 'فشل في تحميل سجل النشاط');
    } finally {
        hideLoading();
    }
}
