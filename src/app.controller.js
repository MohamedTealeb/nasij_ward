import path from 'node:path';
import * as dotenv from 'dotenv'
dotenv.config({path:path.join('./.env')})
import express from 'express'
import cors from 'cors'
import connectDB from './config/connection.db.js';


export const Bootstrap=async()=>{
const app=express();
const port=process.env.PORT
  app.use(cors())
  
//middlewar
 app.use(express.json())

 //DB
  await connectDB()
  //Routes
  app.get('/',(req,res)=>{
    res.json("app runn")
  })

  app.all('{/*dummy}',(req,res)=>{
    res.status(404).json({message:"Page not found"})
})

 app.listen(port,()=>{
        console.log(`Example app listening on port ${port}`)
    })
}