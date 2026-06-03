const menuModel = require('./menu.model');

class MenuService {
  async getAllItems(filters) {
    return await menuModel.findWithCategory(filters);
  }

  async getCategories() {
    return await menuModel.getCategories();
  }

  async createItem(data) {
    return await menuModel.create(data);
  }

  async updateItem(id, data) {
    return await menuModel.update(id, data);
  }

  async deleteItem(id) {
    return await menuModel.softDelete(id);
  }

  async createCategory(data) {
    return await menuModel.createCategory(data);
  }

  async updateCategory(id, data) {
    return await menuModel.updateCategory(id, data);
  }

  async deleteCategory(id) {
    return await menuModel.deleteCategory(id);
  }
}

module.exports = new MenuService();
