import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
 image: {
    type: String,
    required: [true, "Blog image is required"],
  },
  description: {
    type: String,
    required: [true, "Blog description is required"],
    minlength: [5, "Blog description must be at least 10 characters"],
    maxlength: [60000, "Blog description cannot exceed 1000 characters"]
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
   
  }
}, {
  timestamps: true,

});

// Index for better search performance
blogSchema.index({ description: "text" });
blogSchema.index({ author: 1 });
blogSchema.index({ createdAt: -1 });

// Transform function to hide deletedAt when null
blogSchema.set("toJSON", {
  transform: function(doc, ret) {
    if (ret.deletedAt === null) {
      delete ret.deletedAt;
    }
    return ret;
  }
});

blogSchema.set("toObject", {
  transform: function(doc, ret) {
    if (ret.deletedAt === null) {
      delete ret.deletedAt;
    }
    return ret;
  }
});

export const BlogModel = mongoose.model("Blog", blogSchema);
