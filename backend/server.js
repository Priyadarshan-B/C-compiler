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
    { id: 3, input: '0 0', expectedOutput: '0' },
    { id: 4, input: '100 200', expectedOutput: '300' },
    { id: 5, input: '123 456', expectedOutput: '579' }
];

app.post('/submit', (req, res) => {
    const { studentCode } = req.body;
    const responses = [];

    const headers = `
#include <stdio.h>
    `;

    const mainFunction = (input) => `
int main() {
    int a, b;
    sscanf("${input}", "%d %d", &a, &b);
    int sum = add(a, b);
    printf("%d", sum);
    return 0;
}
    `;

    testCases.forEach(testCase => {
        const completeProgram = headers + studentCode + mainFunction(testCase.input);

        const uniqueFilename = uuidv4(); 
        const cFilename = `${uniqueFilename}.c`;
        const exeFilename = `${uniqueFilename}.exe`;

        fs.writeFileSync(cFilename, completeProgram);

        const compileCommand = `gcc ${cFilename} -o ${exeFilename}`;

        exec(compileCommand, (error, stdout, stderr) => {
            if (error) {
                fs.unlinkSync(cFilename);
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
                ? `${exeFilename}`
                : `./${exeFilename}`;

            exec(runCommand, (runError, runStdout, runStderr) => {
                fs.unlinkSync(cFilename);
                fs.unlinkSync(exeFilename); 

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
