require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const multer = require('multer'); 
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage });
app.use(upload.single('image')); 

connectDB(); 

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`); 
});