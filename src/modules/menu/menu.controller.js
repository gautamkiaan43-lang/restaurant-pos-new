const menuService = require('./menu.service');

class MenuController {
  async getAllItems(req, res) {
    try {
      const { category, search, popular } = req.query;
      const items = await menuService.getAllItems({ category, search, popular: popular === 'true' });
      res.json({
        success: true,
        message: 'Menu items fetched successfully',
        data: items
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async getCategories(req, res) {
    try {
      const categories = await menuService.getCategories();
      res.json({
        success: true,
        message: 'Categories fetched successfully',
        data: categories
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async createItem(req, res) {
    try {
      const itemId = await menuService.createItem(req.body);
      res.status(201).json({
        success: true,
        message: 'Item created successfully',
        data: { id: itemId }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async updateItem(req, res) {
    try {
      await menuService.updateItem(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Item updated successfully'
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async deleteItem(req, res) {
    try {
      await menuService.deleteItem(req.params.id);
      res.json({
        success: true,
        message: 'Item deleted successfully'
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async createCategory(req, res) {
    try {
      const categoryId = await menuService.createCategory(req.body);
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { id: categoryId }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async updateCategory(req, res) {
    try {
      await menuService.updateCategory(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Category updated successfully'
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async deleteCategory(req, res) {
    try {
      await menuService.deleteCategory(req.params.id);
      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
}

module.exports = new MenuController();
