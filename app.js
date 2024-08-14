const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const flash = require('express-flash');

const dbConfig = require('./config/db');

// Database
mongoose.connect(dbConfig.mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Connection to MongoDB failed:', err));

// Middleware
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'src', 'public')));
app.use(session({
  secret: process.env.KEY, 
  resave: false,
  saveUninitialized: false
}));
app.use(flash());
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.admin = req.session.admin;
  next();
});

// Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Routes
const adminRoutes = require('./src/routes/adminRoutes');
const userRoutes = require('./src/routes/userRoutes');

app.use('/admin', adminRoutes);
app.use('/user', userRoutes);

// Set
app.get('/', (req, res) => {
  res.redirect('/user/login')
});

app.get('/404', (req, res) => {
  res.redirect('other/404');
});

app.get('/405', (req, res) => {
  res.redirect('other/405');
});

app.get('*', (req, res) => {
  res.status(404).render('other/404');
});

// Set up the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});