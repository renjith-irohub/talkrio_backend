require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./database/connectDB");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middlewares/errorHandler");
const router = require("./routes");
const http = require("http");
const { initializeSocket } = require("./socket");

const app = express();
connectDB();

app.use(cors({
  origin: "https://talkrio.vercel.app",
  credentials: true,
}));


app.use(express.json());
const server = http.createServer(app);
app.use(cookieParser());
app.use(router);

initializeSocket(server);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));