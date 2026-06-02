const houseAccountsModel = require('./house-accounts.model');
const pool = require('../../database/connection');

class HouseAccountsService {
  async getAllAccounts() {
    return await houseAccountsModel.findWithOutstandingBalance();
  }

  async createAccount(data) {
    const accountData = {
      account_name: data.account_name,
      contact_person: data.contact_person || null,
      phone: data.phone || null,
      email: data.email || null,
      credit_limit: data.credit_limit !== undefined ? parseFloat(data.credit_limit) : 50000.00,
      status: 'active'
    };
    return await houseAccountsModel.create(accountData);
  }

  async getStatement(accountId) {
    return await houseAccountsModel.getStatement(accountId);
  }

  async recordPayment(accountId, data) {
    const amountToPay = parseFloat(data.amount);
    if (isNaN(amountToPay) || amountToPay <= 0) {
      throw new Error('Invalid payment amount');
    }

    const transactionData = {
      house_account_id: accountId,
      amount: -amountToPay, // Payments are negative amounts in ledger
      transaction_type: 'PAYMENT',
      payment_method: data.payment_method || 'CASH',
      notes: data.notes || 'Monthly Ledger Settle Payment'
    };

    return await houseAccountsModel.createTransaction(transactionData);
  }

  async updateAccount(id, data) {
    const updateData = {
      account_name: data.account_name,
      contact_person: data.contact_person || null,
      phone: data.phone || null,
      email: data.email || null,
      credit_limit: data.credit_limit !== undefined ? parseFloat(data.credit_limit) : 50000.00
    };
    return await houseAccountsModel.update(id, updateData);
  }

  async deleteAccount(id) {
    const accounts = await houseAccountsModel.findWithOutstandingBalance();
    const account = accounts.find(acc => String(acc.id) === String(id));
    if (!account) {
      throw new Error('Corporate profile not found');
    }
    
    const outstanding = parseFloat(account.outstanding_balance || 0);
    if (outstanding > 0) {
      throw new Error('Cannot delete profile with an outstanding balance. Please settle the dues first!');
    }

    return await houseAccountsModel.softDelete(id);
  }
}

module.exports = new HouseAccountsService();
