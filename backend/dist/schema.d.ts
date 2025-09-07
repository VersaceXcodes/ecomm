import { z } from 'zod';
export declare const userSchema: z.ZodObject<{
    user_id: z.ZodString;
    email: z.ZodString;
    password_hash: z.ZodString;
    first_name: z.ZodString;
    last_name: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    email_verified: z.ZodBoolean;
    is_active: z.ZodBoolean;
    created_at: z.ZodDate;
    updated_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    email?: string;
    password_hash?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    email_verified?: boolean;
    is_active?: boolean;
    created_at?: Date;
    updated_at?: Date;
}, {
    user_id?: string;
    email?: string;
    password_hash?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    email_verified?: boolean;
    is_active?: boolean;
    created_at?: Date;
    updated_at?: Date;
}>;
export declare const createUserInputSchema: z.ZodObject<{
    email: z.ZodString;
    password_hash: z.ZodString;
    first_name: z.ZodString;
    last_name: z.ZodString;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    password_hash?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
}, {
    email?: string;
    password_hash?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
}>;
export declare const updateUserInputSchema: z.ZodObject<{
    user_id: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    password_hash: z.ZodOptional<z.ZodString>;
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    email_verified: z.ZodOptional<z.ZodBoolean>;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    email?: string;
    password_hash?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    email_verified?: boolean;
    is_active?: boolean;
}, {
    user_id?: string;
    email?: string;
    password_hash?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    email_verified?: boolean;
    is_active?: boolean;
}>;
export declare const searchUsersInputSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    email_verified: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodDefault<z.ZodEnum<["created_at", "email", "first_name", "last_name"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    email_verified?: boolean;
    is_active?: boolean;
    query?: string;
    limit?: number;
    offset?: number;
    sort_by?: "email" | "first_name" | "last_name" | "created_at";
    sort_order?: "asc" | "desc";
}, {
    email?: string;
    email_verified?: boolean;
    is_active?: boolean;
    query?: string;
    limit?: number;
    offset?: number;
    sort_by?: "email" | "first_name" | "last_name" | "created_at";
    sort_order?: "asc" | "desc";
}>;
export declare const adminUserSchema: z.ZodObject<{
    admin_id: z.ZodString;
    username: z.ZodString;
    email: z.ZodString;
    password_hash: z.ZodString;
    role: z.ZodString;
    permissions: z.ZodArray<z.ZodString, "many">;
    is_active: z.ZodBoolean;
    created_at: z.ZodDate;
    updated_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    email?: string;
    password_hash?: string;
    is_active?: boolean;
    created_at?: Date;
    updated_at?: Date;
    admin_id?: string;
    username?: string;
    role?: string;
    permissions?: string[];
}, {
    email?: string;
    password_hash?: string;
    is_active?: boolean;
    created_at?: Date;
    updated_at?: Date;
    admin_id?: string;
    username?: string;
    role?: string;
    permissions?: string[];
}>;
export declare const createAdminUserInputSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password_hash: z.ZodString;
    role: z.ZodString;
    permissions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    password_hash?: string;
    username?: string;
    role?: string;
    permissions?: string[];
}, {
    email?: string;
    password_hash?: string;
    username?: string;
    role?: string;
    permissions?: string[];
}>;
export declare const updateAdminUserInputSchema: z.ZodObject<{
    admin_id: z.ZodString;
    username: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    password_hash: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    password_hash?: string;
    is_active?: boolean;
    admin_id?: string;
    username?: string;
    role?: string;
    permissions?: string[];
}, {
    email?: string;
    password_hash?: string;
    is_active?: boolean;
    admin_id?: string;
    username?: string;
    role?: string;
    permissions?: string[];
}>;
export declare const searchAdminUsersInputSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodDefault<z.ZodEnum<["created_at", "username", "email", "role"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean;
    query?: string;
    limit?: number;
    offset?: number;
    sort_by?: "email" | "created_at" | "username" | "role";
    sort_order?: "asc" | "desc";
    role?: string;
}, {
    is_active?: boolean;
    query?: string;
    limit?: number;
    offset?: number;
    sort_by?: "email" | "created_at" | "username" | "role";
    sort_order?: "asc" | "desc";
    role?: string;
}>;
export declare const categorySchema: z.ZodObject<{
    category_id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    display_order: z.ZodNumber;
    is_active: z.ZodBoolean;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean;
    created_at?: Date;
    category_id?: string;
    name?: string;
    description?: string;
    display_order?: number;
}, {
    is_active?: boolean;
    created_at?: Date;
    category_id?: string;
    name?: string;
    description?: string;
    display_order?: number;
}>;
export declare const createCategoryInputSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    display_order: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
    display_order?: number;
}, {
    name?: string;
    description?: string;
    display_order?: number;
}>;
export declare const updateCategoryInputSchema: z.ZodObject<{
    category_id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    display_order: z.ZodOptional<z.ZodNumber>;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean;
    category_id?: string;
    name?: string;
    description?: string;
    display_order?: number;
}, {
    is_active?: boolean;
    category_id?: string;
    name?: string;
    description?: string;
    display_order?: number;
}>;
export declare const searchCategoriesInputSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodDefault<z.ZodEnum<["display_order", "name", "created_at"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean;
    query?: string;
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "name" | "display_order";
    sort_order?: "asc" | "desc";
}, {
    is_active?: boolean;
    query?: string;
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "name" | "display_order";
    sort_order?: "asc" | "desc";
}>;
export declare const productSchema: z.ZodObject<{
    product_id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    price: z.ZodNumber;
    sale_price: z.ZodNullable<z.ZodNumber>;
    stock_quantity: z.ZodNumber;
    sku: z.ZodString;
    brand: z.ZodString;
    fragrance_notes_top: z.ZodArray<z.ZodString, "many">;
    fragrance_notes_middle: z.ZodArray<z.ZodString, "many">;
    fragrance_notes_base: z.ZodArray<z.ZodString, "many">;
    size_volume: z.ZodString;
    category_id: z.ZodNullable<z.ZodString>;
    is_active: z.ZodBoolean;
    is_featured: z.ZodBoolean;
    meta_title: z.ZodNullable<z.ZodString>;
    meta_description: z.ZodNullable<z.ZodString>;
    view_count: z.ZodNumber;
    sales_count: z.ZodNumber;
    created_at: z.ZodDate;
    updated_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean;
    created_at?: Date;
    updated_at?: Date;
    category_id?: string;
    name?: string;
    description?: string;
    product_id?: string;
    price?: number;
    sale_price?: number;
    stock_quantity?: number;
    sku?: string;
    brand?: string;
    fragrance_notes_top?: string[];
    fragrance_notes_middle?: string[];
    fragrance_notes_base?: string[];
    size_volume?: string;
    is_featured?: boolean;
    meta_title?: string;
    meta_description?: string;
    view_count?: number;
    sales_count?: number;
}, {
    is_active?: boolean;
    created_at?: Date;
    updated_at?: Date;
    category_id?: string;
    name?: string;
    description?: string;
    product_id?: string;
    price?: number;
    sale_price?: number;
    stock_quantity?: number;
    sku?: string;
    brand?: string;
    fragrance_notes_top?: string[];
    fragrance_notes_middle?: string[];
    fragrance_notes_base?: string[];
    size_volume?: string;
    is_featured?: boolean;
    meta_title?: string;
    meta_description?: string;
    view_count?: number;
    sales_count?: number;
}>;
export declare const createProductInputSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    price: z.ZodNumber;
    sale_price: z.ZodNullable<z.ZodNumber>;
    stock_quantity: z.ZodDefault<z.ZodNumber>;
    sku: z.ZodString;
    brand: z.ZodString;
    fragrance_notes_top: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    fragrance_notes_middle: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    fragrance_notes_base: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    size_volume: z.ZodString;
    category_id: z.ZodNullable<z.ZodString>;
    meta_title: z.ZodNullable<z.ZodString>;
    meta_description: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    category_id?: string;
    name?: string;
    description?: string;
    price?: number;
    sale_price?: number;
    stock_quantity?: number;
    sku?: string;
    brand?: string;
    fragrance_notes_top?: string[];
    fragrance_notes_middle?: string[];
    fragrance_notes_base?: string[];
    size_volume?: string;
    meta_title?: string;
    meta_description?: string;
}, {
    category_id?: string;
    name?: string;
    description?: string;
    price?: number;
    sale_price?: number;
    stock_quantity?: number;
    sku?: string;
    brand?: string;
    fragrance_notes_top?: string[];
    fragrance_notes_middle?: string[];
    fragrance_notes_base?: string[];
    size_volume?: string;
    meta_title?: string;
    meta_description?: string;
}>;
export declare const updateProductInputSchema: z.ZodObject<{
    product_id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    price: z.ZodOptional<z.ZodNumber>;
    sale_price: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    stock_quantity: z.ZodOptional<z.ZodNumber>;
    sku: z.ZodOptional<z.ZodString>;
    brand: z.ZodOptional<z.ZodString>;
    fragrance_notes_top: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    fragrance_notes_middle: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    fragrance_notes_base: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    size_volume: z.ZodOptional<z.ZodString>;
    category_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    is_featured: z.ZodOptional<z.ZodBoolean>;
    meta_title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    meta_description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean;
    category_id?: string;
    name?: string;
    description?: string;
    product_id?: string;
    price?: number;
    sale_price?: number;
    stock_quantity?: number;
    sku?: string;
    brand?: string;
    fragrance_notes_top?: string[];
    fragrance_notes_middle?: string[];
    fragrance_notes_base?: string[];
    size_volume?: string;
    is_featured?: boolean;
    meta_title?: string;
    meta_description?: string;
}, {
    is_active?: boolean;
    category_id?: string;
    name?: string;
    description?: string;
    product_id?: string;
    price?: number;
    sale_price?: number;
    stock_quantity?: number;
    sku?: string;
    brand?: string;
    fragrance_notes_top?: string[];
    fragrance_notes_middle?: string[];
    fragrance_notes_base?: string[];
    size_volume?: string;
    is_featured?: boolean;
    meta_title?: string;
    meta_description?: string;
}>;
export declare const searchProductsInputSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    category_id: z.ZodOptional<z.ZodString>;
    brand: z.ZodOptional<z.ZodString>;
    min_price: z.ZodOptional<z.ZodNumber>;
    max_price: z.ZodOptional<z.ZodNumber>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    is_featured: z.ZodOptional<z.ZodBoolean>;
    in_stock: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodDefault<z.ZodEnum<["name", "price", "created_at", "view_count", "sales_count"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean;
    query?: string;
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "name" | "price" | "view_count" | "sales_count";
    sort_order?: "asc" | "desc";
    category_id?: string;
    brand?: string;
    is_featured?: boolean;
    min_price?: number;
    max_price?: number;
    in_stock?: boolean;
}, {
    is_active?: boolean;
    query?: string;
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "name" | "price" | "view_count" | "sales_count";
    sort_order?: "asc" | "desc";
    category_id?: string;
    brand?: string;
    is_featured?: boolean;
    min_price?: number;
    max_price?: number;
    in_stock?: boolean;
}>;
export declare const productImageSchema: z.ZodObject<{
    image_id: z.ZodString;
    product_id: z.ZodString;
    image_url: z.ZodString;
    alt_text: z.ZodNullable<z.ZodString>;
    display_order: z.ZodNumber;
    is_primary: z.ZodBoolean;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    created_at?: Date;
    display_order?: number;
    product_id?: string;
    image_id?: string;
    image_url?: string;
    alt_text?: string;
    is_primary?: boolean;
}, {
    created_at?: Date;
    display_order?: number;
    product_id?: string;
    image_id?: string;
    image_url?: string;
    alt_text?: string;
    is_primary?: boolean;
}>;
export declare const createProductImageInputSchema: z.ZodObject<{
    product_id: z.ZodString;
    image_url: z.ZodString;
    alt_text: z.ZodNullable<z.ZodString>;
    display_order: z.ZodDefault<z.ZodNumber>;
    is_primary: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    display_order?: number;
    product_id?: string;
    image_url?: string;
    alt_text?: string;
    is_primary?: boolean;
}, {
    display_order?: number;
    product_id?: string;
    image_url?: string;
    alt_text?: string;
    is_primary?: boolean;
}>;
export declare const updateProductImageInputSchema: z.ZodObject<{
    image_id: z.ZodString;
    image_url: z.ZodOptional<z.ZodString>;
    alt_text: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    display_order: z.ZodOptional<z.ZodNumber>;
    is_primary: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    display_order?: number;
    image_id?: string;
    image_url?: string;
    alt_text?: string;
    is_primary?: boolean;
}, {
    display_order?: number;
    image_id?: string;
    image_url?: string;
    alt_text?: string;
    is_primary?: boolean;
}>;
export declare const searchProductImagesInputSchema: z.ZodObject<{
    product_id: z.ZodOptional<z.ZodString>;
    is_primary: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodDefault<z.ZodEnum<["display_order", "created_at"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "display_order";
    sort_order?: "asc" | "desc";
    product_id?: string;
    is_primary?: boolean;
}, {
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "display_order";
    sort_order?: "asc" | "desc";
    product_id?: string;
    is_primary?: boolean;
}>;
export declare const addressSchema: z.ZodObject<{
    address_id: z.ZodString;
    user_id: z.ZodString;
    type: z.ZodString;
    first_name: z.ZodString;
    last_name: z.ZodString;
    street_address_1: z.ZodString;
    street_address_2: z.ZodNullable<z.ZodString>;
    city: z.ZodString;
    state_province: z.ZodString;
    postal_code: z.ZodString;
    country: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    is_default: z.ZodBoolean;
    created_at: z.ZodDate;
    updated_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    created_at?: Date;
    updated_at?: Date;
    type?: string;
    address_id?: string;
    street_address_1?: string;
    street_address_2?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
    is_default?: boolean;
}, {
    user_id?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    created_at?: Date;
    updated_at?: Date;
    type?: string;
    address_id?: string;
    street_address_1?: string;
    street_address_2?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
    is_default?: boolean;
}>;
export declare const createAddressInputSchema: z.ZodObject<{
    user_id: z.ZodString;
    type: z.ZodEnum<["shipping", "billing"]>;
    first_name: z.ZodString;
    last_name: z.ZodString;
    street_address_1: z.ZodString;
    street_address_2: z.ZodNullable<z.ZodString>;
    city: z.ZodString;
    state_province: z.ZodString;
    postal_code: z.ZodString;
    country: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    is_default: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    type?: "shipping" | "billing";
    street_address_1?: string;
    street_address_2?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
    is_default?: boolean;
}, {
    user_id?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    type?: "shipping" | "billing";
    street_address_1?: string;
    street_address_2?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
    is_default?: boolean;
}>;
export declare const updateAddressInputSchema: z.ZodObject<{
    address_id: z.ZodString;
    type: z.ZodOptional<z.ZodEnum<["shipping", "billing"]>>;
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    street_address_1: z.ZodOptional<z.ZodString>;
    street_address_2: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    city: z.ZodOptional<z.ZodString>;
    state_province: z.ZodOptional<z.ZodString>;
    postal_code: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    is_default: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    first_name?: string;
    last_name?: string;
    phone?: string;
    type?: "shipping" | "billing";
    address_id?: string;
    street_address_1?: string;
    street_address_2?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
    is_default?: boolean;
}, {
    first_name?: string;
    last_name?: string;
    phone?: string;
    type?: "shipping" | "billing";
    address_id?: string;
    street_address_1?: string;
    street_address_2?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
    is_default?: boolean;
}>;
export declare const searchAddressesInputSchema: z.ZodObject<{
    user_id: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["shipping", "billing"]>>;
    country: z.ZodOptional<z.ZodString>;
    is_default: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodDefault<z.ZodEnum<["created_at", "type"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    type?: "shipping" | "billing";
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "type";
    sort_order?: "asc" | "desc";
    country?: string;
    is_default?: boolean;
}, {
    user_id?: string;
    type?: "shipping" | "billing";
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "type";
    sort_order?: "asc" | "desc";
    country?: string;
    is_default?: boolean;
}>;
export declare const cartItemSchema: z.ZodObject<{
    cart_item_id: z.ZodString;
    user_id: z.ZodNullable<z.ZodString>;
    session_id: z.ZodNullable<z.ZodString>;
    product_id: z.ZodString;
    quantity: z.ZodNumber;
    added_at: z.ZodDate;
    updated_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    updated_at?: Date;
    product_id?: string;
    cart_item_id?: string;
    session_id?: string;
    quantity?: number;
    added_at?: Date;
}, {
    user_id?: string;
    updated_at?: Date;
    product_id?: string;
    cart_item_id?: string;
    session_id?: string;
    quantity?: number;
    added_at?: Date;
}>;
export declare const createCartItemInputSchema: z.ZodObject<{
    user_id: z.ZodNullable<z.ZodString>;
    session_id: z.ZodNullable<z.ZodString>;
    product_id: z.ZodString;
    quantity: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    product_id?: string;
    session_id?: string;
    quantity?: number;
}, {
    user_id?: string;
    product_id?: string;
    session_id?: string;
    quantity?: number;
}>;
export declare const updateCartItemInputSchema: z.ZodObject<{
    cart_item_id: z.ZodString;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    cart_item_id?: string;
    quantity?: number;
}, {
    cart_item_id?: string;
    quantity?: number;
}>;
export declare const searchCartItemsInputSchema: z.ZodObject<{
    user_id: z.ZodOptional<z.ZodString>;
    session_id: z.ZodOptional<z.ZodString>;
    product_id: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodDefault<z.ZodEnum<["added_at", "updated_at"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    limit?: number;
    offset?: number;
    sort_by?: "updated_at" | "added_at";
    sort_order?: "asc" | "desc";
    product_id?: string;
    session_id?: string;
}, {
    user_id?: string;
    limit?: number;
    offset?: number;
    sort_by?: "updated_at" | "added_at";
    sort_order?: "asc" | "desc";
    product_id?: string;
    session_id?: string;
}>;
export declare const orderSchema: z.ZodObject<{
    order_id: z.ZodString;
    order_number: z.ZodString;
    user_id: z.ZodNullable<z.ZodString>;
    guest_email: z.ZodNullable<z.ZodString>;
    status: z.ZodString;
    subtotal: z.ZodNumber;
    shipping_cost: z.ZodNumber;
    tax_amount: z.ZodNumber;
    discount_amount: z.ZodNumber;
    total_amount: z.ZodNumber;
    currency: z.ZodString;
    payment_method: z.ZodString;
    payment_status: z.ZodString;
    payment_transaction_id: z.ZodNullable<z.ZodString>;
    shipping_address_id: z.ZodString;
    billing_address_id: z.ZodString;
    shipping_method: z.ZodString;
    tracking_number: z.ZodNullable<z.ZodString>;
    estimated_delivery_date: z.ZodNullable<z.ZodDate>;
    delivered_at: z.ZodNullable<z.ZodDate>;
    notes: z.ZodNullable<z.ZodString>;
    promo_code: z.ZodNullable<z.ZodString>;
    created_at: z.ZodDate;
    updated_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    created_at?: Date;
    updated_at?: Date;
    status?: string;
    order_id?: string;
    order_number?: string;
    guest_email?: string;
    subtotal?: number;
    shipping_cost?: number;
    tax_amount?: number;
    discount_amount?: number;
    total_amount?: number;
    currency?: string;
    payment_method?: string;
    payment_status?: string;
    payment_transaction_id?: string;
    shipping_address_id?: string;
    billing_address_id?: string;
    shipping_method?: string;
    tracking_number?: string;
    estimated_delivery_date?: Date;
    delivered_at?: Date;
    notes?: string;
    promo_code?: string;
}, {
    user_id?: string;
    created_at?: Date;
    updated_at?: Date;
    status?: string;
    order_id?: string;
    order_number?: string;
    guest_email?: string;
    subtotal?: number;
    shipping_cost?: number;
    tax_amount?: number;
    discount_amount?: number;
    total_amount?: number;
    currency?: string;
    payment_method?: string;
    payment_status?: string;
    payment_transaction_id?: string;
    shipping_address_id?: string;
    billing_address_id?: string;
    shipping_method?: string;
    tracking_number?: string;
    estimated_delivery_date?: Date;
    delivered_at?: Date;
    notes?: string;
    promo_code?: string;
}>;
export declare const createOrderInputSchema: z.ZodObject<{
    order_number: z.ZodString;
    user_id: z.ZodNullable<z.ZodString>;
    guest_email: z.ZodNullable<z.ZodString>;
    subtotal: z.ZodNumber;
    shipping_cost: z.ZodDefault<z.ZodNumber>;
    tax_amount: z.ZodDefault<z.ZodNumber>;
    discount_amount: z.ZodDefault<z.ZodNumber>;
    total_amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    payment_method: z.ZodString;
    shipping_address_id: z.ZodString;
    billing_address_id: z.ZodString;
    shipping_method: z.ZodString;
    notes: z.ZodNullable<z.ZodString>;
    promo_code: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    order_number?: string;
    guest_email?: string;
    subtotal?: number;
    shipping_cost?: number;
    tax_amount?: number;
    discount_amount?: number;
    total_amount?: number;
    currency?: string;
    payment_method?: string;
    shipping_address_id?: string;
    billing_address_id?: string;
    shipping_method?: string;
    notes?: string;
    promo_code?: string;
}, {
    user_id?: string;
    order_number?: string;
    guest_email?: string;
    subtotal?: number;
    shipping_cost?: number;
    tax_amount?: number;
    discount_amount?: number;
    total_amount?: number;
    currency?: string;
    payment_method?: string;
    shipping_address_id?: string;
    billing_address_id?: string;
    shipping_method?: string;
    notes?: string;
    promo_code?: string;
}>;
export declare const updateOrderInputSchema: z.ZodObject<{
    order_id: z.ZodString;
    status: z.ZodOptional<z.ZodEnum<["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]>>;
    payment_status: z.ZodOptional<z.ZodEnum<["pending", "paid", "failed", "refunded"]>>;
    payment_transaction_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    tracking_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    estimated_delivery_date: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    delivered_at: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
    order_id?: string;
    payment_status?: "pending" | "refunded" | "paid" | "failed";
    payment_transaction_id?: string;
    tracking_number?: string;
    estimated_delivery_date?: Date;
    delivered_at?: Date;
    notes?: string;
}, {
    status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
    order_id?: string;
    payment_status?: "pending" | "refunded" | "paid" | "failed";
    payment_transaction_id?: string;
    tracking_number?: string;
    estimated_delivery_date?: Date;
    delivered_at?: Date;
    notes?: string;
}>;
export declare const searchOrdersInputSchema: z.ZodObject<{
    user_id: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]>>;
    payment_status: z.ZodOptional<z.ZodEnum<["pending", "paid", "failed", "refunded"]>>;
    order_number: z.ZodOptional<z.ZodString>;
    date_from: z.ZodOptional<z.ZodDate>;
    date_to: z.ZodOptional<z.ZodDate>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodDefault<z.ZodEnum<["created_at", "total_amount", "status"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "status" | "total_amount";
    sort_order?: "asc" | "desc";
    order_number?: string;
    payment_status?: "pending" | "refunded" | "paid" | "failed";
    date_from?: Date;
    date_to?: Date;
}, {
    user_id?: string;
    status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "status" | "total_amount";
    sort_order?: "asc" | "desc";
    order_number?: string;
    payment_status?: "pending" | "refunded" | "paid" | "failed";
    date_from?: Date;
    date_to?: Date;
}>;
export declare const orderItemSchema: z.ZodObject<{
    order_item_id: z.ZodString;
    order_id: z.ZodString;
    product_id: z.ZodString;
    product_name: z.ZodString;
    product_brand: z.ZodString;
    product_sku: z.ZodString;
    product_image_url: z.ZodNullable<z.ZodString>;
    product_price: z.ZodNumber;
    sale_price: z.ZodNullable<z.ZodNumber>;
    quantity: z.ZodNumber;
    line_total: z.ZodNumber;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    created_at?: Date;
    product_id?: string;
    sale_price?: number;
    quantity?: number;
    order_id?: string;
    order_item_id?: string;
    product_name?: string;
    product_brand?: string;
    product_sku?: string;
    product_image_url?: string;
    product_price?: number;
    line_total?: number;
}, {
    created_at?: Date;
    product_id?: string;
    sale_price?: number;
    quantity?: number;
    order_id?: string;
    order_item_id?: string;
    product_name?: string;
    product_brand?: string;
    product_sku?: string;
    product_image_url?: string;
    product_price?: number;
    line_total?: number;
}>;
export declare const createOrderItemInputSchema: z.ZodObject<{
    order_id: z.ZodString;
    product_id: z.ZodString;
    product_name: z.ZodString;
    product_brand: z.ZodString;
    product_sku: z.ZodString;
    product_image_url: z.ZodNullable<z.ZodString>;
    product_price: z.ZodNumber;
    sale_price: z.ZodNullable<z.ZodNumber>;
    quantity: z.ZodNumber;
    line_total: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    product_id?: string;
    sale_price?: number;
    quantity?: number;
    order_id?: string;
    product_name?: string;
    product_brand?: string;
    product_sku?: string;
    product_image_url?: string;
    product_price?: number;
    line_total?: number;
}, {
    product_id?: string;
    sale_price?: number;
    quantity?: number;
    order_id?: string;
    product_name?: string;
    product_brand?: string;
    product_sku?: string;
    product_image_url?: string;
    product_price?: number;
    line_total?: number;
}>;
export declare const searchOrderItemsInputSchema: z.ZodObject<{
    order_id: z.ZodOptional<z.ZodString>;
    product_id: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodDefault<z.ZodEnum<["created_at", "line_total"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "line_total";
    sort_order?: "asc" | "desc";
    product_id?: string;
    order_id?: string;
}, {
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "line_total";
    sort_order?: "asc" | "desc";
    product_id?: string;
    order_id?: string;
}>;
export declare const wishlistItemSchema: z.ZodObject<{
    wishlist_item_id: z.ZodString;
    user_id: z.ZodString;
    product_id: z.ZodString;
    added_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    product_id?: string;
    added_at?: Date;
    wishlist_item_id?: string;
}, {
    user_id?: string;
    product_id?: string;
    added_at?: Date;
    wishlist_item_id?: string;
}>;
export declare const createWishlistItemInputSchema: z.ZodObject<{
    user_id: z.ZodString;
    product_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    product_id?: string;
}, {
    user_id?: string;
    product_id?: string;
}>;
export declare const searchWishlistItemsInputSchema: z.ZodObject<{
    user_id: z.ZodOptional<z.ZodString>;
    product_id: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodDefault<z.ZodEnum<["added_at"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    limit?: number;
    offset?: number;
    sort_by?: "added_at";
    sort_order?: "asc" | "desc";
    product_id?: string;
}, {
    user_id?: string;
    limit?: number;
    offset?: number;
    sort_by?: "added_at";
    sort_order?: "asc" | "desc";
    product_id?: string;
}>;
export declare const productReviewSchema: z.ZodObject<{
    review_id: z.ZodString;
    product_id: z.ZodString;
    user_id: z.ZodString;
    order_id: z.ZodNullable<z.ZodString>;
    rating: z.ZodNumber;
    title: z.ZodNullable<z.ZodString>;
    comment: z.ZodNullable<z.ZodString>;
    is_verified_purchase: z.ZodBoolean;
    is_approved: z.ZodBoolean;
    admin_response: z.ZodNullable<z.ZodString>;
    helpful_votes: z.ZodNumber;
    created_at: z.ZodDate;
    updated_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    created_at?: Date;
    updated_at?: Date;
    product_id?: string;
    order_id?: string;
    review_id?: string;
    rating?: number;
    title?: string;
    comment?: string;
    is_verified_purchase?: boolean;
    is_approved?: boolean;
    admin_response?: string;
    helpful_votes?: number;
}, {
    user_id?: string;
    created_at?: Date;
    updated_at?: Date;
    product_id?: string;
    order_id?: string;
    review_id?: string;
    rating?: number;
    title?: string;
    comment?: string;
    is_verified_purchase?: boolean;
    is_approved?: boolean;
    admin_response?: string;
    helpful_votes?: number;
}>;
export declare const createProductReviewInputSchema: z.ZodObject<{
    product_id: z.ZodString;
    user_id: z.ZodString;
    order_id: z.ZodNullable<z.ZodString>;
    rating: z.ZodNumber;
    title: z.ZodNullable<z.ZodString>;
    comment: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    product_id?: string;
    order_id?: string;
    rating?: number;
    title?: string;
    comment?: string;
}, {
    user_id?: string;
    product_id?: string;
    order_id?: string;
    rating?: number;
    title?: string;
    comment?: string;
}>;
export declare const updateProductReviewInputSchema: z.ZodObject<{
    review_id: z.ZodString;
    rating: z.ZodOptional<z.ZodNumber>;
    title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    comment: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    is_approved: z.ZodOptional<z.ZodBoolean>;
    admin_response: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    review_id?: string;
    rating?: number;
    title?: string;
    comment?: string;
    is_approved?: boolean;
    admin_response?: string;
}, {
    review_id?: string;
    rating?: number;
    title?: string;
    comment?: string;
    is_approved?: boolean;
    admin_response?: string;
}>;
export declare const searchProductReviewsInputSchema: z.ZodObject<{
    product_id: z.ZodOptional<z.ZodString>;
    user_id: z.ZodOptional<z.ZodString>;
    rating: z.ZodOptional<z.ZodNumber>;
    is_approved: z.ZodOptional<z.ZodBoolean>;
    is_verified_purchase: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodDefault<z.ZodEnum<["created_at", "rating", "helpful_votes"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "rating" | "helpful_votes";
    sort_order?: "asc" | "desc";
    product_id?: string;
    rating?: number;
    is_verified_purchase?: boolean;
    is_approved?: boolean;
}, {
    user_id?: string;
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "rating" | "helpful_votes";
    sort_order?: "asc" | "desc";
    product_id?: string;
    rating?: number;
    is_verified_purchase?: boolean;
    is_approved?: boolean;
}>;
export declare const guestAddressSchema: z.ZodObject<{
    guest_address_id: z.ZodString;
    order_id: z.ZodString;
    type: z.ZodString;
    first_name: z.ZodString;
    last_name: z.ZodString;
    email: z.ZodString;
    street_address_1: z.ZodString;
    street_address_2: z.ZodNullable<z.ZodString>;
    city: z.ZodString;
    state_province: z.ZodString;
    postal_code: z.ZodString;
    country: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    created_at?: Date;
    type?: string;
    street_address_1?: string;
    street_address_2?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
    order_id?: string;
    guest_address_id?: string;
}, {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    created_at?: Date;
    type?: string;
    street_address_1?: string;
    street_address_2?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
    order_id?: string;
    guest_address_id?: string;
}>;
export declare const createGuestAddressInputSchema: z.ZodObject<{
    order_id: z.ZodString;
    type: z.ZodEnum<["shipping", "billing"]>;
    first_name: z.ZodString;
    last_name: z.ZodString;
    email: z.ZodString;
    street_address_1: z.ZodString;
    street_address_2: z.ZodNullable<z.ZodString>;
    city: z.ZodString;
    state_province: z.ZodString;
    postal_code: z.ZodString;
    country: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    type?: "shipping" | "billing";
    street_address_1?: string;
    street_address_2?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
    order_id?: string;
}, {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    type?: "shipping" | "billing";
    street_address_1?: string;
    street_address_2?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
    order_id?: string;
}>;
export declare const newsletterSubscriptionSchema: z.ZodObject<{
    subscription_id: z.ZodString;
    email: z.ZodString;
    is_active: z.ZodBoolean;
    subscribed_at: z.ZodDate;
    unsubscribed_at: z.ZodNullable<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    is_active?: boolean;
    subscription_id?: string;
    subscribed_at?: Date;
    unsubscribed_at?: Date;
}, {
    email?: string;
    is_active?: boolean;
    subscription_id?: string;
    subscribed_at?: Date;
    unsubscribed_at?: Date;
}>;
export declare const createNewsletterSubscriptionInputSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
}, {
    email?: string;
}>;
export declare const updateNewsletterSubscriptionInputSchema: z.ZodObject<{
    subscription_id: z.ZodString;
    is_active: z.ZodBoolean;
    unsubscribed_at: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean;
    subscription_id?: string;
    unsubscribed_at?: Date;
}, {
    is_active?: boolean;
    subscription_id?: string;
    unsubscribed_at?: Date;
}>;
export declare const searchNewsletterSubscriptionsInputSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodDefault<z.ZodEnum<["subscribed_at", "email"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
    sort_by?: "email" | "subscribed_at";
    sort_order?: "asc" | "desc";
}, {
    email?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
    sort_by?: "email" | "subscribed_at";
    sort_order?: "asc" | "desc";
}>;
export declare const contactMessageSchema: z.ZodObject<{
    message_id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    subject: z.ZodString;
    message: z.ZodString;
    status: z.ZodString;
    admin_response: z.ZodNullable<z.ZodString>;
    created_at: z.ZodDate;
    updated_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    email?: string;
    phone?: string;
    created_at?: Date;
    updated_at?: Date;
    message?: string;
    status?: string;
    name?: string;
    admin_response?: string;
    message_id?: string;
    subject?: string;
}, {
    email?: string;
    phone?: string;
    created_at?: Date;
    updated_at?: Date;
    message?: string;
    status?: string;
    name?: string;
    admin_response?: string;
    message_id?: string;
    subject?: string;
}>;
export declare const createContactMessageInputSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    subject: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
    phone?: string;
    message?: string;
    name?: string;
    subject?: string;
}, {
    email?: string;
    phone?: string;
    message?: string;
    name?: string;
    subject?: string;
}>;
export declare const updateContactMessageInputSchema: z.ZodObject<{
    message_id: z.ZodString;
    status: z.ZodOptional<z.ZodEnum<["new", "pending", "resolved", "closed"]>>;
    admin_response: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "new" | "resolved" | "closed";
    admin_response?: string;
    message_id?: string;
}, {
    status?: "pending" | "new" | "resolved" | "closed";
    admin_response?: string;
    message_id?: string;
}>;
export declare const searchContactMessagesInputSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["new", "pending", "resolved", "closed"]>>;
    email: z.ZodOptional<z.ZodString>;
    date_from: z.ZodOptional<z.ZodDate>;
    date_to: z.ZodOptional<z.ZodDate>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodDefault<z.ZodEnum<["created_at", "status"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    status?: "pending" | "new" | "resolved" | "closed";
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "status";
    sort_order?: "asc" | "desc";
    date_from?: Date;
    date_to?: Date;
}, {
    email?: string;
    status?: "pending" | "new" | "resolved" | "closed";
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "status";
    sort_order?: "asc" | "desc";
    date_from?: Date;
    date_to?: Date;
}>;
export declare const shippingMethodSchema: z.ZodObject<{
    shipping_method_id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    cost: z.ZodNumber;
    estimated_days_min: z.ZodNumber;
    estimated_days_max: z.ZodNumber;
    is_active: z.ZodBoolean;
    display_order: z.ZodNumber;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean;
    created_at?: Date;
    name?: string;
    description?: string;
    display_order?: number;
    shipping_method_id?: string;
    cost?: number;
    estimated_days_min?: number;
    estimated_days_max?: number;
}, {
    is_active?: boolean;
    created_at?: Date;
    name?: string;
    description?: string;
    display_order?: number;
    shipping_method_id?: string;
    cost?: number;
    estimated_days_min?: number;
    estimated_days_max?: number;
}>;
export declare const createShippingMethodInputSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    cost: z.ZodNumber;
    estimated_days_min: z.ZodNumber;
    estimated_days_max: z.ZodNumber;
    display_order: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
    display_order?: number;
    cost?: number;
    estimated_days_min?: number;
    estimated_days_max?: number;
}, {
    name?: string;
    description?: string;
    display_order?: number;
    cost?: number;
    estimated_days_min?: number;
    estimated_days_max?: number;
}>;
export declare const updateShippingMethodInputSchema: z.ZodObject<{
    shipping_method_id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    cost: z.ZodOptional<z.ZodNumber>;
    estimated_days_min: z.ZodOptional<z.ZodNumber>;
    estimated_days_max: z.ZodOptional<z.ZodNumber>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    display_order: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean;
    name?: string;
    description?: string;
    display_order?: number;
    shipping_method_id?: string;
    cost?: number;
    estimated_days_min?: number;
    estimated_days_max?: number;
}, {
    is_active?: boolean;
    name?: string;
    description?: string;
    display_order?: number;
    shipping_method_id?: string;
    cost?: number;
    estimated_days_min?: number;
    estimated_days_max?: number;
}>;
export declare const searchShippingMethodsInputSchema: z.ZodObject<{
    is_active: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodDefault<z.ZodEnum<["display_order", "name", "cost"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean;
    limit?: number;
    offset?: number;
    sort_by?: "name" | "display_order" | "cost";
    sort_order?: "asc" | "desc";
}, {
    is_active?: boolean;
    limit?: number;
    offset?: number;
    sort_by?: "name" | "display_order" | "cost";
    sort_order?: "asc" | "desc";
}>;
export declare const promoCodeSchema: z.ZodObject<{
    promo_code_id: z.ZodString;
    code: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    discount_type: z.ZodString;
    discount_value: z.ZodNumber;
    minimum_order_amount: z.ZodNullable<z.ZodNumber>;
    maximum_discount_amount: z.ZodNullable<z.ZodNumber>;
    usage_limit: z.ZodNullable<z.ZodNumber>;
    usage_count: z.ZodNumber;
    starts_at: z.ZodDate;
    expires_at: z.ZodNullable<z.ZodDate>;
    is_active: z.ZodBoolean;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean;
    created_at?: Date;
    code?: string;
    description?: string;
    promo_code_id?: string;
    discount_type?: string;
    discount_value?: number;
    minimum_order_amount?: number;
    maximum_discount_amount?: number;
    usage_limit?: number;
    usage_count?: number;
    starts_at?: Date;
    expires_at?: Date;
}, {
    is_active?: boolean;
    created_at?: Date;
    code?: string;
    description?: string;
    promo_code_id?: string;
    discount_type?: string;
    discount_value?: number;
    minimum_order_amount?: number;
    maximum_discount_amount?: number;
    usage_limit?: number;
    usage_count?: number;
    starts_at?: Date;
    expires_at?: Date;
}>;
export declare const createPromoCodeInputSchema: z.ZodObject<{
    code: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    discount_type: z.ZodEnum<["percentage", "fixed", "shipping"]>;
    discount_value: z.ZodNumber;
    minimum_order_amount: z.ZodNullable<z.ZodNumber>;
    maximum_discount_amount: z.ZodNullable<z.ZodNumber>;
    usage_limit: z.ZodNullable<z.ZodNumber>;
    starts_at: z.ZodDate;
    expires_at: z.ZodNullable<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    code?: string;
    description?: string;
    discount_type?: "shipping" | "percentage" | "fixed";
    discount_value?: number;
    minimum_order_amount?: number;
    maximum_discount_amount?: number;
    usage_limit?: number;
    starts_at?: Date;
    expires_at?: Date;
}, {
    code?: string;
    description?: string;
    discount_type?: "shipping" | "percentage" | "fixed";
    discount_value?: number;
    minimum_order_amount?: number;
    maximum_discount_amount?: number;
    usage_limit?: number;
    starts_at?: Date;
    expires_at?: Date;
}>;
export declare const updatePromoCodeInputSchema: z.ZodObject<{
    promo_code_id: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    discount_type: z.ZodOptional<z.ZodEnum<["percentage", "fixed", "shipping"]>>;
    discount_value: z.ZodOptional<z.ZodNumber>;
    minimum_order_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    maximum_discount_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    usage_limit: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    starts_at: z.ZodOptional<z.ZodDate>;
    expires_at: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean;
    code?: string;
    description?: string;
    promo_code_id?: string;
    discount_type?: "shipping" | "percentage" | "fixed";
    discount_value?: number;
    minimum_order_amount?: number;
    maximum_discount_amount?: number;
    usage_limit?: number;
    starts_at?: Date;
    expires_at?: Date;
}, {
    is_active?: boolean;
    code?: string;
    description?: string;
    promo_code_id?: string;
    discount_type?: "shipping" | "percentage" | "fixed";
    discount_value?: number;
    minimum_order_amount?: number;
    maximum_discount_amount?: number;
    usage_limit?: number;
    starts_at?: Date;
    expires_at?: Date;
}>;
export declare const searchPromoCodesInputSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    discount_type: z.ZodOptional<z.ZodEnum<["percentage", "fixed", "shipping"]>>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    is_expired: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodDefault<z.ZodEnum<["created_at", "code", "starts_at", "expires_at"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean;
    code?: string;
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "code" | "starts_at" | "expires_at";
    sort_order?: "asc" | "desc";
    discount_type?: "shipping" | "percentage" | "fixed";
    is_expired?: boolean;
}, {
    is_active?: boolean;
    code?: string;
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "code" | "starts_at" | "expires_at";
    sort_order?: "asc" | "desc";
    discount_type?: "shipping" | "percentage" | "fixed";
    is_expired?: boolean;
}>;
export declare const userSessionSchema: z.ZodObject<{
    session_id: z.ZodString;
    user_id: z.ZodNullable<z.ZodString>;
    token_hash: z.ZodString;
    expires_at: z.ZodDate;
    ip_address: z.ZodNullable<z.ZodString>;
    user_agent: z.ZodNullable<z.ZodString>;
    is_active: z.ZodBoolean;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    is_active?: boolean;
    created_at?: Date;
    session_id?: string;
    expires_at?: Date;
    token_hash?: string;
    ip_address?: string;
    user_agent?: string;
}, {
    user_id?: string;
    is_active?: boolean;
    created_at?: Date;
    session_id?: string;
    expires_at?: Date;
    token_hash?: string;
    ip_address?: string;
    user_agent?: string;
}>;
export declare const createUserSessionInputSchema: z.ZodObject<{
    user_id: z.ZodNullable<z.ZodString>;
    token_hash: z.ZodString;
    expires_at: z.ZodDate;
    ip_address: z.ZodNullable<z.ZodString>;
    user_agent: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    user_id?: string;
    expires_at?: Date;
    token_hash?: string;
    ip_address?: string;
    user_agent?: string;
}, {
    user_id?: string;
    expires_at?: Date;
    token_hash?: string;
    ip_address?: string;
    user_agent?: string;
}>;
export declare const updateUserSessionInputSchema: z.ZodObject<{
    session_id: z.ZodString;
    expires_at: z.ZodOptional<z.ZodDate>;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean;
    session_id?: string;
    expires_at?: Date;
}, {
    is_active?: boolean;
    session_id?: string;
    expires_at?: Date;
}>;
export declare const adminSessionSchema: z.ZodObject<{
    admin_session_id: z.ZodString;
    admin_id: z.ZodString;
    token_hash: z.ZodString;
    expires_at: z.ZodDate;
    ip_address: z.ZodNullable<z.ZodString>;
    user_agent: z.ZodNullable<z.ZodString>;
    is_active: z.ZodBoolean;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean;
    created_at?: Date;
    admin_id?: string;
    expires_at?: Date;
    token_hash?: string;
    ip_address?: string;
    user_agent?: string;
    admin_session_id?: string;
}, {
    is_active?: boolean;
    created_at?: Date;
    admin_id?: string;
    expires_at?: Date;
    token_hash?: string;
    ip_address?: string;
    user_agent?: string;
    admin_session_id?: string;
}>;
export declare const createAdminSessionInputSchema: z.ZodObject<{
    admin_id: z.ZodString;
    token_hash: z.ZodString;
    expires_at: z.ZodDate;
    ip_address: z.ZodNullable<z.ZodString>;
    user_agent: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    admin_id?: string;
    expires_at?: Date;
    token_hash?: string;
    ip_address?: string;
    user_agent?: string;
}, {
    admin_id?: string;
    expires_at?: Date;
    token_hash?: string;
    ip_address?: string;
    user_agent?: string;
}>;
export declare const updateAdminSessionInputSchema: z.ZodObject<{
    admin_session_id: z.ZodString;
    expires_at: z.ZodOptional<z.ZodDate>;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean;
    expires_at?: Date;
    admin_session_id?: string;
}, {
    is_active?: boolean;
    expires_at?: Date;
    admin_session_id?: string;
}>;
export declare const orderStatusHistorySchema: z.ZodObject<{
    status_history_id: z.ZodString;
    order_id: z.ZodString;
    old_status: z.ZodNullable<z.ZodString>;
    new_status: z.ZodString;
    changed_by_admin_id: z.ZodNullable<z.ZodString>;
    notes: z.ZodNullable<z.ZodString>;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    created_at?: Date;
    order_id?: string;
    notes?: string;
    status_history_id?: string;
    old_status?: string;
    new_status?: string;
    changed_by_admin_id?: string;
}, {
    created_at?: Date;
    order_id?: string;
    notes?: string;
    status_history_id?: string;
    old_status?: string;
    new_status?: string;
    changed_by_admin_id?: string;
}>;
export declare const createOrderStatusHistoryInputSchema: z.ZodObject<{
    order_id: z.ZodString;
    old_status: z.ZodNullable<z.ZodString>;
    new_status: z.ZodString;
    changed_by_admin_id: z.ZodNullable<z.ZodString>;
    notes: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    order_id?: string;
    notes?: string;
    old_status?: string;
    new_status?: string;
    changed_by_admin_id?: string;
}, {
    order_id?: string;
    notes?: string;
    old_status?: string;
    new_status?: string;
    changed_by_admin_id?: string;
}>;
export declare const searchOrderStatusHistoryInputSchema: z.ZodObject<{
    order_id: z.ZodOptional<z.ZodString>;
    new_status: z.ZodOptional<z.ZodString>;
    changed_by_admin_id: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodDefault<z.ZodEnum<["created_at"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    limit?: number;
    offset?: number;
    sort_by?: "created_at";
    sort_order?: "asc" | "desc";
    order_id?: string;
    new_status?: string;
    changed_by_admin_id?: string;
}, {
    limit?: number;
    offset?: number;
    sort_by?: "created_at";
    sort_order?: "asc" | "desc";
    order_id?: string;
    new_status?: string;
    changed_by_admin_id?: string;
}>;
export declare const inventoryAdjustmentSchema: z.ZodObject<{
    adjustment_id: z.ZodString;
    product_id: z.ZodString;
    adjustment_type: z.ZodString;
    quantity_change: z.ZodNumber;
    old_quantity: z.ZodNumber;
    new_quantity: z.ZodNumber;
    reason: z.ZodNullable<z.ZodString>;
    admin_id: z.ZodNullable<z.ZodString>;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    created_at?: Date;
    admin_id?: string;
    product_id?: string;
    adjustment_id?: string;
    adjustment_type?: string;
    quantity_change?: number;
    old_quantity?: number;
    new_quantity?: number;
    reason?: string;
}, {
    created_at?: Date;
    admin_id?: string;
    product_id?: string;
    adjustment_id?: string;
    adjustment_type?: string;
    quantity_change?: number;
    old_quantity?: number;
    new_quantity?: number;
    reason?: string;
}>;
export declare const createInventoryAdjustmentInputSchema: z.ZodObject<{
    product_id: z.ZodString;
    adjustment_type: z.ZodEnum<["sale", "restock", "adjustment", "damaged", "expired"]>;
    quantity_change: z.ZodNumber;
    old_quantity: z.ZodNumber;
    new_quantity: z.ZodNumber;
    reason: z.ZodNullable<z.ZodString>;
    admin_id: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    admin_id?: string;
    product_id?: string;
    adjustment_type?: "sale" | "restock" | "adjustment" | "damaged" | "expired";
    quantity_change?: number;
    old_quantity?: number;
    new_quantity?: number;
    reason?: string;
}, {
    admin_id?: string;
    product_id?: string;
    adjustment_type?: "sale" | "restock" | "adjustment" | "damaged" | "expired";
    quantity_change?: number;
    old_quantity?: number;
    new_quantity?: number;
    reason?: string;
}>;
export declare const searchInventoryAdjustmentsInputSchema: z.ZodObject<{
    product_id: z.ZodOptional<z.ZodString>;
    adjustment_type: z.ZodOptional<z.ZodEnum<["sale", "restock", "adjustment", "damaged", "expired"]>>;
    admin_id: z.ZodOptional<z.ZodString>;
    date_from: z.ZodOptional<z.ZodDate>;
    date_to: z.ZodOptional<z.ZodDate>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodDefault<z.ZodEnum<["created_at", "quantity_change"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "quantity_change";
    sort_order?: "asc" | "desc";
    admin_id?: string;
    product_id?: string;
    date_from?: Date;
    date_to?: Date;
    adjustment_type?: "sale" | "restock" | "adjustment" | "damaged" | "expired";
}, {
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "quantity_change";
    sort_order?: "asc" | "desc";
    admin_id?: string;
    product_id?: string;
    date_from?: Date;
    date_to?: Date;
    adjustment_type?: "sale" | "restock" | "adjustment" | "damaged" | "expired";
}>;
export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersInputSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type CreateAdminUserInput = z.infer<typeof createAdminUserInputSchema>;
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserInputSchema>;
export type SearchAdminUsersInput = z.infer<typeof searchAdminUsersInputSchema>;
export type Category = z.infer<typeof categorySchema>;
export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;
export type SearchCategoriesInput = z.infer<typeof searchCategoriesInputSchema>;
export type Product = z.infer<typeof productSchema>;
export type CreateProductInput = z.infer<typeof createProductInputSchema>;
export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;
export type SearchProductsInput = z.infer<typeof searchProductsInputSchema>;
export type ProductImage = z.infer<typeof productImageSchema>;
export type CreateProductImageInput = z.infer<typeof createProductImageInputSchema>;
export type UpdateProductImageInput = z.infer<typeof updateProductImageInputSchema>;
export type SearchProductImagesInput = z.infer<typeof searchProductImagesInputSchema>;
export type Address = z.infer<typeof addressSchema>;
export type CreateAddressInput = z.infer<typeof createAddressInputSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressInputSchema>;
export type SearchAddressesInput = z.infer<typeof searchAddressesInputSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type CreateCartItemInput = z.infer<typeof createCartItemInputSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemInputSchema>;
export type SearchCartItemsInput = z.infer<typeof searchCartItemsInputSchema>;
export type Order = z.infer<typeof orderSchema>;
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderInputSchema>;
export type SearchOrdersInput = z.infer<typeof searchOrdersInputSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type CreateOrderItemInput = z.infer<typeof createOrderItemInputSchema>;
export type SearchOrderItemsInput = z.infer<typeof searchOrderItemsInputSchema>;
export type WishlistItem = z.infer<typeof wishlistItemSchema>;
export type CreateWishlistItemInput = z.infer<typeof createWishlistItemInputSchema>;
export type SearchWishlistItemsInput = z.infer<typeof searchWishlistItemsInputSchema>;
export type ProductReview = z.infer<typeof productReviewSchema>;
export type CreateProductReviewInput = z.infer<typeof createProductReviewInputSchema>;
export type UpdateProductReviewInput = z.infer<typeof updateProductReviewInputSchema>;
export type SearchProductReviewsInput = z.infer<typeof searchProductReviewsInputSchema>;
export type GuestAddress = z.infer<typeof guestAddressSchema>;
export type CreateGuestAddressInput = z.infer<typeof createGuestAddressInputSchema>;
export type NewsletterSubscription = z.infer<typeof newsletterSubscriptionSchema>;
export type CreateNewsletterSubscriptionInput = z.infer<typeof createNewsletterSubscriptionInputSchema>;
export type UpdateNewsletterSubscriptionInput = z.infer<typeof updateNewsletterSubscriptionInputSchema>;
export type SearchNewsletterSubscriptionsInput = z.infer<typeof searchNewsletterSubscriptionsInputSchema>;
export type ContactMessage = z.infer<typeof contactMessageSchema>;
export type CreateContactMessageInput = z.infer<typeof createContactMessageInputSchema>;
export type UpdateContactMessageInput = z.infer<typeof updateContactMessageInputSchema>;
export type SearchContactMessagesInput = z.infer<typeof searchContactMessagesInputSchema>;
export type ShippingMethod = z.infer<typeof shippingMethodSchema>;
export type CreateShippingMethodInput = z.infer<typeof createShippingMethodInputSchema>;
export type UpdateShippingMethodInput = z.infer<typeof updateShippingMethodInputSchema>;
export type SearchShippingMethodsInput = z.infer<typeof searchShippingMethodsInputSchema>;
export type PromoCode = z.infer<typeof promoCodeSchema>;
export type CreatePromoCodeInput = z.infer<typeof createPromoCodeInputSchema>;
export type UpdatePromoCodeInput = z.infer<typeof updatePromoCodeInputSchema>;
export type SearchPromoCodesInput = z.infer<typeof searchPromoCodesInputSchema>;
export type UserSession = z.infer<typeof userSessionSchema>;
export type CreateUserSessionInput = z.infer<typeof createUserSessionInputSchema>;
export type UpdateUserSessionInput = z.infer<typeof updateUserSessionInputSchema>;
export type AdminSession = z.infer<typeof adminSessionSchema>;
export type CreateAdminSessionInput = z.infer<typeof createAdminSessionInputSchema>;
export type UpdateAdminSessionInput = z.infer<typeof updateAdminSessionInputSchema>;
export type OrderStatusHistory = z.infer<typeof orderStatusHistorySchema>;
export type CreateOrderStatusHistoryInput = z.infer<typeof createOrderStatusHistoryInputSchema>;
export type SearchOrderStatusHistoryInput = z.infer<typeof searchOrderStatusHistoryInputSchema>;
export type InventoryAdjustment = z.infer<typeof inventoryAdjustmentSchema>;
export type CreateInventoryAdjustmentInput = z.infer<typeof createInventoryAdjustmentInputSchema>;
export type SearchInventoryAdjustmentsInput = z.infer<typeof searchInventoryAdjustmentsInputSchema>;
//# sourceMappingURL=schema.d.ts.map