const ProductService = require('../src/services/ProductService');

// @desc    Get all products (paginated, filtered)
// @route   GET /api/products
exports.getProducts = async (req, res, next) => {
  try {
    const result = await ProductService.getProducts(req.organization, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
exports.getProduct = async (req, res, next) => {
  try {
    const product = await ProductService.getProductById(req.params.id, req.organization);
    res.json(product);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
exports.createProduct = async (req, res, next) => {
  try {
    const product = await ProductService.createProduct(req.body, req.organization);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await ProductService.updateProduct(req.params.id, req.body, req.organization);
    res.json(product);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    await ProductService.deleteProduct(req.params.id, req.organization);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Get all categories (distinct)
// @route   GET /api/products/categories/list
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await ProductService.getCategories(req.organization);
    res.json(categories);
  } catch (error) {
    next(error);
  }
};
