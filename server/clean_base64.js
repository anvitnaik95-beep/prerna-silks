const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function clean(dbName, uri) {
  const conn = await mongoose.createConnection(uri).asPromise();
  const r1 = await conn.db.collection('products').updateMany(
    { image: /^data:/ },
    { $set: { image: '' } }
  );
  const r2 = await conn.db.collection('products').updateMany(
    { 'images.image_url': /^data:/ },
    { $pull: { images: { image_url: /^data:/ } } }
  );
  const base64 = await conn.db.collection('products').find({ image: /^data:/ }).count();
  console.log(dbName + ': cleared ' + r1.modifiedCount + ' main, ' + r2.modifiedCount + ' gallery, remaining base64: ' + base64);
  const sample = await conn.db.collection('products').findOne({}, { projection: { name:1, image:1 } });
  console.log('Sample: ' + (sample ? sample.name + ' -> image=' + (sample.image || '').substring(0, 40) : 'none'));
  await conn.close();
}

async function main() {
  await clean('prerna_silks', 'mongodb+srv://admin:prerna123@cluster0.hz9pifz.mongodb.net/prerna_silks?retryWrites=true&w=majority');
  await clean('prerna_silks_copy', 'mongodb+srv://admin:prerna123@cluster0.hz9pifz.mongodb.net/prerna_silks_copy?retryWrites=true&w=majority');
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
