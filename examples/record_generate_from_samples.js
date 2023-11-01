// node.js imports
import Path from "path";

// npm imports
import Zod from "zod";

// local imports
import ModelPathContants from "../vendor/llama_playground/src/model_path_constants.js";
import RecordGenerateLlamaCpp from "../src/records_generator/record_generate_llamacpp.js";
import LlamaUtils from "../vendor/llama_playground/src/llama-utils.js";
import FstringTemplate from "../src/fstring-template.js";


// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const CsvCars = `Year,Maker,Model,Length
1997,Ford,E350,2.35
2000,Mercury,Cougar,2.38`
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	init llamaModel and llamaContext
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const modelPath = Path.join(__dirname, '../vendor/llama_playground/models', ModelPathContants.CODELLAMA_7B_INSTRUCT_Q4_K_M)
const { llamaContext, llamaModel } = await LlamaUtils.initModelAndContext(modelPath)


const systemPrompt = `The user will give you a spreadsheet in CSV format, using "," semicolons as separator.

Please generate new rows for this CSV data. 
Please format your reponse MUST only contain new rows. no headers, no extra lines.
`

const userPromptTemplateText = `Please generate {rowCount} new rows for my CSV data. Here is the CSV Data:
{csvData}`

const userPromptTemplate = new FstringTemplate(userPromptTemplateText)
const userPromptText = userPromptTemplate.format({ 
        csvData: CsvCars ,
        rowCount: 3,
})
// debugger
const streamEnabled = true
const outputText = await LlamaUtils.promptOne(llamaContext, systemPrompt, userPromptText, streamEnabled);
