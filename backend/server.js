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

app.post('/submit', (req, res) => {
  const { functionName, args, argTypes, mainFunction, code } = req.body;
  const responses = [];

  const fullCode = `${mainFunction}\n${code}`;
  console.log(fullCode)
  
  if (!code.includes(`${functionName}(`)) {
    return res.send([{ testCase: 'All', result: 'Function name mismatch', passed: false }]);
  }

  const functionDeclarationRegex = new RegExp(`${functionName}\\s*\\(([^)]*)\\)`);
  const functionMatch = code.match(functionDeclarationRegex);
  if (!functionMatch) {
    return res.send([{ testCase: 'All', result: 'Function declaration not found', passed: false }]);
  }
  const argsInCode = functionMatch[1].split(',').map(arg => arg.trim().split(' ')[0]);
  const expectedArgs = args.split(',').map(arg => arg.trim());
  const expectedArgTypes = argTypes.split(',').map(type => type.trim());

  if (argsInCode.length !== expectedArgs.length) {
    return res.send([{ testCase: 'All', result: 'Argument count mismatch', passed: false }]);
  }

  for (let i = 0; i < expectedArgs.length; i++) {
    if (!code.includes(`${expectedArgTypes[i]} ${expectedArgs[i]}`)) {
      return res.send([{ testCase: 'All', result: `Argument type mismatch for ${expectedArgs[i]}`, passed: false }]);
    }
  }

  testCases.forEach(testCase => {
    const uniqueFilename = uuidv4();
    const cFilename = `${uniqueFilename}.c`;
    const exeFilename = `${uniqueFilename}.exe`;
    const inputFilename = `${uniqueFilename}.txt`;

    fs.writeFileSync(cFilename, fullCode);
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
