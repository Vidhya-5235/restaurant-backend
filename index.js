const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection failed:", err));


// ✅ User Schema
const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  email: String,
  password: String
}));

// ✅ Booking Schema
const bookingSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  guests: Number,
  date: String,
  time: String,
  message: String,
  preorder: [String]
});
const Booking = mongoose.model("Booking", bookingSchema);

// ✅ Payment Schema
const payUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  amount: Number,
  paymentMethod: String,
  timestamp: { type: Date, default: Date.now }
});
const PayUser = mongoose.model("PayUser", payUserSchema);

// ✅ Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,  // e.g. amigosrestuarant123@gmail.com
    pass: process.env.EMAIL_PASS   // App Password (NOT your Gmail password)
  }
});


// ✅ Root Route
app.get("/", (req, res) => {
  res.send("🍽️ Amigos Restaurant Backend is Running!");
});


// ✅ Register API
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.json({ message: "User already exists" });

    await User.create({ name, email, password });
    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Login API
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "User not found" });
    if (user.password !== password) return res.json({ message: "Invalid credentials" });

    res.json({ message: `Welcome, ${user.name}` });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Table Booking API
app.post("/book-table", async (req, res) => {
  const { name, email, phone, guests, datetime, message, preorder = [] } = req.body;

  if (!name || !email || !phone || !guests || !datetime) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const [date, time] = datetime.split("T");

    await Booking.create({ name, email, phone, guests, date, time, message, preorder });

    const preorderText = preorder.length
      ? `\n\n🍽️ Preorder Items:\n- ${preorder.join("\n- ")}`
      : "";

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🎉 Booking Confirmation – Amigos Restaurant",
      text: `Hi ${name},\n\n✅ Your table for ${guests} guest(s) is confirmed!\n📅 Date: ${date}\n⏰ Time: ${time}\n📱 Phone: ${phone}\n📩 Email: ${email}\n📝 Message: ${message || "None"}${preorderText}\n\nThanks for choosing Amigos!\n– Amigos Team`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("❌ Email Error:", err);
        return res.status(500).json({ message: "Booking saved, but email failed" });
      }
      console.log("✅ Booking Email Sent:", info.response);
      res.status(200).json({ message: "Booking successful. Email sent." });
    });

  } catch (err) {
    console.error("❌ Booking Error:", err);
    res.status(500).json({ message: "Booking failed" });
  }
});

// ✅ Payment API
app.post("/pay", async (req, res) => {
  const { name, email, phone, amount, paymentMethod } = req.body;

  try {
    await PayUser.create({ name, email, phone, amount, paymentMethod });

    // Common email for all payment methods
    const subject = "✅ Order Placed – Amigos Restaurant";
    const text = `Hi ${name},\n\n🎉 Your order has been placed successfully!\n💳 Payment Method: ${paymentMethod}\n💰 Amount: ₹${amount}\n📞 Contact: ${phone}\n\nThank you for choosing Amigos!\n– Amigos Team`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text
    });

   res.status(200).json({ message: "Payment successful", redirect: "cashsuc.html?clearCart=true" });


  } catch (err) {
    console.error("❌ Payment Error:", err);
    res.status(500).json({ message: "Payment failed" });
  }
});


// ✅ Feedback / Contact Form
app.post("/send-email", async (req, res) => {
  const { name, email, comment } = req.body;

  if (!name || !email || !comment) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const mailOptions = {
    from: `"${name}" <${email}>`,
    to: process.env.EMAIL_RECEIVER || process.env.EMAIL_USER,
    subject: "📬 New Contact Message – Amigos",
    text: `Name: ${name}\nEmail: ${email}\n\n${comment}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Contact Email Sent:", info.response);
    res.status(200).json({ message: "Email sent successfully." });
  } catch (error) {
    console.error("❌ Feedback Email Error:", error);
    res.status(500).json({ message: "Failed to send email." });
  }
});

// ✅ Test Email Route
app.get("/test-email", async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECEIVER || process.env.EMAIL_USER,
      subject: "🚀 Test Email",
      text: "This is a test email from Amigos backend."
    });
    res.send("✅ Test email sent!");
  } catch (error) {
    console.error("❌ Test email failed:", error);
    res.send("❌ Failed to send test email.");
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
