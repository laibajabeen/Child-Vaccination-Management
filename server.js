const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');
const vaccinationManager = require('./vaccinationManager');
const { ParentNotificationObserver, HealthcareProviderObserver, ReminderSystemObserver } = require('./observers');
// Removed Socket.IO and WebSocket-related imports

const port = process.env.PORT || 3000;
const app = express();
// Removed the creation of the server and WebSocket-related code

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});
// Middleware

app.use(cors()); // Enable CORS for all routes
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
app.use(express.static(path.join(__dirname)));
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});


// MongoDB Connection with better error handling
mongoose.connect('mongodb://127.0.0.1/children', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connection successful"))
.catch(err => {
  console.error("MongoDB connection error:", err);
  process.exit(1); // Exit if database connection fails
});

// Database Schemas (keeping your existing schemas)
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
const childSchema = new mongoose.Schema({
  childName: String,
  dateOfBirth: Date,
  gender: String,
  vaccines: [
    {
      name: String,
      dateAdministered: Date,
    },
  ],
  parentEmail: String,
});
const faqSchema = new mongoose.Schema({
  question: String,
  answer: String,
  order: { type: Number, default: 0 }
})

// Models
const Users = mongoose.model("Users", userSchema);
const ChildVaccination = mongoose.model("ChildVaccination", childVaccinationSchema);
const FAQ = mongoose.model('FAQ', faqSchema)

// Observer Registration (keeping your existing setup)
const parentObserver = new ParentNotificationObserver();
const healthcareObserver = new HealthcareProviderObserver();
const reminderObserver = new ReminderSystemObserver();

vaccinationManager.addObserver(parentObserver);
vaccinationManager.addObserver(healthcareObserver);
vaccinationManager.addObserver(reminderObserver);

// Updated Dashboard Data Route
app.get('/api/dashboard-data', async (req, res) => {
    try {
        console.log('Fetching dashboard data...'); // Logging for debugging

        const vaccinations = await ChildVaccination.find({})
            .select('childName dateOfBirth vaccines parentEmail')
            .lean(); // Use lean() for better performance

        console.log(`Found ${vaccinations.length} vaccination records`);

        const totalChildren = vaccinations.length;
        const totalVaccinations = vaccinations.reduce((total, record) => {
            return total + (record.vaccines?.length || 0);
        }, 0);

        const formattedData = vaccinations.map(record => {
            const vaccineNames = record.vaccines.map(v => v.name).filter(Boolean);
            
            return {
                childName: record.childName || 'Unknown',
                dateOfBirth: record.dateOfBirth,
                vaccines: vaccineNames,
                status: vaccineNames.length > 0 ? 'Completed' : 'Pending'
            };
        });
        app.get('/api/faqs', async (req, res) => {
          try {
              const faqs = await FAQ.find().sort('order');
              if (!faqs.length) {
                  // If no FAQs exist, add some sample ones
                  const sampleFaqs = [
                      {
                          question: "What vaccines are mandatory for children?",
                          answer: "The mandatory vaccines include BCG, Polio, MMR, and Hepatitis B. These are essential for your child's health.",
                          order: 1
                      },
                      {
                          question: "When should my child get vaccinated?",
                          answer: "BCG at birth, Polio starts at 6 weeks, MMR at 12 months, and Hepatitis B starts at birth with boosters.",
                          order: 2
                      },
                      {
                          question: "Are these vaccines safe?",
                          answer: "Yes, all vaccines are thoroughly tested and approved by health authorities. Side effects are usually mild.",
                          order: 3
                      }
                  ];
                  await FAQ.insertMany(sampleFaqs);
                  return res.json(sampleFaqs);
              }
              res.json(faqs);
          } catch (error) {
              console.error('Error in /api/faqs:', error);
              res.status(500).json({ 
                  success: false, 
                  error: 'Error fetching FAQs',
                  details: error.message 
              });
          }
      })
        // Set appropriate headers
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: true,
            totalChildren,
            totalVaccinations,
            children: formattedData
        });
    } catch (error) {
        console.error('Error in /api/dashboard-data:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching dashboard data',
            details: error.message
        });
    }
});

// Routes (keeping your existing routes with added error handling)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'vaccinationrecord.html'));
});

app.delete('/api/vaccination/:id', async (req, res) => {
  try {
      const deletedRecord = await ChildVaccination.findByIdAndDelete(req.params.id);
      
      if (!deletedRecord) {
          return res.status(404).json({
              success: false,
              error: 'Record not found'
          });
      }

      // Notify observers (if using the observer pattern)
      vaccinationManager.notify({
          type: 'DELETE_RECORD',
          data: deletedRecord
      });

      res.json({
          success: true,
          message: 'Record deleted successfully',
          data: deletedRecord
      });
  } catch (error) {
      console.error('Error deleting vaccination record:', error);
      res.status(500).json({
          success: false,
          error: 'Error deleting vaccination record',
          details: error.message
      });
  }
})
const Child = mongoose.model("Child", childSchema);

app.get('/api/alerts', async (req, res) => {
  try {
      // Use the ChildVaccination model instead of directly accessing the collection
      const vaccinations = await ChildVaccination.find({})
          .select('childName dateOfBirth vaccines parentEmail')
          .lean();

      if (!vaccinations) {
          return res.status(404).json({ error: 'No records found' });
      }

      // Set CORS headers explicitly for this route
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      res.json(vaccinations);
  } catch (error) {
      console.error('Error fetching vaccination data:', error);
      res.status(500).json({ 
          error: 'Internal server error',
          details: error.message 
      });
  }
})

app.post('/signup', async (req, res) => {
    try {
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
        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, error: 'Registration failed', details: error.message });
    }
});

app.post('/login', async (req, res) => {
    try {
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

        res.json({ success: true, message: 'Login successful', email: user.email });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Login failed', details: error.message });
    }
});
app.get('/api/vaccination/:id', async (req, res) => {
  try {
      const record = await ChildVaccination.findById(req.params.id);
      if (!record) {
          return res.status(404).json({
              success: false,
              error: 'Record not found'
          });
      }
      res.json({
          success: true,
          data: record
      });
  } catch (error) {
      console.error('Error fetching vaccination record:', error);
      res.status(500).json({
          success: false,
          error: 'Error fetching vaccination record',
          details: error.message
      });
  }
});

// Create a new vaccination record
app.post('/api/vaccination', async (req, res) => {
  try {
      const { childName, dateOfBirth, gender, vaccines, parentEmail } = req.body;
      
      // Format vaccines array to match schema
      const formattedVaccines = vaccines.map(name => ({
          name,
          dateAdministered: new Date()
      }));

      const newRecord = new ChildVaccination({
          childName,
          dateOfBirth,
          gender,
          vaccines: formattedVaccines,
          parentEmail
      });

      const savedRecord = await newRecord.save();
      
      // Notify observers (if using the observer pattern)
      vaccinationManager.notify({
          type: 'NEW_RECORD',
          data: savedRecord
      });

      res.status(201).json({
          success: true,
          data: savedRecord
      });
  } catch (error) {
      console.error('Error creating vaccination record:', error);
      res.status(500).json({
          success: false,
          error: 'Error creating vaccination record',
          details: error.message
      });
  }
});

// Update a vaccination record
app.put('/api/vaccination/:id', async (req, res) => {
  try {
      const { childName, dateOfBirth, gender, vaccines, parentEmail } = req.body;
      
      // Format vaccines array to match schema
      const formattedVaccines = vaccines.map(name => ({
          name,
          dateAdministered: new Date()
      }));

      const updatedRecord = await ChildVaccination.findByIdAndUpdate(
          req.params.id,
          {
              childName,
              dateOfBirth,
              gender,
              vaccines: formattedVaccines,
              parentEmail
          },
          { new: true, runValidators: true }
      );

      if (!updatedRecord) {
          return res.status(404).json({
              success: false,
              error: 'Record not found'
          });
      }

      // Notify observers (if using the observer pattern)
      vaccinationManager.notify({
          type: 'UPDATE_RECORD',
          data: updatedRecord
      });

      res.json({
          success: true,
          data: updatedRecord
      });
  } catch (error) {
      console.error('Error updating vaccination record:', error);
      res.status(500).json({
          success: false,
          error: 'Error updating vaccination record',
          details: error.message
      });
  }
})
// Server Startup
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Access the application at http://localhost:${port}`);
});

app.get('/doctor-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'doctor-dashboard.html'));
});

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
})
app.use(express.static(path.join(__dirname)));
// Graceful Shutdown
const gracefulShutdown = async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

