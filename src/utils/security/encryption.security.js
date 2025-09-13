import CryptoJS from "crypto-js";

export const generateEncryption=({plaintext="",key=process.env.SECRET_KEY}={})=>{
    return CryptoJS.AES.encrypt(plaintext,key).toString()
}
export const decryptEncryption=({ciphertext="",key=process.env.SECRET_KEY}={})=>{
    return CryptoJS.AES.decrypt(ciphertext,key).toString(CryptoJS.enc.Utf8)
}
