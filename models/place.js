const mongose = require('mongoose')

const Schema = mongose.Schema;

const placeSchema = new Schema({
   // id: "p2", tidak dibutuhkan karena sudah dibuat oleh mongodb
    title: {type:String, required:true},
    desc: {type:String, required:true},
    image: {type:String, required:true}, //gambar tidak disimpan di database karena memperlambat query  jadi pake url
    creator: {type: mongose.Types.ObjectId, required : true , ref : 'user'} ,
    addres: {type:String, required:true},
    location: {
      lat: {type:Number, required:true},
      lng: {type:Number, required:true},
    },
})

module.exports =mongose.model('Place', placeSchema)//place menjadi nama model dan places akan memnjadi nama documenn karena jamak