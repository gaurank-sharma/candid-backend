require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');


const app = express();
connectDB().catch(err => console.error('DB connection error:', err.message));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));



app.get('/', (req, res) => {
  res.send('🌟 Server is running! Welcome to the API.');
});


app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/users', require('./routes/users'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/case-study', require('./routes/case-study'));
app.use('/api/rfp', require('./routes/rfp'));
app.use("/api/parse-doc", require("./routes/parseDoc"));


if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

module.exports = app;
