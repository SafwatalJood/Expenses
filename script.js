// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, signInAnonymously, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    limit, 
    serverTimestamp,
    getCountFromServer,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDOkIghRKHFsP1WVbm_IzrnVjM2a0U62cs",
  authDomain: "expense-tracker-412b2.firebaseapp.com",
  projectId: "expense-tracker-412b2",
  storageBucket: "expense-tracker-412b2.appspot.com",
  messagingSenderId: "802525395906",
  appId: "1:802525395906:web:fd6e26ab26388cfd59b45b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let currentUser = null;
let currentProjectId = '';
let currentUserRole = '';
let currentPage = 1;
const itemsPerPage = 10;
const cache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Constants
const ROLES = {
  ADMIN: 'admin',
  COLLABORATOR: 'collaborator',
  VIEWER: 'viewer'
};

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
const loadingIndicator = document.getElementById('loadingIndicator');
const projectSearch = document.getElementById('projectSearch');
const paginationElement = document.getElementById('pagination');
const logContainer = document.getElementById('activityLogContainer');
const viewLogBtn = document.getElementById('viewLogBtn');

// Event listeners
document.addEventListener('DOMContentLoaded', initializeApp);
loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
addProjectBtn.addEventListener('click', showProjectForm);
saveProjectBtn.addEventListener('click', saveProject);
addExpenseBtn.addEventListener('click', showExpenseForm);
saveExpenseBtn.addEventListener('click', saveExpense);
backToDashboardBtn.addEventListener('click', showDashboard);
addUserBtn.addEventListener('click', showAddUserForm);
saveNewUserBtn.addEventListener('click', addUserToProject);
projectSearch.addEventListener('input', handleProjectSearch);
viewLogBtn.addEventListener('click', viewActivityLog);

function initializeApp() {
  // Check if user is already logged in
  auth.onAuthStateChanged((user) => {
      if (user) {
          currentUser = user;
          getDoc(doc(db, "users", user.uid)).then(docSnapshot => {
              if (docSnapshot.exists()) {
                  currentUserRole = docSnapshot.data().role;
                  if (currentUserRole === ROLES.ADMIN) {
                      showDashboard();
                  } else {
                      findAndViewUserProject(user.uid);
                  }
              }
          });
      } else {
          showLoginForm();
      }
  });
}

function showLoginForm() {
  loginSection.classList.remove('hidden');
  dashboard.classList.add('hidden');
  projectPage.classList.add('hidden');
}

// Authentication and User Management

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;

  try {
      showLoading();
      // For simplicity, we're using signInAnonymously. In a real app, you'd use proper authentication.
      const userCredential = await signInAnonymously(auth);
      currentUser = userCredential.user;
      
      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, "users", username));
      if (userDoc.exists()) {
          currentUserRole = userDoc.data().role;
          currentUser.displayName = username; // Set display name for logging purposes

          if (currentUserRole === ROLES.ADMIN) {
              showDashboard();
          } else {
              findAndViewUserProject(username);
          }
      } else {
          throw new Error('المستخدم غير موجود');
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
      const userProjects = await getDocs(query(collection(db, "projects"), where("users", "array-contains", userId)));
      if (!userProjects.empty) {
          viewProject(userProjects.docs[0].id);
      } else {
          throw new Error('لم يتم تعيين المستخدم لأي مشروع');
      }
  } catch (error) {
      handleFirebaseError(error);
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

// Utility functions for loading and error handling

function showLoading() {
  loadingIndicator.classList.remove('hidden');
}

function hideLoading() {
  loadingIndicator.classList.add('hidden');
}

function handleFirebaseError(error, customMessage = 'حدث خطأ') {
  console.error(error);
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
          // Add more cases as needed
      }
  }
  alert(errorMessage);
}

async function logActivity(action, details) {
  if (currentUserRole !== ROLES.ADMIN) return; // Only admins can see the log

  try {
      await addDoc(collection(db, "activityLog"), {
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
      const projects = await getCachedData('projects', async () => {
          const projectsSnapshot = await getDocs(query(
              collection(db, "projects"),
              orderBy("name"),
              limit(itemsPerPage)
          ));
          return projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      });

      if (projects.length === 0) {
          projectsList.innerHTML = '<p>لا توجد مشاريع حالياً</p>';
      } else {
          projects.forEach(project => {
              const projectElement = createProjectElement(project);
              projectsList.appendChild(projectElement);
          });
      }

      const totalCount = await getCountFromServer(collection(db, "projects"));
      const totalPages = Math.ceil(totalCount.data().count / itemsPerPage);
      displayPagination(totalPages, loadProjects);
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
      const newProject = {
          name: projectName,
          users: projectUser ? [projectUser] : []
      };

      const docRef = await addDoc(collection(db, "projects"), newProject);

      if (projectUser) {
          const userRef = doc(db, "users", projectUser);
          await setDoc(userRef, { role: projectUserRole }, { merge: true });
      }

      delete cache['projects']; // Invalidate projects cache
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
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      if (projectDoc.exists()) {
          const project = projectDoc.data();
          document.getElementById('projectName').value = project.name;
          document.getElementById('projectUser').value = project.users && project.users.length > 0 ? project.users[0] : '';
          document.getElementById('projectUserRole').value = 'collaborator'; // Default role
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
      await updateDoc(doc(db, "projects", projectId), updatedProject);
      if (updatedUser) {
          const userRef = doc(db, "users", updatedUser);
          await setDoc(userRef, { role: updatedRole }, { merge: true });
      }
      delete cache['projects']; // Invalidate projects cache
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
          await deleteDoc(doc(db, "projects", projectId));
          delete cache['projects']; // Invalidate projects cache
          await logActivity('delete_project', `Deleted project ${projectId}`);
          loadProjects();
      } catch (error) {
          handleFirebaseError(error, 'فشل في حذف المشروع');
      } finally {
          hideLoading();
      }
  }
}

function handleProjectSearch() {
  const searchTerm = projectSearch.value.toLowerCase();
  const projectElements = document.querySelectorAll('.project-block');
  projectElements.forEach(element => {
      const projectName = element.querySelector('h4').textContent.toLowerCase();
      if (projectName.includes(searchTerm)) {
          element.style.display = '';
      } else {
          element.style.display = 'none';
      }
  });
}

function showProjectForm() {
  projectForm.classList.remove('hidden');
  document.getElementById('projectName').value = '';
  document.getElementById('projectUser').value = '';
  document.getElementById('projectUserRole').value = 'collaborator';
  saveProjectBtn.onclick = saveProject;
}

// Pagination function
function displayPagination(totalPages, loadFunction) {
  paginationElement.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
      const pageButton = document.createElement('button');
      pageButton.textContent = i;
      pageButton.addEventListener('click', () => {
          currentPage = i;
          loadFunction();
      });
      if (i === currentPage) {
          pageButton.classList.add('active');
      }
      paginationElement.appendChild(pageButton);
  }
}

// Expense Management Functions

async function loadExpenses(projectId) {
  showLoading();
  expenseTableBody.innerHTML = '';
  
  try {
      const expenses = await getCachedData(`expenses_${projectId}`, async () => {
          const expensesSnapshot = await getDocs(query(
              collection(db, `projects/${projectId}/expenses`),
              orderBy("date", "desc"),
              limit(itemsPerPage)
          ));
          return expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      });

      if (expenses.length === 0) {
          expensesList.innerHTML = '<p>لا توجد قيود لهذا المشروع</p>';
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

      const totalCount = await getCountFromServer(collection(db, `projects/${projectId}/expenses`));
      const totalPages = Math.ceil(totalCount.data().count / itemsPerPage);
      displayPagination(totalPages, () => loadExpenses(projectId));
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

      const expensesRef = collection(db, `projects/${currentProjectId}/expenses`);
      const docRef = await addDoc(expensesRef, newExpense);

      delete cache[`expenses_${currentProjectId}`]; // Invalidate expenses cache for this project
      expenseForm.classList.add('hidden');
      await logActivity('add_expense', `Added expense ${docRef.id} to project ${currentProjectId}`);
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
      const expenseDoc = await getDoc(doc(db, `projects/${projectId}/expenses`, expenseId));
      if (expenseDoc.exists()) {
          const expense = expenseDoc.data();
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
      await updateDoc(doc(db, `projects/${projectId}/expenses`, expenseId), updatedExpense);
      delete cache[`expenses_${projectId}`]; // Invalidate expenses cache for this project
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
          await deleteDoc(doc(db, `projects/${projectId}/expenses`, expenseId));
          delete cache[`expenses_${projectId}`]; // Invalidate expenses cache for this project
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
  getCachedData(`expenses_${projectId}`, async () => {
      const expensesSnapshot = await getDocs(collection(db, `projects/${projectId}/expenses`));
      return expensesSnapshot.docs.map(doc => doc.data());
  }).then(expenses => {
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

// Utility Functions

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

async function getCachedData(key, fetchFunction) {
  const now = Date.now();
  if (cache[key] && now - cache[key].timestamp < CACHE_DURATION) {
      return cache[key].data;
  }

  const data = await fetchFunction();
  cache[key] = { data, timestamp: now };
  return data;
}

// Data Export Functionality

function convertToCSV(expenses) {
  const headers = ['التاريخ', 'الوصف', 'المبلغ', 'النوع', 'طريقة الدفع', 'ضريبة القيمة المضافة', 'أضيف بواسطة'];
  let csvContent = headers.join(',') + '\n';

  expenses.forEach(expense => {
      const row = [
          expense.date,
          `"${expense.description.replace(/"/g, '""')}"`, // Escape quotes in description
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
      const expensesSnapshot = await getDocs(collection(db, `projects/${projectId}/expenses`));
      const expenses = expensesSnapshot.docs.map(doc => doc.data());

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

// View Activity Log (for admin only)
async function viewActivityLog() {
  if (currentUserRole !== ROLES.ADMIN) {
      alert('فقط المسؤول يمكنه عرض سجل النشاط');
      return;
  }

  try {
      showLoading();
      const logSnapshot = await getDocs(query(collection(db, "activityLog"), orderBy("timestamp", "desc"), limit(100)));
      let logHTML = '<h2>سجل النشاط</h2><ul>';

      logSnapshot.forEach(doc => {
          const log = doc.data();
          logHTML += `<li>${formatDate(log.timestamp.toDate())} - ${log.user}: ${log.action} - ${log.details}</li>`;
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

// Initialize the application
initializeApp();
