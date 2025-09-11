import bcrypt from "bcrypt"
export const generateHash=({plaintext="",saltRounds=process.env}={})=>{
    return bcrypt.hashSync(plaintext,parseInt(saltRounds))
}
export const compareHash=({plaintext,hash}={})=>{
    return bcrypt.compareSync(plaintext,hash)
}
