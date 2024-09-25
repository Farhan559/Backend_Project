import dotenv from 'dotenv';
import connectDB from './db/index';
import { app } from './app';

dotenv.config({
    path:'./env'
})

const PORT = process.env.PORT || 8000
connectDB()
.then(()=>{
    app.listen(PORT, ()=>{
        console.log(`Server is running at port ${PORT}`);
    })
})

.catch((err)=>{
    console.log('MongoDB connection failed!!',err)
})