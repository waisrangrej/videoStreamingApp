import dotenv from 'dotenv'
import connectDB from './db/index.js'
import { app } from './app.js'

dotenv.config({
    path:'./env'
})


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 3000,()=>{
        console.log(`server is running at port ${process.env.PORT}`);
    })
    app.on("error",(error)=>{
        console.log("ERRR",error);
        throw error
    })
})
.catch((error)=>{
    console.log("Eroor in connection failed",error);
})














// import express from 'express'
// const app=express()

// (async ()=>{
//     try {
//      await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
// app.on("error",(error)=>{
//     console.log("errr",error);
//     throw error
// })

// app.listen(process.env.PORT,()=>{
//     console.log(`server is listeing on ${process.env.PORT}`);
// })
//     } catch (error) {
//         console.log("Error:",error);
//         throw error
//     }
// })()