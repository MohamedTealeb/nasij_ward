import mongoose from "mongoose";
const userSchema=new mongoose.Schema({






},{






    
})
export const UserModel=mongoose.models.User||mongoose.model("User",userSchema)
UserModel.syncIndexes()