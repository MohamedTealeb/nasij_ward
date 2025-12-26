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
import wishlistController from './modules/wishlist/wishlist.controler.js'
import CartController from './modules/cart/cart.controller.js'
import orderController from './modules/order/order.controller.js'
import paymentController from './modules/payment/payment.controller.js'
import blogController from './modules/blog/blog.controller.js'
import connectDB from './config/connection.db.js';
import { globalErrorHandling } from './utils/response.js';
import shipmentController from './modules/shipment/shipment.controller.js';
import bannerController from './modules/banner/banner.controller.js';
import reviewController from './modules/review/review.controller.js';
import promoCodeController from './modules/promoCode/promoCode.controller.js';
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
   app.use("/wishlist",wishlistController)
   app.use("/cart",CartController)
   app.use("/order",orderController)
   app.use("/payment",paymentController)
   app.use("/blog",blogController)
   app.use("/shipment",shipmentController)
   app.use("/review",reviewController)
   app.use('/banners',bannerController);
   app.use("/promoCode",promoCodeController);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.use(globalErrorHandling);

  app.use((req,res)=>{
    res.status(404).json({message:"Page not found"})
  })

// startImageChecker();

 app.listen(port,()=>{
        console.log(`Example app listening on port ${port}`)
    })
}