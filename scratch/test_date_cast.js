import mongoose from 'mongoose';

const s = new mongoose.Schema({
  d: { type: Date, default: null }
});
const M = mongoose.model('TestDate', s);

try {
  const q = M.find({ d: { $ne: null } });
  q.cast(M);
  console.log('Query with $ne: null casted successfully!');
} catch (e) {
  console.error('ERROR with $ne: null:', e.name, e.message);
}

