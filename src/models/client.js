import mongoose from 'mongoose'


const clientSchema = new mongoose.Schema({
  uid: { type: String },
  slave_uid: { type: String },
  created_at: { type: Number },
  updated_at: { type: Number },
  cashboxTitle: { type: String },
  cashboxID: { type: Number },
  subdivisionID: { type: Number },
  region: { type: String },
  regionTitle: { type: String },
  ws: {
    url: { type: String },
    cashboxTitle: { type: String },
  },

}, { timestamps: false })


export default mongoose.model('Client', clientSchema)
