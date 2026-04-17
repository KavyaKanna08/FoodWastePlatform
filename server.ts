import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
const PORT = 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://KavyaKanna:Kavya123@clusterfood.mjlpheb.mongodb.net/foodsaver";
const JWT_SECRET = process.env.JWT_SECRET || "foodsaver-secret-key";

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Seeding Logic
const seedData = async () => {
  const count = await Listing.countDocuments();
  if (count === 0) {
    console.log("Seeding sample data...");
    // Create a dummy vendor first
    const hashedPassword = await bcrypt.hash("password123", 10);
    const vendor = new User({
      email: "vendor@example.com",
      password: hashedPassword,
      role: "vendor",
      name: "Kavya Nandini",
      businessName: "Fresh Market",
      businessType: "Grocery Store",
      licenseNumber: "FSSAI-123456789",
      phoneNumber: "+91 98765 43210",
      address: {
        street: "123 Main St",
        zipCode: "10001",
        city: "New York",
      }
    });
    await vendor.save();

    const samples = [
      {
        vendorId: vendor._id,
        title: "Fresh Vegetables Bundle",
        description: "Mixed seasonal vegetables including carrots, broccoli, spinach, and tomatoes. All vegetables are organic, locally sourced, and harvested within the last 24 hours. Perfect for healthy meals and cooking.",
        category: "Produce",
        items: [
          { name: "Carrots", quantity: 2, unit: "kg", originalPrice: 60, discountedPrice: 40, expiryDate: new Date(Date.now() + 86400000 * 2) },
          { name: "Broccoli", quantity: 1, unit: "kg", originalPrice: 80, discountedPrice: 50, expiryDate: new Date(Date.now() + 86400000 * 2) },
          { name: "Spinach", quantity: 500, unit: "g", originalPrice: 40, discountedPrice: 25, expiryDate: new Date(Date.now() + 86400000 * 2) },
          { name: "Tomatoes", quantity: 1, unit: "kg", originalPrice: 60, discountedPrice: 35, expiryDate: new Date(Date.now() + 86400000 * 2) },
        ],
        price: 750,
        originalPrice: 1500,
        expiryDate: new Date(Date.now() + 86400000 * 2),
        address: "123 Main St, New York, NY 10001",
        latitude: 40.7128,
        longitude: -74.0060,
        urgency: "medium",
        dietaryTags: ["Organic", "Vegan"],
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
      },
      {
        vendorId: vendor._id,
        title: "Baked Goods Assortment",
        description: "Fresh bread, pastries, and cakes from today's batch. Perfectly edible and delicious!",
        category: "Bakery",
        items: [
          { name: "Croissants", quantity: 4, unit: "pcs", originalPrice: 200, discountedPrice: 100, expiryDate: new Date(Date.now() + 86400000) },
          { name: "Sourdough Bread", quantity: 1, unit: "loaf", originalPrice: 300, discountedPrice: 150, expiryDate: new Date(Date.now() + 86400000) },
        ],
        price: 1000,
        originalPrice: 2000,
        expiryDate: new Date(Date.now() + 86400000),
        address: "456 Oak Ave, City",
        urgency: "high",
        dietaryTags: ["Vegetarian"],
        image: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=800&q=80",
      },
      {
        vendorId: vendor._id,
        title: "Organic Dairy Products",
        description: "Fresh milk, cheese, and yogurt from local farm.",
        category: "Dairy",
        items: [
          { name: "Whole Milk", quantity: 2, unit: "L", originalPrice: 120, discountedPrice: 80, expiryDate: new Date(Date.now() + 86400000 * 3) },
        ],
        price: 600,
        originalPrice: 1200,
        expiryDate: new Date(Date.now() + 86400000 * 3),
        address: "789 Pine Rd, City",
        urgency: "medium",
        dietaryTags: ["Organic"],
        image: "https://images.unsplash.com/photo-1550583724-125581fe2f8a?auto=format&fit=crop&w=800&q=80",
      }
    ];
    await Listing.insertMany(samples);
    console.log("Seeding complete.");
  }
};

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    seedData();
  })
  .catch(err => console.error("MongoDB connection error:", err));

// Models
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['consumer', 'vendor'], required: true },
  name: { type: String, required: true },
  phoneNumber: { type: String },
  address: {
    street: { type: String },
    zipCode: { type: String },
    city: { type: String },
  },
  businessName: { type: String },
  businessType: { type: String }, // e.g., 'Restaurant', 'Cafe', 'Bakery', 'Grocery'
  licenseNumber: { type: String },
  paymentScanner: { type: String }, // Base64 for vendor QR
  savedAmount: { type: Number, default: 0 }, // For consumers
});

const ListingSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  items: [{
    name: { type: String },
    quantity: { type: Number },
    unit: { type: String },
    originalPrice: { type: Number },
    discountedPrice: { type: Number },
    expiryDate: { type: Date },
  }],
  price: { type: Number, required: true }, // Total discounted price
  originalPrice: { type: Number, required: true }, // Total original price
  expiryDate: { type: Date, required: true }, // Earliest expiry
  address: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  image: { type: String },
  dietaryTags: [{ type: String }],
  urgency: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['available', 'sold_out'], default: 'available' },
  createdAt: { type: Date, default: Date.now },
});

const OrderSchema = new mongoose.Schema({
  consumerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  consumerName: { type: String },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['upi', 'scanner', 'bank', 'cod'], required: true },
  status: { type: String, enum: ['pending', 'preparing', 'delivered', 'completed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);
const Listing = mongoose.model('Listing', ListingSchema);
const Order = mongoose.model('Order', OrderSchema);

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// API Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { 
      email, password, role, name, phoneNumber, address, 
      businessName, businessType, licenseNumber, paymentScanner 
    } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      email, password: hashedPassword, role, name, phoneNumber, address,
      businessName, businessType, licenseNumber, paymentScanner 
    });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user._id, role: user.role, name: user.name, savedAmount: user.savedAmount } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Listings
app.get("/api/listings", async (req, res) => {
  const listings = await Listing.find({ status: 'available' }).populate('vendorId', 'name paymentScanner businessType licenseNumber');
  res.json(listings);
});

app.post("/api/listings", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'vendor') return res.sendStatus(403);
  const listing = new Listing({ ...req.body, vendorId: req.user.id });
  await listing.save();
  res.status(201).json(listing);
});

app.delete("/api/listings/:id", authenticateToken, async (req: any, res) => {
  await Listing.findOneAndDelete({ _id: req.params.id, vendorId: req.user.id });
  res.sendStatus(204);
});

app.get("/api/vendor/stats", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'vendor') return res.sendStatus(403);
  const listings = await Listing.find({ vendorId: req.user.id });
  const orders = await Order.find({ vendorId: req.user.id });
  const profit = orders.reduce((acc, curr) => acc + curr.amount, 0);
  res.json({ listings, ordersCount: orders.length, profit });
});

// Orders
app.post("/api/orders", authenticateToken, async (req: any, res) => {
  const { listingId, paymentMethod } = req.body;
  const listing = await Listing.findById(listingId);
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  const order = new Order({
    consumerId: req.user.id,
    consumerName: req.user.name,
    vendorId: listing.vendorId,
    listingId,
    amount: listing.price,
    paymentMethod
  });

  await order.save();
  
  // Update consumer savings
  const savings = listing.originalPrice - listing.price;
  await User.findByIdAndUpdate(req.user.id, { $inc: { savedAmount: savings } });
  
  // Update listing status (simplified for now)
  listing.status = 'sold_out';
  await listing.save();

  res.status(201).json(order);
});

app.get("/api/consumer/stats", authenticateToken, async (req: any, res) => {
  const user = await User.findById(req.user.id);
  res.json({ savedAmount: user?.savedAmount || 0 });
});

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// AI Expiration Prediction
app.post("/api/ai/predict-expiry", authenticateToken, async (req: any, res) => {
  const { title, category } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Predict the typical shelf life (in days) for this food item: "${title}" in the category "${category}". Return ONLY the number of days as an integer.`,
    });
    const days = parseInt(response.text?.trim() || "3");
    res.json({ days });
  } catch (error) {
    res.json({ days: 3 }); // Fallback
  }
});

// Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
