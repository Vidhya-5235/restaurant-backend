const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  guests: Number,
  datetime: String,
  message: String,
});

module.exports = mongoose.model("Booking", bookingSchema);
