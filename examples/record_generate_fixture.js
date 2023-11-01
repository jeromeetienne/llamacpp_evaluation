// npm imports
import Zod from "zod";

// local imports
import ModelPathContants from "../vendor/llama_playground/src/model_path_constants.js";
import RecordGenerateLlamaCpp from "../src/records_generator/record_generate_llamacpp.js";
import RecordGenerateLangchain from "../src/records_generator/record_generate_langchain.js";


// create record zod schema
const recordZodSchema = Zod.object({
        fullName: Zod.string().describe('the full name of a person'),
        age: Zod.number().nullable().describe('the age of this person'),
        nationality: Zod.string().nullable().describe('the nationality of this person'),
        city: Zod.string().describe('the city where this person lives'),
})


// generate the records
let recordsJson = /** @type {array} */([])
const useLlamaCpp = true
if (useLlamaCpp) {
        recordsJson = await RecordGenerateLlamaCpp.generateFromZod(recordZodSchema, {
                recordCount: 2,
                modelName: ModelPathContants.LLAMA_2_13B_CHAT_Q3_K_M,
        })
} else {
        recordsJson = await RecordGenerateLangchain.generateFromZod(recordZodSchema, {
                recordCount: 2,
                modelName: 'gpt-3.5-turbo',
        })
}

// display the records
console.log({ recordsJson })