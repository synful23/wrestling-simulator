// server.js

const dotenv = require('dotenv');
dotenv.config();
console.log("Environment check:");
console.log("- DISCORD_CLIENT_ID present:", Boolean(process.env.DISCORD_CLIENT_ID));

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const wrestlerRoutes = require('./routes/wrestlers');
const venueRoutes = require('./routes/venues');
const showRoutes = require('./routes/shows');


// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose
  .connect('mongodb://localhost:27017/wrestling-simulator')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback_session_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
       mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/wrestling-simulator'
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      secure: process.env.NODE_ENV === 'production'
    }
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// Serve static files from uploads directory
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
console.log("Serving uploads from:", path.join(__dirname, 'uploads'));

// Add these debugging endpoints to your server.js file before your existing API routes

// Debug endpoint to check authentication
app.get('/api/debug/auth', (req, res) => {
  console.log('Debug auth request received');
  console.log('Session:', req.session);
  console.log('Is authenticated:', req.isAuthenticated());
  console.log('User:', req.user);
  
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.user || null,
    session: req.session ? {
      id: req.session.id,
      cookie: req.session.cookie,
      // Don't include potentially sensitive data
    } : null
  });
});

// Debug endpoint to check environment
app.get('/api/debug/env', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    mongoUri: process.env.MONGO_URI ? 'Set (value hidden)' : 'Not set',
    clientUrl: process.env.CLIENT_URL,
    discordClientId: process.env.DISCORD_CLIENT_ID ? 'Set (value hidden)' : 'Not set',
    discordCallbackUrl: process.env.DISCORD_CALLBACK_URL ? 'Set (value hidden)' : 'Not set',
    discordServerId: process.env.DISCORD_SERVER_ID ? 'Set (value hidden)' : 'Not set',
  });
});

// Debug endpoint to check MongoDB connection
app.get('/api/debug/db', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    // Try to query collection names to verify connection works
    let collections = [];
    if (dbState === 1) {
      collections = await mongoose.connection.db.listCollections().toArray();
      collections = collections.map(c => c.name);
    }
    
    res.json({
      connectionState: stateMap[dbState],
      connected: dbState === 1,
      collections: collections,
      databaseName: mongoose.connection.name || null
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// Debug endpoint to check all registered routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          // Get the base path from regexp source
          const basePathMatch = middleware.regexp.source.match(/^\^\\\/([^\\]*)/);
          const basePath = basePathMatch ? `/${basePathMatch[1]}` : '';
          
          routes.push({
            path: `${basePath}${handler.route.path}`,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  res.json(routes);
});

app.get('/api/healthcheck', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      clientUrl: process.env.CLIENT_URL,
      discordConfigured: Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET)
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/wrestlers', wrestlerRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/shows', showRoutes);


// Add a test route to verify server is running
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});