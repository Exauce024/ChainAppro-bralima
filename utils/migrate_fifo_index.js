const pool = require('../config/db');

async function migrate() {
  console.log('🏁 Starting FIFO Index Migration...');
  const conn = await pool.getConnection();
  try {
    // 1. Check existing unique keys
    console.log('🔍 Checking existing indexes on table "stock"...');
    const [indexes] = await conn.execute(`SHOW INDEX FROM stock`);
    const hasOldIndex = indexes.some(idx => idx.Key_name === 'unique_mp_entrepot');
    const hasNewIndex = indexes.some(idx => idx.Key_name === 'unique_mp_entrepot_lot');

    // 2. Drop old index if it exists
    if (hasOldIndex) {
      console.log('⚠️ Dropping old unique index "unique_mp_entrepot"...');
      await conn.execute('ALTER TABLE stock DROP KEY unique_mp_entrepot');
      console.log('✅ Old unique index dropped successfully.');
    } else {
      console.log('ℹ️ Old unique index "unique_mp_entrepot" not found or already dropped.');
    }

    // 3. Add new unique index if it does not exist
    if (!hasNewIndex) {
      console.log('⚙️ Adding new unique index "unique_mp_entrepot_lot" (idmp, identret, lotnumero)...');
      await conn.execute('ALTER TABLE stock ADD UNIQUE KEY unique_mp_entrepot_lot (idmp, identret, lotnumero)');
      console.log('✅ New unique index added successfully!');
    } else {
      console.log('ℹ️ New unique index "unique_mp_entrepot_lot" already exists.');
    }

    console.log('🎉 Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    conn.release();
    pool.end();
  }
}

migrate();
