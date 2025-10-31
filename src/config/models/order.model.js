import mongoose from "mongoose";
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  color: {
    type: [String],
    required: true,
  },
  size: {
    type: [String],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true, 
  },
 
});
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    shippingAddress: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      country: { type: String, required: true },
      city: { type: String, required: true },
      address: { type: String, required: true },
      postalCode: { type: String, required: false },
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "credit_card", "paypal", "mada", "bank_transfer"],
      default: "cash",
    },
    paid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    notes: {
      type: String,
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.models.Order?.countDocuments() || 0;
    this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

export const OrderModel =mongoose.models.Order || mongoose.model("Order", orderSchema);
