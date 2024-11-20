const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const vaccinationManager = require('./vaccinationManager');
const { ParentNotificationObserver, HealthcareProviderObserver, ReminderSystemObserver } = require('./observers');

const port = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

const Users = mongoose.model("data", userSchema);
const ChildVaccination = mongoose.model("ChildVaccination", childVaccinationSchema);

// Observer Registration
const parentObserver = new ParentNotificationObserver();
const healthcareObserver = new HealthcareProviderObserver();
const reminderObserver = new ReminderSystemObserver();

vaccinationManager.addObserver(parentObserver);
vaccinationManager.addObserver(healthcareObserver);
vaccinationManager.addObserver(reminderObserver);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
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

    // Validate childName: Only alphabets and spaces allowed
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

    // Notify observers
    vaccinationManager.addVaccinationRecord(parentEmail, newVaccination);

    res.status(201).json({ message: 'Vaccination registration successful', data: newVaccination });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Schedule Vaccine Endpoint
app.post('/schedule-vaccine', (req, res) => {
  const { childId, schedule } = req.body;

  if (!childId || !schedule) {
    return res.status(400).json({ error: 'Child ID and schedule are required' });
  }

  vaccinationManager.addVaccineSchedule(childId, schedule);
  res.status(201).json({ message: `Schedule added for child ${childId}` });
});

// Fetch Vaccination Records Endpoint
app.get('/vaccination-records/:email', async (req, res) => {
  try {
    const records = await ChildVaccination.find({ parentEmail: req.params.email });
    res.json(records);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Server Startup
app.listen(port, () => {
  console.log(`Server Started on port ${port}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  server.close(() => {
      console.log('Server shutting down');
      mongoose.connection.close(() => {
          console.log('MongoDB connection closed');
          process.exit(0);
      });
  });
});


process.on('SIGINT', () => {
  mongoose.connection.close();
  process.exit(0);
});
