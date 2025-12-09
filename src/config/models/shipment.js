

import mongoose from "mongoose";

const shipmentSchema=new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    address: { type: String, required: true },
    status: { type: String, enum: ["pending", "shipped", "delivered", "cancelled"], default: "pending" },
    estimatedDelivery: Date,
    trackingNumber: { type: String, unique: true },
    carrier: { type: String, default: "oto السعودية" },
    otoOrderId: { type: String },
    otoAccessToken: { type: String },



},{
    timestamps: true
})

shipmentSchema.pre('save', async function(next) {
  if (!this.trackingNumber) {
    // Generate oto Saudi Arabia tracking number: OTO + year + month + day + random 6 digits
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    this.trackingNumber = `OTO${year}${month}${day}${random}`;
  }
  next();
});

export const ShipmentModel=mongoose.models.Shipment || mongoose.model("Shipment",shipmentSchema)