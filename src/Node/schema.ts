import * as mongoose from 'mongoose';

const relation = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, ref: 'node' },
  relation: { type: String, required: true },
});

export const NodeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  money: { type: Number, required: true },
  relations: { type: [relation], required: false },
});
