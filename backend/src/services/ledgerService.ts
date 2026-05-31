const Transaction = require('../models/Transaction');

const recordTransaction = async ({
  hotelId,
  description,
  type, // 'Income' | 'Expense'
  category, // 'Room Revenue', 'Salary', 'Maintenance', etc.
  amount,
  referenceId = null,
  paymentMethod,
}) => {
  try {
    const transaction = new Transaction({
      hotelId,
      description,
      type,
      category,
      amount,
      referenceId,
      paymentMethod,
    });
    
    await transaction.save();
    console.log(`[Ledger Service] Saved ${type} entry - ${category}: ${amount} INR (${paymentMethod})`);
    return transaction;
  } catch (error) {
    console.error('[Ledger Service Error] Failed to save entry:', error.message);
    throw new Error('Ledger transaction entry failed to log.');
  }
};

module.exports = { recordTransaction };
