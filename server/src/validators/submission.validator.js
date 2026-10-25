// This file validates the shape of a submission request before the server processes the answers. We'll validate the answers against the actual form definition in the controller, since every form can contain different questions.
import { z } from "zod"

// The keys correspond to the fieldId of each question. The values contain the respondent's answers. (e.g.) -
                    // {
                    //   "answers": {
                    //     "employeeName": "Rahul",
                    //     "employmentStatus": "Employed",
                    //     "currentlyEmployed": true
                    //   }
                    // }

export const submissionPayloadSchema = z.object({
    answers: z.record(z.string(), z.unknown()),
    confirmed: z.boolean().default(false),
}).strict();