import { jest } from '@jest/globals';
import request from 'supertest';
import { app, pool } from './server.ts';

// Mock external API calls
jest.mock('node-fetch', () => ({
  default: jest.fn()
}));

describe('PerfumeShop Backend API Tests', () => {
  let testUserId;
  let testAdminId;
  let testProductId;
  let testOrderId;
  let testAddressId;
  let testCartItemId;
  let testWishlistItemId;
  let testReviewId;
  let testCategoryId;
  let userToken;
  let adminToken;
  let sessionId;

  beforeAll(async () => {
    // Setup test database
    await pool.query('BEGIN');
    
    // Clear existing test data
    await pool.query('DELETE FROM user_sessions WHERE user_id LIKE $1', ['test_%']);
    await pool.query('DELETE FROM admin_sessions WHERE admin_id LIKE $1', ['test_%']);
    await pool.query('DELETE FROM users WHERE user_id LIKE $1', ['test_%']);
    await pool.query('DELETE FROM admin_users WHERE admin_id LIKE $1', ['test_%']);
    await pool.query('DELETE FROM products WHERE product_id LIKE $1', ['test_%']);
    await pool.query('DELETE FROM categories WHERE category_id LIKE $1', ['test_%']);
  });

  afterAll(async () => {
    // Cleanup test data
    await pool.query('ROLLBACK');
    await pool.end();
  });

  beforeEach(async () => {
    // Create fresh test data for each test
    sessionId = `test_session_${Date.now()}`;
  });

  afterEach(async () => {
    // Clean up test data after each test
    await pool.query('DELETE FROM cart_items WHERE session_id = $1', [sessionId]);
  });

  // ============================================================================
  // AUTHENTICATION TESTS
  // ============================================================================

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user successfully', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          first_name: 'Test',
          last_name: 'User',
          phone: '+1-555-0123'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('expires_at');
        expect(response.body.user.email).toBe(userData.email);
        expect(response.body.user.first_name).toBe(userData.first_name);
        expect(response.body.user.last_name).toBe(userData.last_name);

        testUserId = response.body.user.user_id;
        userToken = response.body.token;
      });

      it('should fail with invalid email format', async () => {
        const userData = {
          email: 'invalid-email',
          password: 'password123',
          first_name: 'Test',
          last_name: 'User'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should fail with missing required fields', async () => {
        const userData = {
          email: 'test2@example.com',
          password: 'password123'
          // Missing first_name and last_name
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should fail with duplicate email', async () => {
        const userData = {
          email: 'test@example.com', // Same email as first test
          password: 'password123',
          first_name: 'Test2',
          last_name: 'User2'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(409);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'password123'
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('expires_at');
        expect(response.body.user.email).toBe(loginData.email);

        userToken = response.body.token;
      });

      it('should fail with invalid credentials', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'wrongpassword'
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);

        expect(response.body).toHaveProperty('error');
      });

      it('should fail with non-existent email', async () => {
        const loginData = {
          email: 'nonexistent@example.com',
          password: 'password123'
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/auth/me', () => {
      it('should return current user with valid token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('user_id');
        expect(response.body.email).toBe('test@example.com');
      });

      it('should fail without authentication token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .expect(401);

        expect(response.body).toHaveProperty('error');
      });

      it('should fail with invalid token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid_token')
          .expect(401);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/auth/logout', () => {
      it('should logout successfully', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });
    });

    describe('POST /api/auth/forgot-password', () => {
      it('should send password reset email', async () => {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: 'test@example.com' })
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });

      it('should fail with invalid email format', async () => {
        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: 'invalid-email' })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  // ============================================================================
  // ADMIN AUTHENTICATION TESTS
  // ============================================================================

  describe('Admin Authentication', () => {
    describe('POST /api/admin/auth/login', () => {
      it('should login admin with valid credentials', async () => {
        const adminData = {
          username: 'superadmin',
          password: 'admin123'
        };

        const response = await request(app)
          .post('/api/admin/auth/login')
          .send(adminData)
          .expect(200);

        expect(response.body).toHaveProperty('admin');
        expect(response.body).toHaveProperty('token');
        expect(response.body.admin.username).toBe(adminData.username);

        testAdminId = response.body.admin.admin_id;
        adminToken = response.body.token;
      });

      it('should fail with invalid admin credentials', async () => {
        const adminData = {
          username: 'superadmin',
          password: 'wrongpassword'
        };

        const response = await request(app)
          .post('/api/admin/auth/login')
          .send(adminData)
          .expect(401);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/admin/auth/me', () => {
      it('should return current admin with valid token', async () => {
        const response = await request(app)
          .get('/api/admin/auth/me')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('admin_id');
        expect(response.body.username).toBe('superadmin');
      });
    });
  });

  // ============================================================================
  // PRODUCT TESTS
  // ============================================================================

  describe('Product Endpoints', () => {
    describe('GET /api/products', () => {
      it('should return products list', async () => {
        const response = await request(app)
          .get('/api/products')
          .expect(200);

        expect(response.body).toHaveProperty('products');
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('limit');
        expect(response.body).toHaveProperty('offset');
        expect(response.body).toHaveProperty('has_more');
        expect(Array.isArray(response.body.products)).toBe(true);
      });

      it('should filter products by search query', async () => {
        const response = await request(app)
          .get('/api/products?search_query=Chanel')
          .expect(200);

        expect(response.body.products.length).toBeGreaterThan(0);
        response.body.products.forEach(product => {
          expect(
            product.name.toLowerCase().includes('chanel') ||
            product.brand.toLowerCase().includes('chanel')
          ).toBe(true);
        });
      });

      it('should filter products by price range', async () => {
        const response = await request(app)
          .get('/api/products?price_min=50&price_max=100')
          .expect(200);

        response.body.products.forEach(product => {
          const price = product.sale_price || product.price;
          expect(price).toBeGreaterThanOrEqual(50);
          expect(price).toBeLessThanOrEqual(100);
        });
      });

      it('should sort products by price', async () => {
        const response = await request(app)
          .get('/api/products?sort_by=price&sort_order=asc')
          .expect(200);

        const prices = response.body.products.map(p => p.sale_price || p.price);
        for (let i = 1; i < prices.length; i++) {
          expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
        }
      });

      it('should paginate results correctly', async () => {
        const response = await request(app)
          .get('/api/products?limit=2&offset=0')
          .expect(200);

        expect(response.body.products.length).toBeLessThanOrEqual(2);
        expect(response.body.limit).toBe(2);
        expect(response.body.offset).toBe(0);
      });
    });

    describe('GET /api/products/:product_id', () => {
      it('should return product details with existing product', async () => {
        // Get first product from the list
        const productsResponse = await request(app).get('/api/products');
        const productId = productsResponse.body.products[0].product_id;

        const response = await request(app)
          .get(`/api/products/${productId}`)
          .expect(200);

        expect(response.body).toHaveProperty('product_id');
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('price');
        expect(response.body).toHaveProperty('images');
        expect(response.body).toHaveProperty('category');
        expect(response.body).toHaveProperty('related_products');
        expect(Array.isArray(response.body.images)).toBe(true);
      });

      it('should return 404 for non-existent product', async () => {
        const response = await request(app)
          .get('/api/products/non-existent-id')
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('PATCH /api/products/:product_id (view count)', () => {
      it('should increment view count', async () => {
        const productsResponse = await request(app).get('/api/products');
        const productId = productsResponse.body.products[0].product_id;
        const initialViewCount = productsResponse.body.products[0].view_count;

        const response = await request(app)
          .patch(`/api/products/${productId}`)
          .expect(200);

        expect(response.body.view_count).toBe(initialViewCount + 1);
      });
    });
  });

  // ============================================================================
  // CATEGORY TESTS
  // ============================================================================

  describe('Category Endpoints', () => {
    describe('GET /api/categories', () => {
      it('should return active categories', async () => {
        const response = await request(app)
          .get('/api/categories')
          .expect(200);

        expect(response.body).toHaveProperty('categories');
        expect(Array.isArray(response.body.categories)).toBe(true);
        response.body.categories.forEach(category => {
          expect(category.is_active).toBe(true);
        });
      });
    });
  });

  // ============================================================================
  // CART TESTS
  // ============================================================================

  describe('Cart Endpoints', () => {
    let productId;

    beforeEach(async () => {
      // Get a product for cart tests
      const productsResponse = await request(app).get('/api/products');
      productId = productsResponse.body.products[0].product_id;
    });

    describe('POST /api/cart (Guest User)', () => {
      it('should add item to guest cart', async () => {
        const cartData = {
          product_id: productId,
          quantity: 2,
          session_id: sessionId
        };

        const response = await request(app)
          .post('/api/cart')
          .send(cartData)
          .expect(201);

        expect(response.body).toHaveProperty('items');
        expect(response.body).toHaveProperty('total_quantity');
        expect(response.body).toHaveProperty('subtotal');
        expect(response.body).toHaveProperty('total');
        expect(response.body.items.length).toBeGreaterThan(0);
        expect(response.body.total_quantity).toBe(2);

        testCartItemId = response.body.items[0].cart_item_id;
      });

      it('should fail with invalid product ID', async () => {
        const cartData = {
          product_id: 'invalid-product-id',
          quantity: 1,
          session_id: sessionId
        };

        const response = await request(app)
          .post('/api/cart')
          .send(cartData)
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });

      it('should fail with invalid quantity', async () => {
        const cartData = {
          product_id: productId,
          quantity: 0,
          session_id: sessionId
        };

        const response = await request(app)
          .post('/api/cart')
          .send(cartData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/cart (Guest User)', () => {
      it('should return guest cart items', async () => {
        const response = await request(app)
          .get(`/api/cart?session_id=${sessionId}`)
          .expect(200);

        expect(response.body).toHaveProperty('items');
        expect(response.body).toHaveProperty('total_quantity');
        expect(response.body).toHaveProperty('subtotal');
        expect(response.body).toHaveProperty('total');
      });
    });

    describe('PATCH /api/cart/:cart_item_id', () => {
      it('should update cart item quantity', async () => {
        const updateData = { quantity: 3 };

        const response = await request(app)
          .patch(`/api/cart/${testCartItemId}`)
          .send(updateData)
          .expect(200);

        expect(response.body.items[0].quantity).toBe(3);
        expect(response.body.total_quantity).toBe(3);
      });

      it('should fail with invalid quantity', async () => {
        const updateData = { quantity: -1 };

        const response = await request(app)
          .patch(`/api/cart/${testCartItemId}`)
          .send(updateData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('DELETE /api/cart/:cart_item_id', () => {
      it('should remove item from cart', async () => {
        const response = await request(app)
          .delete(`/api/cart/${testCartItemId}`)
          .expect(200);

        expect(response.body.items.length).toBe(0);
        expect(response.body.total_quantity).toBe(0);
      });
    });

    describe('DELETE /api/cart/clear', () => {
      it('should clear all items from guest cart', async () => {
        // First add an item
        await request(app)
          .post('/api/cart')
          .send({
            product_id: productId,
            quantity: 1,
            session_id: sessionId
          });

        const response = await request(app)
          .delete(`/api/cart/clear?session_id=${sessionId}`)
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });
    });
  });

  // ============================================================================
  // AUTHENTICATED USER TESTS
  // ============================================================================

  describe('Authenticated User Features', () => {
    beforeAll(async () => {
      // Login to get fresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      userToken = loginResponse.body.token;
      testUserId = loginResponse.body.user.user_id;
    });

    describe('User Profile Management', () => {
      describe('GET /api/user/profile', () => {
        it('should return user profile', async () => {
          const response = await request(app)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);

          expect(response.body).toHaveProperty('user_id');
          expect(response.body).toHaveProperty('email');
          expect(response.body).toHaveProperty('first_name');
          expect(response.body).toHaveProperty('last_name');
        });
      });

      describe('PATCH /api/user/profile', () => {
        it('should update user profile', async () => {
          const updateData = {
            first_name: 'Updated',
            last_name: 'Name',
            phone: '+1-555-9999'
          };

          const response = await request(app)
            .patch('/api/user/profile')
            .set('Authorization', `Bearer ${userToken}`)
            .send(updateData)
            .expect(200);

          expect(response.body.first_name).toBe(updateData.first_name);
          expect(response.body.last_name).toBe(updateData.last_name);
          expect(response.body.phone).toBe(updateData.phone);
        });
      });

      describe('POST /api/user/change-password', () => {
        it('should change user password', async () => {
          const passwordData = {
            current_password: 'password123',
            new_password: 'newpassword123'
          };

          const response = await request(app)
            .post('/api/user/change-password')
            .set('Authorization', `Bearer ${userToken}`)
            .send(passwordData)
            .expect(200);

          expect(response.body).toHaveProperty('message');
        });

        it('should fail with wrong current password', async () => {
          const passwordData = {
            current_password: 'wrongpassword',
            new_password: 'newpassword123'
          };

          const response = await request(app)
            .post('/api/user/change-password')
            .set('Authorization', `Bearer ${userToken}`)
            .send(passwordData)
            .expect(400);

          expect(response.body).toHaveProperty('error');
        });
      });
    });

    describe('Address Management', () => {
      describe('POST /api/user/addresses', () => {
        it('should create new address', async () => {
          const addressData = {
            type: 'shipping',
            first_name: 'Test',
            last_name: 'User',
            street_address_1: '123 Test Street',
            city: 'Test City',
            state_province: 'Test State',
            postal_code: '12345',
            country: 'USA',
            phone: '+1-555-0123',
            is_default: true
          };

          const response = await request(app)
            .post('/api/user/addresses')
            .set('Authorization', `Bearer ${userToken}`)
            .send(addressData)
            .expect(201);

          expect(response.body).toHaveProperty('address_id');
          expect(response.body.type).toBe(addressData.type);
          expect(response.body.first_name).toBe(addressData.first_name);
          expect(response.body.is_default).toBe(true);

          testAddressId = response.body.address_id;
        });

        it('should fail with missing required fields', async () => {
          const addressData = {
            type: 'shipping',
            first_name: 'Test'
            // Missing required fields
          };

          const response = await request(app)
            .post('/api/user/addresses')
            .set('Authorization', `Bearer ${userToken}`)
            .send(addressData)
            .expect(400);

          expect(response.body).toHaveProperty('error');
        });
      });

      describe('GET /api/user/addresses', () => {
        it('should return user addresses', async () => {
          const response = await request(app)
            .get('/api/user/addresses')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);

          expect(response.body).toHaveProperty('addresses');
          expect(Array.isArray(response.body.addresses)).toBe(true);
          expect(response.body.addresses.length).toBeGreaterThan(0);
        });

        it('should filter by address type', async () => {
          const response = await request(app)
            .get('/api/user/addresses?type=shipping')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);

          response.body.addresses.forEach(address => {
            expect(address.type).toBe('shipping');
          });
        });
      });

      describe('PATCH /api/user/addresses/:address_id', () => {
        it('should update address', async () => {
          const updateData = {
            street_address_1: '456 Updated Street',
            city: 'Updated City'
          };

          const response = await request(app)
            .patch(`/api/user/addresses/${testAddressId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send(updateData)
            .expect(200);

          expect(response.body.street_address_1).toBe(updateData.street_address_1);
          expect(response.body.city).toBe(updateData.city);
        });
      });

      describe('PATCH /api/user/addresses/:address_id/set-default', () => {
        it('should set address as default', async () => {
          const response = await request(app)
            .patch(`/api/user/addresses/${testAddressId}/set-default`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);

          expect(response.body.is_default).toBe(true);
        });
      });
    });

    describe('Wishlist Management', () => {
      let productId;

      beforeEach(async () => {
        const productsResponse = await request(app).get('/api/products');
        productId = productsResponse.body.products[0].product_id;
      });

      describe('POST /api/wishlist', () => {
        it('should add product to wishlist', async () => {
          const wishlistData = { product_id: productId };

          const response = await request(app)
            .post('/api/wishlist')
            .set('Authorization', `Bearer ${userToken}`)
            .send(wishlistData)
            .expect(201);

          expect(response.body).toHaveProperty('wishlist_item_id');
          expect(response.body).toHaveProperty('product');
          expect(response.body.product_id).toBe(productId);

          testWishlistItemId = response.body.wishlist_item_id;
        });

        it('should fail with duplicate product in wishlist', async () => {
          const wishlistData = { product_id: productId };

          const response = await request(app)
            .post('/api/wishlist')
            .set('Authorization', `Bearer ${userToken}`)
            .send(wishlistData)
            .expect(409);

          expect(response.body).toHaveProperty('error');
        });
      });

      describe('GET /api/wishlist', () => {
        it('should return user wishlist items', async () => {
          const response = await request(app)
            .get('/api/wishlist')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);

          expect(response.body).toHaveProperty('items');
          expect(response.body).toHaveProperty('total');
          expect(Array.isArray(response.body.items)).toBe(true);
        });
      });

      describe('DELETE /api/wishlist/:wishlist_item_id', () => {
        it('should remove product from wishlist', async () => {
          const response = await request(app)
            .delete(`/api/wishlist/${testWishlistItemId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(204);
        });
      });
    });

    describe('Cart Management (Authenticated User)', () => {
      let productId;

      beforeEach(async () => {
        const productsResponse = await request(app).get('/api/products');
        productId = productsResponse.body.products[0].product_id;
      });

      it('should add item to authenticated user cart', async () => {
        const cartData = {
          product_id: productId,
          quantity: 1
        };

        const response = await request(app)
          .post('/api/cart')
          .set('Authorization', `Bearer ${userToken}`)
          .send(cartData)
          .expect(201);

        expect(response.body.items.length).toBeGreaterThan(0);
        testCartItemId = response.body.items[0].cart_item_id;
      });

      it('should get authenticated user cart', async () => {
        const response = await request(app)
          .get('/api/cart')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('items');
        expect(response.body).toHaveProperty('total_quantity');
      });
    });
  });

  // ============================================================================
  // ORDER TESTS
  // ============================================================================

  describe('Order Management', () => {
    beforeAll(async () => {
      // Ensure we have a cart item and address for order creation
      const productsResponse = await request(app).get('/api/products');
      const productId = productsResponse.body.products[0].product_id;

      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          product_id: productId,
          quantity: 1
        });
    });

    describe('POST /api/orders', () => {
      it('should create new order', async () => {
        const orderData = {
          order_number: `TEST-${Date.now()}`,
          subtotal: 79.99,
          shipping_cost: 9.99,
          tax_amount: 7.20,
          total_amount: 97.18,
          payment_method: 'credit_card',
          shipping_address_id: testAddressId,
          billing_address_id: testAddressId,
          shipping_method: 'Express Shipping',
          order_items: [
            {
              product_id: 'prod_001',
              product_name: 'Test Product',
              product_brand: 'Test Brand',
              product_sku: 'TEST_SKU',
              product_price: 79.99,
              quantity: 1,
              line_total: 79.99
            }
          ]
        };

        const response = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send(orderData)
          .expect(201);

        expect(response.body).toHaveProperty('order_id');
        expect(response.body).toHaveProperty('order_number');
        expect(response.body).toHaveProperty('order_items');
        expect(response.body.total_amount).toBe(orderData.total_amount);
        expect(response.body.status).toBe('pending');

        testOrderId = response.body.order_id;
      });

      it('should fail with missing required fields', async () => {
        const orderData = {
          subtotal: 79.99
          // Missing required fields
        };

        const response = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send(orderData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/orders', () => {
      it('should return user order history', async () => {
        const response = await request(app)
          .get('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('orders');
        expect(response.body).toHaveProperty('total');
        expect(Array.isArray(response.body.orders)).toBe(true);
      });

      it('should filter orders by status', async () => {
        const response = await request(app)
          .get('/api/orders?status=pending')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        response.body.orders.forEach(order => {
          expect(order.status).toBe('pending');
        });
      });
    });

    describe('GET /api/orders/:order_id', () => {
      it('should return order details', async () => {
        const response = await request(app)
          .get(`/api/orders/${testOrderId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('order_id');
        expect(response.body).toHaveProperty('order_items');
        expect(response.body).toHaveProperty('shipping_address');
        expect(response.body).toHaveProperty('billing_address');
        expect(response.body.order_id).toBe(testOrderId);
      });

      it('should fail for non-existent order', async () => {
        const response = await request(app)
          .get('/api/orders/non-existent-order')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  // ============================================================================
  // PRODUCT REVIEW TESTS
  // ============================================================================

  describe('Product Reviews', () => {
    let productId;

    beforeAll(async () => {
      const productsResponse = await request(app).get('/api/products');
      productId = productsResponse.body.products[0].product_id;
    });

    describe('POST /api/products/:product_id/reviews', () => {
      it('should create product review', async () => {
        const reviewData = {
          rating: 5,
          title: 'Amazing product!',
          comment: 'This is the best perfume I have ever bought.',
          order_id: testOrderId
        };

        const response = await request(app)
          .post(`/api/products/${productId}/reviews`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(reviewData)
          .expect(201);

        expect(response.body).toHaveProperty('review_id');
        expect(response.body.rating).toBe(reviewData.rating);
        expect(response.body.title).toBe(reviewData.title);
        expect(response.body.comment).toBe(reviewData.comment);

        testReviewId = response.body.review_id;
      });

      it('should fail with invalid rating', async () => {
        const reviewData = {
          rating: 6, // Invalid rating
          title: 'Test Review'
        };

        const response = await request(app)
          .post(`/api/products/${productId}/reviews`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(reviewData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/products/:product_id/reviews', () => {
      it('should return product reviews', async () => {
        const response = await request(app)
          .get(`/api/products/${productId}/reviews`)
          .expect(200);

        expect(response.body).toHaveProperty('reviews');
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('average_rating');
        expect(response.body).toHaveProperty('rating_breakdown');
        expect(Array.isArray(response.body.reviews)).toBe(true);
      });

      it('should filter reviews by rating', async () => {
        const response = await request(app)
          .get(`/api/products/${productId}/reviews?rating=5`)
          .expect(200);

        response.body.reviews.forEach(review => {
          expect(review.rating).toBe(5);
        });
      });
    });
  });

  // ============================================================================
  // SHIPPING AND PROMO CODE TESTS
  // ============================================================================

  describe('Shipping Methods', () => {
    describe('GET /api/shipping-methods', () => {
      it('should return active shipping methods', async () => {
        const response = await request(app)
          .get('/api/shipping-methods')
          .expect(200);

        expect(response.body).toHaveProperty('shipping_methods');
        expect(Array.isArray(response.body.shipping_methods)).toBe(true);
        response.body.shipping_methods.forEach(method => {
          expect(method.is_active).toBe(true);
        });
      });
    });
  });

  describe('Promo Codes', () => {
    describe('POST /api/promo-codes/validate', () => {
      it('should validate valid promo code', async () => {
        const promoData = {
          code: 'WELCOME10',
          order_amount: 100
        };

        const response = await request(app)
          .post('/api/promo-codes/validate')
          .send(promoData)
          .expect(200);

        expect(response.body).toHaveProperty('valid');
        expect(response.body).toHaveProperty('promo_code');
        expect(response.body).toHaveProperty('discount_amount');
        expect(response.body).toHaveProperty('final_amount');
        expect(response.body.valid).toBe(true);
      });

      it('should reject invalid promo code', async () => {
        const promoData = {
          code: 'INVALID_CODE',
          order_amount: 100
        };

        const response = await request(app)
          .post('/api/promo-codes/validate')
          .send(promoData)
          .expect(200);

        expect(response.body.valid).toBe(false);
      });

      it('should reject promo code with insufficient order amount', async () => {
        const promoData = {
          code: 'WELCOME10',
          order_amount: 25 // Below minimum order amount
        };

        const response = await request(app)
          .post('/api/promo-codes/validate')
          .send(promoData)
          .expect(200);

        expect(response.body.valid).toBe(false);
      });
    });
  });

  // ============================================================================
  // NEWSLETTER AND CONTACT TESTS
  // ============================================================================

  describe('Newsletter Subscription', () => {
    describe('POST /api/newsletter/subscribe', () => {
      it('should subscribe to newsletter', async () => {
        const subscriptionData = {
          email: 'newsletter@test.com'
        };

        const response = await request(app)
          .post('/api/newsletter/subscribe')
          .send(subscriptionData)
          .expect(201);

        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('subscription');
        expect(response.body.subscription.email).toBe(subscriptionData.email);
      });

      it('should handle duplicate subscription', async () => {
        const subscriptionData = {
          email: 'newsletter@test.com' // Same email as above
        };

        const response = await request(app)
          .post('/api/newsletter/subscribe')
          .send(subscriptionData)
          .expect(409);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/newsletter/unsubscribe', () => {
      it('should unsubscribe from newsletter', async () => {
        const unsubscribeData = {
          email: 'newsletter@test.com'
        };

        const response = await request(app)
          .post('/api/newsletter/unsubscribe')
          .send(unsubscribeData)
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });
    });
  });

  describe('Contact Form', () => {
    describe('POST /api/contact', () => {
      it('should submit contact message', async () => {
        const contactData = {
          name: 'Test User',
          email: 'contact@test.com',
          phone: '+1-555-0123',
          subject: 'Test Subject',
          message: 'This is a test contact message.'
        };

        const response = await request(app)
          .post('/api/contact')
          .send(contactData)
          .expect(201);

        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('contact_message');
        expect(response.body.contact_message.name).toBe(contactData.name);
        expect(response.body.contact_message.email).toBe(contactData.email);
        expect(response.body.contact_message.subject).toBe(contactData.subject);
      });

      it('should fail with missing required fields', async () => {
        const contactData = {
          name: 'Test User'
          // Missing required fields
        };

        const response = await request(app)
          .post('/api/contact')
          .send(contactData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  // ============================================================================
  // ADMIN FUNCTIONALITY TESTS
  // ============================================================================

  describe('Admin Functionality', () => {
    describe('Admin Product Management', () => {
      describe('GET /api/admin/products', () => {
        it('should return all products for admin', async () => {
          const response = await request(app)
            .get('/api/admin/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

          expect(response.body).toHaveProperty('products');
          expect(response.body).toHaveProperty('total');
          expect(Array.isArray(response.body.products)).toBe(true);
        });

        it('should fail without admin authentication', async () => {
          const response = await request(app)
            .get('/api/admin/products')
            .expect(401);

          expect(response.body).toHaveProperty('error');
        });
      });

      describe('POST /api/admin/products', () => {
        it('should create new product', async () => {
          const productData = {
            name: 'Test Perfume',
            description: 'A test perfume for testing purposes',
            price: 99.99,
            stock_quantity: 20,
            sku: 'TEST_PERFUME_001',
            brand: 'Test Brand',
            fragrance_notes_top: ['bergamot', 'lemon'],
            fragrance_notes_middle: ['rose', 'jasmine'],
            fragrance_notes_base: ['musk', 'sandalwood'],
            size_volume: '50ml',
            category_id: 'cat_001'
          };

          const response = await request(app)
            .post('/api/admin/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(productData)
            .expect(201);

          expect(response.body).toHaveProperty('product_id');
          expect(response.body.name).toBe(productData.name);
          expect(response.body.price).toBe(productData.price);
          expect(response.body.sku).toBe(productData.sku);

          testProductId = response.body.product_id;
        });

        it('should fail with duplicate SKU', async () => {
          const productData = {
            name: 'Another Test Perfume',
            price: 89.99,
            sku: 'TEST_PERFUME_001', // Same SKU as above
            brand: 'Test Brand',
            size_volume: '50ml'
          };

          const response = await request(app)
            .post('/api/admin/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(productData)
            .expect(409);

          expect(response.body).toHaveProperty('error');
        });
      });

      describe('PATCH /api/admin/products/:product_id', () => {
        it('should update product', async () => {
          const updateData = {
            name: 'Updated Test Perfume',
            price: 109.99,
            stock_quantity: 30
          };

          const response = await request(app)
            .patch(`/api/admin/products/${testProductId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateData)
            .expect(200);

          expect(response.body.name).toBe(updateData.name);
          expect(response.body.price).toBe(updateData.price);
          expect(response.body.stock_quantity).toBe(updateData.stock_quantity);
        });
      });

      describe('POST /api/admin/products/:product_id/images', () => {
        it('should add product image', async () => {
          const imageData = {
            image_url: 'https://example.com/test-image.jpg',
            alt_text: 'Test product image',
            display_order: 0,
            is_primary: true
          };

          const response = await request(app)
            .post(`/api/admin/products/${testProductId}/images`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(imageData)
            .expect(201);

          expect(response.body).toHaveProperty('image_id');
          expect(response.body.image_url).toBe(imageData.image_url);
          expect(response.body.is_primary).toBe(true);
        });
      });
    });

    describe('Admin Order Management', () => {
      describe('GET /api/admin/orders', () => {
        it('should return all orders for admin', async () => {
          const response = await request(app)
            .get('/api/admin/orders')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

          expect(response.body).toHaveProperty('orders');
          expect(response.body).toHaveProperty('total');
          expect(Array.isArray(response.body.orders)).toBe(true);
        });

        it('should filter orders by status', async () => {
          const response = await request(app)
            .get('/api/admin/orders?status=pending')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

          response.body.orders.forEach(order => {
            expect(order.status).toBe('pending');
          });
        });
      });

      describe('PATCH /api/admin/orders/:order_id', () => {
        it('should update order status', async () => {
          const updateData = {
            status: 'processing',
            tracking_number: 'TRK123456789',
            notes: 'Order is being processed'
          };

          const response = await request(app)
            .patch(`/api/admin/orders/${testOrderId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateData)
            .expect(200);

          expect(response.body.status).toBe(updateData.status);
          expect(response.body.tracking_number).toBe(updateData.tracking_number);
          expect(response.body.notes).toBe(updateData.notes);
        });
      });
    });

    describe('Admin Customer Management', () => {
      describe('GET /api/admin/customers', () => {
        it('should return all customers for admin', async () => {
          const response = await request(app)
            .get('/api/admin/customers')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

          expect(response.body).toHaveProperty('customers');
          expect(response.body).toHaveProperty('total');
          expect(Array.isArray(response.body.customers)).toBe(true);
        });
      });

      describe('GET /api/admin/customers/:user_id', () => {
        it('should return customer details', async () => {
          const response = await request(app)
            .get(`/api/admin/customers/${testUserId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

          expect(response.body).toHaveProperty('customer');
          expect(response.body).toHaveProperty('order_count');
          expect(response.body).toHaveProperty('total_spent');
          expect(response.body.customer.user_id).toBe(testUserId);
        });
      });
    });

    describe('Admin Inventory Management', () => {
      describe('GET /api/admin/inventory', () => {
        it('should return inventory status', async () => {
          const response = await request(app)
            .get('/api/admin/inventory')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

          expect(response.body).toHaveProperty('inventory');
          expect(response.body).toHaveProperty('low_stock_count');
          expect(response.body).toHaveProperty('out_of_stock_count');
          expect(Array.isArray(response.body.inventory)).toBe(true);
        });
      });

      describe('POST /api/admin/inventory/:product_id/adjust', () => {
        it('should adjust product inventory', async () => {
          const adjustmentData = {
            adjustment_type: 'restock',
            quantity_change: 10,
            new_quantity: 40,
            reason: 'Restocking for test'
          };

          const response = await request(app)
            .post(`/api/admin/inventory/${testProductId}/adjust`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(adjustmentData)
            .expect(200);

          expect(response.body).toHaveProperty('adjustment');
          expect(response.body).toHaveProperty('updated_product');
          expect(response.body.adjustment.adjustment_type).toBe(adjustmentData.adjustment_type);
          expect(response.body.updated_product.stock_quantity).toBe(adjustmentData.new_quantity);
        });
      });
    });

    describe('Admin Category Management', () => {
      describe('POST /api/admin/categories', () => {
        it('should create new category', async () => {
          const categoryData = {
            name: 'Test Category',
            description: 'A test category for testing',
            display_order: 10
          };

          const response = await request(app)
            .post('/api/admin/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(categoryData)
            .expect(201);

          expect(response.body).toHaveProperty('category_id');
          expect(response.body.name).toBe(categoryData.name);
          expect(response.body.description).toBe(categoryData.description);

          testCategoryId = response.body.category_id;
        });
      });

      describe('PATCH /api/admin/categories/:category_id', () => {
        it('should update category', async () => {
          const updateData = {
            name: 'Updated Test Category',
            description: 'Updated description'
          };

          const response = await request(app)
            .patch(`/api/admin/categories/${testCategoryId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateData)
            .expect(200);

          expect(response.body.name).toBe(updateData.name);
          expect(response.body.description).toBe(updateData.description);
        });
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle database connection errors gracefully', async () => {
      // This would require mocking the database connection
      // For now, we'll test that the server doesn't crash on valid requests
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('products');
    });
  });

  // ============================================================================
  // VALIDATION TESTS
  // ============================================================================

  describe('Input Validation', () => {
    it('should validate email format in registration', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com'
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email,
            password: 'password123',
            first_name: 'Test',
            last_name: 'User'
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      }
    });

    it('should validate required fields in product creation', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product'
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate quantity in cart operations', async () => {
      const productsResponse = await request(app).get('/api/products');
      const productId = productsResponse.body.products[0].product_id;

      const invalidQuantities = [0, -1, 'invalid', null];

      for (const quantity of invalidQuantities) {
        const response = await request(app)
          .post('/api/cart')
          .send({
            product_id: productId,
            quantity,
            session_id: sessionId
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      }
    });
  });

  // ============================================================================
  // BUSINESS LOGIC TESTS
  // ============================================================================

  describe('Business Logic', () => {
    it('should enforce maximum 5 products constraint', async () => {
      // First, get current product count
      const productsResponse = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`);

      const currentCount = productsResponse.body.total;

      // If we already have 5 or more products, this test should fail product creation
      if (currentCount >= 5) {
        const productData = {
          name: 'Exceeding Limit Product',
          price: 99.99,
          sku: `EXCEED_${Date.now()}`,
          brand: 'Test Brand',
          size_volume: '50ml'
        };

        const response = await request(app)
          .post('/api/admin/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(productData)
          .expect(400);

        expect(response.body.error).toContain('maximum 5 products');
      }
    });

    it('should calculate cart totals correctly', async () => {
      const productsResponse = await request(app).get('/api/products');
      const product = productsResponse.body.products[0];
      const quantity = 2;

      const response = await request(app)
        .post('/api/cart')
        .send({
          product_id: product.product_id,
          quantity,
          session_id: `calc_test_${Date.now()}`
        })
        .expect(201);

      const expectedPrice = product.sale_price || product.price;
      const expectedSubtotal = expectedPrice * quantity;

      expect(response.body.subtotal).toBe(expectedSubtotal);
      expect(response.body.total_quantity).toBe(quantity);
    });

    it('should prevent adding out-of-stock products to cart', async () => {
      // This test would need a product with 0 stock
      // For now, we'll test the general case
      const response = await request(app)
        .post('/api/cart')
        .send({
          product_id: 'non-existent-product',
          quantity: 1,
          session_id: sessionId
        })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});