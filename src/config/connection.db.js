import mongoose from "mongoose";
const connectDB=async()=>{
    try {
        const result=await mongoose.connect(process.env.CONNECTION_URL)
        console.log(result.models)
        console.log("DB connected")
    } catch (error) {
        console.log('DB connection error',error)
    }
}
export default connectDB