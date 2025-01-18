const mongoose= require('mongoose');
const Schema=mongoose.Schema;

const ItemSchema = new Schema({
    item:{
        type:String,
        required: true
    },
    bought: {
        type: Boolean,
        default: false
    },
    timestamp:{
        type: String,
        default: Date.now()
    },
    category:{
        type: Schema.Types.ObjectId,
        ref: 'Category'
    }
})

const Item=mongoose.model("Item", ItemSchema);
module.exports=Item;