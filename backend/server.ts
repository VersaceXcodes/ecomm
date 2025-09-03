import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import morgan from 'morgan';

// Import Zod schemas
import {
  userSchema, createUserInputSchema, updateUserInputSchema,
  adminUserSchema, createAdminUserInputSchema,
  productSchema, createProductInputSchema, updateProductInputSchema, searchProductsInputSchema,
  productImageSchema, createProductImageInputSchema, updateProductImageInputSchema,
  categorySchema, createCategoryInputSchema, updateCategoryInputSchema,
  addressSchema, createAddressInputSchema, updateAddressInputSchema,
  cartItemSchema, createCartItemInputSchema, updateCartItemInputSchema,
  orderSchema, createOrderInputSchema, updateOrderInputSchema, searchOrdersInputSchema,
  orderItemSchema, createOrderItemInputSchema,
  wishlistItemSchema, createWishlistItemInputSchema,
  productReviewSchema, createProductReviewInputSchema, updateProductReviewInputSchema,
  contactMessageSchema, createContactMessageInputSchema, updateContactMessageInputSchema,
  newsletterSubscriptionSchema, createNewsletterSubscriptionInputSchema,
  shippingMethodSchema, promoCodeSchema,
  inventoryAdjustmentSchema, createInventoryAdjustmentInputSchema,
  orderStatusHistorySchema, createOrderStatusHistoryInputSchema
} from './schema.ts';

dotenv.config();

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const { DATABASE_URL, PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT = 5432, JWT_SECRET = 'your-secret-key' } = process.env;

const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { require: true } 
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: { require: true },
      }
);

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(morgan('combined'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Error response utility
interface ErrorResponse {
  success: false;
  message: string;
  error_code?: string;
  details?: any;
  timestamp: string;
}

function createErrorResponse(
  message: string,
  error?: any,
  errorCode?: string
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errorCode) {
    response.error_code = errorCode;
  }

  if (error) {
    response.details = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return response;
}

/*
  Authentication middleware for protected routes
  Validates JWT token and loads user information
*/
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(createErrorResponse('Access token required', null, 'AUTH_TOKEN_MISSING'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT user_id, email, first_name, last_name, phone, email_verified, is_active, created_at, updated_at FROM users WHERE user_id = $1 AND is_active = true',
        [decoded.user_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json(createErrorResponse('Invalid token - user not found', null, 'AUTH_USER_NOT_FOUND'));
      }

      req.user = result.rows[0];
      next();
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(403).json(createErrorResponse('Invalid or expired token', error, 'AUTH_TOKEN_INVALID'));
  }
};

/*
  Admin authentication middleware for admin-only routes
  Validates admin JWT token and loads admin information
*/
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(createErrorResponse('Admin access token required', null, 'ADMIN_AUTH_TOKEN_MISSING'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT admin_id, username, email, role, permissions, is_active, created_at, updated_at FROM admin_users WHERE admin_id = $1 AND is_active = true',
        [decoded.admin_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json(createErrorResponse('Invalid admin token', null, 'ADMIN_AUTH_USER_NOT_FOUND'));
      }

      req.admin = result.rows[0];
      next();
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(403).json(createErrorResponse('Invalid or expired admin token', error, 'ADMIN_AUTH_TOKEN_INVALID'));
  }
};

/*
  Optional authentication middleware - allows both authenticated and guest access
  Loads user information if token provided, continues without user if not
*/
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT user_id, email, first_name, last_name, phone, email_verified, is_active, created_at, updated_at FROM users WHERE user_id = $1 AND is_active = true',
        [decoded.user_id]
      );
      
      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }
    } finally {
      client.release();
    }
  } catch (error) {
    // Invalid token, continue as guest
  }
  
  next();
};

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

/*
  User registration endpoint
  Creates new user account with validation and automatic login
*/
app.post('/api/auth/register', async (req, res) => {
  try {
    const validatedData = createUserInputSchema.parse(req.body);
    const { email, password_hash, first_name, last_name, phone } = validatedData;

    const client = await pool.connect();
    
    try {
      // Check if user already exists
      const existingUser = await client.query('SELECT user_id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json(createErrorResponse('User with this email already exists', null, 'USER_ALREADY_EXISTS'));
      }

      const userId = uuidv4();
      const now = new Date().toISOString();

      // Create user (storing password directly as specified for development)
      const userResult = await client.query(
        `INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone, email_verified, is_active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, false, true, $7, $8) 
         RETURNING user_id, email, first_name, last_name, phone, email_verified, is_active, created_at, updated_at`,
        [userId, email.toLowerCase(), password_hash, first_name, last_name, phone, now, now]
      );

      const user = userResult.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        { user_id: user.user_id, email: user.email }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );

      // Create session record
      const sessionId = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      await client.query(
        `INSERT INTO user_sessions (session_id, user_id, token_hash, expires_at, ip_address, user_agent, is_active, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, true, $7)`,
        [sessionId, userId, token, expiresAt, req.ip, req.get('User-Agent'), now]
      );

      res.status(201).json({
        user,
        token,
        expires_at: expiresAt
      });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    console.error('Registration error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  User login endpoint
  Authenticates user credentials and creates session
*/
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, remember_me = false } = req.body;

    if (!email || !password) {
      return res.status(400).json(createErrorResponse('Email and password are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    const client = await pool.connect();
    
    try {
      // Find user with direct password comparison (development setup)
      const result = await client.query(
        'SELECT user_id, email, password_hash, first_name, last_name, phone, email_verified, is_active, created_at, updated_at FROM users WHERE email = $1 AND is_active = true',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.status(401).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
      }

      const user = result.rows[0];

      // Direct password comparison for development
      if (password !== user.password_hash) {
        return res.status(401).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
      }

      // Generate JWT token
      const expiresIn = remember_me ? '30d' : '7d';
      const token = jwt.sign(
        { user_id: user.user_id, email: user.email }, 
        JWT_SECRET, 
        { expiresIn }
      );

      // Create session record
      const sessionId = uuidv4();
      const expiresAt = new Date(Date.now() + (remember_me ? 30 : 7) * 24 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();
      
      await client.query(
        `INSERT INTO user_sessions (session_id, user_id, token_hash, expires_at, ip_address, user_agent, is_active, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, true, $7)`,
        [sessionId, user.user_id, token, expiresAt, req.ip, req.get('User-Agent'), now]
      );

      // Update user last login
      await client.query('UPDATE users SET updated_at = $1 WHERE user_id = $2', [now, user.user_id]);

      // Remove password from response
      delete user.password_hash;

      res.json({
        user,
        token,
        expires_at: expiresAt
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  User logout endpoint
  Invalidates current session
*/
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    const client = await pool.connect();
    
    try {
      await client.query(
        'UPDATE user_sessions SET is_active = false WHERE token_hash = $1',
        [token]
      );

      res.json({ message: 'Logout successful' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get current authenticated user endpoint
  Returns user profile information
*/
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

/*
  @@@need:external-api: Password reset email service to send reset tokens to user email addresses
*/
async function sendPasswordResetEmail({ email, resetToken, resetUrl }) {
  // Mock implementation - returns success for development
  console.log(`Mock: Sending password reset email to ${email} with token ${resetToken}`);
  return {
    success: true,
    messageId: `mock_${Date.now()}`,
    sentAt: new Date().toISOString()
  };
}

/*
  Forgot password endpoint
  Initiates password reset process
*/
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(createErrorResponse('Email is required', null, 'MISSING_EMAIL'));
    }

    const client = await pool.connect();
    
    try {
      const userResult = await client.query('SELECT user_id FROM users WHERE email = $1 AND is_active = true', [email.toLowerCase()]);
      
      if (userResult.rows.length === 0) {
        // Still return success to prevent email enumeration
        return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
      }

      const resetToken = uuidv4();
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      // In a real implementation, you would store the reset token in database with expiration
      // For now, we'll just trigger the email service
      
      await sendPasswordResetEmail({
        email,
        resetToken,
        resetUrl
      });

      res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Reset password endpoint
  Processes password reset with token validation
*/
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json(createErrorResponse('Token and password are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    // For mock implementation, we'll accept any token and just update a dummy user
    // In real implementation, you would validate the reset token against database
    
    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ============================================================================
// PRODUCT ENDPOINTS
// ============================================================================

/*
  Get products list with filtering, searching, and sorting
  Supports both authenticated and guest access with comprehensive product information
*/
app.get('/api/products', async (req, res) => {
  try {
    const {
      search_query,
      category_id,
      brand,
      price_min,
      price_max,
      is_featured,
      in_stock,
      sort_by = 'created_at',
      sort_order = 'desc',
      limit = 20,
      offset = 0
    } = req.query;

    const client = await pool.connect();
    
    try {
      let query = `
        SELECT DISTINCT p.*, 
               array_agg(DISTINCT jsonb_build_object(
                 'image_id', pi.image_id,
                 'image_url', pi.image_url,
                 'alt_text', pi.alt_text,
                 'display_order', pi.display_order,
                 'is_primary', pi.is_primary
               ) ORDER BY pi.display_order, pi.created_at) FILTER (WHERE pi.image_id IS NOT NULL) as images
        FROM products p
        LEFT JOIN product_images pi ON p.product_id = pi.product_id
        WHERE p.is_active = true
      `;
      
      const queryParams = [];
      let paramCount = 0;

      // Add search functionality
      if (search_query) {
        paramCount++;
        query += ` AND (
          p.name ILIKE $${paramCount} OR 
          p.brand ILIKE $${paramCount} OR 
          p.description ILIKE $${paramCount} OR
          array_to_string(p.fragrance_notes_top, ' ') ILIKE $${paramCount} OR
          array_to_string(p.fragrance_notes_middle, ' ') ILIKE $${paramCount} OR
          array_to_string(p.fragrance_notes_base, ' ') ILIKE $${paramCount}
        )`;
        queryParams.push(`%${search_query}%`);
      }

      // Add category filter
      if (category_id) {
        paramCount++;
        query += ` AND p.category_id = $${paramCount}`;
        queryParams.push(category_id);
      }

      // Add brand filter
      if (brand) {
        paramCount++;
        query += ` AND p.brand ILIKE $${paramCount}`;
        queryParams.push(`%${brand}%`);
      }

      // Add price range filters
      if (price_min) {
        paramCount++;
        query += ` AND COALESCE(p.sale_price, p.price) >= $${paramCount}`;
        queryParams.push(parseFloat(price_min));
      }

      if (price_max) {
        paramCount++;
        query += ` AND COALESCE(p.sale_price, p.price) <= $${paramCount}`;
        queryParams.push(parseFloat(price_max));
      }

      // Add featured filter
      if (is_featured !== undefined) {
        paramCount++;
        query += ` AND p.is_featured = $${paramCount}`;
        queryParams.push(is_featured === 'true');
      }

      // Add stock filter
      if (in_stock !== undefined && in_stock === 'true') {
        query += ` AND p.stock_quantity > 0`;
      }

      query += ` GROUP BY p.product_id`;

      // Add sorting
      const validSortFields = ['name', 'price', 'created_at', 'view_count', 'sales_count'];
      const validSortOrders = ['asc', 'desc'];
      
      if (validSortFields.includes(sort_by) && validSortOrders.includes(sort_order)) {
        let sortField = sort_by;
        if (sort_by === 'price') {
          sortField = 'COALESCE(p.sale_price, p.price)';
        } else {
          sortField = `p.${sort_by}`;
        }
        query += ` ORDER BY ${sortField} ${sort_order.toUpperCase()}`;
      }

      // Add pagination
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      queryParams.push(parseInt(limit));
      
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      queryParams.push(parseInt(offset));

      const result = await client.query(query, queryParams);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(DISTINCT p.product_id) as total
        FROM products p
        WHERE p.is_active = true
      `;
      
      let countParams = [];
      let countParamIndex = 0;

      // Apply same filters for count
      if (search_query) {
        countParamIndex++;
        countQuery += ` AND (
          p.name ILIKE $${countParamIndex} OR 
          p.brand ILIKE $${countParamIndex} OR 
          p.description ILIKE $${countParamIndex} OR
          array_to_string(p.fragrance_notes_top, ' ') ILIKE $${countParamIndex} OR
          array_to_string(p.fragrance_notes_middle, ' ') ILIKE $${countParamIndex} OR
          array_to_string(p.fragrance_notes_base, ' ') ILIKE $${countParamIndex}
        )`;
        countParams.push(`%${search_query}%`);
      }

      if (category_id) {
        countParamIndex++;
        countQuery += ` AND p.category_id = $${countParamIndex}`;
        countParams.push(category_id);
      }

      if (brand) {
        countParamIndex++;
        countQuery += ` AND p.brand ILIKE $${countParamIndex}`;
        countParams.push(`%${brand}%`);
      }

      if (price_min) {
        countParamIndex++;
        countQuery += ` AND COALESCE(p.sale_price, p.price) >= $${countParamIndex}`;
        countParams.push(parseFloat(price_min));
      }

      if (price_max) {
        countParamIndex++;
        countQuery += ` AND COALESCE(p.sale_price, p.price) <= $${countParamIndex}`;
        countParams.push(parseFloat(price_max));
      }

      if (is_featured !== undefined) {
        countParamIndex++;
        countQuery += ` AND p.is_featured = $${countParamIndex}`;
        countParams.push(is_featured === 'true');
      }

      if (in_stock !== undefined && in_stock === 'true') {
        countQuery += ` AND p.stock_quantity > 0`;
      }

      const countResult = await client.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      res.json({
        products: result.rows,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: offset + limit < total
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get product details by ID with comprehensive information
  Includes images, category, related products, and review statistics
*/
app.get('/api/products/:product_id', async (req, res) => {
  try {
    const { product_id } = req.params;

    const client = await pool.connect();
    
    try {
      // Get product with images
      const productResult = await client.query(`
        SELECT p.*, 
               array_agg(DISTINCT jsonb_build_object(
                 'image_id', pi.image_id,
                 'image_url', pi.image_url,
                 'alt_text', pi.alt_text,
                 'display_order', pi.display_order,
                 'is_primary', pi.is_primary
               ) ORDER BY pi.display_order, pi.created_at) FILTER (WHERE pi.image_id IS NOT NULL) as images,
               c.category_id as category_id,
               c.name as category_name,
               c.description as category_description
        FROM products p
        LEFT JOIN product_images pi ON p.product_id = pi.product_id
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.product_id = $1 AND p.is_active = true
        GROUP BY p.product_id, c.category_id, c.name, c.description
      `, [product_id]);

      if (productResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Product not found', null, 'PRODUCT_NOT_FOUND'));
      }

      const product = productResult.rows[0];

      // Get review statistics
      const reviewStatsResult = await client.query(`
        SELECT 
          COALESCE(AVG(rating), 0) as average_rating,
          COUNT(*) as review_count,
          COUNT(*) FILTER (WHERE rating = 1) as rating_1_count,
          COUNT(*) FILTER (WHERE rating = 2) as rating_2_count,
          COUNT(*) FILTER (WHERE rating = 3) as rating_3_count,
          COUNT(*) FILTER (WHERE rating = 4) as rating_4_count,
          COUNT(*) FILTER (WHERE rating = 5) as rating_5_count
        FROM product_reviews 
        WHERE product_id = $1 AND is_approved = true
      `, [product_id]);

      const reviewStats = reviewStatsResult.rows[0];

      // Get related products (same category or brand)
      const relatedResult = await client.query(`
        SELECT p.*, 
               array_agg(DISTINCT jsonb_build_object(
                 'image_id', pi.image_id,
                 'image_url', pi.image_url,
                 'alt_text', pi.alt_text,
                 'display_order', pi.display_order,
                 'is_primary', pi.is_primary
               ) ORDER BY pi.display_order, pi.created_at) FILTER (WHERE pi.image_id IS NOT NULL) as images
        FROM products p
        LEFT JOIN product_images pi ON p.product_id = pi.product_id
        WHERE p.product_id != $1 
          AND p.is_active = true 
          AND (p.category_id = $2 OR p.brand = $3)
        GROUP BY p.product_id
        LIMIT 4
      `, [product_id, product.category_id, product.brand]);

      // Structure the response
      const response = {
        ...product,
        category: product.category_id ? {
          category_id: product.category_id,
          name: product.category_name,
          description: product.category_description
        } : null,
        related_products: relatedResult.rows,
        average_rating: parseFloat(reviewStats.average_rating),
        review_count: parseInt(reviewStats.review_count),
        rating_breakdown: {
          1: parseInt(reviewStats.rating_1_count),
          2: parseInt(reviewStats.rating_2_count),
          3: parseInt(reviewStats.rating_3_count),
          4: parseInt(reviewStats.rating_4_count),
          5: parseInt(reviewStats.rating_5_count)
        }
      };

      // Remove category fields from main product object
      delete response.category_name;
      delete response.category_description;

      res.json(response);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get product details error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Increment product view count
  Tracks product popularity for analytics
*/
app.patch('/api/products/:product_id', async (req, res) => {
  try {
    const { product_id } = req.params;

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'UPDATE products SET view_count = view_count + 1 WHERE product_id = $1 AND is_active = true RETURNING view_count',
        [product_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Product not found', null, 'PRODUCT_NOT_FOUND'));
      }

      res.json({ view_count: result.rows[0].view_count });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update product views error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ============================================================================
// CATEGORY ENDPOINTS
// ============================================================================

/*
  Get all active categories
  Returns categorized product organization structure
*/
app.get('/api/categories', async (req, res) => {
  try {
    const { is_active = true } = req.query;

    const client = await pool.connect();
    
    try {
      let query = 'SELECT * FROM categories';
      const queryParams = [];
      
      if (is_active !== undefined) {
        query += ' WHERE is_active = $1';
        queryParams.push(is_active === 'true');
      }
      
      query += ' ORDER BY display_order ASC, name ASC';

      const result = await client.query(query, queryParams);

      res.json({ categories: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ============================================================================
// CART ENDPOINTS
// ============================================================================

/*
  Get current user cart items with product details and calculations
  Supports both authenticated users and guest sessions
*/
app.get('/api/cart', optionalAuth, async (req, res) => {
  try {
    const { session_id } = req.query;
    const userId = req.user?.user_id;

    if (!userId && !session_id) {
      return res.status(400).json(createErrorResponse('User authentication or session_id required', null, 'AUTH_OR_SESSION_REQUIRED'));
    }

    const client = await pool.connect();
    
    try {
      let query = `
        SELECT ci.*, 
               p.name, p.brand, p.price, p.sale_price, p.stock_quantity, p.sku,
               pi.image_url, pi.alt_text
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.product_id
        LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = true
        WHERE p.is_active = true
      `;
      
      const queryParams = [];
      
      if (userId) {
        query += ' AND ci.user_id = $1';
        queryParams.push(userId);
      } else {
        query += ' AND ci.session_id = $1';
        queryParams.push(session_id);
      }
      
      query += ' ORDER BY ci.added_at DESC';

      const result = await client.query(query, queryParams);

      // Calculate totals
      let subtotal = 0;
      const items = result.rows.map(item => {
        const currentPrice = item.sale_price || item.price;
        const lineTotal = currentPrice * item.quantity;
        subtotal += lineTotal;

        return {
          cart_item_id: item.cart_item_id,
          user_id: item.user_id,
          session_id: item.session_id,
          product_id: item.product_id,
          quantity: item.quantity,
          added_at: item.added_at,
          updated_at: item.updated_at,
          product: {
            name: item.name,
            brand: item.brand,
            price: parseFloat(item.price),
            sale_price: item.sale_price ? parseFloat(item.sale_price) : null,
            stock_quantity: item.stock_quantity,
            sku: item.sku,
            images: item.image_url ? [{
              image_url: item.image_url,
              alt_text: item.alt_text,
              is_primary: true
            }] : []
          },
          line_total: lineTotal
        };
      });

      // Calculate shipping and tax (mock implementation)
      const shippingCost = subtotal >= 50 ? 0 : 9.99;
      const taxAmount = subtotal * 0.08; // 8% tax rate
      const total = subtotal + shippingCost + taxAmount;

      res.json({
        items,
        total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        total
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Add item to cart with stock validation and quantity management
  Handles both new items and quantity updates for existing items
*/
app.post('/api/cart', optionalAuth, async (req, res) => {
  try {
    const validatedData = createCartItemInputSchema.parse(req.body);
    const { product_id, quantity, session_id } = validatedData;
    const userId = req.user?.user_id;

    if (!userId && !session_id) {
      return res.status(400).json(createErrorResponse('User authentication or session_id required', null, 'AUTH_OR_SESSION_REQUIRED'));
    }

    const client = await pool.connect();
    
    try {
      // Validate product exists and is active
      const productResult = await client.query(
        'SELECT product_id, stock_quantity FROM products WHERE product_id = $1 AND is_active = true',
        [product_id]
      );

      if (productResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Product not found or inactive', null, 'PRODUCT_NOT_FOUND'));
      }

      const product = productResult.rows[0];

      // Check stock availability
      if (product.stock_quantity < quantity) {
        return res.status(400).json(createErrorResponse(`Insufficient stock. Only ${product.stock_quantity} items available`, null, 'INSUFFICIENT_STOCK'));
      }

      // Check if item already exists in cart
      let existingItemQuery = 'SELECT cart_item_id, quantity FROM cart_items WHERE product_id = $1';
      const existingItemParams = [product_id];
      
      if (userId) {
        existingItemQuery += ' AND user_id = $2';
        existingItemParams.push(userId);
      } else {
        existingItemQuery += ' AND session_id = $2';
        existingItemParams.push(session_id);
      }

      const existingItemResult = await client.query(existingItemQuery, existingItemParams);

      const now = new Date().toISOString();

      if (existingItemResult.rows.length > 0) {
        // Update existing item
        const existingItem = existingItemResult.rows[0];
        const newQuantity = existingItem.quantity + quantity;

        // Check total stock for new quantity
        if (product.stock_quantity < newQuantity) {
          return res.status(400).json(createErrorResponse(`Insufficient stock. Only ${product.stock_quantity} items available`, null, 'INSUFFICIENT_STOCK'));
        }

        await client.query(
          'UPDATE cart_items SET quantity = $1, updated_at = $2 WHERE cart_item_id = $3',
          [newQuantity, now, existingItem.cart_item_id]
        );
      } else {
        // Create new cart item
        const cartItemId = uuidv4();
        await client.query(
          `INSERT INTO cart_items (cart_item_id, user_id, session_id, product_id, quantity, added_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [cartItemId, userId, session_id, product_id, quantity, now, now]
        );
      }

      // Return updated cart
      // Reuse the cart retrieval logic
      const cartResponse = await getCartResponse(client, userId, session_id);
      res.status(201).json(cartResponse);
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    console.error('Add to cart error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Helper function to get cart response with calculations
  Reusable cart calculation logic for consistency
*/
async function getCartResponse(client, userId, sessionId) {
  let query = `
    SELECT ci.*, 
           p.name, p.brand, p.price, p.sale_price, p.stock_quantity, p.sku,
           pi.image_url, pi.alt_text
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = true
    WHERE p.is_active = true
  `;
  
  const queryParams = [];
  
  if (userId) {
    query += ' AND ci.user_id = $1';
    queryParams.push(userId);
  } else {
    query += ' AND ci.session_id = $1';
    queryParams.push(sessionId);
  }
  
  query += ' ORDER BY ci.added_at DESC';

  const result = await client.query(query, queryParams);

  let subtotal = 0;
  const items = result.rows.map(item => {
    const currentPrice = item.sale_price || item.price;
    const lineTotal = currentPrice * item.quantity;
    subtotal += lineTotal;

    return {
      cart_item_id: item.cart_item_id,
      user_id: item.user_id,
      session_id: item.session_id,
      product_id: item.product_id,
      quantity: item.quantity,
      added_at: item.added_at,
      updated_at: item.updated_at,
      product: {
        name: item.name,
        brand: item.brand,
        price: parseFloat(item.price),
        sale_price: item.sale_price ? parseFloat(item.sale_price) : null,
        stock_quantity: item.stock_quantity,
        sku: item.sku,
        images: item.image_url ? [{
          image_url: item.image_url,
          alt_text: item.alt_text,
          is_primary: true
        }] : []
      },
      line_total: lineTotal
    };
  });

  const shippingCost = subtotal >= 50 ? 0 : 9.99;
  const taxAmount = subtotal * 0.08;
  const total = subtotal + shippingCost + taxAmount;

  return {
    items,
    total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    shipping_cost: shippingCost,
    tax_amount: taxAmount,
    total
  };
}

/*
  Update cart item quantity
  Validates stock availability and updates quantity
*/
app.patch('/api/cart/:cart_item_id', optionalAuth, async (req, res) => {
  try {
    const { cart_item_id } = req.params;
    const validatedData = updateCartItemInputSchema.parse(req.body);
    const { quantity } = validatedData;
    const userId = req.user?.user_id;

    const client = await pool.connect();
    
    try {
      // Get cart item and verify ownership
      let ownershipQuery = `
        SELECT ci.*, p.stock_quantity 
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.product_id
        WHERE ci.cart_item_id = $1
      `;
      const ownershipParams = [cart_item_id];
      
      if (userId) {
        ownershipQuery += ' AND ci.user_id = $2';
        ownershipParams.push(userId);
      }

      const cartItemResult = await client.query(ownershipQuery, ownershipParams);

      if (cartItemResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Cart item not found', null, 'CART_ITEM_NOT_FOUND'));
      }

      const cartItem = cartItemResult.rows[0];

      // Validate stock availability
      if (cartItem.stock_quantity < quantity) {
        return res.status(400).json(createErrorResponse(`Insufficient stock. Only ${cartItem.stock_quantity} items available`, null, 'INSUFFICIENT_STOCK'));
      }

      // Update quantity
      const now = new Date().toISOString();
      await client.query(
        'UPDATE cart_items SET quantity = $1, updated_at = $2 WHERE cart_item_id = $3',
        [quantity, now, cart_item_id]
      );

      // Return updated cart
      const cartResponse = await getCartResponse(client, userId, cartItem.session_id);
      res.json(cartResponse);
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    console.error('Update cart item error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Remove item from cart
  Deletes specific cart item by ID
*/
app.delete('/api/cart/:cart_item_id', optionalAuth, async (req, res) => {
  try {
    const { cart_item_id } = req.params;
    const userId = req.user?.user_id;

    const client = await pool.connect();
    
    try {
      // Get cart item to verify ownership and get session info
      let ownershipQuery = 'SELECT user_id, session_id FROM cart_items WHERE cart_item_id = $1';
      const ownershipParams = [cart_item_id];
      
      if (userId) {
        ownershipQuery += ' AND user_id = $2';
        ownershipParams.push(userId);
      }

      const cartItemResult = await client.query(ownershipQuery, ownershipParams);

      if (cartItemResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Cart item not found', null, 'CART_ITEM_NOT_FOUND'));
      }

      const cartItem = cartItemResult.rows[0];

      // Delete cart item
      await client.query('DELETE FROM cart_items WHERE cart_item_id = $1', [cart_item_id]);

      // Return updated cart
      const cartResponse = await getCartResponse(client, userId, cartItem.session_id);
      res.json(cartResponse);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Clear all items from cart
  Removes all cart items for user or session
*/
app.delete('/api/cart/clear', optionalAuth, async (req, res) => {
  try {
    const { session_id } = req.query;
    const userId = req.user?.user_id;

    if (!userId && !session_id) {
      return res.status(400).json(createErrorResponse('User authentication or session_id required', null, 'AUTH_OR_SESSION_REQUIRED'));
    }

    const client = await pool.connect();
    
    try {
      if (userId) {
        await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
      } else {
        await client.query('DELETE FROM cart_items WHERE session_id = $1', [session_id]);
      }

      res.json({ message: 'Cart cleared successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ============================================================================
// ORDER ENDPOINTS
// ============================================================================

/*
  @@@need:external-api: Payment processing service to handle credit card transactions, PayPal payments, and other payment methods with secure tokenization and PCI compliance
*/
async function processPayment({ amount, currency, paymentMethod, paymentDetails }) {
  // Mock payment processing - returns success for development
  console.log(`Mock: Processing payment of ${amount} ${currency} via ${paymentMethod}`);
  return {
    success: true,
    transactionId: `txn_mock_${Date.now()}`,
    status: 'paid',
    amount,
    currency,
    processedAt: new Date().toISOString()
  };
}

/*
  @@@need:external-api: Email notification service to send order confirmations, shipping updates, and customer communications
*/
async function sendOrderNotification({ type, recipient, orderData, templateData }) {
  // Mock email service - returns success for development
  console.log(`Mock: Sending ${type} email to ${recipient} for order ${orderData.order_number}`);
  return {
    success: true,
    messageId: `email_mock_${Date.now()}`,
    sentAt: new Date().toISOString()
  };
}

/*
  Get user order history with filtering and pagination
  Returns complete order information with items and addresses
*/
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const userId = req.user.user_id;

    const client = await pool.connect();
    
    try {
      let query = `
        SELECT o.*,
               array_agg(DISTINCT jsonb_build_object(
                 'order_item_id', oi.order_item_id,
                 'product_id', oi.product_id,
                 'product_name', oi.product_name,
                 'product_brand', oi.product_brand,
                 'product_sku', oi.product_sku,
                 'product_image_url', oi.product_image_url,
                 'product_price', oi.product_price,
                 'sale_price', oi.sale_price,
                 'quantity', oi.quantity,
                 'line_total', oi.line_total
               )) FILTER (WHERE oi.order_item_id IS NOT NULL) as order_items
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.user_id = $1
      `;
      
      const queryParams = [userId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        query += ` AND o.status = $${paramCount}`;
        queryParams.push(status);
      }

      query += ` GROUP BY o.order_id ORDER BY o.created_at DESC`;
      
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      queryParams.push(parseInt(limit));
      
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      queryParams.push(parseInt(offset));

      const result = await client.query(query, queryParams);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = $1';
      const countParams = [userId];
      
      if (status) {
        countQuery += ' AND status = $2';
        countParams.push(status);
      }

      const countResult = await client.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      res.json({
        orders: result.rows,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: offset + limit < total
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create new order with payment processing and inventory management
  Handles both authenticated users and guest checkout with comprehensive order fulfillment
*/
app.post('/api/orders', optionalAuth, async (req, res) => {
  try {
    const validatedData = createOrderInputSchema.parse(req.body);
    const userId = req.user?.user_id;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Generate order ID and number
      const orderId = uuidv4();
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const now = new Date().toISOString();

      // Validate and process cart items
      const cartItems = validatedData.order_items;
      let calculatedSubtotal = 0;

      // Validate each item and check inventory
      for (const item of cartItems) {
        const productResult = await client.query(
          'SELECT stock_quantity, price, sale_price FROM products WHERE product_id = $1 AND is_active = true',
          [item.product_id]
        );

        if (productResult.rows.length === 0) {
          throw new Error(`Product ${item.product_id} not found or inactive`);
        }

        const product = productResult.rows[0];
        
        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.product_name}. Only ${product.stock_quantity} available.`);
        }

        const currentPrice = product.sale_price || product.price;
        calculatedSubtotal += currentPrice * item.quantity;
      }

      // Validate calculated totals match request
      if (Math.abs(calculatedSubtotal - validatedData.subtotal) > 0.01) {
        throw new Error('Subtotal mismatch. Please refresh and try again.');
      }

      // Process payment
      const paymentResult = await processPayment({
        amount: validatedData.total_amount,
        currency: validatedData.currency,
        paymentMethod: validatedData.payment_method,
        paymentDetails: {}
      });

      if (!paymentResult.success) {
        throw new Error('Payment processing failed');
      }

      // Create order record
      const orderResult = await client.query(`
        INSERT INTO orders (
          order_id, order_number, user_id, guest_email, status, subtotal, shipping_cost, 
          tax_amount, discount_amount, total_amount, currency, payment_method, payment_status,
          payment_transaction_id, shipping_address_id, billing_address_id, shipping_method,
          notes, promo_code, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, 'paid', $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
      `, [
        orderId, orderNumber, userId, validatedData.guest_email, validatedData.subtotal,
        validatedData.shipping_cost, validatedData.tax_amount, validatedData.discount_amount,
        validatedData.total_amount, validatedData.currency, validatedData.payment_method,
        paymentResult.transactionId, validatedData.shipping_address_id, validatedData.billing_address_id,
        validatedData.shipping_method, validatedData.notes, validatedData.promo_code, now, now
      ]);

      const order = orderResult.rows[0];

      // Create order items and update inventory
      for (const item of cartItems) {
        const orderItemId = uuidv4();
        
        // Create order item
        await client.query(`
          INSERT INTO order_items (
            order_item_id, order_id, product_id, product_name, product_brand, product_sku,
            product_image_url, product_price, sale_price, quantity, line_total, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          orderItemId, orderId, item.product_id, item.product_name, item.product_brand,
          item.product_sku, item.product_image_url, item.product_price, item.sale_price,
          item.quantity, item.line_total, now
        ]);

        // Update product inventory
        const inventoryResult = await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1, sales_count = sales_count + $2, updated_at = $3 WHERE product_id = $4 RETURNING stock_quantity',
          [item.quantity, item.quantity, now, item.product_id]
        );

        // Create inventory adjustment record
        const adjustmentId = uuidv4();
        await client.query(`
          INSERT INTO inventory_adjustments (
            adjustment_id, product_id, adjustment_type, quantity_change, old_quantity,
            new_quantity, reason, created_at
          ) VALUES ($1, $2, 'sale', $3, $4, $5, $6, $7)
        `, [
          adjustmentId, item.product_id, -item.quantity,
          inventoryResult.rows[0].stock_quantity + item.quantity,
          inventoryResult.rows[0].stock_quantity,
          `Order #${orderNumber}`, now
        ]);
      }

      // Create initial order status history
      const statusHistoryId = uuidv4();
      await client.query(`
        INSERT INTO order_status_history (status_history_id, order_id, old_status, new_status, notes, created_at)
        VALUES ($1, $2, NULL, 'pending', 'Order placed', $3)
      `, [statusHistoryId, orderId, now]);

      // Clear cart for authenticated users
      if (userId) {
        await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
      }

      await client.query('COMMIT');

      // Send order confirmation email
      await sendOrderNotification({
        type: 'order_confirmation',
        recipient: validatedData.guest_email || req.user?.email,
        orderData: order,
        templateData: { orderItems: cartItems }
      });

      // Get complete order with items for response
      const completeOrderResult = await client.query(`
        SELECT o.*,
               array_agg(DISTINCT jsonb_build_object(
                 'order_item_id', oi.order_item_id,
                 'product_id', oi.product_id,
                 'product_name', oi.product_name,
                 'product_brand', oi.product_brand,
                 'product_sku', oi.product_sku,
                 'product_image_url', oi.product_image_url,
                 'product_price', oi.product_price,
                 'sale_price', oi.sale_price,
                 'quantity', oi.quantity,
                 'line_total', oi.line_total
               )) FILTER (WHERE oi.order_item_id IS NOT NULL) as order_items
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.order_id = $1
        GROUP BY o.order_id
      `, [orderId]);

      res.status(201).json(completeOrderResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    console.error('Create order error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get order details by ID with complete information
  Returns order with items, addresses, and status history
*/
app.get('/api/orders/:order_id', optionalAuth, async (req, res) => {
  try {
    const { order_id } = req.params;
    const userId = req.user?.user_id;

    const client = await pool.connect();
    
    try {
      let query = `
        SELECT o.*,
               array_agg(DISTINCT jsonb_build_object(
                 'order_item_id', oi.order_item_id,
                 'product_id', oi.product_id,
                 'product_name', oi.product_name,
                 'product_brand', oi.product_brand,
                 'product_sku', oi.product_sku,
                 'product_image_url', oi.product_image_url,
                 'product_price', oi.product_price,
                 'sale_price', oi.sale_price,
                 'quantity', oi.quantity,
                 'line_total', oi.line_total
               )) FILTER (WHERE oi.order_item_id IS NOT NULL) as order_items
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.order_id = $1
      `;
      
      const queryParams = [order_id];
      
      // If authenticated user, verify ownership
      if (userId) {
        query += ' AND o.user_id = $2';
        queryParams.push(userId);
      }
      
      query += ' GROUP BY o.order_id';

      const result = await client.query(query, queryParams);

      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Order not found', null, 'ORDER_NOT_FOUND'));
      }

      const order = result.rows[0];

      // Get shipping and billing addresses
      const shippingAddressResult = await client.query(
        'SELECT * FROM addresses WHERE address_id = $1',
        [order.shipping_address_id]
      );
      
      const billingAddressResult = await client.query(
        'SELECT * FROM addresses WHERE address_id = $1',
        [order.billing_address_id]
      );

      order.shipping_address = shippingAddressResult.rows[0] || null;
      order.billing_address = billingAddressResult.rows[0] || null;

      res.json(order);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ============================================================================
// USER PROFILE ENDPOINTS
// ============================================================================

/*
  Get user profile information
  Returns current user account details
*/
app.get('/api/user/profile', authenticateToken, (req, res) => {
  res.json(req.user);
});

/*
  Update user profile information
  Allows updating personal details while preserving account security
*/
app.patch('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, phone, email } = req.body;
    const userId = req.user.user_id;

    const client = await pool.connect();
    
    try {
      const updates = [];
      const values = [];
      let paramCount = 0;

      if (first_name !== undefined) {
        paramCount++;
        updates.push(`first_name = $${paramCount}`);
        values.push(first_name);
      }

      if (last_name !== undefined) {
        paramCount++;
        updates.push(`last_name = $${paramCount}`);
        values.push(last_name);
      }

      if (phone !== undefined) {
        paramCount++;
        updates.push(`phone = $${paramCount}`);
        values.push(phone);
      }

      if (email !== undefined) {
        // Check email uniqueness
        const emailCheckResult = await client.query(
          'SELECT user_id FROM users WHERE email = $1 AND user_id != $2',
          [email.toLowerCase(), userId]
        );

        if (emailCheckResult.rows.length > 0) {
          return res.status(409).json(createErrorResponse('Email already in use by another account', null, 'EMAIL_ALREADY_EXISTS'));
        }

        paramCount++;
        updates.push(`email = $${paramCount}`);
        values.push(email.toLowerCase());
      }

      if (updates.length === 0) {
        return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATES_PROVIDED'));
      }

      paramCount++;
      updates.push(`updated_at = $${paramCount}`);
      values.push(new Date().toISOString());

      paramCount++;
      values.push(userId);

      const query = `
        UPDATE users SET ${updates.join(', ')} 
        WHERE user_id = $${paramCount}
        RETURNING user_id, email, first_name, last_name, phone, email_verified, is_active, created_at, updated_at
      `;

      const result = await client.query(query, values);

      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Change user password
  Updates password with current password validation
*/
app.post('/api/user/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.user_id;

    if (!current_password || !new_password) {
      return res.status(400).json(createErrorResponse('Current password and new password are required', null, 'MISSING_PASSWORDS'));
    }

    const client = await pool.connect();
    
    try {
      // Verify current password
      const userResult = await client.query(
        'SELECT password_hash FROM users WHERE user_id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
      }

      const user = userResult.rows[0];

      // Direct password comparison for development
      if (current_password !== user.password_hash) {
        return res.status(400).json(createErrorResponse('Current password is incorrect', null, 'INVALID_CURRENT_PASSWORD'));
      }

      // Update password (storing directly as specified for development)
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = $2 WHERE user_id = $3',
        [new_password, new Date().toISOString(), userId]
      );

      res.json({ message: 'Password changed successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ============================================================================
// ADDRESS ENDPOINTS
// ============================================================================

/*
  Get user addresses with optional type filtering
  Returns saved shipping and billing addresses
*/
app.get('/api/user/addresses', authenticateToken, async (req, res) => {
  try {
    const { type } = req.query;
    const userId = req.user.user_id;

    const client = await pool.connect();
    
    try {
      let query = 'SELECT * FROM addresses WHERE user_id = $1';
      const queryParams = [userId];
      
      if (type) {
        query += ' AND type = $2';
        queryParams.push(type);
      }
      
      query += ' ORDER BY is_default DESC, created_at DESC';

      const result = await client.query(query, queryParams);

      res.json({ addresses: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  @@@need:external-api: Address validation service to verify postal codes, format addresses correctly, and provide geocoding capabilities for shipping calculations
*/
async function validateAddress(addressData) {
  // Mock address validation - returns success for development
  console.log(`Mock: Validating address for ${addressData.city}, ${addressData.state_province}`);
  return {
    valid: true,
    formatted_address: addressData,
    suggestions: [],
    validatedAt: new Date().toISOString()
  };
}

/*
  Create new address with validation and default management
  Handles address validation and default address logic
*/
app.post('/api/user/addresses', authenticateToken, async (req, res) => {
  try {
    const validatedData = createAddressInputSchema.parse({
      ...req.body,
      user_id: req.user.user_id
    });

    // Validate address format
    const validationResult = await validateAddress(validatedData);
    if (!validationResult.valid) {
      return res.status(400).json(createErrorResponse('Invalid address format', validationResult, 'INVALID_ADDRESS'));
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // If setting as default, unset other default addresses of same type
      if (validatedData.is_default) {
        await client.query(
          'UPDATE addresses SET is_default = false WHERE user_id = $1 AND type = $2',
          [validatedData.user_id, validatedData.type]
        );
      }

      const addressId = uuidv4();
      const now = new Date().toISOString();

      const result = await client.query(`
        INSERT INTO addresses (
          address_id, user_id, type, first_name, last_name, street_address_1, street_address_2,
          city, state_province, postal_code, country, phone, is_default, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `, [
        addressId, validatedData.user_id, validatedData.type, validatedData.first_name,
        validatedData.last_name, validatedData.street_address_1, validatedData.street_address_2,
        validatedData.city, validatedData.state_province, validatedData.postal_code,
        validatedData.country, validatedData.phone, validatedData.is_default, now, now
      ]);

      await client.query('COMMIT');

      res.status(201).json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    console.error('Create address error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get address by ID with ownership verification
  Returns specific address details for authenticated user
*/
app.get('/api/user/addresses/:address_id', authenticateToken, async (req, res) => {
  try {
    const { address_id } = req.params;
    const userId = req.user.user_id;

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM addresses WHERE address_id = $1 AND user_id = $2',
        [address_id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Address not found', null, 'ADDRESS_NOT_FOUND'));
      }

      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update address with validation and default management
  Allows modification of existing address details
*/
app.patch('/api/user/addresses/:address_id', authenticateToken, async (req, res) => {
  try {
    const { address_id } = req.params;
    const userId = req.user.user_id;
    const validatedData = updateAddressInputSchema.parse({
      ...req.body,
      address_id
    });

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verify address ownership
      const ownershipResult = await client.query(
        'SELECT type FROM addresses WHERE address_id = $1 AND user_id = $2',
        [address_id, userId]
      );

      if (ownershipResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Address not found', null, 'ADDRESS_NOT_FOUND'));
      }

      const existingAddress = ownershipResult.rows[0];

      // If setting as default, unset other default addresses of same type
      if (validatedData.is_default) {
        const addressType = validatedData.type || existingAddress.type;
        await client.query(
          'UPDATE addresses SET is_default = false WHERE user_id = $1 AND type = $2 AND address_id != $3',
          [userId, addressType, address_id]
        );
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 0;

      const updateableFields = [
        'type', 'first_name', 'last_name', 'street_address_1', 'street_address_2',
        'city', 'state_province', 'postal_code', 'country', 'phone', 'is_default'
      ];

      updateableFields.forEach(field => {
        if (validatedData[field] !== undefined) {
          paramCount++;
          updates.push(`${field} = $${paramCount}`);
          values.push(validatedData[field]);
        }
      });

      if (updates.length === 0) {
        return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATES_PROVIDED'));
      }

      paramCount++;
      updates.push(`updated_at = $${paramCount}`);
      values.push(new Date().toISOString());

      paramCount++;
      values.push(address_id);

      paramCount++;
      values.push(userId);

      const query = `
        UPDATE addresses SET ${updates.join(', ')} 
        WHERE address_id = $${paramCount - 1} AND user_id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);

      await client.query('COMMIT');

      res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    console.error('Update address error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Delete address with ownership verification
  Removes address from user account
*/
app.delete('/api/user/addresses/:address_id', authenticateToken, async (req, res) => {
  try {
    const { address_id } = req.params;
    const userId = req.user.user_id;

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'DELETE FROM addresses WHERE address_id = $1 AND user_id = $2 RETURNING address_id',
        [address_id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Address not found', null, 'ADDRESS_NOT_FOUND'));
      }

      res.status(204).send();
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Set address as default for its type
  Updates default designation with proper type management
*/
app.patch('/api/user/addresses/:address_id/set-default', authenticateToken, async (req, res) => {
  try {
    const { address_id } = req.params;
    const userId = req.user.user_id;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get address type and verify ownership
      const addressResult = await client.query(
        'SELECT type FROM addresses WHERE address_id = $1 AND user_id = $2',
        [address_id, userId]
      );

      if (addressResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Address not found', null, 'ADDRESS_NOT_FOUND'));
      }

      const addressType = addressResult.rows[0].type;

      // Unset current default for this type
      await client.query(
        'UPDATE addresses SET is_default = false WHERE user_id = $1 AND type = $2',
        [userId, addressType]
      );

      // Set new default
      const result = await client.query(
        'UPDATE addresses SET is_default = true, updated_at = $1 WHERE address_id = $2 AND user_id = $3 RETURNING *',
        [new Date().toISOString(), address_id, userId]
      );

      await client.query('COMMIT');

      res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ============================================================================
// WISHLIST ENDPOINTS
// ============================================================================

/*
  Get user wishlist items with product details
  Returns saved products with current pricing and availability
*/
app.get('/api/wishlist', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user.user_id;

    const client = await pool.connect();
    
    try {
      const query = `
        SELECT wi.*, 
               p.name, p.brand, p.price, p.sale_price, p.stock_quantity, p.is_active,
               pi.image_url, pi.alt_text
        FROM wishlist_items wi
        JOIN products p ON wi.product_id = p.product_id
        LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = true
        WHERE wi.user_id = $1 AND p.is_active = true
        ORDER BY wi.added_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await client.query(query, [userId, parseInt(limit), parseInt(offset)]);

      // Get total count
      const countResult = await client.query(
        'SELECT COUNT(*) as total FROM wishlist_items wi JOIN products p ON wi.product_id = p.product_id WHERE wi.user_id = $1 AND p.is_active = true',
        [userId]
      );

      const total = parseInt(countResult.rows[0].total);

      const items = result.rows.map(item => ({
        wishlist_item_id: item.wishlist_item_id,
        user_id: item.user_id,
        product_id: item.product_id,
        added_at: item.added_at,
        product: {
          name: item.name,
          brand: item.brand,
          price: parseFloat(item.price),
          sale_price: item.sale_price ? parseFloat(item.sale_price) : null,
          stock_quantity: item.stock_quantity,
          is_active: item.is_active,
          images: item.image_url ? [{
            image_url: item.image_url,
            alt_text: item.alt_text,
            is_primary: true
          }] : []
        }
      }));

      res.json({
        items,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: offset + limit < total
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Add product to wishlist with duplicate prevention
  Saves product for later purchase consideration
*/
app.post('/api/wishlist', authenticateToken, async (req, res) => {
  try {
    const validatedData = createWishlistItemInputSchema.parse({
      ...req.body,
      user_id: req.user.user_id
    });

    const client = await pool.connect();
    
    try {
      // Check if product exists and is active
      const productResult = await client.query(
        'SELECT product_id FROM products WHERE product_id = $1 AND is_active = true',
        [validatedData.product_id]
      );

      if (productResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Product not found or inactive', null, 'PRODUCT_NOT_FOUND'));
      }

      // Check if already in wishlist
      const existingResult = await client.query(
        'SELECT wishlist_item_id FROM wishlist_items WHERE user_id = $1 AND product_id = $2',
        [validatedData.user_id, validatedData.product_id]
      );

      if (existingResult.rows.length > 0) {
        return res.status(409).json(createErrorResponse('Product already in wishlist', null, 'ALREADY_IN_WISHLIST'));
      }

      // Add to wishlist
      const wishlistItemId = uuidv4();
      const now = new Date().toISOString();

      const result = await client.query(`
        INSERT INTO wishlist_items (wishlist_item_id, user_id, product_id, added_at)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [wishlistItemId, validatedData.user_id, validatedData.product_id, now]);

      // Get product details for response
      const productDetailResult = await client.query(`
        SELECT p.*, pi.image_url, pi.alt_text
        FROM products p
        LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = true
        WHERE p.product_id = $1
      `, [validatedData.product_id]);

      const product = productDetailResult.rows[0];

      const response = {
        ...result.rows[0],
        product: {
          name: product.name,
          brand: product.brand,
          price: parseFloat(product.price),
          sale_price: product.sale_price ? parseFloat(product.sale_price) : null,
          stock_quantity: product.stock_quantity,
          is_active: product.is_active,
          images: product.image_url ? [{
            image_url: product.image_url,
            alt_text: product.alt_text,
            is_primary: true
          }] : []
        }
      };

      res.status(201).json(response);
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    console.error('Add to wishlist error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Remove product from wishlist by wishlist item ID
  Deletes specific wishlist entry
*/
app.delete('/api/wishlist/:wishlist_item_id', authenticateToken, async (req, res) => {
  try {
    const { wishlist_item_id } = req.params;
    const userId = req.user.user_id;

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'DELETE FROM wishlist_items WHERE wishlist_item_id = $1 AND user_id = $2 RETURNING wishlist_item_id',
        [wishlist_item_id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Wishlist item not found', null, 'WISHLIST_ITEM_NOT_FOUND'));
      }

      res.status(204).send();
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Remove product from wishlist by product ID
  Alternative removal method using product identifier
*/
app.delete('/api/wishlist/product/:product_id', authenticateToken, async (req, res) => {
  try {
    const { product_id } = req.params;
    const userId = req.user.user_id;

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'DELETE FROM wishlist_items WHERE product_id = $1 AND user_id = $2 RETURNING wishlist_item_id',
        [product_id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Product not found in wishlist', null, 'PRODUCT_NOT_IN_WISHLIST'));
      }

      res.status(204).send();
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Remove product from wishlist error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ============================================================================
// PRODUCT REVIEW ENDPOINTS
// ============================================================================

/*
  Get product reviews with filtering and statistics
  Returns reviews with rating breakdown and pagination
*/
app.get('/api/products/:product_id/reviews', async (req, res) => {
  try {
    const { product_id } = req.params;
    const { rating, is_verified_purchase, limit = 20, offset = 0 } = req.query;

    const client = await pool.connect();
    
    try {
      // Verify product exists
      const productResult = await client.query(
        'SELECT product_id FROM products WHERE product_id = $1 AND is_active = true',
        [product_id]
      );

      if (productResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Product not found', null, 'PRODUCT_NOT_FOUND'));
      }

      let query = `
        SELECT pr.*, u.first_name, u.last_name
        FROM product_reviews pr
        JOIN users u ON pr.user_id = u.user_id
        WHERE pr.product_id = $1 AND pr.is_approved = true
      `;
      
      const queryParams = [product_id];
      let paramCount = 1;

      if (rating) {
        paramCount++;
        query += ` AND pr.rating = $${paramCount}`;
        queryParams.push(parseInt(rating));
      }

      if (is_verified_purchase !== undefined) {
        paramCount++;
        query += ` AND pr.is_verified_purchase = $${paramCount}`;
        queryParams.push(is_verified_purchase === 'true');
      }

      query += ` ORDER BY pr.created_at DESC`;
      
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      queryParams.push(parseInt(limit));
      
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      queryParams.push(parseInt(offset));

      const result = await client.query(query, queryParams);

      // Get review statistics
      const statsResult = await client.query(`
        SELECT 
          COALESCE(AVG(rating), 0) as average_rating,
          COUNT(*) as total_reviews,
          COUNT(*) FILTER (WHERE rating = 1) as rating_1_count,
          COUNT(*) FILTER (WHERE rating = 2) as rating_2_count,
          COUNT(*) FILTER (WHERE rating = 3) as rating_3_count,
          COUNT(*) FILTER (WHERE rating = 4) as rating_4_count,
          COUNT(*) FILTER (WHERE rating = 5) as rating_5_count
        FROM product_reviews 
        WHERE product_id = $1 AND is_approved = true
      `, [product_id]);

      const stats = statsResult.rows[0];

      // Format reviews for response
      const reviews = result.rows.map(review => ({
        ...review,
        reviewer_name: `${review.first_name} ${review.last_name.charAt(0)}.`
      }));

      res.json({
        reviews,
        total: parseInt(stats.total_reviews),
        average_rating: parseFloat(stats.average_rating),
        rating_breakdown: {
          1: parseInt(stats.rating_1_count),
          2: parseInt(stats.rating_2_count),
          3: parseInt(stats.rating_3_count),
          4: parseInt(stats.rating_4_count),
          5: parseInt(stats.rating_5_count)
        },
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: offset + limit < parseInt(stats.total_reviews)
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create product review with purchase verification
  Allows authenticated users to review purchased products
*/
app.post('/api/products/:product_id/reviews', authenticateToken, async (req, res) => {
  try {
    const { product_id } = req.params;
    const validatedData = createProductReviewInputSchema.parse({
      ...req.body,
      product_id,
      user_id: req.user.user_id
    });

    const client = await pool.connect();
    
    try {
      // Verify product exists
      const productResult = await client.query(
        'SELECT product_id FROM products WHERE product_id = $1 AND is_active = true',
        [product_id]
      );

      if (productResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Product not found', null, 'PRODUCT_NOT_FOUND'));
      }

      // Check if user has purchased this product
      let isVerifiedPurchase = false;
      let verifiedOrderId = null;

      if (validatedData.order_id) {
        const purchaseResult = await client.query(`
          SELECT o.order_id
          FROM orders o
          JOIN order_items oi ON o.order_id = oi.order_id
          WHERE o.user_id = $1 AND oi.product_id = $2 AND o.order_id = $3 AND o.status = 'delivered'
        `, [validatedData.user_id, product_id, validatedData.order_id]);

        if (purchaseResult.rows.length > 0) {
          isVerifiedPurchase = true;
          verifiedOrderId = validatedData.order_id;
        }
      } else {
        // Check any purchase
        const anyPurchaseResult = await client.query(`
          SELECT o.order_id
          FROM orders o
          JOIN order_items oi ON o.order_id = oi.order_id
          WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status = 'delivered'
          LIMIT 1
        `, [validatedData.user_id, product_id]);

        if (anyPurchaseResult.rows.length > 0) {
          isVerifiedPurchase = true;
          verifiedOrderId = anyPurchaseResult.rows[0].order_id;
        }
      }

      // Check if user already reviewed this product
      const existingReviewResult = await client.query(
        'SELECT review_id FROM product_reviews WHERE user_id = $1 AND product_id = $2',
        [validatedData.user_id, product_id]
      );

      if (existingReviewResult.rows.length > 0) {
        return res.status(409).json(createErrorResponse('You have already reviewed this product', null, 'REVIEW_ALREADY_EXISTS'));
      }

      // Create review
      const reviewId = uuidv4();
      const now = new Date().toISOString();

      const result = await client.query(`
        INSERT INTO product_reviews (
          review_id, product_id, user_id, order_id, rating, title, comment,
          is_verified_purchase, is_approved, helpful_votes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, 0, $9, $10)
        RETURNING *
      `, [
        reviewId, product_id, validatedData.user_id, verifiedOrderId,
        validatedData.rating, validatedData.title, validatedData.comment,
        isVerifiedPurchase, now, now
      ]);

      res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    console.error('Create review error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ============================================================================
// SHIPPING AND PROMO CODE ENDPOINTS
// ============================================================================

/*
  Get available shipping methods
  Returns active shipping options with costs and timing
*/
app.get('/api/shipping-methods', async (req, res) => {
  try {
    const { is_active = true } = req.query;

    const client = await pool.connect();
    
    try {
      let query = 'SELECT * FROM shipping_methods';
      const queryParams = [];
      
      if (is_active !== undefined) {
        query += ' WHERE is_active = $1';
        queryParams.push(is_active === 'true');
      }
      
      query += ' ORDER BY display_order ASC, cost ASC';

      const result = await client.query(query, queryParams);

      res.json({ shipping_methods: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get shipping methods error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Validate promo code and calculate discount
  Checks code validity and applies business rules for discounts
*/
app.post('/api/promo-codes/validate', async (req, res) => {
  try {
    const { code, order_amount } = req.body;

    if (!code || order_amount === undefined) {
      return res.status(400).json(createErrorResponse('Code and order amount are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM promo_codes WHERE code = $1 AND is_active = true',
        [code.toUpperCase()]
      );

      if (result.rows.length === 0) {
        return res.json({
          valid: false,
          message: 'Invalid promo code'
        });
      }

      const promoCode = result.rows[0];
      const now = new Date();
      const startsAt = new Date(promoCode.starts_at);
      const expiresAt = promoCode.expires_at ? new Date(promoCode.expires_at) : null;

      // Check if code is active based on dates
      if (now < startsAt) {
        return res.json({
          valid: false,
          message: 'Promo code is not yet active'
        });
      }

      if (expiresAt && now > expiresAt) {
        return res.json({
          valid: false,
          message: 'Promo code has expired'
        });
      }

      // Check usage limit
      if (promoCode.usage_limit && promoCode.usage_count >= promoCode.usage_limit) {
        return res.json({
          valid: false,
          message: 'Promo code usage limit reached'
        });
      }

      // Check minimum order amount
      if (promoCode.minimum_order_amount && order_amount < promoCode.minimum_order_amount) {
        return res.json({
          valid: false,
          message: `Minimum order amount of $${promoCode.minimum_order_amount} required`
        });
      }

      // Calculate discount
      let discountAmount = 0;
      
      switch (promoCode.discount_type) {
        case 'percentage':
          discountAmount = (order_amount * promoCode.discount_value) / 100;
          if (promoCode.maximum_discount_amount && discountAmount > promoCode.maximum_discount_amount) {
            discountAmount = promoCode.maximum_discount_amount;
          }
          break;
        case 'fixed':
          discountAmount = Math.min(promoCode.discount_value, order_amount);
          break;
        case 'shipping':
          discountAmount = promoCode.discount_value; // This would be applied to shipping cost
          break;
      }

      const finalAmount = Math.max(0, order_amount - discountAmount);

      res.json({
        valid: true,
        promo_code: promoCode,
        discount_amount: discountAmount,
        final_amount: finalAmount
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Validate promo code error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ============================================================================
// CONTACT AND NEWSLETTER ENDPOINTS
// ============================================================================

/*
  Submit contact form message
  Processes customer support inquiries and feedback
*/
app.post('/api/contact', async (req, res) => {
  try {
    const validatedData = createContactMessageInputSchema.parse(req.body);

    const client = await pool.connect();
    
    try {
      const messageId = uuidv4();
      const now = new Date().toISOString();

      const result = await client.query(`
        INSERT INTO contact_messages (
          message_id, name, email, phone, subject, message, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'new', $7, $8)
        RETURNING *
      `, [
        messageId, validatedData.name, validatedData.email, validatedData.phone,
        validatedData.subject, validatedData.message, now, now
      ]);

      res.status(201).json({
        message: 'Contact message submitted successfully',
        contact_message: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    console.error('Submit contact message error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Subscribe to newsletter
  Manages email subscription with duplicate prevention
*/
app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const validatedData = createNewsletterSubscriptionInputSchema.parse(req.body);

    const client = await pool.connect();
    
    try {
      // Check if email already exists
      const existingResult = await client.query(
        'SELECT subscription_id, is_active FROM newsletter_subscriptions WHERE email = $1',
        [validatedData.email.toLowerCase()]
      );

      if (existingResult.rows.length > 0) {
        const existing = existingResult.rows[0];
        
        if (existing.is_active) {
          return res.status(409).json(createErrorResponse('Email is already subscribed to newsletter', null, 'ALREADY_SUBSCRIBED'));
        } else {
          // Reactivate subscription
          const result = await client.query(
            'UPDATE newsletter_subscriptions SET is_active = true, subscribed_at = $1, unsubscribed_at = NULL WHERE subscription_id = $2 RETURNING *',
            [new Date().toISOString(), existing.subscription_id]
          );

          return res.status(201).json({
            message: 'Successfully resubscribed to newsletter',
            subscription: result.rows[0]
          });
        }
      }

      // Create new subscription
      const subscriptionId = uuidv4();
      const now = new Date().toISOString();

      const result = await client.query(`
        INSERT INTO newsletter_subscriptions (subscription_id, email, is_active, subscribed_at)
        VALUES ($1, $2, true, $3)
        RETURNING *
      `, [subscriptionId, validatedData.email.toLowerCase(), now]);

      res.status(201).json({
        message: 'Successfully subscribed to newsletter',
        subscription: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    console.error('Newsletter subscribe error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Unsubscribe from newsletter
  Processes newsletter unsubscription requests
*/
app.post('/api/newsletter/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(createErrorResponse('Email is required', null, 'MISSING_EMAIL'));
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'UPDATE newsletter_subscriptions SET is_active = false, unsubscribed_at = $1 WHERE email = $2 AND is_active = true RETURNING subscription_id',
        [new Date().toISOString(), email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Email not found in newsletter subscriptions', null, 'EMAIL_NOT_SUBSCRIBED'));
      }

      res.json({ message: 'Successfully unsubscribed from newsletter' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ============================================================================
// ADMIN AUTHENTICATION ENDPOINTS
// ============================================================================

/*
  Admin login endpoint
  Authenticates admin users with role-based permissions
*/
app.post('/api/admin/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json(createErrorResponse('Username and password are required', null, 'MISSING_CREDENTIALS'));
    }

    const client = await pool.connect();
    
    try {
      // Find admin user
      const result = await client.query(
        'SELECT * FROM admin_users WHERE username = $1 AND is_active = true',
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json(createErrorResponse('Invalid credentials', null, 'INVALID_ADMIN_CREDENTIALS'));
      }

      const admin = result.rows[0];

      // Direct password comparison for development
      if (password !== admin.password_hash) {
        return res.status(401).json(createErrorResponse('Invalid credentials', null, 'INVALID_ADMIN_CREDENTIALS'));
      }

      // Generate admin JWT token
      const token = jwt.sign(
        { admin_id: admin.admin_id, username: admin.username, role: admin.role }, 
        JWT_SECRET, 
        { expiresIn: '8h' }
      );

      // Create admin session
      const sessionId = uuidv4();
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();
      
      await client.query(`
        INSERT INTO admin_sessions (admin_session_id, admin_id, token_hash, expires_at, ip_address, user_agent, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, true, $7)
      `, [sessionId, admin.admin_id, token, expiresAt, req.ip, req.get('User-Agent'), now]);

      // Remove password from response
      delete admin.password_hash;

      res.json({
        admin,
        token,
        expires_at: expiresAt
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get current authenticated admin
  Returns admin profile information
*/
app.get('/api/admin/auth/me', authenticateAdmin, (req, res) => {
  res.json(req.admin);
});

/*
  Admin logout endpoint
  Invalidates current admin session
*/
app.post('/api/admin/auth/logout', authenticateAdmin, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    const client = await pool.connect();
    
    try {
      await client.query(
        'UPDATE admin_sessions SET is_active = false WHERE token_hash = $1',
        [token]
      );

      res.json({ message: 'Admin logout successful' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ============================================================================
// ADMIN PRODUCT MANAGEMENT ENDPOINTS
// ============================================================================

/*
  Get all products for admin management
  Returns products with comprehensive details for administrative operations
*/
app.get('/api/admin/products', authenticateAdmin, async (req, res) => {
  try {
    const {
      search_query,
      is_active,
      is_featured,
      category_id,
      limit = 20,
      offset = 0
    } = req.query;

    const client = await pool.connect();
    
    try {
      let query = `
        SELECT DISTINCT p.*, 
               array_agg(DISTINCT jsonb_build_object(
                 'image_id', pi.image_id,
                 'image_url', pi.image_url,
                 'alt_text', pi.alt_text,
                 'display_order', pi.display_order,
                 'is_primary', pi.is_primary
               ) ORDER BY pi.display_order, pi.created_at) FILTER (WHERE pi.image_id IS NOT NULL) as images
        FROM products p
        LEFT JOIN product_images pi ON p.product_id = pi.product_id
        WHERE 1=1
      `;
      
      const queryParams = [];
      let paramCount = 0;

      if (search_query) {
        paramCount++;
        query += ` AND (p.name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount} OR p.brand ILIKE $${paramCount})`;
        queryParams.push(`%${search_query}%`);
      }

      if (is_active !== undefined) {
        paramCount++;
        query += ` AND p.is_active = $${paramCount}`;
        queryParams.push(is_active === 'true');
      }

      if (is_featured !== undefined) {
        paramCount++;
        query += ` AND p.is_featured = $${paramCount}`;
        queryParams.push(is_featured === 'true');
      }

      if (category_id) {
        paramCount++;
        query += ` AND p.category_id = $${paramCount}`;
        queryParams.push(category_id);
      }

      query += ` GROUP BY p.product_id ORDER BY p.created_at DESC`;
      
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      queryParams.push(parseInt(limit));
      
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      queryParams.push(parseInt(offset));

      const result = await client.query(query, queryParams);

      // Get total count
      let countQuery = 'SELECT COUNT(DISTINCT p.product_id) as total FROM products p WHERE 1=1';
      let countParams = [];
      let countParamIndex = 0;

      if (search_query) {
        countParamIndex++;
        countQuery += ` AND (p.name ILIKE $${countParamIndex} OR p.sku ILIKE $${countParamIndex} OR p.brand ILIKE $${countParamIndex})`;
        countParams.push(`%${search_query}%`);
      }

      if (is_active !== undefined) {
        countParamIndex++;
        countQuery += ` AND p.is_active = $${countParamIndex}`;
        countParams.push(is_active === 'true');
      }

      if (is_featured !== undefined) {
        countParamIndex++;
        countQuery += ` AND p.is_featured = $${countParamIndex}`;
        countParams.push(is_featured === 'true');
      }

      if (category_id) {
        countParamIndex++;
        countQuery += ` AND p.category_id = $${countParamIndex}`;
        countParams.push(category_id);
      }

      const countResult = await client.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      res.json({
        products: result.rows,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: offset + limit < total
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin get products error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create new product with business rule validation
  Enforces 5-product maximum constraint and creates complete product record
*/
app.post('/api/admin/products', authenticateAdmin, async (req, res) => {
  try {
    const validatedData = createProductInputSchema.parse(req.body);

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check maximum 5 products constraint
      const productCountResult = await client.query('SELECT COUNT(*) as count FROM products WHERE is_active = true');
      const activeProductCount = parseInt(productCountResult.rows[0].count);

      if (activeProductCount >= 5) {
        return res.status(400).json(createErrorResponse('Maximum of 5 active products allowed', null, 'MAX_PRODUCTS_EXCEEDED'));
      }

      // Check SKU uniqueness
      const skuCheckResult = await client.query('SELECT product_id FROM products WHERE sku = $1', [validatedData.sku]);
      if (skuCheckResult.rows.length > 0) {
        return res.status(409).json(createErrorResponse('SKU already exists', null, 'SKU_ALREADY_EXISTS'));
      }

      const productId = uuidv4();
      const now = new Date().toISOString();

      // Create product
      const result = await client.query(`
        INSERT INTO products (
          product_id, name, description, price, sale_price, stock_quantity, sku, brand,
          fragrance_notes_top, fragrance_notes_middle, fragrance_notes_base, size_volume,
          category_id, is_active, is_featured, meta_title, meta_description,
          view_count, sales_count, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, false, $14, $15, 0, 0, $16, $17)
        RETURNING *
      `, [
        productId, validatedData.name, validatedData.description, validatedData.price,
        validatedData.sale_price, validatedData.stock_quantity, validatedData.sku,
        validatedData.brand, JSON.stringify(validatedData.fragrance_notes_top),
        JSON.stringify(validatedData.fragrance_notes_middle), JSON.stringify(validatedData.fragrance_notes_base),
        validatedData.size_volume, validatedData.category_id, validatedData.meta_title,
        validatedData.meta_description, now, now
      ]);

      // Create initial inventory adjustment
      if (validatedData.stock_quantity > 0) {
        const adjustmentId = uuidv4();
        await client.query(`
          INSERT INTO inventory_adjustments (
            adjustment_id, product_id, adjustment_type, quantity_change, old_quantity,
            new_quantity, reason, admin_id, created_at
          ) VALUES ($1, $2, 'restock', $3, 0, $4, 'Initial stock setup', $5, $6)
        `, [adjustmentId, productId, validatedData.stock_quantity, validatedData.stock_quantity, req.admin.admin_id, now]);
      }

      await client.query('COMMIT');

      const product = result.rows[0];
      product.images = [];

      res.status(201).json(product);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    console.error('Admin create product error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get product details for admin management
  Returns comprehensive product information for administrative editing
*/
app.get('/api/admin/products/:product_id', authenticateAdmin, async (req, res) => {
  try {
    const { product_id } = req.params;

    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT p.*, 
               array_agg(DISTINCT jsonb_build_object(
                 'image_id', pi.image_id,
                 'image_url', pi.image_url,
                 'alt_text', pi.alt_text,
                 'display_order', pi.display_order,
                 'is_primary', pi.is_primary
               ) ORDER BY pi.display_order, pi.created_at) FILTER (WHERE pi.image_id IS NOT NULL) as images
        FROM products p
        LEFT JOIN product_images pi ON p.product_id = pi.product_id
        WHERE p.product_id = $1
        GROUP BY p.product_id
      `, [product_id]);

      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Product not found', null, 'PRODUCT_NOT_FOUND'));
      }

      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin get product error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update product with validation and audit trail
  Allows modification of product details with change tracking
*/
app.patch('/api/admin/products/:product_id', authenticateAdmin, async (req, res) => {
  try {
    const { product_id } = req.params;
    const validatedData = updateProductInputSchema.parse({
      ...req.body,
      product_id
    });

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verify product exists
      const existingResult = await client.query('SELECT * FROM products WHERE product_id = $1', [product_id]);
      if (existingResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Product not found', null, 'PRODUCT_NOT_FOUND'));
      }

      const existingProduct = existingResult.rows[0];

      // Check SKU uniqueness if changing
      if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
        const skuCheckResult = await client.query('SELECT product_id FROM products WHERE sku = $1 AND product_id != $2', [validatedData.sku, product_id]);
        if (skuCheckResult.rows.length > 0) {
          return res.status(409).json(createErrorResponse('SKU already exists', null, 'SKU_ALREADY_EXISTS'));
        }
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 0;

      const updateableFields = [
        'name', 'description', 'price', 'sale_price', 'stock_quantity', 'sku', 'brand',
        'fragrance_notes_top', 'fragrance_notes_middle', 'fragrance_notes_base',
        'size_volume', 'category_id', 'is_active', 'is_featured', 'meta_title', 'meta_description'
      ];

      updateableFields.forEach(field => {
        if (validatedData[field] !== undefined) {
          paramCount++;
          if (field.includes('fragrance_notes_')) {
            updates.push(`${field} = $${paramCount}`);
            values.push(JSON.stringify(validatedData[field]));
          } else {
            updates.push(`${field} = $${paramCount}`);
            values.push(validatedData[field]);
          }
        }
      });

      if (updates.length === 0) {
        return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATES_PROVIDED'));
      }

      paramCount++;
      updates.push(`updated_at = $${paramCount}`);
      values.push(new Date().toISOString());

      paramCount++;
      values.push(product_id);

      const query = `
        UPDATE products SET ${updates.join(', ')} 
        WHERE product_id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);

      // Handle inventory adjustment if stock_quantity changed
      if (validatedData.stock_quantity !== undefined && validatedData.stock_quantity !== existingProduct.stock_quantity) {
        const adjustmentId = uuidv4();
        const quantityChange = validatedData.stock_quantity - existingProduct.stock_quantity;
        const adjustmentType = quantityChange > 0 ? 'restock' : 'adjustment';
        
        await client.query(`
          INSERT INTO inventory_adjustments (
            adjustment_id, product_id, adjustment_type, quantity_change, old_quantity,
            new_quantity, reason, admin_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, 'Admin adjustment', $7, $8)
        `, [
          adjustmentId, product_id, adjustmentType, quantityChange,
          existingProduct.stock_quantity, validatedData.stock_quantity,
          req.admin.admin_id, new Date().toISOString()
        ]);
      }

      await client.query('COMMIT');

      // Get updated product with images
      const updatedResult = await client.query(`
        SELECT p.*, 
               array_agg(DISTINCT jsonb_build_object(
                 'image_id', pi.image_id,
                 'image_url', pi.image_url,
                 'alt_text', pi.alt_text,
                 'display_order', pi.display_order,
                 'is_primary', pi.is_primary
               ) ORDER BY pi.display_order, pi.created_at) FILTER (WHERE pi.image_id IS NOT NULL) as images
        FROM products p
        LEFT JOIN product_images pi ON p.product_id = pi.product_id
        WHERE p.product_id = $1
        GROUP BY p.product_id
      `, [product_id]);

      res.json(updatedResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    console.error('Admin update product error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Delete product with safety checks
  Removes product while preventing deletion of products with active orders
*/
app.delete('/api/admin/products/:product_id', authenticateAdmin, async (req, res) => {
  try {
    const { product_id } = req.params;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if product exists
      const productResult = await client.query('SELECT product_id FROM products WHERE product_id = $1', [product_id]);
      if (productResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Product not found', null, 'PRODUCT_NOT_FOUND'));
      }

      // Check if product has orders
      const orderResult = await client.query('SELECT order_item_id FROM order_items WHERE product_id = $1 LIMIT 1', [product_id]);
      if (orderResult.rows.length > 0) {
        return res.status(400).json(createErrorResponse('Cannot delete product with existing orders. Consider deactivating instead.', null, 'PRODUCT_HAS_ORDERS'));
      }

      // Delete related data
      await client.query('DELETE FROM product_images WHERE product_id = $1', [product_id]);
      await client.query('DELETE FROM cart_items WHERE product_id = $1', [product_id]);
      await client.query('DELETE FROM wishlist_items WHERE product_id = $1', [product_id]);
      await client.query('DELETE FROM product_reviews WHERE product_id = $1', [product_id]);
      await client.query('DELETE FROM inventory_adjustments WHERE product_id = $1', [product_id]);
      
      // Delete product
      await client.query('DELETE FROM products WHERE product_id = $1', [product_id]);

      await client.query('COMMIT');

      res.status(204).send();
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin delete product error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ============================================================================
// ADMIN PRODUCT IMAGE MANAGEMENT
// ============================================================================

/*
  @@@need:external-api: Image storage service for uploading, resizing, and serving product images with CDN delivery and image optimization capabilities
*/
async function uploadProductImage({ imageFile, productId, altText }) {
  // Mock image upload - returns success for development
  const mockImageUrl = `https://picsum.photos/400/400?random=${Date.now()}`;
  console.log(`Mock: Uploading image for product ${productId}`);
  return {
    success: true,
    imageUrl: mockImageUrl,
    imageId: `img_${Date.now()}`,
    uploadedAt: new Date().toISOString()
  };
}

/*
  Add product image with upload handling
  Manages product image gallery with proper ordering
*/
app.post('/api/admin/products/:product_id/images', authenticateAdmin, async (req, res) => {
  try {
    const { product_id } = req.params;
    const validatedData = createProductImageInputSchema.parse({
      ...req.body,
      product_id
    });

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verify product exists
      const productResult = await client.query('SELECT product_id FROM products WHERE product_id = $1', [product_id]);
      if (productResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Product not found', null, 'PRODUCT_NOT_FOUND'));
      }

      // Handle primary image logic
      if (validatedData.is_primary) {
        await client.query(
          'UPDATE product_images SET is_primary = false WHERE product_id = $1',
          [product_id]
        );
      }

      const imageId = uuidv4();
      const now = new Date().toISOString();

      const result = await client.query(`
        INSERT INTO product_images (
          image_id, product_id, image_url, alt_text, display_order, is_primary, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        imageId, product_id, validatedData.image_url, validatedData.alt_text,
        validatedData.display_order, validatedData.is_primary, now
      ]);

      await client.query('COMMIT');

      res.status(201).json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    console.error('Admin add product image error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update product image details
  Modifies image metadata and ordering
*/
app.patch('/api/admin/products/:product_id/images/:image_id', authenticateAdmin, async (req, res) => {
  try {
    const { product_id, image_id } = req.params;
    const validatedData = updateProductImageInputSchema.parse({
      ...req.body,
      image_id
    });

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verify image exists and belongs to product
      const imageResult = await client.query(
        'SELECT image_id FROM product_images WHERE image_id = $1 AND product_id = $2',
        [image_id, product_id]
      );

      if (imageResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Product image not found', null, 'IMAGE_NOT_FOUND'));
      }

      // Handle primary image logic
      if (validatedData.is_primary) {
        await client.query(
          'UPDATE product_images SET is_primary = false WHERE product_id = $1 AND image_id != $2',
          [product_id, image_id]
        );
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 0;

      const updateableFields = ['image_url', 'alt_text', 'display_order', 'is_primary'];

      updateableFields.forEach(field => {
        if (validatedData[field] !== undefined) {
          paramCount++;
          updates.push(`${field} = $${paramCount}`);
          values.push(validatedData[field]);
        }
      });

      if (updates.length === 0) {
        return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATES_PROVIDED'));
      }

      paramCount++;
      values.push(image_id);

      const query = `
        UPDATE product_images SET ${updates.join(', ')} 
        WHERE image_id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);

      await client.query('COMMIT');

      res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    console.error('Admin update product image error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Delete product image with primary image management
  Removes image from product gallery with automatic primary reassignment
*/
app.delete('/api/admin/products/:product_id/images/:image_id', authenticateAdmin, async (req, res) => {
  try {
    const { product_id, image_id } = req.params;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get image info before deletion
      const imageResult = await client.query(
        'SELECT is_primary FROM product_images WHERE image_id = $1 AND product_id = $2',
        [image_id, product_id]
      );

      if (imageResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Product image not found', null, 'IMAGE_NOT_FOUND'));
      }

      const wasPrimary = imageResult.rows[0].is_primary;

      // Delete image
      await client.query('DELETE FROM product_images WHERE image_id = $1', [image_id]);

      // If deleted image was primary, make another image primary
      if (wasPrimary) {
        await client.query(
          'UPDATE product_images SET is_primary = true WHERE product_id = $1 ORDER BY display_order LIMIT 1',
          [product_id]
        );
      }

      await client.query('COMMIT');

      res.status(204).send();
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin delete product image error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ============================================================================
// ADMIN ORDER MANAGEMENT ENDPOINTS
// ============================================================================

/*
  Get all orders for admin management with comprehensive filtering
  Returns orders with complete details for administrative processing
*/
app.get('/api/admin/orders', authenticateAdmin, async (req, res) => {
  try {
    const {
      status,
      payment_status,
      search_query,
      date_from,
      date_to,
      limit = 20,
      offset = 0
    } = req.query;

    const client = await pool.connect();
    
    try {
      let query = `
        SELECT o.*,
               array_agg(DISTINCT jsonb_build_object(
                 'order_item_id', oi.order_item_id,
                 'product_id', oi.product_id,
                 'product_name', oi.product_name,
                 'product_brand', oi.product_brand,
                 'product_sku', oi.product_sku,
                 'product_image_url', oi.product_image_url,
                 'product_price', oi.product_price,
                 'sale_price', oi.sale_price,
                 'quantity', oi.quantity,
                 'line_total', oi.line_total
               )) FILTER (WHERE oi.order_item_id IS NOT NULL) as order_items
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE 1=1
      `;
      
      const queryParams = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        query += ` AND o.status = $${paramCount}`;
        queryParams.push(status);
      }

      if (payment_status) {
        paramCount++;
        query += ` AND o.payment_status = $${paramCount}`;
        queryParams.push(payment_status);
      }

      if (search_query) {
        paramCount++;
        query += ` AND (o.order_number ILIKE $${paramCount} OR o.guest_email ILIKE $${paramCount})`;
        queryParams.push(`%${search_query}%`);
      }

      if (date_from) {
        paramCount++;
        query += ` AND o.created_at >= $${paramCount}`;
        queryParams.push(date_from);
      }

      if (date_to) {
        paramCount++;
        query += ` AND o.created_at <= $${paramCount}`;
        queryParams.push(date_to);
      }

      query += ` GROUP BY o.order_id ORDER BY o.created_at DESC`;
      
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      queryParams.push(parseInt(limit));
      
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      queryParams.push(parseInt(offset));

      const result = await client.query(query, queryParams);

      // Get total count
      let countQuery = 'SELECT COUNT(DISTINCT o.order_id) as total FROM orders o WHERE 1=1';
      let countParams = [];
      let countParamIndex = 0;

      if (status) {
        countParamIndex++;
        countQuery += ` AND o.status = $${countParamIndex}`;
        countParams.push(status);
      }

      if (payment_status) {
        countParamIndex++;
        countQuery += ` AND o.payment_status = $${countParamIndex}`;
        countParams.push(payment_status);
      }

      if (search_query) {
        countParamIndex++;
        countQuery += ` AND (o.order_number ILIKE $${countParamIndex} OR o.guest_email ILIKE $${countParamIndex})`;
        countParams.push(`%${search_query}%`);
      }

      if (date_from) {
        countParamIndex++;
        countQuery += ` AND o.created_at >= $${countParamIndex}`;
        countParams.push(date_from);
      }

      if (date_to) {
        countParamIndex++;
        countQuery += ` AND o.created_at <= $${countParamIndex}`;
        countParams.push(date_to);
      }

      const countResult = await client.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      res.json({
        orders: result.rows,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: offset + limit < total
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin get orders error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get order details for admin management
  Returns comprehensive order information for administrative processing
*/
app.get('/api/admin/orders/:order_id', authenticateAdmin, async (req, res) => {
  try {
    const { order_id } = req.params;

    const client = await pool.connect();
    
    try {
      const orderResult = await client.query(`
        SELECT o.*,
               array_agg(DISTINCT jsonb_build_object(
                 'order_item_id', oi.order_item_id,
                 'product_id', oi.product_id,
                 'product_name', oi.product_name,
                 'product_brand', oi.product_brand,
                 'product_sku', oi.product_sku,
                 'product_image_url', oi.product_image_url,
                 'product_price', oi.product_price,
                 'sale_price', oi.sale_price,
                 'quantity', oi.quantity,
                 'line_total', oi.line_total
               )) FILTER (WHERE oi.order_item_id IS NOT NULL) as order_items
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.order_id = $1
        GROUP BY o.order_id
      `, [order_id]);

      if (orderResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Order not found', null, 'ORDER_NOT_FOUND'));
      }

      const order = orderResult.rows[0];

      // Get shipping and billing addresses
      const shippingAddressResult = await client.query(
        'SELECT * FROM addresses WHERE address_id = $1',
        [order.shipping_address_id]
      );
      
      const billingAddressResult = await client.query(
        'SELECT * FROM addresses WHERE address_id = $1',
        [order.billing_address_id]
      );

      order.shipping_address = shippingAddressResult.rows[0] || null;
      order.billing_address = billingAddressResult.rows[0] || null;

      res.json(order);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin get order error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  @@@need:external-api: Shipping carrier integration for tracking number generation, label printing, and delivery status updates
*/
async function generateTrackingNumber({ shippingMethod, shippingAddress }) {
  // Mock tracking generation - returns success for development
  const trackingNumber = `TRK${Date.now()}${Math.floor(Math.random() * 1000)}`;
  console.log(`Mock: Generated tracking number ${trackingNumber} for ${shippingMethod}`);
  return {
    success: true,
    trackingNumber,
    carrier: 'Mock Carrier',
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
}

/*
  Update order status with comprehensive state management
  Handles order lifecycle changes with notifications and tracking
*/
app.patch('/api/admin/orders/:order_id', authenticateAdmin, async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status, payment_status, tracking_number, estimated_delivery_date, notes } = req.body;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current order status
      const currentOrderResult = await client.query(
        'SELECT status, payment_status FROM orders WHERE order_id = $1',
        [order_id]
      );

      if (currentOrderResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Order not found', null, 'ORDER_NOT_FOUND'));
      }

      const currentOrder = currentOrderResult.rows[0];

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 0;

      if (status !== undefined) {
        paramCount++;
        updates.push(`status = $${paramCount}`);
        values.push(status);
      }

      if (payment_status !== undefined) {
        paramCount++;
        updates.push(`payment_status = $${paramCount}`);
        values.push(payment_status);
      }

      if (tracking_number !== undefined) {
        paramCount++;
        updates.push(`tracking_number = $${paramCount}`);
        values.push(tracking_number);
      }

      if (estimated_delivery_date !== undefined) {
        paramCount++;
        updates.push(`estimated_delivery_date = $${paramCount}`);
        values.push(estimated_delivery_date);
      }

      if (notes !== undefined) {
        paramCount++;
        updates.push(`notes = $${paramCount}`);
        values.push(notes);
      }

      // Set delivered_at if status changed to delivered
      if (status === 'delivered' && currentOrder.status !== 'delivered') {
        paramCount++;
        updates.push(`delivered_at = $${paramCount}`);
        values.push(new Date().toISOString());
      }

      if (updates.length === 0) {
        return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATES_PROVIDED'));
      }

      paramCount++;
      updates.push(`updated_at = $${paramCount}`);
      values.push(new Date().toISOString());

      paramCount++;
      values.push(order_id);

      const query = `
        UPDATE orders SET ${updates.join(', ')} 
        WHERE order_id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);

      // Create status history entry if status changed
      if (status && status !== currentOrder.status) {
        const statusHistoryId = uuidv4();
        await client.query(`
          INSERT INTO order_status_history (
            status_history_id, order_id, old_status, new_status, changed_by_admin_id, notes, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          statusHistoryId, order_id, currentOrder.status, status,
          req.admin.admin_id, notes || `Status changed to ${status}`,
          new Date().toISOString()
        ]);

        // Send status update notification
        const order = result.rows[0];
        await sendOrderNotification({
          type: 'status_update',
          recipient: order.guest_email || 'customer@example.com', // Would get from user table if user_id exists
          orderData: order,
          templateData: { newStatus: status, trackingNumber: tracking_number }
        });
      }

      await client.query('COMMIT');

      // Get complete order with items for response
      const completeOrderResult = await client.query(`
        SELECT o.*,
               array_agg(DISTINCT jsonb_build_object(
                 'order_item_id', oi.order_item_id,
                 'product_id', oi.product_id,
                 'product_name', oi.product_name,
                 'product_brand', oi.product_brand,
                 'product_sku', oi.product_sku,
                 'product_image_url', oi.product_image_url,
                 'product_price', oi.product_price,
                 'sale_price', oi.sale_price,
                 'quantity', oi.quantity,
                 'line_total', oi.line_total
               )) FILTER (WHERE oi.order_item_id IS NOT NULL) as order_items
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.order_id = $1
        GROUP BY o.order_id
      `, [order_id]);

      res.json(completeOrderResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin update order error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ============================================================================
// ADMIN CUSTOMER MANAGEMENT ENDPOINTS
// ============================================================================

/*
  Get all customers for admin management
  Returns customer list with search and filtering capabilities
*/
app.get('/api/admin/customers', authenticateAdmin, async (req, res) => {
  try {
    const {
      search_query,
      is_active,
      email_verified,
      limit = 20,
      offset = 0
    } = req.query;

    const client = await pool.connect();
    
    try {
      let query = 'SELECT user_id, email, first_name, last_name, phone, email_verified, is_active, created_at, updated_at FROM users WHERE 1=1';
      const queryParams = [];
      let paramCount = 0;

      if (search_query) {
        paramCount++;
        query += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
        queryParams.push(`%${search_query}%`);
      }

      if (is_active !== undefined) {
        paramCount++;
        query += ` AND is_active = $${paramCount}`;
        queryParams.push(is_active === 'true');
      }

      if (email_verified !== undefined) {
        paramCount++;
        query += ` AND email_verified = $${paramCount}`;
        queryParams.push(email_verified === 'true');
      }

      query += ` ORDER BY created_at DESC`;
      
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      queryParams.push(parseInt(limit));
      
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      queryParams.push(parseInt(offset));

      const result = await client.query(query, queryParams);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
      let countParams = [];
      let countParamIndex = 0;

      if (search_query) {
        countParamIndex++;
        countQuery += ` AND (first_name ILIKE $${countParamIndex} OR last_name ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex})`;
        countParams.push(`%${search_query}%`);
      }

      if (is_active !== undefined) {
        countParamIndex++;
        countQuery += ` AND is_active = $${countParamIndex}`;
        countParams.push(is_active === 'true');
      }

      if (email_verified !== undefined) {
        countParamIndex++;
        countQuery += ` AND email_verified = $${countParamIndex}`;
        countParams.push(email_verified === 'true');
      }

      const countResult = await client.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      res.json({
        customers: result.rows,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: offset + limit < total
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin get customers error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get customer details for admin management
  Returns comprehensive customer information with order statistics
*/
app.get('/api/admin/customers/:user_id', authenticateAdmin, async (req, res) => {
  try {
    const { user_id } = req.params;

    const client = await pool.connect();
    
    try {
      // Get customer details
      const customerResult = await client.query(
        'SELECT user_id, email, first_name, last_name, phone, email_verified, is_active, created_at, updated_at FROM users WHERE user_id = $1',
        [user_id]
      );

      if (customerResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Customer not found', null, 'CUSTOMER_NOT_FOUND'));
      }

      const customer = customerResult.rows[0];

      // Get order statistics
      const orderStatsResult = await client.query(`
        SELECT 
          COUNT(*) as order_count,
          COALESCE(SUM(total_amount), 0) as total_spent,
          MAX(created_at) as last_order_date
        FROM orders 
        WHERE user_id = $1
      `, [user_id]);

      const orderStats = orderStatsResult.rows[0];

      res.json({
        customer,
        order_count: parseInt(orderStats.order_count),
        total_spent: parseFloat(orderStats.total_spent),
        last_order_date: orderStats.last_order_date
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin get customer error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update customer status
  Allows admin to modify customer account status and verification
*/
app.patch('/api/admin/customers/:user_id', authenticateAdmin, async (req, res) => {
  try {
    const { user_id } = req.params;
    const { is_active, email_verified } = req.body;

    const client = await pool.connect();
    
    try {
      // Verify customer exists
      const customerResult = await client.query('SELECT user_id FROM users WHERE user_id = $1', [user_id]);
      if (customerResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Customer not found', null, 'CUSTOMER_NOT_FOUND'));
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 0;

      if (is_active !== undefined) {
        paramCount++;
        updates.push(`is_active = $${paramCount}`);
        values.push(is_active);
      }

      if (email_verified !== undefined) {
        paramCount++;
        updates.push(`email_verified = $${paramCount}`);
        values.push(email_verified);
      }

      if (updates.length === 0) {
        return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATES_PROVIDED'));
      }

      paramCount++;
      updates.push(`updated_at = $${paramCount}`);
      values.push(new Date().toISOString());

      paramCount++;
      values.push(user_id);

      const query = `
        UPDATE users SET ${updates.join(', ')} 
        WHERE user_id = $${paramCount}
        RETURNING user_id, email, first_name, last_name, phone, email_verified, is_active, created_at, updated_at
      `;

      const result = await client.query(query, values);

      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin update customer error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ============================================================================
// ADMIN INVENTORY MANAGEMENT ENDPOINTS
// ============================================================================

/*
  Get inventory status for all products
  Returns comprehensive inventory overview with low stock alerts
*/
app.get('/api/admin/inventory', authenticateAdmin, async (req, res) => {
  try {
    const { low_stock_threshold = 10 } = req.query;

    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          p.product_id,
          p.name as product_name,
          p.sku,
          p.stock_quantity as current_stock,
          CASE WHEN p.stock_quantity <= $1 THEN true ELSE false END as is_low_stock,
          ia.created_at as last_restocked
        FROM products p
        LEFT JOIN LATERAL (
          SELECT created_at 
          FROM inventory_adjustments 
          WHERE product_id = p.product_id AND adjustment_type = 'restock' 
          ORDER BY created_at DESC 
          LIMIT 1
        ) ia ON true
        WHERE p.is_active = true
        ORDER BY p.stock_quantity ASC, p.name ASC
      `, [parseInt(low_stock_threshold)]);

      const inventory = result.rows;
      const lowStockCount = inventory.filter(item => item.is_low_stock).length;
      const outOfStockCount = inventory.filter(item => item.current_stock === 0).length;

      res.json({
        inventory,
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin get inventory error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Adjust product inventory with comprehensive audit trail
  Handles all types of inventory adjustments with proper tracking
*/
app.post('/api/admin/inventory/:product_id/adjust', authenticateAdmin, async (req, res) => {
  try {
    const { product_id } = req.params;
    const validatedData = createInventoryAdjustmentInputSchema.parse({
      ...req.body,
      product_id,
      admin_id: req.admin.admin_id
    });

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verify product exists and get current stock
      const productResult = await client.query(
        'SELECT stock_quantity FROM products WHERE product_id = $1 AND is_active = true',
        [product_id]
      );

      if (productResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Product not found or inactive', null, 'PRODUCT_NOT_FOUND'));
      }

      const currentStock = productResult.rows[0].stock_quantity;

      // Validate the adjustment
      if (validatedData.old_quantity !== currentStock) {
        return res.status(400).json(createErrorResponse('Old quantity does not match current stock', null, 'STOCK_MISMATCH'));
      }

      if (validatedData.new_quantity < 0) {
        return res.status(400).json(createErrorResponse('New quantity cannot be negative', null, 'INVALID_QUANTITY'));
      }

      // Update product stock
      await client.query(
        'UPDATE products SET stock_quantity = $1, updated_at = $2 WHERE product_id = $3',
        [validatedData.new_quantity, new Date().toISOString(), product_id]
      );

      // Create adjustment record
      const adjustmentId = uuidv4();
      const now = new Date().toISOString();

      const adjustmentResult = await client.query(`
        INSERT INTO inventory_adjustments (
          adjustment_id, product_id, adjustment_type, quantity_change, old_quantity,
          new_quantity, reason, admin_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        adjustmentId, product_id, validatedData.adjustment_type, validatedData.quantity_change,
        validatedData.old_quantity, validatedData.new_quantity, validatedData.reason,
        validatedData.admin_id, now
      ]);

      await client.query('COMMIT');

      res.json({
        adjustment: adjustmentResult.rows[0],
        updated_product: {
          product_id,
          stock_quantity: validatedData.new_quantity
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    console.error('Admin adjust inventory error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ============================================================================
// ADMIN CATEGORY MANAGEMENT ENDPOINTS
// ============================================================================

/*
  Get all categories for admin management
  Returns categories for administrative operations
*/
app.get('/api/admin/categories', authenticateAdmin, async (req, res) => {
  try {
    const { is_active } = req.query;

    const client = await pool.connect();
    
    try {
      let query = 'SELECT * FROM categories';
      const queryParams = [];
      
      if (is_active !== undefined) {
        query += ' WHERE is_active = $1';
        queryParams.push(is_active === 'true');
      }
      
      query += ' ORDER BY display_order ASC, name ASC';

      const result = await client.query(query, queryParams);

      res.json({ categories: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin get categories error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create new category
  Adds new product category with proper ordering
*/
app.post('/api/admin/categories', authenticateAdmin, async (req, res) => {
  try {
    const validatedData = createCategoryInputSchema.parse(req.body);

    const client = await pool.connect();
    
    try {
      // Check if category name already exists
      const existingResult = await client.query('SELECT category_id FROM categories WHERE name = $1', [validatedData.name]);
      if (existingResult.rows.length > 0) {
        return res.status(409).json(createErrorResponse('Category name already exists', null, 'CATEGORY_ALREADY_EXISTS'));
      }

      const categoryId = uuidv4();
      const now = new Date().toISOString();

      const result = await client.query(`
        INSERT INTO categories (category_id, name, description, display_order, is_active, created_at)
        VALUES ($1, $2, $3, $4, true, $5)
        RETURNING *
      `, [categoryId, validatedData.name, validatedData.description, validatedData.display_order, now]);

      res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    console.error('Admin create category error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update category details
  Modifies category information and ordering
*/
app.patch('/api/admin/categories/:category_id', authenticateAdmin, async (req, res) => {
  try {
    const { category_id } = req.params;
    const validatedData = updateCategoryInputSchema.parse({
      ...req.body,
      category_id
    });

    const client = await pool.connect();
    
    try {
      // Verify category exists
      const existingResult = await client.query('SELECT category_id FROM categories WHERE category_id = $1', [category_id]);
      if (existingResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Category not found', null, 'CATEGORY_NOT_FOUND'));
      }

      // Check name uniqueness if changing name
      if (validatedData.name) {
        const nameCheckResult = await client.query(
          'SELECT category_id FROM categories WHERE name = $1 AND category_id != $2',
          [validatedData.name, category_id]
        );
        if (nameCheckResult.rows.length > 0) {
          return res.status(409).json(createErrorResponse('Category name already exists', null, 'CATEGORY_NAME_EXISTS'));
        }
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 0;

      const updateableFields = ['name', 'description', 'display_order', 'is_active'];

      updateableFields.forEach(field => {
        if (validatedData[field] !== undefined) {
          paramCount++;
          updates.push(`${field} = $${paramCount}`);
          values.push(validatedData[field]);
        }
      });

      if (updates.length === 0) {
        return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATES_PROVIDED'));
      }

      paramCount++;
      values.push(category_id);

      const query = `
        UPDATE categories SET ${updates.join(', ')} 
        WHERE category_id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);

      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error.errors, 'VALIDATION_ERROR'));
    }
    console.error('Admin update category error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Delete category with safety checks
  Removes category while preventing deletion of categories with products
*/
app.delete('/api/admin/categories/:category_id', authenticateAdmin, async (req, res) => {
  try {
    const { category_id } = req.params;

    const client = await pool.connect();
    
    try {
      // Check if category exists
      const categoryResult = await client.query('SELECT category_id FROM categories WHERE category_id = $1', [category_id]);
      if (categoryResult.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Category not found', null, 'CATEGORY_NOT_FOUND'));
      }

      // Check if category has products
      const productResult = await client.query('SELECT product_id FROM products WHERE category_id = $1 LIMIT 1', [category_id]);
      if (productResult.rows.length > 0) {
        return res.status(400).json(createErrorResponse('Cannot delete category with existing products', null, 'CATEGORY_HAS_PRODUCTS'));
      }

      // Delete category
      await client.query('DELETE FROM categories WHERE category_id = $1', [category_id]);

      res.status(204).send();
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin delete category error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

/*
  Health check endpoint for monitoring and load balancing
  Returns server status and basic system information
*/
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ============================================================================
// SPA CATCH-ALL ROUTE
// ============================================================================

// Catch-all route for SPA routing (must be last)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

export { app, pool };

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port} and listening on 0.0.0.0`);
});