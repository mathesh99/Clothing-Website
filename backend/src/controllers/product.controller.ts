import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth';

export const productController = {
  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        category, clothingType, minPrice, maxPrice, brand,
        inStock, rating, isFeatured, isNewArrival, search, sortBy,
        page, limit,
      } = req.query;

      const sizes = req.query.sizes ? String(req.query.sizes).split(',') : undefined;
      const colors = req.query.colors ? String(req.query.colors).split(',') : undefined;

      const result = await productService.getProducts({
        category: category as string,
        clothingType: clothingType as string,
        sizes,
        colors,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        brand: brand as string,
        inStock: inStock === 'true',
        rating: rating ? Number(rating) : undefined,
        isFeatured: isFeatured === 'true' ? true : undefined,
        isNewArrival: isNewArrival === 'true' ? true : undefined,
        search: search as string,
        sortBy: sortBy as any,
        page: page ? Number(page) : 1,
        limit: limit ? Math.min(Number(limit), 50) : 20,
      });

      sendSuccess(res, result.products, 'Products retrieved', 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (err) {
      next(err);
    }
  },

  async getProductBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getProductBySlug(req.params.slug as string);
      sendSuccess(res, product, 'Product retrieved');
    } catch (err) {
      next(err);
    }
  },

  async getFeaturedProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await productService.getFeaturedProducts(Number(req.query.limit) || 8);
      sendSuccess(res, products, 'Featured products retrieved');
    } catch (err) {
      next(err);
    }
  },

  async getNewArrivals(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await productService.getNewArrivals(Number(req.query.limit) || 8);
      sendSuccess(res, products, 'New arrivals retrieved');
    } catch (err) {
      next(err);
    }
  },

  async getRelatedProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, categoryId } = req.query;
      const products = await productService.getRelatedProducts(
        productId as string,
        categoryId as string,
        6
      );
      sendSuccess(res, products, 'Related products retrieved');
    } catch (err) {
      next(err);
    }
  },
};
