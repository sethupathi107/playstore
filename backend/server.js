import express from "express";
import authRoutes from "./src/routes/auth.js";
import image from "./src/routes/image.js";
import application from "./src/routes/app.js";
import category from "./src/routes/category.js";
import admin from "./src/routes/admin.js";
import auth from "./src/middlewares/auth.js"
import requireAdmin from "./src/middlewares/requireAdmin.js"


const app = express(); 
app.use(express.json())
app.use("/v1/sign",authRoutes);
app.use(auth);
app.use("/v1/app",application);
app.use("/v1/images",image);
app.use("/v1/category",category);
app.use("/v1/admin",requireAdmin,admin);

app.listen(4000, () => console.log('Server running on port 4000'));