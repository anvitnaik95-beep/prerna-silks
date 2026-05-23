const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Product = require('./models/Product');
const User = require('./models/User');
const Setting = require('./models/Setting');
const Order = require('./models/Order');
const Comment = require('./models/Comment');
const Expense = require('./models/Expense');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/prerna_silks';

const sarees = [
  { name: 'Kanjivaram Pure Silk Saree', cat: 'Silk', col: 'Red', occ: 'Wedding', pat: 'Zari', price: 15000, orig: 18000, rating: 5, img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop' },
  { name: 'Banarasi Brocade Silk Saree', cat: 'Silk', col: 'Blue', occ: 'Wedding', pat: 'Floral', price: 12500, orig: 15000, rating: 4.8, img: 'https://images.unsplash.com/photo-1583391733958-650ac8698115?w=600&h=800&fit=crop' },
  { name: 'Lightweight Chiffon Saree', cat: 'Chiffon', col: 'Pink', occ: 'Party', pat: 'Plain', price: 3500, orig: 4500, rating: 4.2, img: 'https://images.unsplash.com/photo-1603574670812-d245b0afddfd?w=600&h=800&fit=crop' },
  { name: 'Designer Georgette Saree', cat: 'Georgette', col: 'Green', occ: 'Festival', pat: 'Embroidered', price: 5500, orig: 7000, rating: 4.5, img: 'https://images.unsplash.com/photo-1583391733975-520e0e03e5c9?w=600&h=800&fit=crop' },
  { name: 'Soft Cotton Handloom Saree', cat: 'Cotton', col: 'White', occ: 'Casual', pat: 'Striped', price: 1200, orig: 1500, rating: 4.0, img: 'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?w=600&h=800&fit=crop' },
  { name: 'Organza Floral Print Saree', cat: 'Organza', col: 'Beige', occ: 'Party', pat: 'Printed', price: 4200, orig: 5000, rating: 4.3, img: 'https://images.unsplash.com/photo-1610189013210-97914441584c?w=600&h=800&fit=crop' },
  { name: 'Pure Linen Saree', cat: 'Linen', col: 'Orange', occ: 'Casual', pat: 'Plain', price: 2800, orig: 3500, rating: 4.1, img: 'https://images.unsplash.com/photo-1617260551717-36173a118d09?w=600&h=800&fit=crop' },
  { name: 'Mysore Silk Crepe Saree', cat: 'Silk', col: 'Purple', occ: 'Wedding', pat: 'Zari', price: 9000, orig: 11000, rating: 4.7, img: 'https://images.unsplash.com/photo-1585848243621-e0c81db35134?w=600&h=800&fit=crop' },
  { name: 'Bridal Heavy Banarasi', cat: 'Silk', col: 'Maroon', occ: 'Wedding', pat: 'Zari', price: 25000, orig: 30000, rating: 5, img: 'https://images.unsplash.com/photo-1617244971032-482a5c48b715?w=600&h=800&fit=crop' },
  { name: 'Kalamkari Printed Cotton', cat: 'Cotton', col: 'Beige', occ: 'Casual', pat: 'Painted', price: 1800, orig: 2200, rating: 4.4, img: 'https://images.unsplash.com/photo-1596455607739-16a7f805908e?w=600&h=800&fit=crop' },
  { name: 'Pochampally Ikat Silk', cat: 'Silk', col: 'Red', occ: 'Festival', pat: 'Ikat', price: 8500, orig: 10000, rating: 4.6, img: 'https://images.unsplash.com/photo-1610030469687-3c7ea8a679e3?w=600&h=800&fit=crop' },
  { name: 'Chanderi Silk Saree', cat: 'Silk', col: 'Green', occ: 'Festival', pat: 'Zari', price: 6500, orig: 8000, rating: 4.3, img: 'https://images.unsplash.com/photo-1603574670830-ec62c2f74133?w=600&h=800&fit=crop' },
  { name: 'Bandhani Georgette Saree', cat: 'Georgette', col: 'Pink', occ: 'Party', pat: 'Printed', price: 3800, orig: 4800, rating: 4.2, img: 'https://images.unsplash.com/photo-1583391733924-d2e825316315?w=600&h=800&fit=crop' },
  { name: 'Sequin Embellished Net Saree', cat: 'Georgette', col: 'White', occ: 'Party', pat: 'Sequin', price: 7500, orig: 9000, rating: 4.8, img: 'https://images.unsplash.com/photo-1617244970977-802ba6ec77cd?w=600&h=800&fit=crop' },
  { name: 'Plain Chiffon Saree', cat: 'Chiffon', col: 'Blue', occ: 'Casual', pat: 'Plain', price: 1500, orig: 2000, rating: 3.9, img: 'https://images.unsplash.com/photo-1610189013210-97914441584c?w=600&h=800&fit=crop' },
  { name: 'Khadi Cotton Saree', cat: 'Cotton', col: 'White', occ: 'Casual', pat: 'Plain', price: 1000, orig: 1200, rating: 4.0, img: 'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?w=600&h=800&fit=crop' },
  { name: 'South Indian Kanjeevaram', cat: 'Silk', col: 'Orange', occ: 'Wedding', pat: 'Zari', price: 18000, orig: 22000, rating: 4.9, img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop' },
  { name: 'Paithani Silk Saree', cat: 'Silk', col: 'Purple', occ: 'Wedding', pat: 'Zari', price: 14000, orig: 16000, rating: 4.8, img: 'https://images.unsplash.com/photo-1583391733958-650ac8698115?w=600&h=800&fit=crop' },
  { name: 'Tussar Silk Handwoven', cat: 'Silk', col: 'Beige', occ: 'Festival', pat: 'Plain', price: 7000, orig: 8500, rating: 4.5, img: 'https://images.unsplash.com/photo-1603574670812-d245b0afddfd?w=600&h=800&fit=crop' },
  { name: 'Jamdani Cotton Saree', cat: 'Cotton', col: 'Red', occ: 'Festival', pat: 'Floral', price: 3000, orig: 3800, rating: 4.4, img: 'https://images.unsplash.com/photo-1583391733975-520e0e03e5c9?w=600&h=800&fit=crop' },
  { name: 'Zari Border Linen Saree', cat: 'Linen', col: 'Green', occ: 'Party', pat: 'Zari', price: 4500, orig: 5500, rating: 4.3, img: 'https://images.unsplash.com/photo-1617260551717-36173a118d09?w=600&h=800&fit=crop' },
  { name: 'Digital Print Organza', cat: 'Organza', col: 'Pink', occ: 'Party', pat: 'Printed', price: 5000, orig: 6000, rating: 4.6, img: 'https://images.unsplash.com/photo-1585848243621-e0c81db35134?w=600&h=800&fit=crop' },
  { name: 'Heavy Embroidered Georgette', cat: 'Georgette', col: 'Maroon', occ: 'Wedding', pat: 'Embroidered', price: 11000, orig: 13000, rating: 4.7, img: 'https://images.unsplash.com/photo-1617244971032-482a5c48b715?w=600&h=800&fit=crop' },
  { name: 'Casual Printed Cotton', cat: 'Cotton', col: 'Blue', occ: 'Casual', pat: 'Printed', price: 900, orig: 1100, rating: 3.8, img: 'https://images.unsplash.com/photo-1596455607739-16a7f805908e?w=600&h=800&fit=crop' },
  { name: 'Raw Silk Saree', cat: 'Silk', col: 'Orange', occ: 'Festival', pat: 'Plain', price: 6000, orig: 7500, rating: 4.4, img: 'https://images.unsplash.com/photo-1610030469687-3c7ea8a679e3?w=600&h=800&fit=crop' },
  { name: 'Satin Silk Party Wear', cat: 'Silk', col: 'White', occ: 'Party', pat: 'Plain', price: 8000, orig: 9500, rating: 4.5, img: 'https://images.unsplash.com/photo-1603574670830-ec62c2f74133?w=600&h=800&fit=crop' },
  { name: 'Patola Print Silk', cat: 'Silk', col: 'Red', occ: 'Festival', pat: 'Printed', price: 5500, orig: 6500, rating: 4.3, img: 'https://images.unsplash.com/photo-1583391733924-d2e825316315?w=600&h=800&fit=crop' },
  { name: 'Leheriya Georgette', cat: 'Georgette', col: 'Pink', occ: 'Festival', pat: 'Striped', price: 2500, orig: 3000, rating: 4.1, img: 'https://images.unsplash.com/photo-1617244970977-802ba6ec77cd?w=600&h=800&fit=crop' },
  { name: 'Hand Painted Kalamkari', cat: 'Cotton', col: 'Beige', occ: 'Party', pat: 'Painted', price: 4000, orig: 5000, rating: 4.7, img: 'https://images.unsplash.com/photo-1610189013210-97914441584c?w=600&h=800&fit=crop' },
  { name: 'Ruffled Chiffon Saree', cat: 'Chiffon', col: 'Purple', occ: 'Party', pat: 'Plain', price: 3200, orig: 4000, rating: 4.2, img: 'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?w=600&h=800&fit=crop' },
  { name: 'Baluchari Silk Saree', cat: 'Silk', col: 'Maroon', occ: 'Wedding', pat: 'Zari', price: 16000, orig: 19000, rating: 4.9, img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop' },
  { name: 'Maheshwari Cotton Silk', cat: 'Silk', col: 'Green', occ: 'Casual', pat: 'Striped', price: 4500, orig: 5500, rating: 4.3, img: 'https://images.unsplash.com/photo-1583391733958-650ac8698115?w=600&h=800&fit=crop' },
  { name: 'Tissue Silk Saree', cat: 'Silk', col: 'Gold', occ: 'Wedding', pat: 'Zari', price: 12000, orig: 14500, rating: 4.6, img: 'https://images.unsplash.com/photo-1603574670812-d245b0afddfd?w=600&h=800&fit=crop' },
  { name: 'Gota Patti Georgette', cat: 'Georgette', col: 'Red', occ: 'Wedding', pat: 'Embroidered', price: 9500, orig: 12000, rating: 4.8, img: 'https://images.unsplash.com/photo-1583391733975-520e0e03e5c9?w=600&h=800&fit=crop' },
  { name: 'Temple Border Silk', cat: 'Silk', col: 'Orange', occ: 'Wedding', pat: 'Zari', price: 11000, orig: 13500, rating: 4.5, img: 'https://images.unsplash.com/photo-1617260551717-36173a118d09?w=600&h=800&fit=crop' },
  { name: 'Ajrakh Print Modal Silk', cat: 'Silk', col: 'Blue', occ: 'Casual', pat: 'Printed', price: 5000, orig: 6000, rating: 4.4, img: 'https://images.unsplash.com/photo-1585848243621-e0c81db35134?w=600&h=800&fit=crop' },
  { name: 'Chikankari Cotton Saree', cat: 'Cotton', col: 'White', occ: 'Party', pat: 'Embroidered', price: 6500, orig: 8000, rating: 4.7, img: 'https://images.unsplash.com/photo-1617244971032-482a5c48b715?w=600&h=800&fit=crop' },
  { name: 'Narayanpet Handloom', cat: 'Cotton', col: 'Pink', occ: 'Casual', pat: 'Plain', price: 2000, orig: 2500, rating: 4.0, img: 'https://images.unsplash.com/photo-1596455607739-16a7f805908e?w=600&h=800&fit=crop' },
  { name: 'Uppada Pattu Saree', cat: 'Silk', col: 'Purple', occ: 'Wedding', pat: 'Zari', price: 13000, orig: 15500, rating: 4.8, img: 'https://images.unsplash.com/photo-1610030469687-3c7ea8a679e3?w=600&h=800&fit=crop' },
  { name: 'Gadwal Silk Saree', cat: 'Silk', col: 'Green', occ: 'Wedding', pat: 'Zari', price: 10500, orig: 13000, rating: 4.6, img: 'https://images.unsplash.com/photo-1603574670830-ec62c2f74133?w=600&h=800&fit=crop' }
];

async function seed() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    // Scale prices to be between 250 and 5000, and set initial rating to 2.5
    const originalMin = 900;
    const originalMax = 25000;
    const targetMin = 250;
    const targetMax = 5000;

    const scalePrice = (val) => {
      let mapped = targetMin + ((val - originalMin) / (originalMax - originalMin)) * (targetMax - targetMin);
      mapped = Math.round(mapped / 50) * 50 - 1; // e.g. 299, 449, 4999
      return Math.max(targetMin, Math.min(targetMax, mapped));
    };

    sarees.forEach(s => {
      s.price = scalePrice(s.price);
      s.orig = scalePrice(s.orig);
      if (s.orig <= s.price) {
        s.orig = Math.min(5000, Math.round(s.price * 1.25));
      }
      s.rating = 2.5; // Always set initial rating to 2.5
    });

    // 1. Clear Database
    console.log('Clearing old collections...');
    await Product.deleteMany({});
    await User.deleteMany({});
    await Setting.deleteMany({});
    await Order.deleteMany({});
    await Comment.deleteMany({});
    await Expense.deleteMany({});
    console.log('Database cleared.');

    // 2. Hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashedAdminPass = await bcrypt.hash('admin123', salt);
    const hashedCustomerPass = await bcrypt.hash('customer123', salt);

    // 3. Seed Users
    console.log('Seeding users...');
    const admin = new User({
      name: 'Admin',
      email: 'admin@prernasilks.com',
      password: hashedAdminPass,
      role: 'admin',
      phone: '9876543210'
    });
    await admin.save();

    const customer1 = new User({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: hashedCustomerPass,
      role: 'customer',
      phone: '9876543211',
      address: 'Hubli, Karnataka'
    });
    await customer1.save();

    const customer2 = new User({
      name: 'Anvit Naik',
      email: 'anvitnaik95@gmail.com',
      password: hashedAdminPass,
      role: 'customer',
      phone: '9876543212'
    });
    await customer2.save();
    console.log('✅ Users seeded successfully!');

    // 4. Seed Products
    console.log('Seeding products...');
    
    // Read local upload images if they exist
    let localImages = [];
    try {
      const uploadsDir = path.join(__dirname, 'public/uploads/products');
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        localImages = files.filter(f => f.endsWith('.png') || f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.webp'));
        console.log(`Found ${localImages.length} local product images inside public/uploads/products.`);
      }
    } catch (err) {
      console.warn('Could not read uploads directory:', err.message);
    }

    let productsCount = 0;
    for (let idx = 0; idx < sarees.length; idx++) {
      const s = sarees[idx];
      
      let mainImgUrl = s.img;
      let galleryImages = [{ image_url: s.img, is_cover: true }];
      
      // If we have actual previous uploaded images, map them!
      if (localImages.length > 0) {
        const primaryFile = localImages[idx % localImages.length];
        mainImgUrl = `/uploads/products/${primaryFile}`;
        
        galleryImages = [
          { image_url: mainImgUrl, is_cover: true }
        ];
        
        // Add 2 other actual images to the product card gallery scroll
        const sec1 = localImages[(idx + 1) % localImages.length];
        const sec2 = localImages[(idx + 2) % localImages.length];
        galleryImages.push({ image_url: `/uploads/products/${sec1}`, is_cover: false });
        galleryImages.push({ image_url: `/uploads/products/${sec2}`, is_cover: false });
      }

      const prod = new Product({
        name: s.name,
        category: s.cat,
        color: s.col,
        occasion: s.occ,
        pattern: s.pat,
        price: s.price,
        original_price: s.orig,
        rating: s.rating,
        image: mainImgUrl,
        stock: Math.floor(Math.random() * 25) + 5,
        featured: s.rating >= 4.7,
        sareeDetails: {
          pattern: s.pat + ' Weaving',
          purity: s.cat === 'Silk' ? 'Pure Silk' : 'Standard',
          color: s.col,
          fabric: s.cat + ' Saree',
          length: '5.5 meters',
          work: 'Zari & Thread',
          border: 'Grand Zari Border'
        },
        blouseDetails: {
          border: 'Zari Border',
          work: 'Embroidery',
          fabric: s.cat === 'Silk' ? 'Silk Blend' : 'Cotton Blend',
          length: '0.8 meters',
          pattern: 'Matching',
          color: s.col
        },
        images: galleryImages
      });
      await prod.save();
      productsCount++;
    }
    console.log(`✅ ${productsCount} Products seeded successfully with real local images!`);

    // 5. Seed Settings (Hero banner)
    console.log('Seeding settings...');
    await Setting.findOneAndUpdate(
      { setting_key: 'hero_banner' },
      { setting_value: 'https://images.unsplash.com/photo-1610189013210-97914441584c?w=1200&h=400&fit=crop' },
      { upsert: true, new: true }
    );
    console.log('✅ Settings seeded successfully!');

  } catch (error) {
    console.error('❌ Seeding Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
}

seed();
