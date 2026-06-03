const houseAccountsService = require('./house-accounts.service');
const { sendSuccess, sendError } = require('../../utils/response.formatter');

class HouseAccountsController {
  async getAllAccounts(req, res) {
    try {
      const accounts = await houseAccountsService.getAllAccounts();
      return sendSuccess(res, 'House accounts fetched successfully', accounts);
    } catch (err) {
      return sendError(res, err.message);
    }
  }

  async createAccount(req, res) {
    try {
      const accountId = await houseAccountsService.createAccount(req.body);
      return sendSuccess(res, 'House account created successfully', { id: accountId }, 201);
    } catch (err) {
      return sendError(res, err.message);
    }
  }

  async getStatement(req, res) {
    try {
      const statement = await houseAccountsService.getStatement(req.params.id);
      return sendSuccess(res, 'Statement fetched successfully', statement);
    } catch (err) {
      return sendError(res, err.message);
    }
  }

  async recordPayment(req, res) {
    try {
      const transactionId = await houseAccountsService.recordPayment(req.params.id, req.body);
      return sendSuccess(res, 'Payment recorded successfully', { id: transactionId });
    } catch (err) {
      return sendError(res, err.message);
    }
  }

  async updateAccount(req, res) {
    try {
      await houseAccountsService.updateAccount(req.params.id, req.body);
      return sendSuccess(res, 'House account updated successfully');
    } catch (err) {
      return sendError(res, err.message);
    }
  }

  async deleteAccount(req, res) {
    try {
      await houseAccountsService.deleteAccount(req.params.id);
      return sendSuccess(res, 'House account deleted successfully');
    } catch (err) {
      return sendError(res, err.message);
    }
  }
}

module.exports = new HouseAccountsController();
