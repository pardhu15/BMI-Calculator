const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const { db } = require("./firebase");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Signup
app.post("/signup", async (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  const password = req.body.password;

  try {
    const snapshot = await db.collection("users").where("email", "==", email).get();
    if (!snapshot.empty) return res.status(409).send("Email already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection("users").add({ email, password: hashedPassword });

    res.status(201).send("Signup successful");
  } catch (error) {
    res.status(500).send("Signup failed");
  }
});

// Login
app.post("/login", async (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  const password = req.body.password;

  try {
    const snapshot = await db.collection("users").where("email", "==", email).get();
    if (snapshot.empty) return res.status(404).send("User not found");

    const userData = snapshot.docs[0].data();
    const match = await bcrypt.compare(password, userData.password);

    if (!match) return res.status(401).send("Incorrect password");

    res.status(200).send("Login successful");
  } catch (error) {
    res.status(500).send("Login failed");
  }
});

// BMI
app.post("/bmi", async (req, res) => {
  const { email, weight, height } = req.body;

  try {
    const heightMeters = height / 100;
    const bmi = (weight / (heightMeters * heightMeters)).toFixed(2);

    await db.collection("bmiRecords").add({ email, weight, height, bmi, timestamp: new Date() });

    res.json({ bmi });
  } catch (error) {
    res.status(500).send("BMI calculation failed");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
