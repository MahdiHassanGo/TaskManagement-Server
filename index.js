require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5001;

const app = express();
const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ygrer.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const database = client.db("TaskManagement");
    const collection = database.collection("Users");
    const tasksCollection = database.collection("Tasks");

    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        const existingUser = await collection.findOne({ email: user.email });

        if (existingUser) {
          return res.status(409).json({ message: "User already exists" }); // Send 409 status code
        }

        const result = await collection.insertOne(user);
        res.status(201).json({ message: "User added successfully", result }); // Send 201 status code for created resource
      } catch (error) {
        res.status(500).json({ error: "Failed to add user" });
      }
    });
    app.post("/jwt", (req, res) => {
      const userInfo = req.body;
      const token = jwt.sign(userInfo, process.env.JWT_SECRET, {
        expiresIn: "1h",
      }); // Use your secret key
      res.json({ token });
    });

    app.post("/tasks", async (req, res) => {
      try {
        const task = req.body;
        const result = await tasksCollection.insertOne(task);
        res.json({ message: "Task added successfully", result });
      } catch (error) {
        res.status(500).json({ error: "Failed to add task" });
      }
    });
    app.patch("/tasks/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { category } = req.body;
        const result = await tasksCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { category } }
        );
        res.json({ message: "Task updated successfully", result });
      } catch (error) {
        res.status(500).json({ error: "Failed to update task" });
      }
    });

    app.get("/users", async (req, res) => {
      try {
        const data = await collection.find().toArray();
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch data" });
      }
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("beshi beshi task running");
});

// Ensure the server is listening
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
