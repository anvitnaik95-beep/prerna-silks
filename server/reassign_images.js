// One-time script: Restore 3 images per product in deterministic order
// Run ONCE after removing fixProductImages() from startup
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Product = require('./models/Product');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const dir = path.join(__dirname, 'public/uploads/products');
  const files = fs.readdirSync(dir)
    .filter(f => /\.(png|jpe?g|webp)$/i.test(f))
    .sort();
  
  console.log(`Found ${files.length} image files`);
  
  // Get products sorted by _id (insertion order) for deterministic ordering
  const products = await Product.find({}).sort({ _id: 1 }).lean();
  console.log(`Found ${products.length} products\n`);
  
  let updated = 0;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    
    // Assign 3 images per product
    const img1 = files[(i * 3) % files.length];
    const img2 = files[(i * 3 + 1) % files.length];
    const img3 = files[(i * 3 + 2) % files.length];
    
    const galleryImages = [
      { image_url: `/uploads/products/${img1}`, is_cover: true },
      { image_url: `/uploads/products/${img2}`, is_cover: false },
      { image_url: `/uploads/products/${img3}`, is_cover: false }
    ];
    
    await Product.findByIdAndUpdate(p._id, {
      $set: {
        image: `/uploads/products/${img1}`,
        images: galleryImages
      }
    });
    
    console.log(`[${i+1}/${products.length}] ${(p.name||'?').slice(0,30).padEnd(30)} -> ${img1}, ${img2}, ${img3}`);
    updated++;
  }
  
  console.log(`\nDone! Updated ${updated} products with 3 images each.`);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
