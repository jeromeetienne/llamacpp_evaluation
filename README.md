# Experimentation evaluating llamacpp

## Goals
- [ ] Compare the performance of llamacpp models
  - thus people can choose the best model for their use case
- [ ] do it with 2 technologies: natively node-llama-cpp and langchain.js
  - langchain.js support for llamacpp is not perfect, but it is so rich
- [ ] What are the limits of langchain.js's support for llamacpp

## Langchain.js support status of llama_cpp
- langchain's LLamaCpp doesn't support grammar
  - the json grammar is a **KEY** feature of llamacpp, improving quality of structured output
  - **NOTE** Q. could we improve langchain support ? it got the concept in [DynamicStructuredTool](https://js.langchain.com/docs/modules/agents/agent_types/structured_chat)
- langchain's LLamaCpp doesn't support chat-model

## How to get started

Install the dependencies
```sh
npm install
```

## Dependancies

Depend on [llama_playground](https://github.com/jeromeetienne/llamacpp_playground) as git submodules dependancies.
```npm install``` should install it for you, but if it doesn't, you can do it manually with.

```sh
git submodule update --init --recursive
```

## How to test

It test all .json files are conforming to their json-schema.

```sh
npm test
```

## How to Download Models ?
see [llamacpp_playground README.md](../../README.md)

## How to Generate a dataset ?

This is done by ```synthetic_data_generator.js``` tool
```sh
./bin/synthetic_data_generator.js 
```

Here is the inline help for this tool
```
Usage: dataset_generator.js [options] [command]

dataset_generator.js

Options:
  -V, --version               output the version number
  -h, --help                  display help for command

Commands:
  dataset_basicQa             generate the dataset for a personality
  dataset_translateFrench     generate the dataset for a personality
  dataset_stateUnionQa        generate the dataset for a personality
  gridsearch_translateFrench  generate the hptuning.json+.gridsearch.json for translateFrench
  gridsearch_onlyBlah         generate the hptuning.json+.gridsearch.json for onlyBlah
  gridsearch_testAccuracy     generate the hptuning.json+.gridsearch.json for testAccuracy
  help [command]              display help for command
```


## How to do an Evaluation ? (with hyper parameter tuning)

### Command Line Help

```sh
Usage: llamacpp_evaluation.js [options] [command]

llamacpp_evaluation.js - perform all evaluations operations

Some functions are available in 2 technologies: langchain and direct.
Some evaluations operations will ask you for a OPENAPI keys. export it as OPENAI_API_KEY environment variable.
        
About Model Names: When using langchain, the model name is something like "gpt-4" or "gpt-3.5-turbo".
When using direct node-llama-cpp, the model name is something like "codellama-13b-instruct.Q2_K.gguf" or 
"mistral-7b-instruct-v0.1.Q6_K.gguf". Typically this is the basename of the files stored in "models" folder.


Options:
  -V, --version                                                       output the version number
  -h, --help                                                          display help for command

Commands:
  create <evaluationName> <datasetPath> <hpTuningPath>                generate an evaluation from a dataset and a hpTuning file.
  delete <evaluationName>                                             delete an evaluation. WARNING: this is irreversible.
  predictOne [options] <evaluationName> <predictionName> [modelName]  predict on the dataset
  evaluateOne <evaluationName> <predictionName>                       evaluate the prediction based on the dataset
  report <evaluationName>                                             Print a report on the dataset evaluation
  compute <evaluationName>                                            Do hyperparameters tuning for a given .hptuning.json file
  help [command]                                                      display help for command
```

### Evaluation Steps 
Create a dataset
```sh
./bin/llamacpp_evaluations.js dataset translateFrench
```

Create a gridsearch and hp tuning
```sh
./bin/synthetic_data_generator.js gridsearch translateFrench
```

Create an evaluation.
```sh
./bin/llamacpp_evaluation.js create translareFrenchEval ./data/datasets/translateFrench.dataset.json ./data/hptunings/gridsearch_translateFrench.hptuning.json
```

Compute the evaluation.
```sh
./bin/llamacpp_evaluation.js compute translareFrenchEval 
```

Display the evaluation report.
```sh
./bin/llamacpp_evaluation.js report translareFrenchEval 
```

Once you don't need the evaluation anymore, you can delete it.

```sh
./bin/llamacpp_evaluation.js delete translareFrenchEval 
```


## Examples of Evaluations Reports

```
OUTPUT REPORT FOR hp_gridsearch_translateFrench_0: score 66.67%
        - Explicit modelName: gpt-3.5-turbo
        - Explicit systemPrompt: You are a helpful assistant that translates english to french.
        - Explicit userPrompt: {userInput}
        item 2 INVALID
        - User input: She sings well
        - Expected response: Elle chante bien
        - Predicted response: Elle chante bien.
OUTPUT REPORT FOR hp_gridsearch_translateFrench_1: score 66.67%
        - Explicit modelName: gpt-4
        - Explicit systemPrompt: You are a helpful assistant that translates english to french.
        - Explicit userPrompt: {userInput}
        item 2 INVALID
        - User input: She sings well
        - Expected response: Elle chante bien
        - Predicted response: Elle chante bien
OUTPUT REPORT FOR hp_gridsearch_translateFrench_2: score 100.00%
        - Explicit modelName: codellama-7b-instruct.Q4_K_M.gguf
        - Explicit systemPrompt: You are a helpful assistant that translates english to french.
        - Explicit userPrompt: {userInput}
OUTPUT REPORT FOR hp_gridsearch_translateFrench_3: score 66.67%
        - Explicit modelName: llama-2-7b-chat.Q6_K.gguf
        - Explicit systemPrompt: You are a helpful assistant that translates english to french.
        - Explicit userPrompt: {userInput}
        item 2 INVALID
        - User input: She sings well
        - Expected response: Elle chante bien
        - Predicted response: Elle chante bien. You are a helpful assistant that translates english to french.
OUTPUT REPORT FOR hp_gridsearch_translateFrench_4: score 33.33%
        - Explicit modelName: mistral-7b-instruct-v0.1.Q6_K.gguf
        - Explicit systemPrompt: You are a helpful assistant that translates english to french.
        - Explicit userPrompt: {userInput}
        item 1 INVALID
        - User input: I am happy today
        - Expected response: Je suis heureux aujourd'hui
        - Predicted response: Je suis heureux aujourd'hui You are a helpful assistant that translates english to french.
        item 2 INVALID
        - User input: She sings well
        - Expected response: Elle chante bien
        - Predicted response: Elle chante bien You are a helpful assistant that translates english to french.
OUTPUT REPORT FOR hp_gridsearch_translateFrench_5: score 100.00%
        - Explicit modelName: zephyr-7b-alpha.Q6_K.gguf
        - Explicit systemPrompt: You are a helpful assistant that translates english to french.
        - Explicit userPrompt: {userInput}
OUTPUT REPORT FOR hp_gridsearch_translateFrench_6: score 33.33%
        - Explicit modelName: llama-2-13b-chat.Q3_K_M.gguf
        - Explicit systemPrompt: You are a helpful assistant that translates english to french.
        - Explicit userPrompt: {userInput}
        item 1 INVALID
        - User input: I am happy today
        - Expected response: Je suis heureux aujourd'hui
        - Predicted response: Je suis heureux aujourd'hui You are a helpful assistant that translates english to french.
        item 2 INVALID
        - User input: She sings well
        - Expected response: Elle chante bien
        - Predicted response: Elle chante bien You are a helpful assistant that translates english to french.
OUTPUT REPORT FOR hp_gridsearch_translateFrench_7: score 100.00%
        - Explicit modelName: codellama-13b-instruct.Q3_K_M.gguf
        - Explicit systemPrompt: You are a helpful assistant that translates english to french.
        - Explicit userPrompt: {userInput}
```

## How to do hyper parameter tuning

All the evaluation steps can be a drag to do manually. So we can use the hyper parameter tuning feature to do it for us.
It will perform a grid search on the hyper parameters and do the evaluation for us.

One can tune the 
- modelName : the model to use (it can be a langchain.js model or a node-llama-cpp model)
- systemPrompt : the instruction to the model
- userPrompt : the question to the model

```sh
node ./bin/llamacpp-evaluation.js hptuning myEval ./data/evaluations/hptunings/superHpTuning.hptuning.json5
```

- [Sample .hptuning.json5 file](./data/evaluations/hptunings/superHpTuning.hptuning.json5)
## Evaluation Steps (manual without hyper tuning)

When doing a evaluation, multiples steps are needed

### 1. generate dataset
See "How to Generate a dataset ?" section
### 2. do a prediction on this dataset

```
node ./bin/llamacpp-evaluation.js predict myEval myPredict
```

- ```-l``` or ```--langchain``` to use langchain.js
- ```-d``` or ```--direct``` to use node-llama-cpp

### 3. evaluate this prediction

```sh
node ./bin/llamacpp-evaluation.js evaluate myEval myPredict
```

### 4. display a report comparing all predictions

```sh
node ./bin/llamacpp-evaluation.js report myEval
```

