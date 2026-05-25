const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const SAREES = [
  { match: /paithani/i, url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop' },
  { match: /tussar|tusar/i, url: 'https://images.unsplash.com/photo-1610030470298-40b8a1c22d15?w=600&h=800&fit=crop' },
  { match: /jamdani/i, url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=600&h=800&fit=crop' },
  { match: /zari/i, url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=800&fit=crop' },
  { match: /organza/i, url: 'https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=600&h=800&fit=crop' },
  { match: /georgette/i, url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=800&fit=crop' },
  { match: /cotton/i, url: 'https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=600&h=800&fit=crop' },
  { match: /satin/i, url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop' },
  { match: /patola|patlo/i, url: 'https://images.unsplash.com/photo-1610030470298-40b8a1c22d15?w=600&h=800&fit=crop' },
  { match: /leheriya/i, url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=600&h=800&fit=crop' },
  { match: /kalamkari/i, url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=800&fit=crop' },
  { match: /chiffon/i, url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop' },
  { match: /baluchari/i, url: 'https://images.unsplash.com/photo-1610030470298-40b8a1c22d15?w=600&h=800&fit=crop' },
  { match: /maheshwari/i, url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=600&h=800&fit=crop' },
  { match: /tissue/i, url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=800&fit=crop' },
  { match: /gota/i, url: 'https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=600&h=800&fit=crop' },
  { match: /banarasi/i, url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop' },
  { match: /mysore/i, url: 'https://images.unsplash.com/photo-1610030470298-40b8a1c22d15?w=600&h=800&fit=crop' },
  { match: /raw.?silk/i, url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=600&h=800&fit=crop' },
  { match: /embroidered/i, url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=800&fit=crop' },
  { match: /printed/i, url: 'https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=600&h=800&fit=crop' },
];
const FALLBACK = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop';

function getImage(name) {
  for (const s of SAREES) {
    if (s.match.test(name)) return s.url;
  }
  return FALLBACK;
}

async function restore(uri, label) {
  const conn = await mongoose.createConnection(uri).asPromise();
  const products = await conn.db.collection('products').find({}).toArray();
  let updated = 0;
  for (const p of products) {
    const hasMain = p.image && p.image.startsWith('/uploads/');
    const hasGallery = (p.images || []).some(i => i.image_url && i.image_url.startsWith('/uploads/'));
    if (hasMain || hasGallery) continue;
    const img = getImage(p.name);
    await conn.db.collection('products').updateOne(
      { _id: p._id },
      { $set: { image: img, images: [{ image_url: img, is_cover: true }] } }
    );
    updated++;
    console.log('  Restored: ' + p.name);
  }
  console.log(label + ': restored ' + updated + ' products');
  await conn.close();
}

(async () => {
  console.log('Restoring images...');
  await restore('mongodb+srv://admin:prerna123@cluster0.hz9pifz.mongodb.net/prerna_silks?retryWrites=true&w=majority', 'prerna_silks');
  await restore('mongodb+srv://admin:prerna123@cluster0.hz9pifz.mongodb.net/prerna_silks_copy?retryWrites=true&w=majority', 'prerna_silks_copy');
  console.log('Done!');
  process.exit(0);
})();
