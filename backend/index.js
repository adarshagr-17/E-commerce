require('dotenv').config()
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path=require("path");
const cors= require("cors");
const port = process.env.PORT||4000;
app.use(express.json());

// Use CORS to allow specific domains
const corsOptions = {
    origin: ['https://e-commerce-admin-beta-three.vercel.app','https://e-commerce-client-kappa-five.vercel.app','*','http://localhost:5174','http://localhost:3000'], // The front-end URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
     allowedHeaders: ["Content-Type", "Authorization", "auth-token"]
  };
  
  app.use(cors(corsOptions));  
//Databse connection

mongoose.connect(process.env.MONGODBURI)

//API Creation

app.get("/",(req,res)=>{
    res.send("Express App is Running");
})

//Image Storage Engine

const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({storage:storage})

//Creating upload endpoint for images
app.use('/images',express.static('upload/images'))

app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url:`${"https://e-commerce-pvx3.onrender.com"}/images/${req.file.filename}`
    })
})


// Schema for Creating Products

const Product = mongoose.model("Product",{
    id:{
        type: Number,
        required:true,
    },
    name:{
        type: String,
        required: true,
    },
    image:{
        type:String,
        required: true,
    },
    category:{
        type:String,
        required:true,
    },
    new_price:{
        type:Number,
        required:true,
    },
    old_price:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    available:{
        type:Boolean,
        default:true,
    },
})
app.post('/addproduct',async(req,res)=>{
    //to get all objects in one array
    let products = await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id=last_product.id+1;
    }
    else{
        id=1;
    }
    const product=new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success:true,
        name:req.body.name,
    })
})
//Creating API for deleting Products

app.post('/removeproduct',async (req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    res.json({
      success:true,
      name:req.body.name  
    })
})

// Creating API for getting all products
app.get('/allproducts',async (req,res)=>{
    let products = await Product.find({});
    console.log("All Products Fetched");
    res.json({success:true,
        products
    });
})

// Schema creating for User Model

const Users = mongoose.model('Users',{
    name:{
        type:String,
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now,
    }
})

// Creating Endpoint for registering the user
app.post('/signup',async(req,res)=>{

    let check = await Users.findOne({email:req.body.email});
    if(check){
        return res.status(400).json({success:false,errors:"existing users found with same email"})
    }
    let cart = {};
    for(let i=0; i<300;i++){
        cart[i]=0;
    }
    date=Date.now
    const user = new Users({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
        date:date,
    })

    await user.save();

    const data={
        user:{
            id:user.id
        }
    }

    const token = jwt.sign(data,process.env.JWT_SECRET_CODE);
    res.json({success:true,token})
})

// Creating endpoint for user login
app.post('/login', async(req,res)=>{
    let user = await Users.findOne({email:req.body.email});
    if (user){
        const passCompare = req.body.password === user.password;
        if(passCompare){
            const data ={
                user:{
                    id:user.id
                }
            }
            const token =jwt.sign(data, process.env.JWT_SECRET_CODE);
            res.json({success:true,token,message:'Logged in successfully'});
        }
        else{
            res.json({success:false,errors:"Wrong Password",message:'Wrong password'});
        }
    }
    else{
            res.json({success:false,errors:"Wrong Email Id",message:'wrong email id'});
        }
})

// creating endpoint for newcollection data
app.get('/newcollection', async(req,res)=>{
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("New Collection Fetched");
    res.send(newcollection);
})

// Creating emdpoint for popular in women section\
app.get('/popularinwomen',async (req,res)=>{
    let products = await Product.find({category:"women"});
    let popular_in_women = products.slice(0,4);
    console.log("Popular in Women fetched");
    res.send(popular_in_women);
})

// Creating middleware to fetch user
const fetchUser = async(req,res,next)=>{
    const token= req.header('auth-token');
    if(!token){
        res.status(401).send({errors:"Please authenticate using valid token"})
    }
    else{
        try{
            const data = jwt.verify(token,process.env.JWT_SECRET_CODE);
            req.user =data.user;
            next();
        }
        catch(error){
            res.status(401).send({errors:"Please authenticate using valid token"})
        }
    }
}

// Creating endpoint for adding products in cartdata
app.post('/addtocart',fetchUser,async(req,res)=>{
    console.log("Added",req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId] +=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Added")

})

// Creating endpoint to remove product from cartdata
app.post('/removefromcart',fetchUser,async(req,res)=>{
    console.log("Removed",req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId] -=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Removed")
})

app.post('/getcart',fetchUser,async(req,res)=>{
    console.log("GetCart");
    let userData = await Users.findOne({_id:req.user.id});
    res.json(userData.cartData);
})

app.listen(port,(error)=>{
    if(!error){
        console.log("Server Running on Port " +port)
    }
    else{
        console.log("Error : "+error)
    }
})