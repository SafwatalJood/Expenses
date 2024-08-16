// Firebase initialization
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Initialize Firebase services
const auth = getAuth();
const db = getFirestore();

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
const actionsColumn = document.getElementById('actionsColumn');

// Global variables
let currentUser = null;
let currentProjectId = '';
let currentUserRole = '';

// Functions
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value; // You need to add a password field in your HTML

    try {
        const userCredential = await signInWithEmailAndPassword(auth, username, password);
        currentUser = userCredential.user;
        
        // Get user role from Firestore
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        currentUserRole = userDoc.data().role;

        if (currentUserRole === 'admin') {
            showDashboard();
        } else {
            const userProjects = await getDocs(query(collection(db, "projects"), where("users", "array-contains", currentUser.uid)));
            if (!userProjects.empty) {
                viewProject(userProjects.docs[0].id);
            } else {
                alert('لم يتم تعيين المستخدم لأي مشروع');
            }
        }
    } catch (error) {
        console.error("Error logging in: ", error);
        alert('فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.');
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        currentUser = null;
        currentProjectId = '';
        currentUserRole = '';
        loginSection.classList.remove('hidden');
        dashboard.classList.add('hidden');
        projectPage.classList.add('hidden');
    } catch (error) {
        console.error("Error signing out: ", error);
    }
}

async function loadProjects() {
    if (currentUserRole !== 'admin') return;

    projectsList.innerHTML = '';
    const projectsSnapshot = await getDocs(collection(db, "projects"));

    if (projectsSnapshot.empty) {
        projectsList.innerHTML = '<p>لا توجد مشاريع حالياً</p>';
    } else {
        projectsSnapshot.forEach(doc => {
            const project = doc.data();
            const projectElement = document.createElement('div');
            projectElement.classList.add('project-block');
            projectElement.innerHTML = `
                <h4>${project.name}</h4>
                <p>المستخدمون: ${project.users ? project.users.join(', ') : 'لا يوجد مستخدمين'}</p>
                <button onclick="editProject('${doc.id}')">تعديل</button>
                <button onclick="deleteProject('${doc.id}')">حذف</button>
                <button onclick="viewProject('${doc.id}')">عرض</button>
            `;
            projectsList.appendChild(projectElement);
        });
    }
}

async function saveProject() {
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

    try {
        const newProject = {
            name: projectName,
            users: projectUser ? [projectUser] : []
        };

        const docRef = await addDoc(collection(db, "projects"), newProject);

        if (projectUser) {
            // Add user to users collection if not exists
            const userRef = doc(db, "users", projectUser);
            await setDoc(userRef, { role: projectUserRole }, { merge: true });
        }

        projectForm.classList.add('hidden');
        loadProjects();
    } catch (error) {
        console.error("Error saving project: ", error);
        alert('حدث خطأ أثناء حفظ المشروع');
    }
}

async function editProject(projectId) {
    console.log('Editing project:', projectId);
    if (currentUserRole !== 'admin') {
        alert('ليس لديك صلاحية لتعديل المشروع');
        return;
    }
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (projectDoc.exists()) {
        const project = projectDoc.data();
        document.getElementById('projectName').value = project.name;
        if (project.users && project.users.length > 0) {
            document.getElementById('projectUser').value = project.users[0];
            document.getElementById('projectUserRole').value = 'collaborator'; // Assuming default role
        } else {
            document.getElementById('projectUser').value = '';
            document.getElementById('projectUserRole').value = 'collaborator';
        }
        projectForm.classList.remove('hidden');
        saveProjectBtn.onclick = async function() {
            const updatedName = document.getElementById('projectName').value;
            const updatedUser = document.getElementById('projectUser').value;
            const updatedRole = document.getElementById('projectUserRole').value;
            
            const updatedProject = {
                name: updatedName,
                users: updatedUser ? [updatedUser] : []
            };
            await updateDoc(doc(db, "projects", projectId), updatedProject);
            if (updatedUser) {
                const userRef = doc(db, "users", updatedUser);
                await setDoc(userRef, { role: updatedRole }, { merge: true });
            }
            projectForm.classList.add('hidden');
            loadProjects();
        };
    }
}

async function deleteProject(projectId) {
    console.log('Deleting project:', projectId);
    if (currentUserRole !== 'admin') {
        alert('ليس لديك صلاحية لحذف المشروع');
        return;
    }
    if (confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
        await deleteDoc(doc(db, "projects", projectId));
        loadProjects();
        console.log('Project deleted successfully');
    }
}

async function viewProject(projectId) {
    console.log('Viewing project:', projectId);
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (projectDoc.exists()) {
        const project = projectDoc.data();
        currentProjectId = projectId;
        dashboard.classList.add('hidden');
        loginSection.classList.add('hidden');
        projectPage.classList.remove('hidden');
        document.getElementById('projectTitle').textContent = project.name;
        loadExpenses(projectId);
        updateProjectSummary(projectId);
        
        // Show/hide buttons and actions column based on user role
        if (currentUserRole === 'collaborator' || currentUserRole === 'admin') {
            addExpenseBtn.classList.remove('hidden');
        } else {
            addExpenseBtn.classList.add('hidden');
        }

        if (currentUserRole === 'admin') {
            addUserBtn.classList.remove('hidden');
            backToDashboardBtn.classList.remove('hidden');
            actionsColumn.classList.remove('hidden');
        } else {
            addUserBtn.classList.add('hidden');
            backToDashboardBtn.classList.add('hidden');
            actionsColumn.classList.add('hidden');
        }
    }
}

async function loadExpenses(projectId) {
    expenseTableBody.innerHTML = '';
    const expensesSnapshot = await getDocs(collection(db, `projects/${projectId}/expenses`));

    if (expensesSnapshot.empty) {
        expensesList.innerHTML = '<p>لا توجد مصروفات لهذا المشروع</p>';
    } else {
        expensesSnapshot.forEach(expenseDoc => {
            const expense = expenseDoc.data();
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
                        <button onclick="editExpense('${projectId}', '${expenseDoc.id}')">تعديل</button>
                        <button onclick="deleteExpense('${projectId}', '${expenseDoc.id}')">حذف</button>
                    </td>
                ` : ''}
            `;
        });
    }

    updateProjectSummary(projectId);
}

async function saveExpense() {
    console.log('Attempting to save expense');
    if (currentUserRole !== 'admin' && currentUserRole !== 'collaborator') {
        alert('ليس لديك صلاحية لإضافة مصروف');
        return;
    }
    
    const formElements = [
        {id: 'expenseDescription', name: 'الوصف'},
        {id: 'expenseAmount', name: 'المبلغ'},
        {id: 'expenseDate', name: 'التاريخ'},
        {id: 'expenseType', name: 'النوع'},
        {id: 'paymentMethod', name: 'طريقة الدفع'},
        {id: 'expenseVAT', name: 'ضريبة القيمة المضافة'}
    ];

    const missingElements = [];
    const elementValues = {};

    formElements.forEach(element => {
        const el = document.getElementById(element.id);
        if (!el) {
            missingElements.push(element.name);
        } else {
            elementValues[element.id] = el.value;
        }
    });

    if (missingElements.length > 0) {
        console.error('Missing form elements:', missingElements.join(', '));
        alert(`حدث خطأ في النموذج. العناصر المفقودة: ${missingElements.join(', ')}`);
        return;
    }

    console.log('Form element values:', elementValues);

    if (!elementValues.expenseDescription || !elementValues.expenseAmount || !elementValues.expenseDate) {
        alert('الرجاء إدخال جميع البيانات المطلوبة');
        return;
    }

    const expensesRef = collection(db, `projects/${currentProjectId}/expenses`);

    if (editingExpenseId) {
        // Edit existing expense
        await updateDoc(doc(expensesRef, editingExpenseId), {
            description: elementValues.expenseDescription,
            amount: parseFloat(elementValues.expenseAmount),
            date: elementValues.expenseDate,
            type: elementValues.expenseType,
            paymentMethod: elementValues.paymentMethod,
            vat: elementValues.expenseVAT ? parseFloat(elementValues.expenseVAT) : null,
            addedBy: currentUser.uid
        });
        console.log('Expense edited successfully');
        editingExpenseId = null; // Reset the editing ID
    } else {
        // Add new expense
        await addDoc(expensesRef, {
            description: elementValues.expenseDescription,
            amount: parseFloat(elementValues.expenseAmount),
            date: elementValues.expenseDate,
            type: elementValues.expenseType,
            paymentMethod: elementValues.paymentMethod,
            vat: elementValues.expenseVAT ? parseFloat(elementValues.expenseVAT) : null,
            addedBy: currentUser.uid
        });
        console.log('Expense saved successfully');
    }

    expenseForm.classList.add('hidden');
    loadExpenses(currentProjectId);
}

async function editExpense(projectId, expenseId) {
    console.log('Editing expense:', expenseId);
    const expenseDoc = await getDoc(doc(db, `projects/${projectId}/expenses`, expenseId));
    if (expenseDoc.exists()) {
        const expense = expenseDoc.data();
        // Load the expense details into the form
        document.getElementById('expenseDescription').value = expense.description;
        document.getElementById('expenseAmount').value = expense.amount;
        document.getElementById('expenseDate').value = expense.date;
        document.getElementById('expenseType').value = expense.type;
        document.getElementById('paymentMethod').value = expense.paymentMethod;
        document.getElementById('expenseVAT').value = expense.vat || '';

        // Show the form and set the editing ID
        expenseForm.classList.remove('hidden');
        editingExpenseId = expenseId;
    } else {
        console.error('Expense not found');
    }
}

function updateProjectSummary(projectId) {
    const expensesRef = collection(db, `projects/${projectId}/expenses`);
    let totalExpenses = 0;
    let totalDeposits = 0;

    getDocs(expensesRef).then((expensesSnapshot) => {
        expensesSnapshot.forEach(expenseDoc => {
            const expense = expenseDoc.data();
            if (expense.type === 'expense') {
                totalExpenses += expense.amount + (expense.vat || 0);
            } else {
                totalDeposits += expense.amount;
            }
        });

        const remainingBalance = totalDeposits - totalExpenses;

        if (totalsElement) {
            totalsElement.innerHTML = `إجمالي الإيداعات: ${totalDeposits.toFixed(2)} ر.س<br>إجمالي المصروفات: ${totalExpenses.toFixed(2)} ر.س`;
        } else {
            console.error('totalsElement not found');
        }

        if (remainingElement) {
            remainingElement.innerHTML = `الرصيد المتبقي: ${remainingBalance.toFixed(2)} ر.س`;
        } else {
            console.error('remainingElement not found');
        }
    });
}

async function addUserToProject() {
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

    const projectDoc = await getDoc(doc(db, "projects", currentProjectId));
    if (projectDoc.exists()) {
        const project = projectDoc.data();
        if (!project.users) {
            project.users = [];
        }
        project.users.push(newUser);
        await updateDoc(doc(db, "projects", currentProjectId), { users: project.users });

        const userRef = doc(db, "users", newUser);
        await setDoc(userRef, { role: newUserRole }, { merge: true });

        if (addUserForm) {
            addUserForm.classList.add('hidden');
        } else {
            console.error('addUserForm element not found');
        }

        alert('تمت إضافة المستخدم بنجاح');
        loadProjects();  // Refresh the project list to show the new user
    }
}

// Initialize the app
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        getDoc(doc(db, "users", user.uid)).then(docSnapshot => {
            if (docSnapshot.exists()) {
                currentUserRole = docSnapshot.data().role;
                if (currentUserRole === 'admin') {
                    showDashboard();
                } else {
                    // Find and view the user's project
                    getDocs(query(collection(db, "projects"), where("users", "array-contains", user.uid)))
                        .then(querySnapshot => {
                            if (!querySnapshot.empty) {
                                viewProject(querySnapshot.docs[0].id);
                            } else {
                                alert('لم يتم تعيين المستخدم لأي مشروع');
                                handleLogout();
                            }
                        });
                }
            }
        });
    } else {
        loginSection.classList.remove('hidden');
        dashboard.classList.add('hidden');
        projectPage.classList.add('hidden');
    }
});

// Event listeners and other initialization code
document.addEventListener('DOMContentLoaded', () => {
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Add a logout button on all pages
    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'تسجيل الخروج';
    logoutButton.classList.add('logout-btn');
    logoutButton.addEventListener('click', handleLogout);
    document.body.prepend(logoutButton);  // Add the button at the top of the body
});
