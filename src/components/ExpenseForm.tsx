import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { ARABIC_TEXTS } from '../constants/arabic';

interface ExpenseFormProps {
  projectId: string;
  onClose: () => void;
  onExpenseAdded: (expense: any) => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ projectId, onClose, onExpenseAdded }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<'expense' | 'deposit'>('expense');
  const [paymentMethod, setPaymentMethod] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newExpense = {
      description,
      amount: parseFloat(amount),
      date,
      type,
      paymentMethod,
      addedBy: user.email,
    };

    try {
      const docRef = await addDoc(collection(db, 'projects', projectId, 'expenses'), newExpense);
      onExpenseAdded({ id: docRef.id, ...newExpense });
      onClose();
    } catch (error) {
      console.error('Error adding expense: ', error);
    }
  };

  return (
    <div className="expense-form">
      <h3>{ARABIC_TEXTS.ADD_NEW_ENTRY}</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={ARABIC_TEXTS.DESCRIPTION}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder={ARABIC_TEXTS.AMOUNT}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <select value={type} onChange={(e) => setType(e.target.value as 'expense' | 'deposit')}>
          <option value="expense">{ARABIC_TEXTS.EXPENSE}</option>
          <option value="deposit">{ARABIC_TEXTS.DEPOSIT}</option>
        </select>
        <input
          type="text"
          placeholder={ARABIC_TEXTS.PAYMENT_METHOD}
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          required
        />
        <button type="submit">{ARABIC_TEXTS.SAVE}</button>
        <button type="button" onClick={onClose}>{ARABIC_TEXTS.CANCEL}</button>
      </form>
    </div>
  );
};

export default ExpenseForm;
