const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Load models
const User = require('./models/User');
const Product = require('./models/Product');
const Setting = require('./models/Setting');
const Comment = require('./models/Comment');
const Order = require('./models/Order');
const Wishlist = require('./models/Wishlist');
const Cart = require('./models/Cart');
const Feedback = require('./models/Feedback');
const Supplier = require('./models/Supplier');
const Expense = require('./models/Expense');
const Bill = require('./models/Bill');

async function migrate() {
  console.log('🏁 Starting complete data migration from MySQL to MongoDB Atlas...');
  
  // 1. Establish database connections
  let mysqlConn;
  try {
    mysqlConn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: 'Anvit@123',
      database: process.env.DB_NAME || 'prerna_silks',
      port: Number(process.env.DB_PORT) || 3306
    });
    console.log('✅ Connected to legacy MySQL Database.');
  } catch (err) {
    console.error('❌ Failed to connect to MySQL:', err.message);
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas Cloud Database.');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB Atlas:', err.message);
    await mysqlConn.end();
    process.exit(1);
  }

  // 2. Wipe MongoDB collections to avoid duplicates
  console.log('🧹 Clearing existing collections in MongoDB Atlas...');
  await User.deleteMany({});
  await Product.deleteMany({});
  await Setting.deleteMany({});
  await Comment.deleteMany({});
  await Order.deleteMany({});
  await Wishlist.deleteMany({});
  await Cart.deleteMany({});
  await Feedback.deleteMany({});
  await Supplier.deleteMany({});
  await Expense.deleteMany({});
  await Bill.deleteMany({});
  console.log('🧹 Wiping complete.');

  // Maps to maintain relationship mappings between old integer IDs and new ObjectIds
  const userMap = new Map();
  const productMap = new Map();

  try {
    // 3. Migrate Settings (including Hero Banners!)
    console.log('\n⚙️ Migrating Settings...');
    const [settings] = await mysqlConn.query('SELECT * FROM settings');
    for (const s of settings) {
      await Setting.create({
        setting_key: s.setting_key,
        setting_value: s.setting_value
      });
    }
    console.log(`✅ Migrated ${settings.length} setting record(s).`);

    // 4. Migrate Users
    console.log('\n👤 Migrating Users...');
    const [users] = await mysqlConn.query('SELECT * FROM users');
    for (const u of users) {
      const newUser = await User.create({
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role || 'customer',
        phone: u.phone || '',
        address: u.address || '',
        created_at: u.created_at || new Date()
      });
      userMap.set(u.id, newUser._id);
    }
    console.log(`✅ Migrated ${users.length} user record(s).`);

    // 5. Migrate Products (joining saree_details, blouse_details, and images)
    console.log('\n👗 Migrating Products (with embedded details and image galleries)...');
    const [products] = await mysqlConn.query('SELECT * FROM products');
    for (const p of products) {
      // Fetch Saree Details
      const [sareeRows] = await mysqlConn.query('SELECT * FROM saree_details WHERE product_id = ? LIMIT 1', [p.id]);
      const sd = sareeRows[0] || {};
      
      // Fetch Blouse Details
      const [blouseRows] = await mysqlConn.query('SELECT * FROM blouse_details WHERE product_id = ? LIMIT 1', [p.id]);
      const bd = blouseRows[0] || {};
      
      // Fetch Product Images
      const [imageRows] = await mysqlConn.query('SELECT * FROM product_images WHERE product_id = ?', [p.id]);
      const imagesList = imageRows.map(img => ({
        image_url: img.image_url,
        is_cover: Boolean(img.is_cover)
      }));

      const newProduct = await Product.create({
        name: p.name,
        price: Number(p.price) || 0.00,
        original_price: Number(p.original_price) || Number(p.price) || 0.00,
        description: p.description || '',
        image: p.image || '',
        rating: Number(p.rating) || 4.0,
        category: p.category,
        color: p.color || 'Multi',
        occasion: p.occasion || 'Casual',
        pattern: p.pattern || 'Traditional',
        stock: Number(p.stock) || 0,
        featured: Boolean(p.featured),
        sareeDetails: {
          pattern: sd.pattern || '',
          purity: sd.purity || '',
          color: sd.color || '',
          fabric: sd.fabric || '',
          length: sd.length || '5.5 meters',
          work: sd.work || '',
          border: sd.border || ''
        },
        blouseDetails: {
          pattern: bd.pattern || '',
          fabric: bd.fabric || '',
          length: bd.length || '0.8 meters',
          work: bd.work || '',
          border: bd.border || '',
          color: bd.color || ''
        },
        images: imagesList,
        created_at: p.created_at || new Date()
      });
      productMap.set(p.id, newProduct._id);
    }
    console.log(`✅ Migrated ${products.length} product record(s) and structured nested items successfully.`);

    // 6. Migrate Comments
    console.log('\n💬 Migrating Product Reviews & Comments...');
    const [comments] = await mysqlConn.query('SELECT * FROM comments');
    let commentCount = 0;
    for (const c of comments) {
      const mongoUserId = userMap.get(c.user_id);
      const mongoProductId = productMap.get(c.product_id);
      if (mongoUserId && mongoProductId) {
        await Comment.create({
          userId: mongoUserId,
          productId: mongoProductId,
          name: c.name,
          rating: Number(c.rating) || 5,
          comment: c.comment || '',
          created_at: c.created_at || new Date()
        });
        commentCount++;
      }
    }
    console.log(`✅ Migrated ${commentCount} reviews.`);

    // 7. Migrate Wishlist
    console.log('\n❤️ Migrating Wishlists...');
    const [wishlist] = await mysqlConn.query('SELECT * FROM wishlist');
    let wishlistCount = 0;
    for (const w of wishlist) {
      const mongoUserId = userMap.get(w.user_id);
      const mongoProductId = productMap.get(w.product_id);
      if (mongoUserId && mongoProductId) {
        await Wishlist.create({
          userId: mongoUserId,
          productId: mongoProductId,
          created_at: w.created_at || new Date()
        });
        wishlistCount++;
      }
    }
    console.log(`✅ Migrated ${wishlistCount} wishlist entries.`);

    // 8. Migrate Carts
    console.log('\n🛒 Migrating Carts...');
    const [carts] = await mysqlConn.query('SELECT * FROM cart');
    let cartCount = 0;
    for (const cart of carts) {
      const mongoUserId = userMap.get(cart.user_id);
      if (mongoUserId) {
        const [cartItems] = await mysqlConn.query('SELECT * FROM cart_items WHERE cart_id = ?', [cart.id]);
        const items = [];
        for (const item of cartItems) {
          const mongoProductId = productMap.get(item.product_id);
          if (mongoProductId) {
            items.push({
              productId: mongoProductId,
              quantity: Number(item.quantity) || 1
            });
          }
        }
        if (items.length > 0) {
          await Cart.create({
            userId: mongoUserId,
            items: items,
            created_at: cart.created_at || new Date()
          });
          cartCount++;
        }
      }
    }
    console.log(`✅ Migrated ${cartCount} shopping cart(s).`);

    // 9. Migrate Orders & Order Items
    console.log('\n📦 Migrating Orders...');
    const [orders] = await mysqlConn.query('SELECT * FROM orders');
    let orderCount = 0;
    for (const o of orders) {
      const mongoUserId = userMap.get(o.user_id);
      if (mongoUserId) {
        const [orderItems] = await mysqlConn.query('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
        const items = [];
        for (const item of orderItems) {
          const mongoProductId = productMap.get(item.product_id);
          if (mongoProductId) {
            items.push({
              productId: mongoProductId,
              product_name: item.product_name || '',
              price: Number(item.price) || 0,
              quantity: Number(item.quantity) || 1
            });
          }
        }

        await Order.create({
          userId: mongoUserId,
          items: items,
          total_amount: Number(o.total_amount) || 0,
          status: o.status || 'Pending',
          payment_method: o.payment_method || 'COD',
          payment_status: o.payment_status || 'Unpaid',
          address: o.address || '',
          razorpay_order_id: o.razorpay_order_id || '',
          razorpay_payment_id: o.razorpay_payment_id || '',
          created_at: o.created_at || new Date()
        });
        orderCount++;
      }
    }
    console.log(`✅ Migrated ${orderCount} order history records.`);

    // 10. Migrate Suppliers
    console.log('\n🤝 Migrating Suppliers...');
    const [suppliers] = await mysqlConn.query('SELECT * FROM suppliers');
    for (const s of suppliers) {
      await Supplier.create({
        name: s.name,
        contact_person: s.contact_person || '',
        city: s.city,
        phone: s.phone || '',
        email: s.email || '',
        created_at: s.created_at || new Date()
      });
    }
    console.log(`✅ Migrated ${suppliers.length} suppliers.`);

    // 11. Migrate Expenses
    console.log('\n💸 Migrating Expenses...');
    const [expenses] = await mysqlConn.query('SELECT * FROM expenses');
    for (const ex of expenses) {
      await Expense.create({
        title: ex.title,
        category: ex.category || 'Other',
        amount: Number(ex.amount) || 0,
        date: ex.date || new Date(),
        notes: ex.notes || '',
        created_at: ex.created_at || new Date()
      });
    }
    console.log(`✅ Migrated ${expenses.length} expenses.`);

    // 12. Migrate Bills
    console.log('\n📑 Migrating Bills...');
    const [bills] = await mysqlConn.query('SELECT * FROM bills');
    for (const b of bills) {
      await Bill.create({
        title: b.title,
        file_path: b.file_path,
        created_at: b.created_at || new Date()
      });
    }
    console.log(`✅ Migrated ${bills.length} uploaded PDF bills.`);

    console.log('\n🎉 ========================================================');
    console.log('🎉 SUCCESS: Complete database migration completed successfully!');
    console.log('🎉 All manual products, product images, categories, orders,');
    console.log('🎉 and hero banners are now active on your MongoDB Atlas Cloud!');
    console.log('🎉 ========================================================');

  } catch (error) {
    console.error('\n❌ Migration failed due to error:', error);
  } finally {
    await mysqlConn.end();
    await mongoose.connection.close();
    console.log('\n🔌 Database connections safely closed.');
  }
}

migrate();
