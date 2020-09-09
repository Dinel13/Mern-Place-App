const moongose = require('mongoose')
const unikValidator = require('mongoose-unique-validator')

const userSchema =new moongose.Schema({
    name: { type:String, required:true},
    email: { type:String, required:true, unique:true}, // uniqu untutk buat index supaya query cepat
    password: { type:String, required:true, minlength:6},
    image: { type:String, required:true},
    place: [{type: moongose.Types.ObjectId, required : true , ref : 'Place'}]

})

userSchema.plugin(unikValidator) // agar unique buisa dipake harus intall library

module.exports = moongose.model('user', userSchema)