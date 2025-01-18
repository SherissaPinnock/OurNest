const mongoose= require('mongoose');

const Schema= mongoose.Schema;

const CategorySchema = new Schema({
    name:
    {
        type: String,
        required: true
    },
    items: [{
        type: Schema.Types.ObjectId,
        ref:'Item'
    }]
})

const Category= mongoose.model('Category', CategorySchema);
module.exports= Category;