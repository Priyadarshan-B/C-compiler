const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(bodyParser.json());
app.use(cors());

const testCases = [
    { id: 1, input: '10 20', expectedOutput: '30' },
    { id: 2, input: '-10 20', expectedOutput: '10' },
    { id: 3, input: '2 0', expectedOutput: '2' },
    { id: 4, input: '100 200', expectedOutput: '300' },
    { id: 5, input: '123 456', expectedOutput: '579' }
];

// Function to strip comments from code
const stripComments = (code) => {
    return code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').trim();
};

// Function to extract code between function braces
const getFunctionBody = (code, funcName) => {
    const regex = new RegExp(`${funcName}\\s*\\([^)]*\\)\\s*{([^}]*)}`);
    const match = code.match(regex);
    return match ? match[1].trim() : '';
};

app.post('/submit', (req, res) => {
    const { code } = req.body;
    const responses = [];

    // Strip comments from code
    const cleanCode = stripComments(code);

    // Check for presence of main function
    if (!cleanCode.includes('main(')) {
        responses.push({
            testCase: 'All',
            result: 'Missing main function',
            passed: false
        });
        return res.send(responses);
    }

    // Extract function declarations excluding 'main'
    const funcDeclarations = cleanCode.match(/int\s+\w+\s*\(.*\)\s*{/g);
    if (!funcDeclarations || funcDeclarations.length === 0) {
        responses.push({
            testCase: 'All',
            result: 'Missing or invalid function declaration',
            passed: false
        });
        return res.send(responses);
    }

    // Check each function declaration for a call within the main function
    const mainFunctionContent = cleanCode.split('main(')[1].split('{')[1].split('}')[0];
    let functionCalled = false;

    funcDeclarations.forEach(declaration => {
        const funcName = declaration.split('(')[0].trim().split(' ').pop(); // Extract function name
        if (funcName !== 'main') {
            const funcCallRegex = new RegExp(`\\b${funcName}\\b\\s*\\(`);
            if (funcCallRegex.test(mainFunctionContent)) {
                functionCalled = true;

                // Check if function body has at least one line of code
                const functionBody = getFunctionBody(cleanCode, funcName);
                if (!functionBody) {
                    responses.push({
                        testCase: 'All',
                        result: `Function '${funcName}' is declared but does not contain any code`,
                        passed: false
                    });
                    return res.send(responses);
                }
            }
        }
    });

    if (!functionCalled) {
        // If no functions are called in main, fail all test cases
        testCases.forEach(testCase => {
            responses.push({
                testCase: `TC${testCase.id}`,
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                result: 'No declared functions called in main function',
                passed: false
            });
        });
        return res.send(responses);
    }

    testCases.forEach(testCase => {
        const uniqueFilename = uuidv4();
        const cFilename = `${uniqueFilename}.c`;
        const exeFilename = `${uniqueFilename}.exe`;
        const inputFilename = `${uniqueFilename}.txt`;

        fs.writeFileSync(cFilename, code);
        fs.writeFileSync(inputFilename, testCase.input);

        const compileCommand = `gcc ${cFilename} -o ${exeFilename}`;

        exec(compileCommand, (error, stdout, stderr) => {
            if (error) {
                fs.unlinkSync(cFilename);
                fs.unlinkSync(inputFilename);
                responses.push({
                    testCase: `TC${testCase.id}`,
                    input: testCase.input,
                    expectedOutput: testCase.expectedOutput,
                    result: stderr,
                    passed: false
                });

                if (responses.length === testCases.length) {
                    res.send(responses);
                }
                return;
            }

            const runCommand = process.platform === 'win32'
                ? `${exeFilename} < ${inputFilename}`
                : `./${exeFilename} < ${inputFilename}`;

            exec(runCommand, (runError, runStdout, runStderr) => {
                fs.unlinkSync(cFilename);
                fs.unlinkSync(exeFilename);
                fs.unlinkSync(inputFilename);

                if (runError) {
                    responses.push({
                        testCase: `TC${testCase.id}`,
                        input: testCase.input,
                        expectedOutput: testCase.expectedOutput,
                        result: runStderr,
                        passed: false
                    });
                } else {
                    const result = runStdout.trim();
                    console.log(`Test Case ID: ${testCase.id}, Input: ${testCase.input}, Expected Output: ${testCase.expectedOutput}, Result: ${result}`);

                    const passed = result === testCase.expectedOutput;

                    const response = {
                        testCase: `Test case ${testCase.id}`,
                        input: testCase.input,
                        expectedOutput: testCase.expectedOutput,
                        result,
                        passed
                    };

                    responses.push(response);
                }

                if (responses.length === testCases.length) {
                    res.send(responses);
                }
            });
        });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
