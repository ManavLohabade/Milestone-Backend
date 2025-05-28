require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const quotationRoutes = require('./routes/quotationRoutes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static('uploads'));

connectDB()
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch(err => {
    console.error('Database connection error');
    process.exit(1);
  });

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/quotations', quotationRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ 
    message: 'Something went wrong!',
    status: statusCode
  });
});

app.listen(process.env.PORT || 5001, () => {
  console.log('Server started successfully');
});