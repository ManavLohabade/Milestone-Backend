const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

dotenv.config(); 
const app = express();
app.use(cors());
app.use(express.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.log("❌ MongoDB Connection Error:", err));

const ProductSchema = new mongoose.Schema({
  productName: String,
  code: String,
  category: String,
  price: Number,
  image: String, 
  quantity: Number,
  unit: String,
  description: String,
});

const Product = mongoose.model("Product", ProductSchema);

app.post("/api/products", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ message: "✅ Product added successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
