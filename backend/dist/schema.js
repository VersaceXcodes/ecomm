import { z } from 'zod';
// ============================================================================
// USERS SCHEMAS
// ============================================================================
export const userSchema = z.object({
    user_id: z.string(),
    email: z.string().email(),
    password_hash: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    phone: z.string().nullable(),
    email_verified: z.boolean(),
    is_active: z.boolean(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date()
});
export const createUserInputSchema = z.object({
    email: z.string().email().max(255),
    password_hash: z.string().min(1),
    first_name: z.string().min(1).max(255),
    last_name: z.string().min(1).max(255),
    phone: z.string().max(50).nullable().optional()
});
export const updateUserInputSchema = z.object({
    user_id: z.string(),
    email: z.string().email().max(255).optional(),
    password_hash: z.string().min(1).optional(),
    first_name: z.string().min(1).max(255).optional(),
    last_name: z.string().min(1).max(255).optional(),
    phone: z.string().max(50).nullable().optional(),
    email_verified: z.boolean().optional(),
    is_active: z.boolean().optional()
});
export const searchUsersInputSchema = z.object({
    query: z.string().optional(),
    email: z.string().optional(),
    is_active: z.boolean().optional(),
    email_verified: z.boolean().optional(),
    limit: z.number().int().positive().default(10),
    offset: z.number().int().nonnegative().default(0),
    sort_by: z.enum(['created_at', 'email', 'first_name', 'last_name']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc')
});
// ============================================================================
// ADMIN_USERS SCHEMAS
// ============================================================================
export const adminUserSchema = z.object({
    admin_id: z.string(),
    username: z.string(),
    email: z.string().email(),
    password_hash: z.string(),
    role: z.string(),
    permissions: z.array(z.string()),
    is_active: z.boolean(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date()
});
export const createAdminUserInputSchema = z.object({
    username: z.string().min(1).max(255),
    email: z.string().email().max(255),
    password_hash: z.string().min(1),
    role: z.string().min(1).max(100),
    permissions: z.array(z.string()).default([])
});
export const updateAdminUserInputSchema = z.object({
    admin_id: z.string(),
    username: z.string().min(1).max(255).optional(),
    email: z.string().email().max(255).optional(),
    password_hash: z.string().min(1).optional(),
    role: z.string().min(1).max(100).optional(),
    permissions: z.array(z.string()).optional(),
    is_active: z.boolean().optional()
});
export const searchAdminUsersInputSchema = z.object({
    query: z.string().optional(),
    role: z.string().optional(),
    is_active: z.boolean().optional(),
    limit: z.number().int().positive().default(10),
    offset: z.number().int().nonnegative().default(0),
    sort_by: z.enum(['created_at', 'username', 'email', 'role']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc')
});
// ============================================================================
// CATEGORIES SCHEMAS
// ============================================================================
export const categorySchema = z.object({
    category_id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    display_order: z.number().int(),
    is_active: z.boolean(),
    created_at: z.coerce.date()
});
export const createCategoryInputSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().nullable(),
    display_order: z.number().int().nonnegative().default(0)
});
export const updateCategoryInputSchema = z.object({
    category_id: z.string(),
    name: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
    display_order: z.number().int().nonnegative().optional(),
    is_active: z.boolean().optional()
});
export const searchCategoriesInputSchema = z.object({
    query: z.string().optional(),
    is_active: z.boolean().optional(),
    limit: z.number().int().positive().default(10),
    offset: z.number().int().nonnegative().default(0),
    sort_by: z.enum(['display_order', 'name', 'created_at']).default('display_order'),
    sort_order: z.enum(['asc', 'desc']).default('asc')
});
// ============================================================================
// PRODUCTS SCHEMAS
// ============================================================================
export const productSchema = z.object({
    product_id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    price: z.number(),
    sale_price: z.number().nullable(),
    stock_quantity: z.number().int(),
    sku: z.string(),
    brand: z.string(),
    fragrance_notes_top: z.array(z.string()),
    fragrance_notes_middle: z.array(z.string()),
    fragrance_notes_base: z.array(z.string()),
    size_volume: z.string(),
    category_id: z.string().nullable(),
    is_active: z.boolean(),
    is_featured: z.boolean(),
    meta_title: z.string().nullable(),
    meta_description: z.string().nullable(),
    view_count: z.number().int(),
    sales_count: z.number().int(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date()
});
export const createProductInputSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().nullable(),
    price: z.number().positive(),
    sale_price: z.number().positive().nullable(),
    stock_quantity: z.number().int().nonnegative().default(0),
    sku: z.string().min(1).max(255),
    brand: z.string().min(1).max(255),
    fragrance_notes_top: z.array(z.string()).default([]),
    fragrance_notes_middle: z.array(z.string()).default([]),
    fragrance_notes_base: z.array(z.string()).default([]),
    size_volume: z.string().min(1).max(100),
    category_id: z.string().nullable(),
    meta_title: z.string().max(500).nullable(),
    meta_description: z.string().nullable()
});
export const updateProductInputSchema = z.object({
    product_id: z.string(),
    name: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
    price: z.number().positive().optional(),
    sale_price: z.number().positive().nullable().optional(),
    stock_quantity: z.number().int().nonnegative().optional(),
    sku: z.string().min(1).max(255).optional(),
    brand: z.string().min(1).max(255).optional(),
    fragrance_notes_top: z.array(z.string()).optional(),
    fragrance_notes_middle: z.array(z.string()).optional(),
    fragrance_notes_base: z.array(z.string()).optional(),
    size_volume: z.string().min(1).max(100).optional(),
    category_id: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    meta_title: z.string().max(500).nullable().optional(),
    meta_description: z.string().nullable().optional()
});
export const searchProductsInputSchema = z.object({
    query: z.string().optional(),
    category_id: z.string().optional(),
    brand: z.string().optional(),
    min_price: z.number().nonnegative().optional(),
    max_price: z.number().positive().optional(),
    is_active: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    in_stock: z.boolean().optional(),
    limit: z.number().int().positive().default(20),
    offset: z.number().int().nonnegative().default(0),
    sort_by: z.enum(['name', 'price', 'created_at', 'view_count', 'sales_count']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc')
});
// ============================================================================
// PRODUCT_IMAGES SCHEMAS
// ============================================================================
export const productImageSchema = z.object({
    image_id: z.string(),
    product_id: z.string(),
    image_url: z.string().url(),
    alt_text: z.string().nullable(),
    display_order: z.number().int(),
    is_primary: z.boolean(),
    created_at: z.coerce.date()
});
export const createProductImageInputSchema = z.object({
    product_id: z.string(),
    image_url: z.string().url().max(1000),
    alt_text: z.string().max(500).nullable(),
    display_order: z.number().int().nonnegative().default(0),
    is_primary: z.boolean().default(false)
});
export const updateProductImageInputSchema = z.object({
    image_id: z.string(),
    image_url: z.string().url().max(1000).optional(),
    alt_text: z.string().max(500).nullable().optional(),
    display_order: z.number().int().nonnegative().optional(),
    is_primary: z.boolean().optional()
});
export const searchProductImagesInputSchema = z.object({
    product_id: z.string().optional(),
    is_primary: z.boolean().optional(),
    limit: z.number().int().positive().default(50),
    offset: z.number().int().nonnegative().default(0),
    sort_by: z.enum(['display_order', 'created_at']).default('display_order'),
    sort_order: z.enum(['asc', 'desc']).default('asc')
});
// ============================================================================
// ADDRESSES SCHEMAS
// ============================================================================
export const addressSchema = z.object({
    address_id: z.string(),
    user_id: z.string(),
    type: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    street_address_1: z.string(),
    street_address_2: z.string().nullable(),
    city: z.string(),
    state_province: z.string(),
    postal_code: z.string(),
    country: z.string(),
    phone: z.string().nullable(),
    is_default: z.boolean(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date()
});
export const createAddressInputSchema = z.object({
    user_id: z.string(),
    type: z.enum(['shipping', 'billing']),
    first_name: z.string().min(1).max(255),
    last_name: z.string().min(1).max(255),
    street_address_1: z.string().min(1).max(500),
    street_address_2: z.string().max(500).nullable(),
    city: z.string().min(1).max(255),
    state_province: z.string().min(1).max(255),
    postal_code: z.string().min(1).max(50),
    country: z.string().min(1).max(255),
    phone: z.string().max(50).nullable(),
    is_default: z.boolean().default(false)
});
export const updateAddressInputSchema = z.object({
    address_id: z.string(),
    type: z.enum(['shipping', 'billing']).optional(),
    first_name: z.string().min(1).max(255).optional(),
    last_name: z.string().min(1).max(255).optional(),
    street_address_1: z.string().min(1).max(500).optional(),
    street_address_2: z.string().max(500).nullable().optional(),
    city: z.string().min(1).max(255).optional(),
    state_province: z.string().min(1).max(255).optional(),
    postal_code: z.string().min(1).max(50).optional(),
    country: z.string().min(1).max(255).optional(),
    phone: z.string().max(50).nullable().optional(),
    is_default: z.boolean().optional()
});
export const searchAddressesInputSchema = z.object({
    user_id: z.string().optional(),
    type: z.enum(['shipping', 'billing']).optional(),
    country: z.string().optional(),
    is_default: z.boolean().optional(),
    limit: z.number().int().positive().default(20),
    offset: z.number().int().nonnegative().default(0),
    sort_by: z.enum(['created_at', 'type']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc')
});
// ============================================================================
// CART_ITEMS SCHEMAS
// ============================================================================
export const cartItemSchema = z.object({
    cart_item_id: z.string(),
    user_id: z.string().nullable(),
    session_id: z.string().nullable(),
    product_id: z.string(),
    quantity: z.number().int(),
    added_at: z.coerce.date(),
    updated_at: z.coerce.date()
});
export const createCartItemInputSchema = z.object({
    user_id: z.string().nullable(),
    session_id: z.string().nullable(),
    product_id: z.string(),
    quantity: z.number().int().positive().default(1)
});
export const updateCartItemInputSchema = z.object({
    cart_item_id: z.string(),
    quantity: z.number().int().positive()
});
export const searchCartItemsInputSchema = z.object({
    user_id: z.string().optional(),
    session_id: z.string().optional(),
    product_id: z.string().optional(),
    limit: z.number().int().positive().default(50),
    offset: z.number().int().nonnegative().default(0),
    sort_by: z.enum(['added_at', 'updated_at']).default('added_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc')
});
// ============================================================================
// ORDERS SCHEMAS
// ============================================================================
export const orderSchema = z.object({
    order_id: z.string(),
    order_number: z.string(),
    user_id: z.string().nullable(),
    guest_email: z.string().nullable(),
    status: z.string(),
    subtotal: z.number(),
    shipping_cost: z.number(),
    tax_amount: z.number(),
    discount_amount: z.number(),
    total_amount: z.number(),
    currency: z.string(),
    payment_method: z.string(),
    payment_status: z.string(),
    payment_transaction_id: z.string().nullable(),
    shipping_address_id: z.string(),
    billing_address_id: z.string(),
    shipping_method: z.string(),
    tracking_number: z.string().nullable(),
    estimated_delivery_date: z.coerce.date().nullable(),
    delivered_at: z.coerce.date().nullable(),
    notes: z.string().nullable(),
    promo_code: z.string().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date()
});
export const createOrderInputSchema = z.object({
    order_number: z.string().min(1).max(255),
    user_id: z.string().nullable(),
    guest_email: z.string().email().nullable(),
    subtotal: z.number().nonnegative(),
    shipping_cost: z.number().nonnegative().default(0),
    tax_amount: z.number().nonnegative().default(0),
    discount_amount: z.number().nonnegative().default(0),
    total_amount: z.number().nonnegative(),
    currency: z.string().length(3).default('USD'),
    payment_method: z.string().min(1).max(100),
    shipping_address_id: z.string(),
    billing_address_id: z.string(),
    shipping_method: z.string().min(1).max(255),
    notes: z.string().nullable(),
    promo_code: z.string().max(100).nullable()
});
export const updateOrderInputSchema = z.object({
    order_id: z.string(),
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
    payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
    payment_transaction_id: z.string().max(255).nullable().optional(),
    tracking_number: z.string().max(255).nullable().optional(),
    estimated_delivery_date: z.coerce.date().nullable().optional(),
    delivered_at: z.coerce.date().nullable().optional(),
    notes: z.string().nullable().optional()
});
export const searchOrdersInputSchema = z.object({
    user_id: z.string().optional(),
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
    payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
    order_number: z.string().optional(),
    date_from: z.coerce.date().optional(),
    date_to: z.coerce.date().optional(),
    limit: z.number().int().positive().default(20),
    offset: z.number().int().nonnegative().default(0),
    sort_by: z.enum(['created_at', 'total_amount', 'status']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc')
});
// ============================================================================
// ORDER_ITEMS SCHEMAS
// ============================================================================
export const orderItemSchema = z.object({
    order_item_id: z.string(),
    order_id: z.string(),
    product_id: z.string(),
    product_name: z.string(),
    product_brand: z.string(),
    product_sku: z.string(),
    product_image_url: z.string().nullable(),
    product_price: z.number(),
    sale_price: z.number().nullable(),
    quantity: z.number().int(),
    line_total: z.number(),
    created_at: z.coerce.date()
});
export const createOrderItemInputSchema = z.object({
    order_id: z.string(),
    product_id: z.string(),
    product_name: z.string().min(1).max(255),
    product_brand: z.string().min(1).max(255),
    product_sku: z.string().min(1).max(255),
    product_image_url: z.string().url().max(1000).nullable(),
    product_price: z.number().positive(),
    sale_price: z.number().positive().nullable(),
    quantity: z.number().int().positive(),
    line_total: z.number().nonnegative()
});
export const searchOrderItemsInputSchema = z.object({
    order_id: z.string().optional(),
    product_id: z.string().optional(),
    limit: z.number().int().positive().default(50),
    offset: z.number().int().nonnegative().default(0),
    sort_by: z.enum(['created_at', 'line_total']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('asc')
});
// ============================================================================
// WISHLIST_ITEMS SCHEMAS
// ============================================================================
export const wishlistItemSchema = z.object({
    wishlist_item_id: z.string(),
    user_id: z.string(),
    product_id: z.string(),
    added_at: z.coerce.date()
});
export const createWishlistItemInputSchema = z.object({
    user_id: z.string(),
    product_id: z.string()
});
export const searchWishlistItemsInputSchema = z.object({
    user_id: z.string().optional(),
    product_id: z.string().optional(),
    limit: z.number().int().positive().default(50),
    offset: z.number().int().nonnegative().default(0),
    sort_by: z.enum(['added_at']).default('added_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc')
});
// ============================================================================
// PRODUCT_REVIEWS SCHEMAS
// ============================================================================
export const productReviewSchema = z.object({
    review_id: z.string(),
    product_id: z.string(),
    user_id: z.string(),
    order_id: z.string().nullable(),
    rating: z.number().int(),
    title: z.string().nullable(),
    comment: z.string().nullable(),
    is_verified_purchase: z.boolean(),
    is_approved: z.boolean(),
    admin_response: z.string().nullable(),
    helpful_votes: z.number().int(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date()
});
export const createProductReviewInputSchema = z.object({
    product_id: z.string(),
    user_id: z.string(),
    order_id: z.string().nullable(),
    rating: z.number().int().min(1).max(5),
    title: z.string().max(500).nullable(),
    comment: z.string().nullable()
});
export const updateProductReviewInputSchema = z.object({
    review_id: z.string(),
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().max(500).nullable().optional(),
    comment: z.string().nullable().optional(),
    is_approved: z.boolean().optional(),
    admin_response: z.string().nullable().optional()
});
export const searchProductReviewsInputSchema = z.object({
    product_id: z.string().optional(),
    user_id: z.string().optional(),
    rating: z.number().int().min(1).max(5).optional(),
    is_approved: z.boolean().optional(),
    is_verified_purchase: z.boolean().optional(),
    limit: z.number().int().positive().default(20),
    offset: z.number().int().nonnegative().default(0),
    sort_by: z.enum(['created_at', 'rating', 'helpful_votes']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc')
});
// ============================================================================
// GUEST_ADDRESSES SCHEMAS
// ============================================================================
export const guestAddressSchema = z.object({
    guest_address_id: z.string(),
    order_id: z.string(),
    type: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email(),
    street_address_1: z.string(),
    street_address_2: z.string().nullable(),
    city: z.string(),
    state_province: z.string(),
    postal_code: z.string(),
    country: z.string(),
    phone: z.string().nullable(),
    created_at: z.coerce.date()
});
export const createGuestAddressInputSchema = z.object({
    order_id: z.string(),
    type: z.enum(['shipping', 'billing']),
    first_name: z.string().min(1).max(255),
    last_name: z.string().min(1).max(255),
    email: z.string().email().max(255),
    street_address_1: z.string().min(1).max(500),
    street_address_2: z.string().max(500).nullable(),
    city: z.string().min(1).max(255),
    state_province: z.string().min(1).max(255),
    postal_code: z.string().min(1).max(50),
    country: z.string().min(1).max(255),
    phone: z.string().max(50).nullable()
});
// ============================================================================
// NEWSLETTER_SUBSCRIPTIONS SCHEMAS
// ============================================================================
export const newsletterSubscriptionSchema = z.object({
    subscription_id: z.string(),
    email: z.string().email(),
    is_active: z.boolean(),
    subscribed_at: z.coerce.date(),
    unsubscribed_at: z.coerce.date().nullable()
});
export const createNewsletterSubscriptionInputSchema = z.object({
    email: z.string().email().max(255)
});
export const updateNewsletterSubscriptionInputSchema = z.object({
    subscription_id: z.string(),
    is_active: z.boolean(),
    unsubscribed_at: z.coerce.date().nullable().optional()
});
export const searchNewsletterSubscriptionsInputSchema = z.object({
    email: z.string().optional(),
    is_active: z.boolean().optional(),
    limit: z.number().int().positive().default(50),
    offset: z.number().int().nonnegative().default(0),
    sort_by: z.enum(['subscribed_at', 'email']).default('subscribed_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc')
});
// ============================================================================
// CONTACT_MESSAGES SCHEMAS
// ============================================================================
export const contactMessageSchema = z.object({
    message_id: z.string(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string().nullable(),
    subject: z.string(),
    message: z.string(),
    status: z.string(),
    admin_response: z.string().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date()
});
export const createContactMessageInputSchema = z.object({
    name: z.string().min(1).max(255),
    email: z.string().email().max(255),
    phone: z.string().max(50).nullable(),
    subject: z.string().min(1).max(500),
    message: z.string().min(1)
});
export const updateContactMessageInputSchema = z.object({
    message_id: z.string(),
    status: z.enum(['new', 'pending', 'resolved', 'closed']).optional(),
    admin_response: z.string().nullable().optional()
});
export const searchContactMessagesInputSchema = z.object({
    status: z.enum(['new', 'pending', 'resolved', 'closed']).optional(),
    email: z.string().optional(),
    date_from: z.coerce.date().optional(),
    date_to: z.coerce.date().optional(),
    limit: z.number().int().positive().default(20),
    offset: z.number().int().nonnegative().default(0),
    sort_by: z.enum(['created_at', 'status']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc')
});
// ============================================================================
// SHIPPING_METHODS SCHEMAS
// ============================================================================
export const shippingMethodSchema = z.object({
    shipping_method_id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    cost: z.number(),
    estimated_days_min: z.number().int(),
    estimated_days_max: z.number().int(),
    is_active: z.boolean(),
    display_order: z.number().int(),
    created_at: z.coerce.date()
});
export const createShippingMethodInputSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().nullable(),
    cost: z.number().nonnegative(),
    estimated_days_min: z.number().int().positive(),
    estimated_days_max: z.number().int().positive(),
    display_order: z.number().int().nonnegative().default(0)
});
export const updateShippingMethodInputSchema = z.object({
    shipping_method_id: z.string(),
    name: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
    cost: z.number().nonnegative().optional(),
    estimated_days_min: z.number().int().positive().optional(),
    estimated_days_max: z.number().int().positive().optional(),
    is_active: z.boolean().optional(),
    display_order: z.number().int().nonnegative().optional()
});
export const searchShippingMethodsInputSchema = z.object({
    is_active: z.boolean().optional(),
    limit: z.number().int().positive().default(20),
    offset: z.number().int().nonnegative().default(0),
    sort_by: z.enum(['display_order', 'name', 'cost']).default('display_order'),
    sort_order: z.enum(['asc', 'desc']).default('asc')
});
// ============================================================================
// PROMO_CODES SCHEMAS
// ============================================================================
export const promoCodeSchema = z.object({
    promo_code_id: z.string(),
    code: z.string(),
    description: z.string().nullable(),
    discount_type: z.string(),
    discount_value: z.number(),
    minimum_order_amount: z.number().nullable(),
    maximum_discount_amount: z.number().nullable(),
    usage_limit: z.number().int().nullable(),
    usage_count: z.number().int(),
    starts_at: z.coerce.date(),
    expires_at: z.coerce.date().nullable(),
    is_active: z.boolean(),
    created_at: z.coerce.date()
});
export const createPromoCodeInputSchema = z.object({
    code: z.string().min(1).max(100),
    description: z.string().nullable(),
    discount_type: z.enum(['percentage', 'fixed', 'shipping']),
    discount_value: z.number().nonnegative(),
    minimum_order_amount: z.number().nonnegative().nullable(),
    maximum_discount_amount: z.number().nonnegative().nullable(),
    usage_limit: z.number().int().positive().nullable(),
    starts_at: z.coerce.date(),
    expires_at: z.coerce.date().nullable()
});
export const updatePromoCodeInputSchema = z.object({
    promo_code_id: z.string(),
    code: z.string().min(1).max(100).optional(),
    description: z.string().nullable().optional(),
    discount_type: z.enum(['percentage', 'fixed', 'shipping']).optional(),
    discount_value: z.number().nonnegative().optional(),
    minimum_order_amount: z.number().nonnegative().nullable().optional(),
    maximum_discount_amount: z.number().nonnegative().nullable().optional(),
    usage_limit: z.number().int().positive().nullable().optional(),
    starts_at: z.coerce.date().optional(),
    expires_at: z.coerce.date().nullable().optional(),
    is_active: z.boolean().optional()
});
export const searchPromoCodesInputSchema = z.object({
    code: z.string().optional(),
    discount_type: z.enum(['percentage', 'fixed', 'shipping']).optional(),
    is_active: z.boolean().optional(),
    is_expired: z.boolean().optional(),
    limit: z.number().int().positive().default(20),
    offset: z.number().int().nonnegative().default(0),
    sort_by: z.enum(['created_at', 'code', 'starts_at', 'expires_at']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc')
});
// ============================================================================
// USER_SESSIONS SCHEMAS
// ============================================================================
export const userSessionSchema = z.object({
    session_id: z.string(),
    user_id: z.string().nullable(),
    token_hash: z.string(),
    expires_at: z.coerce.date(),
    ip_address: z.string().nullable(),
    user_agent: z.string().nullable(),
    is_active: z.boolean(),
    created_at: z.coerce.date()
});
export const createUserSessionInputSchema = z.object({
    user_id: z.string().nullable(),
    token_hash: z.string().min(1).max(500),
    expires_at: z.coerce.date(),
    ip_address: z.string().max(50).nullable(),
    user_agent: z.string().nullable()
});
export const updateUserSessionInputSchema = z.object({
    session_id: z.string(),
    expires_at: z.coerce.date().optional(),
    is_active: z.boolean().optional()
});
// ============================================================================
// ADMIN_SESSIONS SCHEMAS
// ============================================================================
export const adminSessionSchema = z.object({
    admin_session_id: z.string(),
    admin_id: z.string(),
    token_hash: z.string(),
    expires_at: z.coerce.date(),
    ip_address: z.string().nullable(),
    user_agent: z.string().nullable(),
    is_active: z.boolean(),
    created_at: z.coerce.date()
});
export const createAdminSessionInputSchema = z.object({
    admin_id: z.string(),
    token_hash: z.string().min(1).max(500),
    expires_at: z.coerce.date(),
    ip_address: z.string().max(50).nullable(),
    user_agent: z.string().nullable()
});
export const updateAdminSessionInputSchema = z.object({
    admin_session_id: z.string(),
    expires_at: z.coerce.date().optional(),
    is_active: z.boolean().optional()
});
// ============================================================================
// ORDER_STATUS_HISTORY SCHEMAS
// ============================================================================
export const orderStatusHistorySchema = z.object({
    status_history_id: z.string(),
    order_id: z.string(),
    old_status: z.string().nullable(),
    new_status: z.string(),
    changed_by_admin_id: z.string().nullable(),
    notes: z.string().nullable(),
    created_at: z.coerce.date()
});
export const createOrderStatusHistoryInputSchema = z.object({
    order_id: z.string(),
    old_status: z.string().max(100).nullable(),
    new_status: z.string().min(1).max(100),
    changed_by_admin_id: z.string().nullable(),
    notes: z.string().nullable()
});
export const searchOrderStatusHistoryInputSchema = z.object({
    order_id: z.string().optional(),
    new_status: z.string().optional(),
    changed_by_admin_id: z.string().optional(),
    limit: z.number().int().positive().default(20),
    offset: z.number().int().nonnegative().default(0),
    sort_by: z.enum(['created_at']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc')
});
// ============================================================================
// INVENTORY_ADJUSTMENTS SCHEMAS
// ============================================================================
export const inventoryAdjustmentSchema = z.object({
    adjustment_id: z.string(),
    product_id: z.string(),
    adjustment_type: z.string(),
    quantity_change: z.number().int(),
    old_quantity: z.number().int(),
    new_quantity: z.number().int(),
    reason: z.string().nullable(),
    admin_id: z.string().nullable(),
    created_at: z.coerce.date()
});
export const createInventoryAdjustmentInputSchema = z.object({
    product_id: z.string(),
    adjustment_type: z.enum(['sale', 'restock', 'adjustment', 'damaged', 'expired']),
    quantity_change: z.number().int(),
    old_quantity: z.number().int().nonnegative(),
    new_quantity: z.number().int().nonnegative(),
    reason: z.string().nullable(),
    admin_id: z.string().nullable()
});
export const searchInventoryAdjustmentsInputSchema = z.object({
    product_id: z.string().optional(),
    adjustment_type: z.enum(['sale', 'restock', 'adjustment', 'damaged', 'expired']).optional(),
    admin_id: z.string().optional(),
    date_from: z.coerce.date().optional(),
    date_to: z.coerce.date().optional(),
    limit: z.number().int().positive().default(20),
    offset: z.number().int().nonnegative().default(0),
    sort_by: z.enum(['created_at', 'quantity_change']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc')
});
//# sourceMappingURL=schema.js.map