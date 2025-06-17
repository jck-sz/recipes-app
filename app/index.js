require('dotenv').config();
const express = require('express');
const app = express();
const recipesRouter = require('./routes/recipes');

app.use(express.json());

// Add a root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Recipe API!' });
});

app.use('/recipes', recipesRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
