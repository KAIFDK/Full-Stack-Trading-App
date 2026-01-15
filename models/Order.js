import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    stock:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock',
        required: true,
    },
    quantity:{
        type: Number,
        required: true,
    },
    price:{
        type: Number,
        required: true,
    },
    type:{
        type: String,
        enum: ['BUY', 'SELL'],
        required: true,
    },
    timestamp:{
        type: Date,
        default: Date.now,
    },
    remaingBalance:{
        type: Number,
        required: true,
        set: function(value) {
            return this.parseFloat(value.toFixed(2));
    }
},
});

const order = mongoose.model('order', orderSchema);

export default order;