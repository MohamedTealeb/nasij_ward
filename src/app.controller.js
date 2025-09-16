import path from 'node:path';
import * as dotenv from 'dotenv'
dotenv.config({path:path.join('./.env')})
import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import yaml from 'js-yaml'

// Load YAML file
const swaggerDocument = yaml.load(fs.readFileSync('./swagger.yaml', 'utf8'))
import authController from './modules/auth/auth.controller.js'
import userController from './modules/user/user.controller.js'
import categoryController from './modules/category/category.controller.js'
import prodductController from './modules/product/product.controller.js'

import connectDB from './config/connection.db.js';


export const Bootstrap=async()=>{
const app=express();
const port=process.env.PORT
  app.use(cors())
  
//middlewar
 app.use(express.json())

 //DB
  await connectDB()
  
  // Swagger Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Nasij Ward API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true
    }
  }));

  //Routes - documentation is in /swagger/docs/ folder
  app.get('/',(req,res)=>{
    res.json("app run nasij_ward")
  })
   app.use('/auth',authController)
   app.use('/user',userController)
   app.use("/category",categoryController)
   app.use("/product",prodductController)


  app.use((req,res)=>{
    res.status(404).json({message:"Page not found"})
  })

 app.listen(port,()=>{
        console.log(`Example app listening on port ${port}`)
    })
}