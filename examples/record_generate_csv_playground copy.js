// node.js imports
import Path from "path";

// npm imports
import Zod from "zod";
import CliColor from "cli-color";
import { LlamaContext, LlamaJsonSchemaGrammar } from "node-llama-cpp";
import { zodToJsonSchema } from "zod-to-json-schema";
import Json5 from "json5";
import * as Commander from "commander"


// local imports
import ModelPathContants from "../vendor/llama_playground/src/model_path_constants.js"
import RecordGenerateLlamaCpp from "../src/records_generator/record_generate_llamacpp.js"
import RecordGenerateLangchain from "../src/records_generator/record_generate_langchain.js"
import LlamaUtils from "../vendor/llama_playground/src/llama-utils.js"
import FstringTemplate from "../src/fstring-template.js"

// TODO
// - [ ] add a command line interface
// - [ ] ability to choose the action on the csv file
// - [ ] ability to load any csv file

// get __dirname in esm module
import Url from "url";
const __filename = Url.fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


async function mainAsync() {

        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////
        //	init llamaModel and llamaContext
        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////

        const modelName = ModelPathContants.MISTRAL_7B_INSTRUCT_V0_1_Q6_K
        const modelPath = Path.join(__dirname, '../vendor/llama_playground/models', modelName)
        const { llamaContext } = await LlamaUtils.initModelAndContext(modelPath)

        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////
        //	
        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////

        const CsvCarsShort = `Manufacturing Year,Manufacturer,Model,Car Length (Meters)
1997,Ford,E350,2.35
2000,Mercury,Cougar,2.38`


        const CsvCarsLong = `Year,Make,Model,Length (m)
1997,Ford,E350,2.35
2000,Mercury,Cougar,2.38
2002,Toyota,Camry,2.42
1999,Honda,Accord,2.45
2001,Nissan,Maxima,2.48
2003,Ford,Mustang,2.50
2004,Toyota,Corolla,2.52
1998,Volkswagen,Golf,2.55
2006,Honda,Civic,2.58`

        /////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////
        //	Parse command line
        /////////////////////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////

        // parse command line
        const cmdline = new Commander.Command()
        cmdline.name(`${Path.basename(__filename)}`)
                .version('0.0.3')
                .description(`Play with CSV files and LlamaCpp models.`)
        cmdline.usage('[options]')
        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////
        //	
        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////
        // cmdline.requiredOption('-m,--mode <yourMode>', "['page-search', 'question-answering']", 'question-answering')
        cmdline.option('--fixture-generations-zero-shot', 'Generate new rows for a CSV table.')

        // cmdline.command('fixture-generations-zero-shot')
        //         .description('Generate new rows for a CSV table.')
        //         .action(async () => {
        //                 await doFixtureGenerationZeroShot(llamaContext, CsvCarsLong)
        //         });
        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////
        //	
        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////

        // parse command line
        cmdline.parse(process.argv)
        const cmdlineOptions = cmdline.opts()
        console.log('cmdlineOptions', cmdlineOptions)

        if (cmdlineOptions.fixtureGenerationsZeroShot) {
                await doFixtureGenerationZeroShot(llamaContext, CsvCarsLong)
                return
        }

        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////
        //	fixture generations zero-shot
        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////
        if (false) {
                const systemPrompt = `The user will give you a table in CSV format. This CSV data is using "," as separator and has headers.

Please generate new rows for this CSV table. 
Please format your reponse MUST only contain new rows. Be sure not to include no CSV headers, no extra text or explaination.
`

                const userPromptTemplateText = `Generate {rowCount} rows. Here is the CSV table:
{csvText}`

                const userPromptTemplate = new FstringTemplate(userPromptTemplateText)
                const userPromptText = userPromptTemplate.format({
                        csvText: CsvCarsLong,
                        rowCount: 5,
                })
                console.log(CliColor.magenta('Generating fixture generations zero-shot...'))
                const outputText = await LlamaUtils.promptGeneric(llamaContext, systemPrompt, userPromptText, {
                        // streamEnabled: true,
                        temperature: 0.2,
                });

                // FIXME the output is not typed, it is just a string
                console.log(CliColor.magenta('fixture generations zero-shot: Csv new rows:'))
                console.log(outputText)
        }


        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////
        //	Csv table description zero-shot
        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////

        if (false) {
                const systemPromptTemplateText = `The user will give table in CSV format. This CSV data is using "," as separator and has headers.

Generate a {wordCount} words description for this CSV table.`

                const userPromptTemplateText = `Here is the CSV table:
{csvText}`

                const systemPromptTemplate = new FstringTemplate(systemPromptTemplateText)
                const systemPromptText = systemPromptTemplate.format({
                        wordCount: 20,
                })
                const userPromptTemplate = new FstringTemplate(userPromptTemplateText)
                const userPromptText = userPromptTemplate.format({
                        csvText: CsvCarsLong,
                })
                console.log(CliColor.magenta('Generating Table description zero-shot...'))
                const outputText = await LlamaUtils.promptGeneric(llamaContext, systemPromptText, userPromptText, {
                        // streamEnabled: true,
                        temperature: 0.2,
                });

                console.log(CliColor.magenta('Csv table description zero-shot. Description:'))
                console.log(outputText)
        }

        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////
        //	column description
        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////

        if (false) {
                const recordZodSchema = Zod.object({
                        description: Zod.string().describe('a description of this column, not the column name.'),
                })

                // generate llama grammar
                const responseZodSchema = Zod.array(recordZodSchema)
                const responseJsonSchemaFull = zodToJsonSchema(responseZodSchema, "responseJsonSchema");
                const responseJsonSchema = /** @type {Object} */(responseJsonSchemaFull.definitions?.['responseJsonSchema'])
                const llamaGrammar = new LlamaJsonSchemaGrammar(responseJsonSchema)


                const systemPromptTemplateFstring = `Generate JSON Objects. each of them has:
{formatInstruction}

Format your response as a JSON array. Never add any explainations or comments. Just the JSON array.`

                const userPromptTemplateFstring = `Here is the CSV Data. It is using "," as separator and has headers.
{csvText}

Now, for each column, generate a JSON object.`

                // get formatInstruction from zod schema
                const formatInstruction = await RecordGenerateLlamaCpp.formatInstructionFromZod(recordZodSchema)

                const systemPromptText = FstringTemplate.render(systemPromptTemplateFstring, {
                        formatInstruction: formatInstruction,
                })
                const userPromptText = FstringTemplate.render(userPromptTemplateFstring, {
                        csvText: CsvCarsShort,
                })
                console.log(CliColor.magenta('Generating column description zero-shot...'))
                let responseJsonText = await LlamaUtils.promptGeneric(llamaContext, systemPromptText, userPromptText, {
                        streamEnabled: true,
                        jsonCleanup: true,
                        temperature: 0.2,
                        // llamaGrammar: llamaGrammar,
                })

                // reparse with zod to validate the responseJsonUntyped and to do type casting if needed
                // - result is garanteed to be typed
                const responseJson = Json5.parse(responseJsonText)


                console.log(CliColor.magenta('column description zero-shot'))
                console.log(responseJson)
        }

        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////
        //	column renaming
        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////

        if (true) {
                const recordZodSchema = Zod.object({
                        // currentColumnName: Zod.string().describe('Current Name of this column.'),
                        originalName: Zod.string().describe('Original name of this column.'),
                        reasoning: Zod.string().describe('Clearly explain why you think the suggested name is better than the original one.'),
                        suggestedName: Zod.string().describe('a clear, descriptive name. Change the original name only if it is clear it doesnt match the criteria. If the column data is a number, be sure to specify the unit between parentheses.'),
                })

                // generate llama grammar
                const responseZodSchema = Zod.array(recordZodSchema)
                const responseJsonSchemaFull = zodToJsonSchema(responseZodSchema, "responseJsonSchema");
                const responseJsonSchema = /** @type {Object} */(responseJsonSchemaFull.definitions?.['responseJsonSchema'])
                const llamaGrammar = new LlamaJsonSchemaGrammar(responseJsonSchema)


                const systemPromptTemplateFstring = `Generate JSON Objects. each of them has:
{formatInstruction}

Format your response as a JSON array. Never add any explainations or comments. Just the JSON array.`

                const userPromptTemplateFstring = `Here is a spreadsheet in CSV format. This CSV data is using "," as separator and has headers. 
{csvText}

For each and every column of the CSV table, think about a better name. Never add any explainations or comments. Just the JSON array.`

                // get formatInstruction from zod schema
                const formatInstruction = await RecordGenerateLlamaCpp.formatInstructionFromZod(recordZodSchema)

                const systemPromptText = FstringTemplate.render(systemPromptTemplateFstring, {
                        formatInstruction: formatInstruction,
                })
                const userPromptText = FstringTemplate.render(userPromptTemplateFstring, {
                        csvText: CsvCarsLong,
                })
                console.log(CliColor.magenta('Generating column renaming zero-shot...'))
                let responseJsonText = await LlamaUtils.promptGeneric(llamaContext, systemPromptText, userPromptText, {
                        // streamEnabled: true,
                        jsonCleanup: true,
                        temperature: 0.2,
                        // llamaGrammar: llamaGrammar,
                })

                // reparse with zod to validate the responseJsonUntyped and to do type casting if needed
                // - result is garanteed to be typed
                const responseJsonTyped = Json5.parse(responseJsonText)


                console.log(CliColor.magenta('column renaming zero-shot'))
                console.log(responseJsonTyped)
        }
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	call main async function (without async prefix because of top level await)
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

void mainAsync()



///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * 
 * @param {LlamaContext} llamaContext 
 * @param {string} csvText 
 */
async function doFixtureGenerationZeroShot(llamaContext, csvText) {
}