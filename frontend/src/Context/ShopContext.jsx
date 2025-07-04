import React, { createContext, useEffect } from "react";
import { useState } from "react";

export const ShopContext = createContext(null);
const getDefaultCart = () => {
    let cart = {};
    for (let index = 0; index < 300+1; index++) {
        cart[index] = 0;
    }
    return cart;
}
const ShopContextProvider = (props) => {
    const [all_product,setAll_Product] = useState([]);
    const [cartItems,setCartItems] = useState(getDefaultCart());
    
    useEffect(()=>{
        fetch('https://e-commerce-pvx3.onrender.com/allproducts')
        .then((response)=>response.json())
        .then((data)=>setAll_Product(data.products))
        .catch(error => console.error("Error fetching products:", error));

        if(localStorage.getItem('auth-token')){
            fetch('https://e-commerce-pvx3.onrender.com/getcart',{
                method:'POST',
                headers:{
                    Accept:'application/json',
                    'auth-token':`${localStorage.getItem('auth-token')}`,
                    'Content-Type':'application/json',
                },
                body:JSON.stringify({}),
            }).then((response)=>response.json())
            .then((data)=>setCartItems(data))
            .catch(error => console.error("Error fetching cart:", error));
        }
    },[])
    
    const addToCart = (itemId)=>{
        setCartItems((prev)=>({...prev,[itemId]:prev[itemId]+1}))
        if(localStorage.getItem('auth-token')){
            fetch('https://e-commerce-pvx3.onrender.com/addtocart',{
                method:'POST',
                headers:{
                    Accept:'application/json',
                    'auth-token':`${localStorage.getItem('auth-token')}`,
                    'Content-Type':'application/json',
                },
                body:JSON.stringify({"itemID":itemId}),
            })
            .then((response)=>response.json())
            .then((data)=>console.log(data))
            .catch(error => console.error("Error adding to cart:", error));
        }
    }
    const removeFromCart = (itemId)=>{
        setCartItems((prev=>({...prev,[itemId]:prev[itemId]-1})))
        if(localStorage.getItem('auth-token')){
            fetch('https://e-commerce-pvx3.onrender.com/removefromcart',{
                method:'POST',
                headers:{
                    Accept:'application/json',
                    'auth-token':`${localStorage.getItem('auth-token')}`,
                    'Content-Type':'application/json',
                },
                body:JSON.stringify({"itemID":itemId}),
            })
            .then((response)=>response.json())
            .then((data)=>console.log(data))
            .catch(error => console.error("Error removing from cart:", error));
        }
    }
    const getTotalCartAmount = ()=>{
        let totalAmount=0;
        for(const item in cartItems){
            if(cartItems[item]>0){
               let itemInfo = all_product.find((product)=>product.id===Number(item))
               totalAmount += itemInfo.new_price * cartItems[item];
            }
        }
        return totalAmount;
    }
    const getTotalCartItems=()=>{
        let totalItem=0;
        for(const item in cartItems){
            if(cartItems[item]>0){
                totalItem+= cartItems[item];
            }
        }
        return totalItem;
    }
    const contextValue = {getTotalCartItems,getTotalCartAmount,all_product, cartItems, addToCart,removeFromCart };
    return (
        <ShopContext.Provider value={contextValue}>
            {props.children}
        </ShopContext.Provider>
    )
}

export default ShopContextProvider