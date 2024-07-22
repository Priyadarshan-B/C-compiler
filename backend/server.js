const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(bodyParser.json());
app.use(cors());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'programming_test'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});

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

app.post('/submit', (req, res) => {
    const { studentCode, mainFunction, mainReturnType, funcDeclaration } = req.body;
    const headers = req.headers['custom-headers'];
    const responses = [];

    const funcName = funcDeclaration.split('(')[0].trim().split(' ').pop(); // Extract function name

    // Strip comments from main function code
    const cleanMainFunction = stripComments(mainFunction);

    // Check if the function is called in main function
    const funcCallRegex = new RegExp(`\\b${funcName}\\b\\s*\\(`);

    if (!funcCallRegex.test(cleanMainFunction)) {
        // If the function is not called in main, fail all test cases
        testCases.forEach(testCase => {
            responses.push({
                testCase: `TC${testCase.id}`,
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                result: `Function '${funcName}' not called in main function`,
                passed: false
            });
        });
        return res.send(responses);
    }

    testCases.forEach(testCase => {
        const completeProgram = `${headers}\n${funcDeclaration} {${studentCode}}\n${mainReturnType} main() {${mainFunction}}`;
        console.log(completeProgram);

        const uniqueFilename = uuidv4();
        const cFilename = `${uniqueFilename}.c`;
        const exeFilename = `${uniqueFilename}.exe`;
        const inputFilename = `${uniqueFilename}.txt`;

        fs.writeFileSync(cFilename, completeProgram);
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
