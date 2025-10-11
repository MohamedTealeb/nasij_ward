import mongoose from "mongoose";
import bcrypt from "bcryptjs"
const userSchema=new mongoose.Schema({

 firstName:{type:String,required:true,minlength:3,maxlength:[20,"Too long name"]},
    lastName:{type:String,required:true,minlength:3,maxlength:[20,"Too long name"]},
    email:{type:String,required:true,unique:true},
    password:{type:String,select:false,required:function(){
        return this.provider==="local"?true:false
    }},
    phone:{type:String,select:false,required:function(){
        return this.provider==="local"?true:false
    }},
    role:{type:String,enum:["user","admin"],default:"user"},
           wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
 cart: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
      },
    ],

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
      resetPasswordToken: String, 
  resetPasswordExpires: Date,
},{


  timestamps:true,
  toObject: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret.password;
      delete ret.phone;
      return ret;
    }
  },
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret.password;
      delete ret.phone;
      return ret;
    }
  }


    
})


userSchema.methods.comparePassword = async function(plain) {
  return bcrypt.compare(plain, this.password);
};
userSchema.pre(/^find/, function (next) {
  if (!this.getFilter().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});
export const UserModel=mongoose.models.User||mongoose.model("User",userSchema)
UserModel.syncIndexes()