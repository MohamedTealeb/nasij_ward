



// emailEvent.on("resetPassword",async(data:{email:string,otp:string})=>{
//     try{
//         data.subject="Reset-Password";
//         data.html=verifyEmail({otp:data.otp,title:"Reset Password"})
//         await  sendEmail(data)

//     }
//     catch(error){
//         console.log(`fail to send email`,error);
        
//     }
// })