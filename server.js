const express = require("express");
const mongoose = require("mongoose"); // Import Mongoose

const cors = require("cors");
const port = 3000;
const app = express();
app.use(cors());
const mongoUrl = "mongodb://0.0.0.0:27017/amezon";

// Connect to MongoDB
mongoose
  .connect(mongoUrl)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });


  const productSchema = new mongoose.Schema({
  id: Number,
  title: String,
  price: Number,
  description: String,
  category: String,
  image: String,
  sold: Boolean,
  dateOfSale: Date,
});

const Product = mongoose.model('Product', productSchema); // Create a model


app.get("/products", async (req, res) => {
  try {
    const products = await Product.find({}); // Retrieve all products
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal server error");
  }
});

// API endpoint to list all transactions with search and pagination
app.get("/transactions", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;
    const search = req.query.search || "";

    const query = {
      $or: [
        { title: { $regex: search, $options: "i" } }, // Case-insensitive search on title
        { description: { $regex: search, $options: "i" } }, // Case-insensitive search on description
        { price: parseFloat(search) || 0 }, // Search by price (convert search to float)
      ],
    };

    const transactions = await Product.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).send("Internal server error");
  }
});
 

// if you want to go to other pages
//http://localhost:3000/transactions?page=1

//if you want to search by title
// http://localhost:3000/transactions?search=query (any title name of product)

// API for Statistics
app.get("/statistics", async (req, res) => {
  try {
    const selectedMonth = req.query.month || new Date().getMonth() + 1; // Default to current month

    const totalSaleAmount = await Product.aggregate([
      {
        $match: {
          dateOfSale: {
            $gte: new Date(new Date().getFullYear(), selectedMonth - 1, 1),
            $lt: new Date(new Date().getFullYear(), selectedMonth, 0),
          },
          sold: true,
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$price" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalSoldItems = await Product.countDocuments({
      dateOfSale: {
        $gte: new Date(new Date().getFullYear(), selectedMonth - 1, 1),
        $lt: new Date(new Date().getFullYear(), selectedMonth, 0),
      },
      sold: true,
    });

    const totalNotSoldItems = await Product.countDocuments({
      dateOfSale: {
        $gte: new Date(new Date().getFullYear(), selectedMonth - 1, 1),
        $lt: new Date(new Date().getFullYear(), selectedMonth, 0),
      },
      sold: false,
    });

    res.json({
      totalSaleAmount: totalSaleAmount.length > 0 ? totalSaleAmount[0].totalAmount : 0,
      totalSoldItems,
      totalNotSoldItems,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).send("Internal server error");
  }
});

// API for Bar Chart
app.get("/bar-chart", async (req, res) => {
  try {
    const selectedMonth = req.query.month || new Date().getMonth() + 1; // Default to current month

    // Define price ranges
    const priceRanges = [
      { min: 0, max: 100 },
      { min: 101, max: 200 },
      { min: 201, max: 300 },
      { min: 301, max: 400 },
      { min: 401, max: 500 },
      { min: 501, max: 600 },
      { min: 601, max: 700 },
      { min: 701, max: 800 },
      { min: 801, max: 900 },
      { min: 901, max: Infinity },
    ];

    const barChartData = [];

    // Count items falling into each price range
    for (const range of priceRanges) {
      const count = await Product.countDocuments({
        dateOfSale: {
          $gte: new Date(new Date().getFullYear(), selectedMonth - 1, 1),
          $lt: new Date(new Date().getFullYear(), selectedMonth, 0),
        },
        sold: true,
        price: { $gte: range.min, $lte: range.max },
      });

      barChartData.push({ range: `${range.min}-${range.max}`, count });
    }

    res.json(barChartData);
  } catch (error) {
    console.error("Error fetching bar chart data:", error);
    res.status(500).send("Internal server error");
  }
});

// API for Pie Chart
app.get("/pie-chart", async (req, res) => {
  try {
    const selectedMonth = req.query.month || new Date().getMonth() + 1; // Default to current month

    const pieChartData = await Product.aggregate([
      {
        $match: {
          dateOfSale: {
            $gte: new Date(new Date().getFullYear(), selectedMonth - 1, 1),
            $lt: new Date(new Date().getFullYear(), selectedMonth, 0),
          },
          sold: true,
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(pieChartData);
  } catch (error) {
    console.error("Error fetching pie chart data:", error);
    res.status(500).send("Internal server error");
  }
});

// API to Combine Responses
app.get("/combined-data", async (req, res) => {
  try {
    const statistics = await fetch("http://localhost:3000/statistics?month=" + req.query.month);
    const barChartData = await fetch("http://localhost:3000/bar-chart?month=" + req.query.month);
    const pieChartData = await fetch("http://localhost:3000/pie-chart?month=" + req.query.month);

    const combinedData = {
      statistics: await statistics.json(),
      barChartData: await barChartData.json(),
      pieChartData: await pieChartData.json(),
    };

    res.json(combinedData);
  } catch (error) {
    console.error("Error fetching combined data:", error);
    res.status(500).send("Internal server error");
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server listening on port http://localhost:${port}`);
});