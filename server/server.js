const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'sjsm_secret_jwt_key_2026_change_me';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'shrijains@gmail.com').toLowerCase();

// Middlewares
app.use(cors());
app.use(express.json());

// Mongoose Configuration
mongoose.set('bufferCommands', false); // Fail fast when database is offline

let isMongoConnected = false;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected successfully.');
    isMongoConnected = true;
    seedDatabase();
  })
  .catch(err => {
    console.warn('MongoDB connection failed. Operating in fallback in-memory database mode for preview.');
    console.warn('Error message:', err.message);
  });

// --- Database Schemas & Models ---

// 1. User Schema
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  street: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zip: { type: String, default: '' },
  loyaltyPoints: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  registrationDate: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  wishlist: [{ type: Number, default: [] }]
});
const User = mongoose.model('User', userSchema);

// 2. Product Schema
const reviewSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  date: { type: String, required: true }
});
const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  brand: { type: String, default: '' },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String, default: '' },
  rating: { type: Number, default: 5.0 },
  reviews: { type: Number, default: 0 },
  stock: { type: Number, default: 25 },
  status: { type: String, enum: ['Active', 'Disabled'], default: 'Active' },
  userReviews: { type: [reviewSchema], default: [] }
});
productSchema.index({ category: 1 });
const Product = mongoose.model('Product', productSchema);

// 3. Inventory Schema
const inventorySchema = new mongoose.Schema({
  productId: { type: Number, required: true, unique: true },
  productName: { type: String, required: true },
  category: { type: String, required: true },
  initialStock: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 },
  totalUnitsSold: { type: Number, default: 0 },
  totalUnitsCancelled: { type: Number, default: 0 },
  totalUnitsReturned: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});
const Inventory = mongoose.model('Inventory', inventorySchema);

// 4. Order Schema
const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userEmail: { type: String },
  items: { type: Array, required: true },
  subtotal: { type: Number, required: true },
  deliveryCharge: { type: Number, required: true },
  total: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  date: { type: String, required: true },
  deliveryDate: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  address: { type: String, default: '' },
  customerName: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  streetAddress: { type: String, default: '' },
  city: { type: String, default: '' },
  zipcode: { type: String, default: '' },
  paymentMethod: { type: String, default: '' },
  paymentId: { type: String, default: '' },
  deliveredDate: { type: String }
});
orderSchema.index({ userId: 1 });
const Order = mongoose.model('Order', orderSchema);

// 5. Payment Schema
const paymentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  orderId: { type: String, required: true },
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String },
  paymentStatus: { type: String },
  timestamp: { type: Date, default: Date.now }
});
const Payment = mongoose.model('Payment', paymentSchema);

// 6. Coupon Schema
const couponSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  festivalName: { type: String, default: '' },
  discountPercentage: { type: Number, required: true },
  maxDiscountLimit: { type: Number, required: true },
  startDate: { type: String, required: true },
  expiryDate: { type: String, required: true },
  minimumOrderValue: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isUserSpecific: { type: Boolean, default: false },
  userId: { type: String },
  usageLimit: { type: Number, default: 0 },
  restrictedProductIds: { type: [Number], default: [] }
});
const Coupon = mongoose.model('Coupon', couponSchema);

// 7. CouponUsage Schema
const couponUsageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userEmail: { type: String },
  couponCode: { type: String, required: true },
  usageDate: { type: String },
  discountApplied: { type: Number, default: 0 },
  orderId: { type: String },
  campaignName: { type: String, default: '' },
  discountAmount: { type: Number, default: 0 },
  redemptionDateTime: { type: String },
  redemptionStatus: { type: String, default: 'Captured' }
});
const CouponUsage = mongoose.model('CouponUsage', couponUsageSchema);

// 8. AdminActivityLog Schema
const adminActivityLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  adminEmail: { type: String, required: true },
  actionType: { type: String, required: true },
  moduleName: { type: String, required: true },
  description: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});
const AdminActivityLog = mongoose.model('AdminActivityLog', adminActivityLogSchema);

// 9. InventoryLog Schema
const inventoryLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  productId: { type: Number, required: true },
  productName: { type: String, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  actionType: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});
const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);


// --- Seeding Script ---
async function seedDatabase() {
  try {
    // 1. Seed Admin Account if not existing
    const adminExists = await User.findOne({ email: ADMIN_EMAIL });
    if (!adminExists) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      const adminUser = new User({
        id: 'u-admin',
        name: 'Shri Jains',
        email: ADMIN_EMAIL,
        password: hashedPassword,
        phone: '9876543210',
        city: 'Kota',
        street: 'Gumanpura',
        state: 'Rajasthan',
        zip: '324001',
        loyaltyPoints: 500,
        isBlocked: false,
        registrationDate: '2026-01-01',
        role: 'admin',
        wishlist: []
      });
      await adminUser.save();
      console.log('Seeded default admin account shrijains@gmail.com');
    }

    // 2. Seed Products if catalog is empty
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const productsFilePath = path.join(__dirname, 'products.json');
      if (fs.existsSync(productsFilePath)) {
        const productsData = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));
        const formattedProducts = productsData.map(p => ({
          ...p,
          stock: p.stock ?? 25,
          status: p.status || 'Active',
          userReviews: p.userReviews || []
        }));
        await Product.insertMany(formattedProducts);
        console.log(`Seeded ${formattedProducts.length} products to database.`);

        // Seed Inventory matching initial product stocks
        const inventoryRecords = formattedProducts.map(p => ({
          productId: p.id,
          productName: p.name,
          category: p.category,
          initialStock: p.stock,
          currentStock: p.stock,
          totalUnitsSold: 0,
          totalUnitsCancelled: 0,
          totalUnitsReturned: 0,
          lastUpdated: new Date()
        }));
        await Inventory.insertMany(inventoryRecords);
        console.log('Seeded initial inventory tracking records.');
      } else {
        console.warn('products.json file not found, skipping product seed.');
      }
    }
  } catch (err) {
    console.error('Database seeding failed:', err);
  }
}

// --- In-Memory Database Fallback System ---
const memoryDB = {
  users: [],
  products: [],
  orders: [],
  inventory: [],
  payments: [],
  coupons: [],
  couponUsages: [],
  adminLogs: [],
  inventoryLogs: []
};

function initMemoryDB() {
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  memoryDB.users = [{
    id: 'u-admin',
    name: 'Shri Jains',
    email: ADMIN_EMAIL,
    password: adminPasswordHash,
    phone: '9876543210',
    city: 'Kota',
    street: 'Gumanpura',
    state: 'Rajasthan',
    zip: '324001',
    loyaltyPoints: 500,
    isBlocked: false,
    registrationDate: '2026-01-01',
    role: 'admin',
    wishlist: []
  }];

  const productsFilePath = path.join(__dirname, 'products.json');
  if (fs.existsSync(productsFilePath)) {
    const productsData = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));
    memoryDB.products = productsData.map(p => ({
      ...p,
      stock: p.stock ?? 25,
      status: p.status || 'Active',
      userReviews: p.userReviews || []
    }));

    memoryDB.inventory = memoryDB.products.map(p => ({
      productId: p.id,
      productName: p.name,
      category: p.category,
      initialStock: p.stock,
      currentStock: p.stock,
      totalUnitsSold: 0,
      totalUnitsCancelled: 0,
      totalUnitsReturned: 0,
      lastUpdated: new Date()
    }));
  }
}
initMemoryDB();

// Helper to check active mode
function getActiveMode() {
  return isMongoConnected ? 'mongo' : 'memory';
}


// --- Middleware helpers ---

// JWT Authentication Filter
const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);

    let user;
    if (getActiveMode() === 'mongo') {
      user = await User.findOne({ id: payload.userId });
    } else {
      user = memoryDB.users.find(u => u.id === payload.userId);
    }

    if (!user) {
      return res.status(401).json({ error: 'User does not exist' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been temporarily restricted. Please contact support.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Admin Authorization Filter
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Forbidden: Admin access only' });
  }
};

// helper to log admin activity
async function logAdminAction(adminEmail, actionType, moduleName, description) {
  try {
    const logId = `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const logData = {
      id: logId,
      adminEmail,
      actionType,
      moduleName,
      description,
      timestamp: new Date()
    };

    if (getActiveMode() === 'mongo') {
      const log = new AdminActivityLog(logData);
      await log.save();
    } else {
      memoryDB.adminLogs.unshift(logData);
    }
  } catch (e) {
    console.error('Failed to log admin action:', e);
  }
}

// helper to log inventory actions
async function logInventoryAction(productId, productName, previousStock, newStock, actionType) {
  try {
    const logId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const logData = {
      id: logId,
      productId,
      productName,
      previousStock,
      newStock,
      actionType,
      timestamp: new Date()
    };

    if (getActiveMode() === 'mongo') {
      const log = new InventoryLog(logData);
      await log.save();
    } else {
      memoryDB.inventoryLogs.unshift(logData);
    }
  } catch (e) {
    console.error('Failed to write inventory log:', e);
  }
}


// --- API Endpoints ---

// 1. Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, street, city, state, zip } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const emailLower = email.toLowerCase();

    let existing;
    if (getActiveMode() === 'mongo') {
      existing = await User.findOne({ email: emailLower });
    } else {
      existing = memoryDB.users.find(u => u.email.toLowerCase() === emailLower);
    }

    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = `u-${Date.now()}`;
    const userData = {
      id: userId,
      name,
      email: emailLower,
      password: hashedPassword,
      phone: phone || '',
      street: street || '',
      city: city || '',
      state: state || '',
      zip: zip || '',
      loyaltyPoints: 0,
      isBlocked: false,
      registrationDate: new Date().toISOString().split('T')[0],
      role: 'user',
      wishlist: []
    };

    let savedUser;
    if (getActiveMode() === 'mongo') {
      const newUser = new User(userData);
      await newUser.save();
      savedUser = newUser.toObject();
    } else {
      memoryDB.users.push(userData);
      savedUser = { ...userData };
    }

    // Create JWT
    const token = jwt.sign({ userId, email: emailLower, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    delete savedUser.password;

    res.status(201).json({ success: true, token, user: savedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailLower = email.toLowerCase();

    let user;
    if (getActiveMode() === 'mongo') {
      user = await User.findOne({ email: emailLower });
    } else {
      user = memoryDB.users.find(u => u.email.toLowerCase() === emailLower);
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been temporarily restricted. Please contact support.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, email: emailLower, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    let userResponse;
    if (getActiveMode() === 'mongo') {
      userResponse = user.toObject();
    } else {
      userResponse = { ...user };
    }
    delete userResponse.password;

    res.status(200).json({ success: true, token, user: userResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateJWT, async (req, res) => {
  let userResponse;
  if (getActiveMode() === 'mongo') {
    userResponse = req.user.toObject();
  } else {
    userResponse = { ...req.user };
  }
  delete userResponse.password;
  res.status(200).json(userResponse);
});

app.put('/api/auth/profile', authenticateJWT, async (req, res) => {
  try {
    const { name, phone, street, city, state, zip, newPassword } = req.body;

    const target = req.user;
    if (name) target.name = name;
    if (phone !== undefined) target.phone = phone;
    if (street !== undefined) target.street = street;
    if (city !== undefined) target.city = city;
    if (state !== undefined) target.state = state;
    if (zip !== undefined) target.zip = zip;

    if (newPassword) {
      target.password = bcrypt.hashSync(newPassword, 10);
    }

    let userResponse;
    if (getActiveMode() === 'mongo') {
      await target.save();
      userResponse = target.toObject();
    } else {
      const idx = memoryDB.users.findIndex(u => u.id === target.id);
      if (idx !== -1) {
        memoryDB.users[idx] = { ...target };
      }
      userResponse = { ...target };
    }

    delete userResponse.password;
    res.status(200).json({ success: true, user: userResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin management of users
app.get('/api/users', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    if (getActiveMode() === 'mongo') {
      const users = await User.find({}, '-password');
      res.status(200).json(users);
    } else {
      const users = memoryDB.users.map(u => {
        const clean = { ...u };
        delete clean.password;
        return clean;
      });
      res.status(200).json(users);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:userId/status', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { isBlocked } = req.body;

    let target;
    if (getActiveMode() === 'mongo') {
      target = await User.findOne({ id: req.params.userId });
      if (!target) return res.status(404).json({ error: 'User not found' });
      target.isBlocked = isBlocked;
      await target.save();
    } else {
      target = memoryDB.users.find(u => u.id === req.params.userId);
      if (!target) return res.status(404).json({ error: 'User not found' });
      target.isBlocked = isBlocked;
    }

    await logAdminAction(
      req.user.email,
      isBlocked ? 'User Blocked' : 'User Unblocked',
      'Users',
      `Customer "${target.name}" (${target.email}) status modified to ${isBlocked ? 'Blocked' : 'Active'}.`
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:userId', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    let target;
    if (getActiveMode() === 'mongo') {
      target = await User.findOneAndDelete({ id: req.params.userId });
    } else {
      const idx = memoryDB.users.findIndex(u => u.id === req.params.userId);
      if (idx !== -1) {
        target = memoryDB.users.splice(idx, 1)[0];
      }
    }

    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logAdminAction(
      req.user.email,
      'User Deleted',
      'Users',
      `Customer "${target.name}" (${target.email}) accounts completely removed from portal.`
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 2. Product Routes
app.get('/api/products', async (req, res) => {
  try {
    if (getActiveMode() === 'mongo') {
      const products = await Product.find({});
      res.status(200).json(products);
    } else {
      res.status(200).json(memoryDB.products);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const newProductData = req.body;

    let nextId = 1;
    if (getActiveMode() === 'mongo') {
      const maxProd = await Product.findOne().sort({ id: -1 });
      nextId = maxProd ? maxProd.id + 1 : 1;
    } else {
      const maxId = memoryDB.products.reduce((max, p) => p.id > max ? p.id : max, 0);
      nextId = maxId + 1;
    }

    const finalProductData = {
      ...newProductData,
      id: nextId,
      rating: 5.0,
      reviews: 0,
      userReviews: []
    };

    if (getActiveMode() === 'mongo') {
      const finalProduct = new Product(finalProductData);
      await finalProduct.save();

      // Create Initial Inventory Entry
      const inventory = new Inventory({
        productId: nextId,
        productName: finalProduct.name,
        category: finalProduct.category,
        initialStock: finalProduct.stock,
        currentStock: finalProduct.stock,
        totalUnitsSold: 0,
        totalUnitsCancelled: 0,
        totalUnitsReturned: 0,
        lastUpdated: new Date()
      });
      await inventory.save();
    } else {
      memoryDB.products.push(finalProductData);
      memoryDB.inventory.push({
        productId: nextId,
        productName: finalProductData.name,
        category: finalProductData.category,
        initialStock: finalProductData.stock,
        currentStock: finalProductData.stock,
        totalUnitsSold: 0,
        totalUnitsCancelled: 0,
        totalUnitsReturned: 0,
        lastUpdated: new Date()
      });
    }

    // Log Stock/Product creation
    await logInventoryAction(nextId, finalProductData.name, 0, finalProductData.stock, 'Restock');
    await logAdminAction(
      req.user.email,
      'Product Added',
      'Products',
      `Product "${finalProductData.name}" added inside section ${finalProductData.category}. Initial Stock: ${finalProductData.stock}.`
    );

    res.status(201).json(finalProductData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    let target;
    if (getActiveMode() === 'mongo') {
      target = await Product.findOne({ id: productId });
    } else {
      target = memoryDB.products.find(p => p.id === productId);
    }

    if (!target) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const previousStock = target.stock;
    const previousName = target.name;

    // Update fields
    Object.assign(target, req.body);

    if (getActiveMode() === 'mongo') {
      await target.save();
    } else {
      const idx = memoryDB.products.findIndex(p => p.id === productId);
      if (idx !== -1) {
        memoryDB.products[idx] = { ...target };
      }
    }

    // Inventory Sync & logging
    if (previousStock !== target.stock) {
      if (getActiveMode() === 'mongo') {
        const inv = await Inventory.findOne({ productId });
        if (inv) {
          inv.currentStock = target.stock;
          if (target.stock > previousStock) {
            inv.initialStock += (target.stock - previousStock);
          }
          inv.lastUpdated = new Date();
          await inv.save();
        }
      } else {
        const inv = memoryDB.inventory.find(i => i.productId === productId);
        if (inv) {
          inv.currentStock = target.stock;
          if (target.stock > previousStock) {
            inv.initialStock += (target.stock - previousStock);
          }
          inv.lastUpdated = new Date();
        }
      }

      await logInventoryAction(productId, target.name, previousStock, target.stock, 'Manual Adjustment');
      await logAdminAction(
        req.user.email,
        'Stock Updated',
        'Products',
        `Stock for "${target.name}" altered from ${previousStock} units to ${target.stock} units.`
      );
    } else {
      await logAdminAction(
        req.user.email,
        'Product Updated',
        'Products',
        `Details for product "${target.name}" revised.`
      );
    }

    res.status(200).json(target);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    let target;
    if (getActiveMode() === 'mongo') {
      target = await Product.findOneAndDelete({ id: productId });
      await Inventory.findOneAndDelete({ productId });
    } else {
      const idx = memoryDB.products.findIndex(p => p.id === productId);
      if (idx !== -1) {
        target = memoryDB.products.splice(idx, 1)[0];
      }
      const invIdx = memoryDB.inventory.findIndex(i => i.productId === productId);
      if (invIdx !== -1) {
        memoryDB.inventory.splice(invIdx, 1);
      }
    }

    if (!target) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await logAdminAction(
      req.user.email,
      'Product Deleted',
      'Products',
      `Product "${target.name}" deleted from database.`
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products/:id/reviews', authenticateJWT, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const review = req.body;

    let prod;
    if (getActiveMode() === 'mongo') {
      prod = await Product.findOne({ id: productId });
    } else {
      prod = memoryDB.products.find(p => p.id === productId);
    }

    if (!prod) {
      return res.status(404).json({ error: 'Product not found' });
    }

    prod.userReviews.push(review);
    const totalUserRatings = prod.userReviews.reduce((sum, r) => sum + r.rating, 0);
    prod.reviews = prod.userReviews.length;
    prod.rating = parseFloat((totalUserRatings / prod.userReviews.length).toFixed(1)) || 5.0;

    if (getActiveMode() === 'mongo') {
      await prod.save();
    } else {
      const idx = memoryDB.products.findIndex(p => p.id === productId);
      if (idx !== -1) {
        memoryDB.products[idx] = { ...prod };
      }
    }

    res.status(200).json(prod);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 3. Orders Routes
app.get('/api/orders', authenticateJWT, async (req, res) => {
  try {
    if (getActiveMode() === 'mongo') {
      const orders = await Order.find({ userId: req.user.id }).sort({ date: -1 });
      res.status(200).json(orders);
    } else {
      const orders = memoryDB.orders
        .filter(o => o.userId === req.user.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      res.status(200).json(orders);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/all', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    if (getActiveMode() === 'mongo') {
      const orders = await Order.find({}).sort({ date: -1 });
      res.status(200).json(orders);
    } else {
      const orders = [...memoryDB.orders].sort((a, b) => new Date(b.date) - new Date(a.date));
      res.status(200).json(orders);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', authenticateJWT, async (req, res) => {
  try {
    const { order, paymentMethod, paymentId } = req.body;

    const newOrderData = {
      ...order,
      userId: req.user.id,
      userEmail: req.user.email
    };

    if (getActiveMode() === 'mongo') {
      const newOrder = new Order(newOrderData);
      await newOrder.save();
    } else {
      memoryDB.orders.unshift(newOrderData);
    }

    // Inventory automation logic (Decrement Stock levels)
    for (const item of order.items) {
      let prod;
      if (getActiveMode() === 'mongo') {
        prod = await Product.findOne({ id: item.id });
      } else {
        prod = memoryDB.products.find(p => p.id === item.id);
      }

      if (prod) {
        const prevStock = prod.stock;
        prod.stock = Math.max(0, prod.stock - item.quantity);

        if (getActiveMode() === 'mongo') {
          await prod.save();

          const inv = await Inventory.findOne({ productId: item.id });
          if (inv) {
            inv.currentStock = prod.stock;
            inv.totalUnitsSold += item.quantity;
            inv.lastUpdated = new Date();
            await inv.save();
          }
        } else {
          const inv = memoryDB.inventory.find(i => i.productId === item.id);
          if (inv) {
            inv.currentStock = prod.stock;
            inv.totalUnitsSold += item.quantity;
            inv.lastUpdated = new Date();
          }
        }

        await logInventoryAction(item.id, prod.name, prevStock, prod.stock, 'Purchase');
      }
    }

    // Record Payment
    if (paymentId) {
      const paymentData = {
        id: paymentId,
        orderId: order.id,
        userId: req.user.id,
        amount: order.total,
        method: paymentMethod,
        paymentStatus: 'Captured',
        timestamp: new Date()
      };

      if (getActiveMode() === 'mongo') {
        const payment = new Payment(paymentData);
        await payment.save();
      } else {
        memoryDB.payments.unshift(paymentData);
      }

      await logAdminAction(
        'System',
        'Payment Verified',
        'Payments',
        `Payment for Order ${order.id} verified. Transaction Ref: ${paymentId}. Amount: ₹${order.total}.`
      );
    }

    res.status(201).json({ success: true, order: newOrderData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders/:id/cancel', authenticateJWT, async (req, res) => {
  try {
    const orderId = req.params.id;

    let ord;
    if (getActiveMode() === 'mongo') {
      ord = await Order.findOne({ id: orderId });
    } else {
      ord = memoryDB.orders.find(o => o.id === orderId);
    }

    if (!ord) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Cancellation window restriction: 5 Hours limit
    const orderTime = new Date(ord.date).getTime();
    const currTime = Date.now();
    const diffHours = (currTime - orderTime) / (1000 * 60 * 60);

    if (diffHours >= 5) {
      return res.status(400).json({
        error: "This order can no longer be cancelled because the 5-hour cancellation period has expired."
      });
    }

    if (ord.status === 'Cancelled') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    ord.status = 'Cancelled';

    if (getActiveMode() === 'mongo') {
      await ord.save();
    } else {
      const idx = memoryDB.orders.findIndex(o => o.id === orderId);
      if (idx !== -1) {
        memoryDB.orders[idx] = { ...ord };
      }
    }

    // Inventory automation logic (Restore stock quantities)
    for (const item of ord.items) {
      let prod;
      if (getActiveMode() === 'mongo') {
        prod = await Product.findOne({ id: item.id });
      } else {
        prod = memoryDB.products.find(p => p.id === item.id);
      }

      if (prod) {
        const prevStock = prod.stock;
        prod.stock += item.quantity;

        if (getActiveMode() === 'mongo') {
          await prod.save();
          const inv = await Inventory.findOne({ productId: item.id });
          if (inv) {
            inv.currentStock = prod.stock;
            inv.totalUnitsSold = Math.max(0, inv.totalUnitsSold - item.quantity);
            inv.totalUnitsCancelled += item.quantity;
            inv.lastUpdated = new Date();
            await inv.save();
          }
        } else {
          const inv = memoryDB.inventory.find(i => i.productId === item.id);
          if (inv) {
            inv.currentStock = prod.stock;
            inv.totalUnitsSold = Math.max(0, inv.totalUnitsSold - item.quantity);
            inv.totalUnitsCancelled += item.quantity;
            inv.lastUpdated = new Date();
          }
        }

        await logInventoryAction(item.id, prod.name, prevStock, prod.stock, 'Order Cancelled');
      }
    }

    await logAdminAction(
      req.user.email,
      'Order Cancelled',
      'Orders',
      `Order ${orderId} was cancelled. Inventory restored.`
    );

    res.status(200).json({ success: true, message: 'Your order has been cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id/status', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    let ord;
    if (getActiveMode() === 'mongo') {
      ord = await Order.findOne({ id: req.params.id });
    } else {
      ord = memoryDB.orders.find(o => o.id === req.params.id);
    }

    if (!ord) {
      return res.status(404).json({ error: 'Order not found' });
    }

    ord.status = status;
    if (status === 'Delivered') {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      ord.deliveredDate = `${dd}/${mm}/${yyyy}`;
    }

    if (getActiveMode() === 'mongo') {
      await ord.save();
    } else {
      const idx = memoryDB.orders.findIndex(o => o.id === req.params.id);
      if (idx !== -1) {
        memoryDB.orders[idx] = { ...ord };
      }
    }

    await logAdminAction(
      req.user.email,
      'Order Status Changed',
      'Orders',
      `Order ${ord.id} upgraded status level to "${status}".`
    );

    res.status(200).json({ success: true, order: ord });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 4. Inventory Routes
app.get('/api/inventory', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    if (getActiveMode() === 'mongo') {
      const inventory = await Inventory.find({});
      res.status(200).json(inventory);
    } else {
      res.status(200).json(memoryDB.inventory);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory/logs', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    if (getActiveMode() === 'mongo') {
      const logs = await InventoryLog.find({}).sort({ timestamp: -1 });
      res.status(200).json(logs);
    } else {
      res.status(200).json(memoryDB.inventoryLogs);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 5. Coupons Routes
app.get('/api/coupons', async (req, res) => {
  try {
    if (getActiveMode() === 'mongo') {
      const coupons = await Coupon.find({});
      res.status(200).json(coupons);
    } else {
      res.status(200).json(memoryDB.coupons);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/coupons', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const couponId = `c-${Date.now()}`;
    const couponData = {
      ...req.body,
      id: couponId
    };

    if (getActiveMode() === 'mongo') {
      const newCoupon = new Coupon(couponData);
      await newCoupon.save();
    } else {
      memoryDB.coupons.push(couponData);
    }

    await logAdminAction(
      req.user.email,
      'Coupon Created',
      'Coupons',
      `Special coupon code "${couponData.code}" was successfully spawned.`
    );

    res.status(201).json(couponData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/coupons/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    let target;
    if (getActiveMode() === 'mongo') {
      target = await Coupon.findOne({ id: req.params.id });
    } else {
      target = memoryDB.coupons.find(c => c.id === req.params.id);
    }

    if (!target) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    Object.assign(target, req.body);

    if (getActiveMode() === 'mongo') {
      await target.save();
    } else {
      const idx = memoryDB.coupons.findIndex(c => c.id === req.params.id);
      if (idx !== -1) {
        memoryDB.coupons[idx] = { ...target };
      }
    }

    await logAdminAction(
      req.user.email,
      'Coupon Updated',
      'Coupons',
      `Coupon code "${target.code}" was updated by administrator.`
    );

    res.status(200).json(target);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/coupons/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    let target;
    if (getActiveMode() === 'mongo') {
      target = await Coupon.findOneAndDelete({ id: req.params.id });
    } else {
      const idx = memoryDB.coupons.findIndex(c => c.id === req.params.id);
      if (idx !== -1) {
        target = memoryDB.coupons.splice(idx, 1)[0];
      }
    }

    if (!target) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    await logAdminAction(
      req.user.email,
      'Coupon Deleted',
      'Coupons',
      `Coupon code "${target.code}" was expunged.`
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/coupons/usages', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    if (getActiveMode() === 'mongo') {
      const usages = await CouponUsage.find({});
      res.status(200).json(usages);
    } else {
      res.status(200).json(memoryDB.couponUsages);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/coupons/usages', authenticateJWT, async (req, res) => {
  try {
    const usageId = `cu-${Date.now()}`;
    const usageData = {
      ...req.body,
      id: usageId,
      userId: req.user.id,
      userEmail: req.user.email
    };

    if (getActiveMode() === 'mongo') {
      const usage = new CouponUsage(usageData);
      await usage.save();
    } else {
      memoryDB.couponUsages.push(usageData);
    }

    res.status(201).json(usageData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 6. Payments route
app.get('/api/payments', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    if (getActiveMode() === 'mongo') {
      const payments = await Payment.find({}).sort({ timestamp: -1 });
      res.status(200).json(payments);
    } else {
      res.status(200).json(memoryDB.payments);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 7. Wishlist Routes
app.get('/api/wishlist', authenticateJWT, async (req, res) => {
  res.status(200).json(req.user.wishlist || []);
});

app.post('/api/wishlist', authenticateJWT, async (req, res) => {
  try {
    const { productId } = req.body;
    if (productId === undefined) {
      return res.status(400).json({ error: 'productId is required' });
    }

    if (!req.user.wishlist) {
      req.user.wishlist = [];
    }

    if (!req.user.wishlist.includes(productId)) {
      req.user.wishlist.push(productId);

      if (getActiveMode() === 'mongo') {
        await req.user.save();
      } else {
        const idx = memoryDB.users.findIndex(u => u.id === req.user.id);
        if (idx !== -1) {
          memoryDB.users[idx].wishlist = [...req.user.wishlist];
        }
      }
    }
    res.status(200).json(req.user.wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/wishlist/:productId', authenticateJWT, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    if (req.user.wishlist) {
      req.user.wishlist = req.user.wishlist.filter(id => id !== productId);

      if (getActiveMode() === 'mongo') {
        await req.user.save();
      } else {
        const idx = memoryDB.users.findIndex(u => u.id === req.user.id);
        if (idx !== -1) {
          memoryDB.users[idx].wishlist = [...req.user.wishlist];
        }
      }
    }
    res.status(200).json(req.user.wishlist || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 8. Admin log list
app.get('/api/admin/logs', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    if (getActiveMode() === 'mongo') {
      const logs = await AdminActivityLog.find({}).sort({ timestamp: -1 });
      res.status(200).json(logs);
    } else {
      res.status(200).json(memoryDB.adminLogs);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed & Reset operations
app.post('/api/admin/seed', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    if (getActiveMode() === 'mongo') {
      await Product.deleteMany({});
      await Inventory.deleteMany({});
      await seedDatabase();

      const products = await Product.find({});
      await logAdminAction(req.user.email, 'Database Seeded', 'Products', 'Initial catalog seeded with real stationery products.');
      res.status(200).json({ success: true, products });
    } else {
      initMemoryDB();
      await logAdminAction(req.user.email, 'Database Seeded', 'Products', 'Initial catalog seeded with real stationery products.');
      res.status(200).json({ success: true, products: memoryDB.products });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/reset', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    if (getActiveMode() === 'mongo') {
      await Product.deleteMany({});
      await Order.deleteMany({});
      await Payment.deleteMany({});
      await Coupon.deleteMany({});
      await CouponUsage.deleteMany({});
      await InventoryLog.deleteMany({});
      await AdminActivityLog.deleteMany({});
      await Inventory.deleteMany({});
    } else {
      memoryDB.products = [];
      memoryDB.orders = [];
      memoryDB.payments = [];
      memoryDB.coupons = [];
      memoryDB.couponUsages = [];
      memoryDB.inventoryLog = [];
      memoryDB.adminLogs = [];
      memoryDB.inventory = [];
    }

    await logAdminAction(req.user.email, 'Database Purged', 'System', 'Database wiped completely empty.');
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch(err => {
    console.error("MongoDB Error:", err);
  });