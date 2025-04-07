const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const Saree = require('./models/Saree');

// Load environment variables
dotenv.config();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
console.log('Uploads directory:', uploadsDir);

// CORS configuration
app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', (req, res, next) => {
    // Log the request
    console.log('Accessing file:', req.url);
    const filePath = path.join(uploadsDir, req.url);
    console.log('Full path:', filePath);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
        console.log('File exists, serving:', filePath);
        res.sendFile(filePath);
    } else {
        console.log('File not found:', filePath);
        res.status(404).send('File not found');
    }
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Test route to check MongoDB connection
app.get('/api/test', async (req, res) => {
    try {
        const count = await Saree.countDocuments();
        res.json({ 
            message: 'MongoDB is connected',
            sareeCount: count,
            mongodbUri: process.env.MONGO_URI.replace(/:[^:]*@/, ':****@')
        });
    } catch (err) {
        res.status(500).json({ 
            message: 'Error connecting to MongoDB',
            error: err.message
        });
    }
});

// Multer Setup for File Upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// Routes
// Get all sarees
app.get('/api/sarees', async (req, res) => {
    try {
        const sarees = await Saree.find();
        res.json(sarees);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a new saree
app.post('/api/sarees', upload.single('image'), async (req, res) => {
    try {
        const saree = new Saree({
            sareeId: req.body.sareeId,
            addedDate: req.body.addedDate,
            title: req.body.title,
            price: req.body.price,
            salePrice: req.body.salePrice || null,
            mainColor: req.body.mainColor,
            fabric: req.body.fabric,
            color: req.body.color,
            stockAvailability: req.body.stockAvailability,
            stock: req.body.stock,
            customization: req.body.customization,
            designPattern: req.body.designPattern,
            embroideryStyle: req.body.embroideryStyle,
            description: req.body.description,
            occasion: req.body.occasion,
            image: req.file ? `/uploads/${req.file.filename}` : null,
        });
        await saree.save();
        res.status(201).json(saree);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a saree
app.put('/api/sarees/:id', upload.single('image'), async (req, res) => {
    try {
        const saree = await Saree.findById(req.params.id);
        if (!saree) {
            return res.status(404).json({ message: 'Saree not found' });
        }

        saree.sareeId = req.body.sareeId || saree.sareeId;
        saree.addedDate = req.body.addedDate || saree.addedDate;
        saree.title = req.body.title || saree.title;
        saree.price = req.body.price || saree.price;
        saree.salePrice = req.body.salePrice || null;
        saree.mainColor = req.body.mainColor || saree.mainColor;
        saree.fabric = req.body.fabric || saree.fabric;
        saree.color = req.body.color || saree.color;
        saree.stockAvailability = req.body.stockAvailability || saree.stockAvailability;
        saree.stock = req.body.stock || saree.stock;
        saree.customization = req.body.customization || saree.customization;
        saree.designPattern = req.body.designPattern || saree.designPattern;
        saree.embroideryStyle = req.body.embroideryStyle || saree.embroideryStyle;
        saree.description = req.body.description || saree.description;
        saree.occasion = req.body.occasion || saree.occasion;
        if (req.file) {
            saree.image = `/uploads/${req.file.filename}`;
        }

        await saree.save();
        res.json(saree);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a saree
app.delete('/api/sarees/:id', async (req, res) => {
    try {
        const saree = await Saree.findById(req.params.id);
        if (!saree) {
            return res.status(404).json({ message: 'Saree not found' });
        }

        await saree.deleteOne();
        res.json({ message: 'Saree deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
