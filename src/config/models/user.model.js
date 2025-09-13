import mongoose from "mongoose";
const userSchema=new mongoose.Schema({


 firstName:{type:String,required:true,minlength:3,maxlength:[20,"Too long name"]},
    lastName:{type:String,required:true,minlength:3,maxlength:[20,"Too long name"]},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:function(){
        return this.provider==="local"?true:false
    }},
    gender:{type:String,enum:["male","female"],default:"male"},
    phone:{type:String,required:function(){
        return this.provider==="local"?true:false
    }},
    confirmEmail:{Date},
    role:{type:String,enum:["user","admin"],default:"user"},
       confirmEmailOtp:{type:String},



},{


  timestamps:true,
    toObject:{
        virtuals:true
    },
    toJSON:{
        virtuals:true
    }



    
})
export const UserModel=mongoose.models.User||mongoose.model("User",userSchema)
UserModel.syncIndexes()