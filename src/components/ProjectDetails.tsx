import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useUserRole } from '../hooks/useUserRole';
import { ARABIC_TEXTS, formatCurrency, formatDate } from '../constants/arabic';

interface Expense {
  id: string;
  description: string;
  amount: number;
  vat: number;
  totalAmount: number;
  type: 'expense' | 'deposit';
  date: string;
  addedBy: string;
  receiptUrl?: string;
}

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    vat: 0,
    type: 'expense' as 'expense' | 'deposit',
    date: new Date().toISOString().split('T')[0],
    receipt: null as File | null,
  });
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const userRole = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProject = async () => {
      if (id) {
        try {
          const docRef = doc(db, 'projects', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProject({ id: docSnap.id, ...docSnap.data() });
          } else {
            setError(ARABIC_TEXTS.PROJECT_NOT_FOUND);
          }
        } catch (err) {
          setError(ARABIC_TEXTS.ERROR_FETCHING_PROJECT);
          console.error(err);
        }
      }
    };

    fetchProject();
    if (id) {
      fetchExpenses();
    }
  }, [id]);

  const fetchExpenses = async () => {
    if (!id) return;

    try {
      const q = query(collection(db, 'projects', id, 'expenses'), orderBy('date', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
        setExpenses(expensesData);
        calculateTotals(expensesData);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setError(ARABIC_TEXTS.ERROR_FETCHING_EXPENSES);
    }
  };

  const calculateTotals = (expensesData: Expense[]) => {
    const { totalExp, totalDep } = expensesData.reduce((acc, expense) => {
      if (expense.type === 'expense') {
        acc.totalExp += expense.totalAmount;
      } else {
        acc.totalDep += expense.totalAmount;
      }
      return acc;
    }, { totalExp: 0, totalDep: 0 });

    setTotalExpenses(totalExp);
    setTotalDeposits(totalDep);
    setLoading(false);
  };

  const recalculateTotals = async () => {
    const q = query(collection(db, 'projects', id!, 'expenses'), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    const expensesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
    calculateTotals(expensesData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;

    try {
      let receiptUrl = '';
      if (newExpense.receipt) {
        const storageRef = ref(storage, `receipts/${id}/${newExpense.receipt.name}`);
        await uploadBytes(storageRef, newExpense.receipt);
        receiptUrl = await getDownloadURL(storageRef);
      }

      const amount = Number(newExpense.amount) || 0;
      const vat = Number(newExpense.vat) || 0;
      const totalAmount = amount + vat;

      const expenseData = {
        description: newExpense.description,
        amount: amount,
        vat: vat,
        totalAmount: totalAmount,
        type: newExpense.type,
        date: newExpense.date,
        addedBy: user.email,
        createdAt: serverTimestamp(),
        receiptUrl
      };

      if (editingExpense) {
        await updateDoc(doc(db, 'projects', id, 'expenses', editingExpense.id), expenseData);
      } else {
        await addDoc(collection(db, 'projects', id, 'expenses'), expenseData);
      }

      await recalculateTotals();

      setNewExpense({
        description: '',
        amount: 0,
        vat: 0,
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        receipt: null,
      });
      setEditingExpense(null);
    } catch (error) {
      console.error("Error handling expense:", error);
      setError(ARABIC_TEXTS.ERROR_HANDLING_EXPENSE);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setNewExpense({
      description: expense.description,
      amount: expense.amount,
      vat: expense.vat,
      type: expense.type,
      date: expense.date,
      receipt: null,
    });
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!id || !user) return;

    if (window.confirm(ARABIC_TEXTS.CONFIRM_DELETE_EXPENSE)) {
      try {
        await deleteDoc(doc(db, 'projects', id, 'expenses', expenseId));
        await recalculateTotals();
      } catch (error) {
        console.error("Error deleting expense:", error);
        setError(ARABIC_TEXTS.ERROR_DELETING_EXPENSE);
      }
    }
  };

  const handleDeleteProject = async () => {
    if (window.confirm(ARABIC_TEXTS.CONFIRM_DELETE_PROJECT)) {
      try {
        await deleteDoc(doc(db, 'projects', id!));
        navigate('/home');
      } catch (error) {
        console.error("Error deleting project:", error);
        setError(ARABIC_TEXTS.ERROR_DELETING_PROJECT);
      }
    }
  };

  const exportProjectReport = () => {
    const headers = [
      ARABIC_TEXTS.DATE,
      ARABIC_TEXTS.DESCRIPTION,
      ARABIC_TEXTS.AMOUNT,
      ARABIC_TEXTS.TYPE,
      ARABIC_TEXTS.ADDED_BY,
      ARABIC_TEXTS.RECEIPT,
      ARABIC_TEXTS.ACTIONS,
    ];
    const csvContent = [
      headers.join(','),
      ...expenses.map(expense => [
        formatDate(expense.date), // Using Gregorian date format
        expense.description,
        formatCurrency(expense.totalAmount), // Showing total amount (including VAT if applicable)
        expense.type === 'expense' ? ARABIC_TEXTS.EXPENSE : ARABIC_TEXTS.DEPOSIT,
        expense.addedBy,
        expense.receiptUrl ? ARABIC_TEXTS.VIEW_RECEIPT : '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${project.name}_report.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) return <div className="loading">{ARABIC_TEXTS.LOADING}</div>;
  if (error) return <div className="error text-center text-red-500 p-4">{error}</div>;
  if (!project) return <div className="not-found">{ARABIC_TEXTS.PROJECT_NOT_FOUND}</div>;

  return (
    <div className="project-details p-4 rtl">
      <h1 className="text-2xl font-bold mb-4">{project.name}</h1>
      <p className="mb-6">{project.description}</p>
      {userRole === 'admin' && (
        <div className="mb-4">
          <button onClick={handleDeleteProject} className="bg-red-500 text-white px-4 py-2 rounded mr-2 hover:bg-red-600">
            {ARABIC_TEXTS.DELETE_PROJECT}
          </button>
          <button onClick={exportProjectReport} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            {ARABIC_TEXTS.EXPORT_REPORT}
          </button>
        </div>
      )}

      <div className="expense-table-container overflow-x-auto mb-6">
        <table className="expense-table w-full">
          <thead>
            <tr>
              <th>{ARABIC_TEXTS.DATE}</th>
              <th>{ARABIC_TEXTS.DESCRIPTION}</th>
              <th>{ARABIC_TEXTS.AMOUNT}</th>
              <th>{ARABIC_TEXTS.TYPE}</th>
              <th>{ARABIC_TEXTS.ADDED_BY}</th>
              <th>{ARABIC_TEXTS.RECEIPT}</th>
              {userRole === 'admin' && <th>{ARABIC_TEXTS.ACTIONS}</th>}
            </tr>
          </thead>
          <tbody>
            {expenses.map(expense => (
              <tr key={expense.id}>
                <td>{formatDate(expense.date)}</td>
                <td>{expense.description}</td>
                <td className={expense.type === 'expense' ? 'negative-amount' : 'positive-amount'}>
                  {formatCurrency(expense.totalAmount)} {expense.vat ? 'شامل الضريبة' : ''}
                </td>
                <td>{expense.type === 'expense' ? ARABIC_TEXTS.EXPENSE : ARABIC_TEXTS.DEPOSIT}</td>
                <td>{expense.addedBy}</td>
                <td>
                  {expense.receiptUrl && (
                    <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      {ARABIC_TEXTS.VIEW_RECEIPT}
                    </a>
                  )}
                </td>
                {userRole === 'admin' && (
                  <td>
                    <button onClick={() => handleEditExpense(expense)} className="bg-blue-500 text-white px-2 py-1 rounded text-sm mr-2 hover:bg-blue-600">
                      {ARABIC_TEXTS.EDIT}
                    </button>
                    <button onClick={() => handleDeleteExpense(expense.id)} className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">
                      {ARABIC_TEXTS.DELETE}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="totals mb-6">
        <p>{ARABIC_TEXTS.TOTAL_EXPENSES}: <span className="negative-amount">{formatCurrency(totalExpenses)}</span></p>
        <p>{ARABIC_TEXTS.TOTAL_DEPOSITS}: <span className="positive-amount">{formatCurrency(totalDeposits)}</span></p>
        <p>{ARABIC_TEXTS.REMAINING_BALANCE}: 
          <span className={totalDeposits - totalExpenses >= 0 ? 'positive-amount' : 'negative-amount'}>
            {formatCurrency(totalDeposits - totalExpenses)}
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="add-expense-form bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">{editingExpense ? ARABIC_TEXTS.UPDATE_EXPENSE : ARABIC_TEXTS.ADD_EXPENSE}</h3>
        <input
          type="text"
          value={newExpense.description}
          onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
          placeholder={ARABIC_TEXTS.DESCRIPTION}
          className="w-full p-2 mb-3 border rounded"
          required
        />
        <div className="flex flex-wrap -mx-2 mb-3">
          <div className="w-full md:w-1/2 px-2 mb-3 md:mb-0">
            <input
              type="number"
              value={newExpense.amount || ''}
              onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
              placeholder={ARABIC_TEXTS.AMOUNT}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="w-full md:w-1/2 px-2">
            <input
              type="number"
              value={newExpense.vat || ''}
              onChange={(e) => setNewExpense({...newExpense, vat: parseFloat(e.target.value)})}
              placeholder={ARABIC_TEXTS.VAT}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <select
          value={newExpense.type}
          onChange={(e) => setNewExpense({...newExpense, type: e.target.value as 'expense' | 'deposit'})}
          className="w-full p-2 mb-3 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          style={{ backgroundImage: 'none' }} // Removes the default arrow
        >
          <option value="expense">{ARABIC_TEXTS.EXPENSE}</option>
          <option value="deposit">{ARABIC_TEXTS.DEPOSIT}</option>
        </select>
        <input
          type="date"
          value={newExpense.date}
          onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
          className="w-full p-2 mb-3 border rounded"
          required
        />
        <div className="mb-2">
          <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 mb-1">
            {ARABIC_TEXTS.UPLOAD_RECEIPT}
          </label>
          <input
            type="file"
            id="receipt"
            onChange={(e) => setNewExpense({...newExpense, receipt: e.target.files ? e.target.files[0] : null})}
            className="w-full p-2 border rounded"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300">
          {editingExpense ? ARABIC_TEXTS.UPDATE_EXPENSE : ARABIC_TEXTS.ADD_EXPENSE}
        </button>
        {editingExpense && (
          <button 
            type="button" 
            onClick={() => {
              setEditingExpense(null);
              setNewExpense({
                description: '',
                amount: 0,
                vat: 0,
                type: 'expense',
                date: new Date().toISOString().split('T')[0],
                receipt: null,
              });
            }} 
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition duration-300 mr-2"
          >
            {ARABIC_TEXTS.CANCEL}
          </button>
        )}
      </form>
    </div>
  );
};

export default ProjectDetails;
