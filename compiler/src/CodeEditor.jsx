import React, { useState } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/theme-twilight';
import axios from 'axios';
import './App.css';

const CodeEditor = () => {
    const [studentCode, setStudentCode] = useState(`
// refer main function by clicking on "show main function"
// write a function with respective logic and return the result to main function
    `);
    const [output, setOutput] = useState([]);
    const [showMainFunction, setShowMainFunction] = useState(false);
    const [loading, setLoading] = useState(false);

    const predefinedMainFunction = `
#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    int sum = add(a, b);
    printf("%d", sum);
    return 0;
}
    `;

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/submit', { studentCode });
            setOutput(response.data);
            console.log(response)
        } catch (error) {
            console.error('Submission error:', error);
            setOutput([{ testCase: 'Error', error: 'Failed to submit or evaluate code.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", width: "100%", justifyContent: "space-between", height: "fit-content", backgroundColor: "rgb(220, 222, 224)", padding: "10px", boxSizing: "border-box" }}>
            <div style={{ width: "48%" }}>
                <h2>Question</h2>
                <p>
                    <b>
                        Add 2 numbers
                    </b>
                </p>
                <h2>Sample Inputs and Outputs</h2>
                <p>Input: 10 20<br />Output: 30</p>
                <p>Input: -10 20<br />Output: 10</p>
                
                <table>
                        <thead>
                            <tr>
                                <th>Test Case</th>
                                <th>Result</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {output.map((result, index) => (
                                <tr key={index}>
                                    <td>{`${result.testCase}`}</td>
                                    <td>{result.result}</td>
                                    <td>{result.passed ? 'Passed' : 'Failed'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
            </div>
            <div style={{ width: "50%", boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px", padding: "10px", boxSizing: "border-box", height: "fit-content", backgroundColor: "white" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button onClick={() => setShowMainFunction(!showMainFunction)}>
                        {showMainFunction ? 'Hide Main Function' : 'Show Main Function'}
                    </button>
                    <button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
                {showMainFunction && (
                    <div className='main-function-div' style={{ marginBottom: "10px" }}>
                        <h4>Predefined Main Function (Read-Only)</h4>
                        <AceEditor
                            mode="c_cpp"
                            theme="twilight"
                            value={predefinedMainFunction}
                            name="main_function_editor"
                            editorProps={{ $blockScrolling: true }}
                            width="99%"
                            height="200px"
                            readOnly={true}
                            fontSize={15}
                        />
                    </div>
                )}
                <div>
                    <p></p>
                    <AceEditor
                        mode="c_cpp"
                        theme="twilight"
                        value={studentCode}
                        onChange={newValue => setStudentCode(newValue)}
                        name="student_code_editor"
                        editorProps={{ $blockScrolling: true }}
                        width="100%"
                        height="88vh"
                        fontSize={15}
                    />
                </div>
                
            </div>
        </div>
    );
};

export default CodeEditor;
