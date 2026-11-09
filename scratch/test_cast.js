import mongoose from 'mongoose';
const { Schema } = mongoose;

const s = new Schema({
  companyId: { type: Schema.Types.ObjectId },
  periodLockedAt: { type: Date, default: null },
  lockedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
});

const M = mongoose.model('CastTest2', s);

try {
  const q = M.updateMany(
    { companyId: new mongoose.Types.ObjectId() },
    { $set: { periodLockedAt: null, lockedBy: null } }
  );
  // Trigger mongoose query casting
  const casted = q.cast(M);
  console.log('Update query casted successfully:', casted);
} catch (err) {
  console.error('ERROR IN CAST:', err.name, err.message, err.path);
}
