import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`server is running at http://localhost:${PORT}`);
    });
}

startServer().catch((error) => {
    console.error("Error starting the server:", error.message);
    process.exit(1);
});
