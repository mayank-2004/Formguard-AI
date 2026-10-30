import dotenv from "dotenv"
import mongoose from "mongoose"
import path from "node:path"
import { fileURLToPath } from "node:url"

import User from "../models/User.js"
import Form from "../models/Form.js"
import Submission from "../models/Submission.js"

const currentDirectory = path.dirname(
    fileURLToPath(import.meta.url)
);

dotenv.config({
    path: path.resolve(currentDirectory, "../../.env"),
});

async function backfillOwner() {
    const email = process.argv[2]?.trim().toLowerCase();

    if (!email) {
        throw new Error("Provide the registered user's email as a command-line argument.")
    }

    if (!process.env.MONGODB_URI) {
        throw new Error("MNOGODB_URI is missing from server/.env.");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("No user found with that email. Register the account first.");
    }

    const legacyFilter = {
        $or: [
            { ownerId: { $exists: false } },
            { ownerId: null },
        ],
    };

    const formResult = await Form.updateMany(
        legacyFilter,
        {
            $set: { ownerId: user._id },
        }
    );

    const submissionsResult = await Submission.updateMany(
        legacyFilter,
        {
            $set: { ownerId: user._id },
        }
    );

    console.log("Legacy data migration completed.");
    console.log("Account:", user.email);
    console.log("Forms updated:", formResult.modifiedCount);
    console.log(
        "Submissions updated:",
        submissionsResult.modifiedCount
    );
}

backfillOwner()
    .catch((error) => {
        console.error("Migration failed: ", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });

// node server/src/scripts/backfill-owner.js your-email@example.com   -   run this in terminal after creating first account to assign the unassigned forms and submissions.