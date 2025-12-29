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
    taxPrice: {
      type: Number,
      default: 0,
    },
    finalPrice: {
      type: Number,
      default: 0,
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
      enum: ["creditcard", "applepay", "mada",],
     
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
    trackingNumber: {
      type: String,
    },
    trackingUrl: {
      type: String,
    },
    paymentId: {
      type: String,
    },
    promoCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PromoCode",
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// إنشاء فهرس sparse فريد على trackingNumber (يتجاهل القيم null)
orderSchema.index({ trackingNumber: 1 }, { unique: true, sparse: true });

orderSchema.pre('save', async function(next) {
  if (typeof this.totalPrice === 'number') {
    // Calculate tax on totalPrice before discount
    const computedTax = Math.round(this.totalPrice * 0.15 * 100) / 100;
    this.taxPrice = computedTax;
  }
  if (typeof this.totalPrice === 'number') {
    const shipping = typeof this.shippingCost === 'number' ? this.shippingCost : 0;
    const tax = typeof this.taxPrice === 'number' ? this.taxPrice : 0;
    const discount = typeof this.discountAmount === 'number' ? this.discountAmount : 0;
    // Calculate final price: totalPrice + tax + shipping - discount
    const computedFinal = Math.round((this.totalPrice + tax + shipping - discount) * 100) / 100;
    this.finalPrice = Math.max(0, computedFinal); // Ensure final price is not negative
  }
  if (!this.orderNumber) {
    const count = await mongoose.models.Order?.countDocuments() || 0;
    this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

export const OrderModel =mongoose.models.Order || mongoose.model("Order", orderSchema);
