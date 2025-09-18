import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [cartItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "ordered", "abandoned"],
      default: "active",
    },
  },
  { timestamps: true }
);

cartSchema.methods.addItem = function (productId, price, quantity = 1) {
  const existingItem = this.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({ product: productId, price, quantity });
  }

  this.totalPrice = this.items.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );

  return this.save();
};

export const CartModel =
  mongoose.models.Cart || mongoose.model("Cart", cartSchema);
