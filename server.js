const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const vaccinationManager = require('./vaccinationManager');
const { ParentNotificationObserver, HealthcareProviderObserver, ReminderSystemObserver } = require('./observers');
const { Server } = require("socket.io");
const http = require("http");

const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve static files from the current directory

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1/children', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("MongoDB connection successful"))
  .catch(err => console.error("MongoDB connection error:", err));

// Database Schemas
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const childVaccinationSchema = new mongoose.Schema({
  childName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other']
  },
  vaccines: [{
    name: String,
    dateAdministered: {
      type: Date,
      default: Date.now
    }
  }],
  parentEmail: {
    type: String,
    required: true,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Users = mongoose.model("Users", userSchema);
const ChildVaccination = mongoose.model("ChildVaccination", childVaccinationSchema);
const FAQ = mongoose.model("FAQ", faqSchema);

// Observer Registration
const parentObserver = new ParentNotificationObserver();
const healthcareObserver = new HealthcareProviderObserver();
const reminderObserver = new ReminderSystemObserver();

vaccinationManager.addObserver(parentObserver);
vaccinationManager.addObserver(healthcareObserver);
vaccinationManager.addObserver(reminderObserver);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'vaccinationrecord.html')); // Serve the HTML file
});

// Signup Endpoint
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const existingUser = await Users.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new Users({ email, password: hashedPassword });
  await user.save();
  res.status(201).json({ message: 'User registered successfully' });
});

// Login Endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await Users.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({ message: 'Login successful', email: user.email });
});

// Register Vaccination Endpoint
app.post('/register-vaccination', async (req, res) => {
  try {
    const { childName, dateOfBirth, gender, vaccines, parentEmail } = req.body;

    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(childName)) {
      return res.status(400).json({ error: 'Child name must contain only alphabets and spaces.' });
    }

    if (!Array.isArray(vaccines) || vaccines.length === 0) {
      return res.status(400).json({ error: 'At least one vaccine must be selected.' });
    }

    const newVaccination = new ChildVaccination({
      childName,
      dateOfBirth,
      gender,
      vaccines: vaccines.map(vaccine => ({ name: vaccine })),
      parentEmail
    });

    await newVaccination.save();

    vaccinationManager.addVaccinationRecord(parentEmail, newVaccination);

    res.status(201).json({ message: 'Vaccination registration successful', data: newVaccination });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Fetch All Vaccination Records Endpoint
app.get('/api/childvaccinations', async (req, res) => {
  try {
    const records = await ChildVaccination.find();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vaccination records.' });
  }
});

// FAQ Endpoints
app.get('/faqs', async (req, res) => {
  try {
    const faqs = await FAQ.find();
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch FAQs.' });
  }
});

app.post('/faqs', async (req, res) => {
  try {
    const { question, answer } = req.body;
    const newFAQ = new FAQ({ question, answer });
    await newFAQ.save();
    res.status(201).json({ message: 'FAQ added successfully', data: newFAQ });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Socket.IO for FAQs
io.on("connection", (socket) => {
  console.log("A client connected");

  socket.on("fetchFAQs", async () => {
    try {
      const faqs = await FAQ.find({});
      socket.emit("faqsData", faqs);
    } catch (err) {
      console.error("Error fetching FAQs:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Server Startup
server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  mongoose.connection.close();
  process.exit(0);
});
