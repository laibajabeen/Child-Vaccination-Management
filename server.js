// server.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');

const port = process.env.PORT || 3000;
const app = express();

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1/children', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connection successful"))
.catch(err => console.error("MongoDB connection error:", err));

// User Schema
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

// Child Vaccination Schema
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

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

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

// New route to handle child vaccination registration
app.post('/register-vaccination', async (req, res) => {
  try {
    const { childName, dateOfBirth, gender, vaccines, parentEmail } = req.body;

    const newVaccination = new ChildVaccination({
      childName,
      dateOfBirth,
      gender,
      vaccines: vaccines.map(vaccine => ({ name: vaccine })),
      parentEmail
    });

    await newVaccination.save();
    res.status(201).json({ message: 'Vaccination registration successful', data: newVaccination });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to get vaccination records for a parent
app.get('/vaccination-records/:email', async (req, res) => {
  try {
    const records = await ChildVaccination.find({ parentEmail: req.params.email });
    res.json(records);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server Started on port ${port}`);
});

process.on('SIGTERM', () => {
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  mongoose.connection.close();
  process.exit(0);
});
// server.js
import vaccinationManager from './vaccinationManager.js';
import { 
    ParentNotificationObserver, 
    HealthcareProviderObserver, 
    ReminderSystemObserver 
} from './observers.js';

// Initialize observers
const parentNotifier = new ParentNotificationObserver();
const healthcareProvider = new HealthcareProviderObserver();
const reminderSystem = new ReminderSystemObserver();

// Register observers with the vaccination manager
vaccinationManager.addObserver(parentNotifier);
vaccinationManager.addObserver(healthcareProvider);
vaccinationManager.addObserver(reminderSystem);

// Example route handler for vaccination registration
app.post('/register-vaccination', (req, res) => {
    try {
        const childData = req.body;
        
        // Use the singleton instance to manage the vaccination record
        vaccinationManager.addVaccinationRecord(childData.childId, {
            childName: childData.childName,
            dateOfBirth: childData.dateOfBirth,
            vaccines: childData.vaccines,
            parentEmail: childData.parentEmail,
            registeredDate: new Date()
        });

        // Schedule will automatically notify observers
        vaccinationManager.addVaccineSchedule(childData.childId, {
            childId: childData.childId,
            vaccines: childData.vaccines,
            scheduleDates: generateVaccineSchedule(childData)
        });

        res.json({ success: true, message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

function generateVaccineSchedule(childData) {
    // Implementation to generate vaccine schedule based on child's age and selected vaccines
    return [];
}
